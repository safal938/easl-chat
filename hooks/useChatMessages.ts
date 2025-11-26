"use client";

import { useCallback } from "react";
import { flushSync } from "react-dom";
import { useAuth } from "@/hooks/use-auth";
import { useAuthContext } from "@/components/auth-provider";
import { UnifiedChatService } from "@/services/unifiedChatService";
import { useSimpleStreamProcessor } from "./useSimpleStreamProcessor";
import { Message } from "@/types/message";

interface UseChatMessagesProps {
  chatId: string | null;
  onChatCreated: (newChatId: string) => void;
  currentInput: string;
  setCurrentInput: (value: string) => void;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
  modelType: "reasoning_model";
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setHighlightedUserMessageId: (id: string | null) => void;
  setLastAIMessageId: (id: string | null) => void;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
  setTempReasoningMessage: (message: Message | null) => void;
  setTempAnswerMessage: (message: Message | null) => void;
  setExpertTransferMessage: (expertName: string | null) => void;
  setIsPreparingFinalAnswer: (preparing: boolean) => void;
  setExpertLoadingState: (state: { isLoading: boolean; expertName?: string }) => void;
  resetStreamingState: () => void;
  resetProcessor: () => void;
  processStreamChunk: (data: any) => void;
  buildFinalMessage: () => Message[];
  boardAppMetadataRef: React.MutableRefObject<any>;
}

export function useChatMessages({
  chatId,
  onChatCreated,
  currentInput,
  setCurrentInput,
  isTyping,
  setIsTyping,
  modelType,
  messages,
  setMessages,
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
}: UseChatMessagesProps) {
  const { user } = useAuth();
  const { isGuestMode } = useAuthContext();

  const sendMessage = useCallback(async () => {
    const userText = currentInput.trim();
    // Allow sending if either authenticated or in guest mode
    if ((!user && !isGuestMode) || !userText || isTyping) return;
    
    const userId: string | null = isGuestMode ? null : (user?.uid || null);

    setCurrentInput("");
    resetStreamingState();
    resetProcessor();
    setLastAIMessageId(null);

    // Check if this message is from board app
    const isBoardAppMessage = boardAppMetadataRef?.current !== null;
    const metadata = boardAppMetadataRef?.current;

    const userMessage: Message = {
      id: `user-${crypto.randomUUID()}`,
      text: userText,
      isUser: true,
      timestamp: new Date(),
      uid: userId || 'guest',
      source: isBoardAppMessage ? 'board-app' : 'main-app',
      boardAppMetadata: isBoardAppMessage ? metadata : undefined,
    };

    // Clear the metadata ref after using it
    if (boardAppMetadataRef) {
      boardAppMetadataRef.current = null;
    }

    setMessages((prev) => [...prev, userMessage]);
    setHighlightedUserMessageId(userMessage.id);

    // slight delay so the user message renders before the skeleton
    setTimeout(() => setIsTyping(true), 300);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // <-- key differences start here
    let createdChatId: string | null = null;
    let aiMessagesSaved = false;

    try {
      // 1) Create the chat ONLY if we don't have one yet (but DO NOT navigate yet)
      let currentChat = chatId;
      if (!currentChat) {
        createdChatId = await UnifiedChatService.createChat(userId, userText);
        currentChat = createdChatId; // temp, local only for now
      }

      // 2) Save the user message to that chat
      console.log("💾 Saving user message:", userMessage);
      await UnifiedChatService.saveMessage(userId, currentChat!, userMessage);
      console.log("✅ User message saved successfully");

      // 3) Stream the AI response (stay on the same route)
      const userEmail = isGuestMode ? 'guest@local' : (user?.email || 'guest@local');
      const response = await UnifiedChatService.sendChatRequest(userText, modelType, { user_email: userEmail }, signal);
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      // DEBUG: Buffer to collect all raw response chunks
      const rawResponseChunks: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // DEBUG: Collect raw chunk
        rawResponseChunks.push(chunk);
        
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            processStreamChunk(data);
          } catch {
            /* ignore */
          }
        }
      }

      // DEBUG: Log combined raw response
      const combinedRawResponse = rawResponseChunks.join('');
      console.log('🔍 COMBINED RAW RESPONSE FROM ENDPOINT:');
      console.log('Total chunks received:', rawResponseChunks.length);
      console.log('Combined response length:', combinedRawResponse.length);
      console.log('Combined raw response:', combinedRawResponse);

      // 4) Build final assistant messages and persist them
      const aiMessages = buildFinalMessage();
      
      // Mark AI messages with same source as user message
      aiMessages.forEach(msg => {
        msg.source = userMessage.source;
        if (userMessage.boardAppMetadata) {
          msg.boardAppMetadata = userMessage.boardAppMetadata;
        }
      });
      
      console.log('Built AI messages:', aiMessages.map(m => ({ id: m.id, text: m.text.substring(0, 50) + '...' })));

      // 5) Clean up temporary messages BEFORE saving to Firebase to prevent flicker
      // This ensures temp messages are gone before Firebase listener adds the real ones
      flushSync(() => {
        setTempReasoningMessage(null);
        setTempAnswerMessage(null);
        if (aiMessages.length) {
          setLastAIMessageId(aiMessages[aiMessages.length - 1].id);
        }
        setHighlightedUserMessageId(null);
      });

      // 6) Persist assistant messages
      for (const m of aiMessages) {
        await UnifiedChatService.saveMessage(userId, currentChat!, m);
      }
      aiMessagesSaved = true;
      
      // In guest mode, manually add messages to state since there's no Firebase listener
      if (isGuestMode) {
        setMessages((prev) => [...prev, ...aiMessages]);
      }

      // 7) Now that the first exchange is fully saved, navigate exactly once
      if (!chatId && createdChatId) {
        onChatCreated(createdChatId);
      }
    } catch (err: any) {
      console.error("❌ Error in sendMessage:", err);
      if (err?.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${crypto.randomUUID()}`,
            text: "Sorry, I encountered an error. Please try again.",
            isUser: false,
            timestamp: new Date(),
            uid: "ai-error",
          },
        ]);
      }
      // optional cleanup: if we created a chat but failed before saving any AI message,
      // remove the empty chat so it doesn't show up in the sidebar.
      if (createdChatId && !aiMessagesSaved) {
        try {
          await UnifiedChatService.deleteChatIfEmpty(userId, createdChatId);
        } catch {}
      }
    } finally {
      // Batch final cleanup to prevent additional re-renders
      flushSync(() => {
        setIsTyping(false);
      });
      abortControllerRef.current = null;
    }
  }, [
    currentInput,
    isTyping,
    modelType,
    chatId,
    user,
    isGuestMode,
    setCurrentInput,
    setIsTyping,
    setMessages,
    setHighlightedUserMessageId,
    setLastAIMessageId,
    abortControllerRef,
    resetStreamingState,
    resetProcessor,
    processStreamChunk,
    buildFinalMessage,
    setTempReasoningMessage,
    setTempAnswerMessage,
    onChatCreated,
  ]);

  return { sendMessage };
}
