'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Message } from '@/types/message';

export function useChatState(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [highlightedUserMessageId, setHighlightedUserMessageId] = useState<string | null>(null);
  const [lastAIMessageId, setLastAIMessageId] = useState<string | null>(null);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [tempReasoningMessage, setTempReasoningMessage] = useState<Message | null>(null);
  const [tempAnswerMessage, setTempAnswerMessage] = useState<Message | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isReasoningActive, setIsReasoningActive] = useState(false);
  const [isConversationComplete, setIsConversationComplete] = useState(false);

  const [expertTransferMessage, setExpertTransferMessage] = useState<string | null>(null);
  const [isPreparingFinalAnswer, setIsPreparingFinalAnswer] = useState(false);
  const [expertLoadingState, setExpertLoadingState] = useState<{ isLoading: boolean; expertName?: string }>({ isLoading: false });

  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const [modelType, setModelType] = useState<'reasoning_model'>('reasoning_model');

  // Centralized collapsible states for all messages
  const [collapsibleStates, setCollapsibleStates] = useState<Map<string, boolean>>(new Map());

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('modelType') as 'reasoning_model' | null;
    localStorage.setItem('modelType', saved === 'reasoning_model' ? saved : 'reasoning_model');
    if (saved === 'reasoning_model') setModelType(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('modelType', modelType);
  }, [modelType]);

  const setReasoningCollapsibleState = useCallback((messageId: string, state: boolean) => {
    setCollapsibleStates(prev => {
      const next = new Map(prev);
      next.set(messageId, state);
      return next;
    });
  }, []);

  const getReasoningCollapsibleState = useCallback((messageId: string): boolean => {
    return collapsibleStates.get(messageId) ?? false;
  }, [collapsibleStates]);

  const resetAllState = useCallback(() => {
    setMessages([]);
    setCurrentInput('');
    setHighlightedUserMessageId(null);
    setLastAIMessageId(null);
    setTempReasoningMessage(null);
    setTempAnswerMessage(null);
    setExpertTransferMessage(null);
    setIsPreparingFinalAnswer(false);
    setExpertLoadingState({ isLoading: false });
    setShouldAutoScroll(true);
    setIsUserScrolledUp(false);
    setCollapsibleStates(new Map());
    setIsReasoningActive(false);
    setIsConversationComplete(false);
    setIsTyping(false);
    setIsLoadingMessages(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleInputChange = (val: string) => {
    if (lastAIMessageId) setLastAIMessageId(null);
    setCurrentInput(val);
  };

  const handleFocusChange = (focused: boolean) => {
    if (focused && lastAIMessageId) setLastAIMessageId(null);
  };

  const handleStop = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsTyping(false);
    setTempReasoningMessage(null);
    setTempAnswerMessage(null);
    setExpertTransferMessage(null);
    setIsPreparingFinalAnswer(false);
    setExpertLoadingState({ isLoading: false });
    setIsReasoningActive(false);
    setIsConversationComplete(false);
  };

  const resetStreamingState = () => {
    setTempReasoningMessage(null);
    setTempAnswerMessage(null);
    setExpertTransferMessage(null);
    setIsPreparingFinalAnswer(false);
    setExpertLoadingState({ isLoading: false });
    setIsReasoningActive(false);
    setIsConversationComplete(false);
    setShouldAutoScroll(true);
    setIsUserScrolledUp(false);
  };

  return {
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
    collapsibleStates,
    setReasoningCollapsibleState,
    getReasoningCollapsibleState,
    isReasoningActive,
    setIsReasoningActive,
    isConversationComplete,
    setIsConversationComplete,
    shouldAutoScroll,
    setShouldAutoScroll,
    isUserScrolledUp,
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
  };
}