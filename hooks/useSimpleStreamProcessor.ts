import { useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { Message, LocalGuidelineAnalysis } from "@/types/message";

interface UseSimpleStreamProcessorProps {
  setTempReasoningMessage: (message: Message | null) => void;
  setTempAnswerMessage: (message: Message | null) => void;
  setExpertLoadingState?: (state: { isLoading: boolean; expertName?: string }) => void;
  setIsPreparingFinalAnswer?: (preparing: boolean) => void;
  setIsReasoningActive?: (active: boolean) => void;
  setIsConversationComplete?: (complete: boolean) => void; // NEW
}

export function useSimpleStreamProcessor({
  setTempReasoningMessage,
  setTempAnswerMessage,
  setExpertLoadingState,
  setIsPreparingFinalAnswer,
  setIsReasoningActive,
  setIsConversationComplete, // NEW
}: UseSimpleStreamProcessorProps) {
  const reasoningContentRef = useRef<string>("");
  const answerContentRef = useRef<string>("");
  const expertNameRef = useRef<string>("Medical Expert");
  const hasReasoningRef = useRef(false);
  const safetyFlagRef = useRef(false);
  const localGuidelineAnalysisRef = useRef<LocalGuidelineAnalysis | undefined>(undefined);
  const isProcessingGuidelineRef = useRef(false);

  const processStreamChunk = useCallback((data: any) => {
    console.log("Processing chunk:", data.response_type);

    // Normalize & capture safety flag (from server-sent event)
    if (data.safety_flag === true) {
      safetyFlagRef.current = true;
    }

    // Update expert name
    if (data.expert_name) {
      expertNameRef.current = data.expert_name.replace(/_/g, " ") + " Expert";
    }

    switch (data.response_type) {
      case "expert_selection":
        setExpertLoadingState?.({
          isLoading: true,
          expertName: expertNameRef.current,
        });
        break;

      case "reasoning_start":
        hasReasoningRef.current = true;
        reasoningContentRef.current = "";
        setExpertLoadingState?.({ isLoading: false });
        
        // Signal that reasoning is now active
        setIsReasoningActive?.(true);

        // Create initial reasoning message
        setTempReasoningMessage({
          id: "temp-reasoning",
          text: "",
          isUser: false,
          timestamp: new Date(),
          uid: "ai-stream",
          isTemporary: true,
          isReasoning: true,
          expertName: expertNameRef.current,
        });
        break;

      case "reasoning":
        if (hasReasoningRef.current) {
          let contentToAdd = data.response || "";
          
          // Try to parse nested JSON with thinking content
          try {
            // First, try to extract the thinking content using regex
            const thinkingMatch = contentToAdd.match(/'thinking':\s*"([^"]*(?:\\.[^"]*)*)"/);
            if (thinkingMatch && thinkingMatch[1]) {
              // Extract and unescape the thinking content
              contentToAdd = thinkingMatch[1]
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
            } else {
              // Fallback: try standard JSON parsing
              const jsonStr = contentToAdd.replace(/'/g, '"');
              const parsed = JSON.parse(jsonStr);
              
              if (parsed.type === 'thinking' && parsed.thinking) {
                contentToAdd = parsed.thinking
                  .replace(/\\n/g, '\n')
                  .replace(/\\t/g, '\t')
                  .replace(/\\"/g, '"')
                  .replace(/\\\\/g, '\\');
              }
            }
          } catch {
            // Not JSON or parsing failed, use as-is
          }
          
          reasoningContentRef.current += contentToAdd;
          setTempReasoningMessage({
            id: "temp-reasoning",
            text: reasoningContentRef.current,
            isUser: false,
            timestamp: new Date(),
            uid: "ai-stream",
            isTemporary: true,
            isReasoning: true,
            expertName: expertNameRef.current,
          });
        }
        break;

      case "reasoning_complete":
        if (hasReasoningRef.current) {
          setTempReasoningMessage({
            id: "temp-reasoning",
            text: reasoningContentRef.current,
            isUser: false,
            timestamp: new Date(),
            uid: "ai-stream",
            isTemporary: false, // mark as complete
            isReasoning: true,
            expertName: expertNameRef.current,
          });
        }
        
        // Signal that reasoning is now complete
        setIsReasoningActive?.(false);
        
        setIsPreparingFinalAnswer?.(true);
        break;

      case "final_answer_start":
        setIsPreparingFinalAnswer?.(false);
        answerContentRef.current = "";
        break;

      case "final_answer":
        // Append streamed text
        answerContentRef.current += data.response || "";

        // Fallback: detect embedded JSON safety flag (robust to some providers)
        if (data.response) {
          try {
            const parsedChunk = JSON.parse(data.response);
            if (parsedChunk?.safety_flag === true) safetyFlagRef.current = true;
          } catch {
            /* noop */
          }
          try {
            const parsedAccumulated = JSON.parse(answerContentRef.current);
            if (parsedAccumulated?.safety_flag === true) safetyFlagRef.current = true;
          } catch {
            /* noop */
          }
        }

        // IMPORTANT: include safetyAnalysis on the *temporary* streaming message too
        setTempAnswerMessage({
          id: "temp-answer",
          text: answerContentRef.current,
          isUser: false,
          timestamp: new Date(),
          uid: "ai-stream",
          isTemporary: true,
          isReasoningAnswer: hasReasoningRef.current,
          reasoningText: reasoningContentRef.current,
          isReasoningFinalAnswer: hasReasoningRef.current,
          expertName: expertNameRef.current,
          safetyAnalysis: safetyFlagRef.current ? { safetyRequired: true } : undefined,
          localGuidelineAnalysis: localGuidelineAnalysisRef.current,
          isProcessingGuideline: isProcessingGuidelineRef.current,
        });
        break;

      case "local-guideline-analysis":
        // Handle local guideline analysis response
        console.log("📋 Received local guideline analysis");
        
        const guidelineAnalysis: LocalGuidelineAnalysis = {
          expert_name: data.expert_name || expertNameRef.current,
          response_type: data.response_type,
          response: data.response || "",
          timestamp: data.timestamp || new Date().toISOString(),
          model_version: data.model_version || "",
          model_description: data.model_description || "Local guideline comparison analysis",
        };
        
        localGuidelineAnalysisRef.current = guidelineAnalysis;
        isProcessingGuidelineRef.current = false;
        
        // Update the answer message with the guideline analysis
        setTempAnswerMessage({
          id: "temp-answer",
          text: answerContentRef.current,
          isUser: false,
          timestamp: new Date(),
          uid: "ai-stream",
          isTemporary: false,
          isReasoningAnswer: hasReasoningRef.current,
          reasoningText: reasoningContentRef.current,
          isReasoningFinalAnswer: hasReasoningRef.current,
          expertName: expertNameRef.current,
          safetyAnalysis: safetyFlagRef.current ? { safetyRequired: true } : undefined,
          localGuidelineAnalysis: guidelineAnalysis,
          isProcessingGuideline: false,
        });
        break;

      case "complete":
        // Handle complete response - may contain final answer if no reasoning was used
        if (data.response) {
          // If we haven't accumulated any answer content yet, use the complete response
          if (!answerContentRef.current) {
            answerContentRef.current = data.response;
            
            // Create or update the answer message with the complete response
            setTempAnswerMessage({
              id: "temp-answer",
              text: answerContentRef.current,
              isUser: false,
              timestamp: new Date(),
              uid: "ai-stream",
              isTemporary: false, // Mark as complete
              isReasoningAnswer: hasReasoningRef.current,
              reasoningText: reasoningContentRef.current,
              isReasoningFinalAnswer: hasReasoningRef.current,
              expertName: expertNameRef.current,
              safetyAnalysis: safetyFlagRef.current ? { safetyRequired: true } : undefined,
              localGuidelineAnalysis: localGuidelineAnalysisRef.current,
              isProcessingGuideline: isProcessingGuidelineRef.current,
            });
          } else {
            // Update existing message to mark guideline processing as started
            isProcessingGuidelineRef.current = true;
            setTempAnswerMessage({
              id: "temp-answer",
              text: answerContentRef.current,
              isUser: false,
              timestamp: new Date(),
              uid: "ai-stream",
              isTemporary: false,
              isReasoningAnswer: hasReasoningRef.current,
              reasoningText: reasoningContentRef.current,
              isReasoningFinalAnswer: hasReasoningRef.current,
              expertName: expertNameRef.current,
              safetyAnalysis: safetyFlagRef.current ? { safetyRequired: true } : undefined,
              localGuidelineAnalysis: localGuidelineAnalysisRef.current,
              isProcessingGuideline: true,
            });
          }
          
          // Check for safety flag in complete response
          try {
            const parsedComplete = JSON.parse(data.response);
            if (parsedComplete?.safety_flag === true) safetyFlagRef.current = true;
          } catch {
            /* noop */
          }
        }
        
        // Batch all completion state updates to prevent multiple re-renders
        flushSync(() => {
          setIsConversationComplete?.(true);
        });
        console.log('🏁 CONVERSATION COMPLETE - Will auto-close reasoning panel');
        break;

      default:
        console.log("Unhandled response type:", data.response_type);
        break;
    }
  }, [setTempReasoningMessage, setTempAnswerMessage, setExpertLoadingState, setIsPreparingFinalAnswer, setIsReasoningActive, setIsConversationComplete]);

  const buildFinalMessage = useCallback(() => {
    const messages: Message[] = [];

    if (answerContentRef.current || reasoningContentRef.current) {
      const message: Message = {
        id: `ai-${crypto.randomUUID()}`,
        text: answerContentRef.current,
        isUser: false,
        timestamp: new Date(),
        uid: "ai",
        isReasoningAnswer: hasReasoningRef.current,
        reasoningText: reasoningContentRef.current,
        isReasoningFinalAnswer: hasReasoningRef.current,
        expertName: expertNameRef.current,
      };

      // Add the normalized flag to the finalized message
      if (safetyFlagRef.current) {
        message.safetyAnalysis = { safetyRequired: true };
      }

      // Add local guideline analysis if available
      if (localGuidelineAnalysisRef.current) {
        message.localGuidelineAnalysis = localGuidelineAnalysisRef.current;
      }

      messages.push(message);
    }

    return messages;
  }, []);

  const resetProcessor = useCallback(() => {
    // Batch all reset operations to prevent multiple re-renders
    flushSync(() => {
      setIsReasoningActive?.(false);
      setIsConversationComplete?.(false);
    });
    
    // Reset refs (no re-renders)
    hasReasoningRef.current = false;
    expertNameRef.current = "Medical Expert";
    reasoningContentRef.current = "";
    answerContentRef.current = "";
    safetyFlagRef.current = false;
    localGuidelineAnalysisRef.current = undefined;
    isProcessingGuidelineRef.current = false;
  }, [setIsReasoningActive, setIsConversationComplete]);

  return {
    processStreamChunk,
    buildFinalMessage,
    resetProcessor,
  };
}