"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { flushSync } from "react-dom";
import { useChatState } from "@/hooks/useChatState";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useMessageLoader } from "@/hooks/useMessageLoader";
import { useSimpleStreamProcessor } from "@/hooks/useSimpleStreamProcessor";
import { useCanvasMessageListener } from "@/hooks/useCanvasMessageListener";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { EmptyState } from "@/components/chat/EmptyState";
import { MessageList } from "@/components/chat/MessageList";
import { InputArea } from "@/components/chat/InputArea";
import { ChatLoadingSkeleton } from "@/components/chat/ChatLoadingSkeleton";
import { CanvasQueryIndicator } from "@/components/CanvasQueryIndicator";

interface ChatProps {
  chatId: string;
  onChatCreated: (chatId: string) => void;
}

export default function Chat({ chatId, onChatCreated }: ChatProps) {
  const [canvasQueryIndicator, setCanvasQueryIndicator] = useState<{
    show: boolean;
    query: string;
    source?: string;
  }>({ show: false, query: "", source: undefined });

  const pendingCanvasQueryRef = useRef<string | null>(null);
  const boardAppMetadataRef = useRef<any>(null);

  const {
    messages,
    setMessages,
    highlightedUserMessageId,
    setHighlightedUserMessageId,
    lastAIMessageId,
    setLastAIMessageId,
    currentInput,
    setCurrentInput,
    isTyping,
    setIsTyping,
    tempReasoningMessage,
    setTempReasoningMessage,
    tempAnswerMessage,
    setTempAnswerMessage,
    isLoadingMessages,
    setIsLoadingMessages,
    collapsibleStates, // CHANGED: Now using Map-based states
    setReasoningCollapsibleState, // CHANGED: Function to set state for specific message
    getReasoningCollapsibleState, // CHANGED: Function to get state for specific message
    isReasoningActive,
    setIsReasoningActive,
    isConversationComplete,
    setIsConversationComplete,
    shouldAutoScroll,
    setShouldAutoScroll,
    setIsUserScrolledUp,
    modelType,
    setModelType,
    expertTransferMessage,
    setExpertTransferMessage,
    isPreparingFinalAnswer,
    setIsPreparingFinalAnswer,
    expertLoadingState,
    setExpertLoadingState,
    abortControllerRef,
    handleInputChange,
    handleFocusChange,
    handleStop,
    resetStreamingState,
    resetAllState,
  } = useChatState(chatId);

  // Use the stream processor hook
  const { processStreamChunk, buildFinalMessage, resetProcessor } =
    useSimpleStreamProcessor({
      setTempReasoningMessage,
      setTempAnswerMessage,
      setExpertLoadingState,
      setIsPreparingFinalAnswer,
      setIsReasoningActive,
      setIsConversationComplete,
    });

  // Use the message sending hook
  const { sendMessage } = useChatMessages({
    chatId,
    onChatCreated,
    messages,
    setMessages,
    currentInput,
    setCurrentInput,
    isTyping,
    setIsTyping,
    modelType,
    setHighlightedUserMessageId,
    setLastAIMessageId,
    abortControllerRef,
    setTempReasoningMessage,
    setTempAnswerMessage,
    setExpertTransferMessage,
    setIsPreparingFinalAnswer,
    setExpertLoadingState,
    resetStreamingState,
    resetProcessor,
    processStreamChunk,
    buildFinalMessage,
    boardAppMetadataRef,
  });

  useMessageLoader({ chatId, setMessages, setIsLoadingMessages });

  // Handle queries from Canvas iframe parent
  const handleCanvasQuery = useCallback(
    (query: string, metadata?: any) => {
      console.log("🎯 Processing Canvas query:", { query, metadata });

      // Don't process if already typing (AI is responding)
      if (isTyping) {
        console.warn(
          "⚠️ Cannot process Canvas query: AI is currently responding"
        );
        return;
      }

      // Show indicator
      setCanvasQueryIndicator({
        show: true,
        query,
        source: metadata?.source || "canvas",
      });

      // Store the query in ref and set input
      // Also store metadata to mark this as a board app message
      pendingCanvasQueryRef.current = query;
      boardAppMetadataRef.current = metadata;
      handleInputChange(query);
    },
    [handleInputChange, isTyping]
  );

  // Effect to auto-send pending Canvas queries
  useEffect(() => {
    if (
      pendingCanvasQueryRef.current &&
      currentInput === pendingCanvasQueryRef.current &&
      !isTyping
    ) {
      console.log(
        "📤 Auto-sending Canvas query to AI:",
        pendingCanvasQueryRef.current
      );
      console.log("   Current input:", currentInput);
      console.log("   Is typing:", isTyping);

      const queryToSend = pendingCanvasQueryRef.current;
      pendingCanvasQueryRef.current = null;
      // Keep boardAppMetadataRef - it will be cleared after message is sent

      // Small delay to ensure UI is ready
      setTimeout(() => {
        console.log("   Calling sendMessage()...");
        sendMessage();
      }, 100);
    }
  }, [currentInput, isTyping, sendMessage]);

  // Listen for messages from Canvas parent window
  const { sendResponseToCanvas } = useCanvasMessageListener({
    onQueryReceived: handleCanvasQuery,
    onClearChats: async () => {
      console.log("🗑️ Processing clear chats request from Canvas");
      
      try {
        // Check if we're in guest mode
        const guestModeEnabled = typeof window !== 'undefined' && 
          localStorage.getItem('easl_guest_mode_enabled') === 'true';
        
        let result;
        
        if (guestModeEnabled) {
          // Guest mode: Clear localStorage directly
          console.log("🗑️ Clearing chats from localStorage (guest mode)");
          
          // Import the service dynamically
          const { UnifiedChatService } = await import('@/services/unifiedChatService');
          result = await UnifiedChatService.deleteBoardAppChats(null);
          
          console.log("✅ Chats deleted from localStorage:", result);
        } else {
          // Authenticated mode: Call API endpoint
          const { auth } = await import('@/lib/firebase');
          const user = auth.currentUser;
          
          if (!user) {
            throw new Error("User not authenticated");
          }
          
          const idToken = await user.getIdToken();
          
          console.log("📤 Calling clear-chats API endpoint...");
          const response = await fetch('/api/board-app/clear-chats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to clear chats');
          }
          
          result = await response.json();
          console.log("✅ Chats deleted from Firestore:", result);
        }
        
        // Clear the current chat UI
        setMessages([]);
        setCurrentInput("");
        resetStreamingState();
        resetAllState();
        
        // If we're currently viewing a chat and chats were deleted, navigate to home
        if (chatId && result.deletedChats > 0) {
          console.log("📍 Navigating to home page after clearing chats");
          // Use window.location for navigation since we're in a callback
          window.location.href = '/';
        }
        
        // Send success response to Canvas
        sendResponseToCanvas(
          { 
            success: true, 
            message: "Chat history cleared",
            deletedChats: result.deletedChats,
            deletedMessages: result.deletedMessages,
          },
          "success"
        );
        
        console.log("✅ Chat history cleared successfully");
      } catch (error) {
        console.error("❌ Error clearing chats:", error);
        sendResponseToCanvas(
          { success: false, error: error instanceof Error ? error.message : "Failed to clear chat history" },
          "error"
        );
      }
    },
  });

  // ============================================================================
  // BOARD APP INTEGRATION - ENABLED
  // ============================================================================
  // To disable: Comment out the code below and see docs/BOARD_APP_INTEGRATION_TOGGLE.md
  // ============================================================================

  // Track if we've sent the response and the user query
  const hasSentResponseRef = useRef(false);
  const userQueryRef = useRef<string>("");

  // Track the user query when a new message is sent
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.isUser) {
        userQueryRef.current = lastMessage.text;
        hasSentResponseRef.current = false; // Reset when new query comes in
      }
    }
  }, [messages]);

  // Send complete response to Board App via postMessage (per EASL_INTEGRATION_API.md)
  const sendConversationToBoardApp = useCallback(
    (query: string, response: string, metadata: any) => {
      // Check if we're in an iframe
      if (window.parent && window.parent !== window) {
        try {
          console.log("📤 Sending EASL_CONVERSATION to Board App:", {
            query: query.substring(0, 100) + "...",
            responseLength: response.length,
            metadata,
          });

          // Send postMessage to parent (Board App will handle API call)
          window.parent.postMessage(
            {
              type: "EASL_CONVERSATION",
              payload: {
                query: query,
                response: response,
                timestamp: new Date().toISOString(),
                metadata: {
                  ...metadata,
                  source: metadata.source || "easl-chat",
                },
              },
            },
            "*" // Board App will validate origin
          );

          console.log("✅ EASL_CONVERSATION message sent to Board App");
        } catch (error) {
          console.error("❌ Error sending EASL_CONVERSATION to Board App:", error);
        }
      } else {
        console.log("ℹ️ Not in iframe, skipping Board App integration");
      }
    },
    []
  );

  // Send complete response to Board App when AI completes (including guideline analysis)
  useEffect(() => {
    if (
      isConversationComplete &&
      messages.length > 0 &&
      !hasSentResponseRef.current
    ) {
      const lastMessage = messages[messages.length - 1];

      // Only send if it's an AI message and guideline processing is complete (or not needed)
      if (!lastMessage.isUser && !lastMessage.isProcessingGuideline) {
        // Get the user query
        const query = userQueryRef.current || "No query available";

        // Build complete response string with all available data
        let completeResponseText = lastMessage.text;

        // Add reasoning if available
        if (lastMessage.reasoningText) {
          completeResponseText = `## Medical Reasoning\n\n${lastMessage.reasoningText}\n\n## Answer\n\n${completeResponseText}`;
        }

        // Add local guideline analysis if available
        if (lastMessage.localGuidelineAnalysis) {
          completeResponseText += `\n\n## Local Guideline Analysis\n\n${lastMessage.localGuidelineAnalysis.response}`;
        }

        // Build metadata
        const metadata: any = {
          chatId: chatId,
          messageId: lastMessage.id,
          expertName: lastMessage.expertName,
          source: "easl-chat",
          hasReasoning: !!lastMessage.reasoningText,
          hasSafetyAnalysis: !!lastMessage.safetyAnalysis,
          hasLocalGuidelineAnalysis: !!lastMessage.localGuidelineAnalysis,
          timestamp: lastMessage.timestamp,
        };

        // Add guideline analysis details if available
        if (lastMessage.localGuidelineAnalysis) {
          metadata.guidelineAnalysis = {
            expertName: lastMessage.localGuidelineAnalysis.expert_name,
            modelVersion: lastMessage.localGuidelineAnalysis.model_version,
            modelDescription:
              lastMessage.localGuidelineAnalysis.model_description,
            timestamp: lastMessage.localGuidelineAnalysis.timestamp,
          };
        }

        // Send to Board App via postMessage (per EASL_INTEGRATION_API.md)
        sendConversationToBoardApp(query, completeResponseText, metadata);
        hasSentResponseRef.current = true;
      }
    }
  }, [isConversationComplete, messages, chatId, sendConversationToBoardApp]);

  // ============================================================================
  // END BOARD APP INTEGRATION
  // ============================================================================

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <ChatContainer>
      <CanvasQueryIndicator
        show={canvasQueryIndicator.show}
        query={canvasQueryIndicator.query}
        source={canvasQueryIndicator.source}
      />
      {isLoadingMessages ? (
        <ChatLoadingSkeleton type="loading-messages" />
      ) : messages.length === 0 &&
        !tempReasoningMessage &&
        !tempAnswerMessage ? (
        <EmptyState>
          <InputArea
            currentInput={currentInput}
            setCurrentInput={handleInputChange}
            isTyping={isTyping}
            modelType={modelType}
            setModelType={setModelType}
            onSendMessage={sendMessage}
            onStop={handleStop}
            onKeyPress={handleKeyPress}
            onFocusChange={handleFocusChange}
          />
        </EmptyState>
      ) : (
        <>
          <MessageList
            messages={messages}
            tempReasoningMessage={tempReasoningMessage}
            tempAnswerMessage={tempAnswerMessage}
            isTyping={isTyping}
            highlightedUserMessageId={highlightedUserMessageId}
            lastAIMessageId={lastAIMessageId}
            collapsibleStates={collapsibleStates} // CHANGED: Pass the Map
            setReasoningCollapsibleState={setReasoningCollapsibleState} // CHANGED: Pass the setter function
            getReasoningCollapsibleState={getReasoningCollapsibleState} // CHANGED: Pass the getter function
            shouldAutoScroll={shouldAutoScroll}
            setShouldAutoScroll={setShouldAutoScroll}
            setIsUserScrolledUp={setIsUserScrolledUp}
            expertTransferMessage={expertTransferMessage}
            isPreparingFinalAnswer={isPreparingFinalAnswer}
            expertLoadingState={expertLoadingState}
            modelType={modelType}
            chatId={chatId}
            isReasoningActive={isReasoningActive}
            isConversationComplete={isConversationComplete}
          />
          <InputArea
            currentInput={currentInput}
            setCurrentInput={handleInputChange}
            isTyping={isTyping}
            modelType={modelType}
            setModelType={setModelType}
            onSendMessage={sendMessage}
            onStop={handleStop}
            onKeyPress={handleKeyPress}
            onFocusChange={handleFocusChange}
          />
        </>
      )}
    </ChatContainer>
  );
}
