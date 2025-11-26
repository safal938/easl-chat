
"use client";

import React, { useRef, useEffect, useCallback, useState, useLayoutEffect } from "react";
import { AnimatedMessage } from "@/components/AnimatedMessage";
import { ExpertLoadingIndicator } from "@/components/ExpertLoadingIndicator";
import { AdaptiveAnswerSkeleton } from "@/components/AdaptiveAnswerSkeleton";
import { ScrollToBottomButton } from "./ScrollToBottomButton";
import { Message } from "@/types/message";

interface MessageListProps {
  messages: Message[];
  tempReasoningMessage: Message | null;
  tempAnswerMessage: Message | null;
  isTyping: boolean;
  highlightedUserMessageId: string | null;
  lastAIMessageId: string | null;
  collapsibleStates: Map<string, boolean>;
  setReasoningCollapsibleState: (messageId: string, state: boolean) => void;
  getReasoningCollapsibleState: (messageId: string) => boolean;
  shouldAutoScroll: boolean;
  setShouldAutoScroll: (should: boolean) => void;
  setIsUserScrolledUp: (scrolled: boolean) => void;
  expertTransferMessage: string | null;
  isPreparingFinalAnswer: boolean;
  expertLoadingState: { isLoading: boolean; expertName?: string };
  modelType: "reasoning_model";
  chatId: string | null;
  isReasoningActive: boolean;
  isConversationComplete: boolean;
}

// Debounce utility
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  }) as T;

  (debounced as any).cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };

  return debounced as T & { cancel: () => void };
}

export function MessageList({
  messages,
  tempReasoningMessage,
  tempAnswerMessage,
  isTyping,
  highlightedUserMessageId,
  lastAIMessageId,
  collapsibleStates,
  setReasoningCollapsibleState,
  getReasoningCollapsibleState,
  shouldAutoScroll,
  setShouldAutoScroll,
  setIsUserScrolledUp,
  expertTransferMessage,
  isPreparingFinalAnswer,
  expertLoadingState,
  modelType,
  chatId,
  isReasoningActive,
  isConversationComplete,
}: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isUserScrolledUpLocal, setIsUserScrolledUpLocal] = useState(false);
  const [hasNewContent, setHasNewContent] = useState(false);
  const [showAdaptiveSkeleton, setShowAdaptiveSkeleton] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Height management for stable transitions
  const msgHeightsRef = useRef<Map<string, number>>(new Map());
  const measureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for scroll logic
  const lastMessageCountRef = useRef<number>(messages.length);
  const prevMessagesLengthRef = useRef<number>(messages.length);
  const isScrollingProgrammaticallyRef = useRef<boolean>(false);
  const isUserScrollingRef = useRef<boolean>(false);
  const lastScrollTopRef = useRef<number>(0);
  const userMessageJustSentRef = useRef<boolean>(false);

  // Reasoning collapsible tracking
  const wasReasoningActiveRef = useRef<boolean>(false);
  const userOverrideThisSessionRef = useRef<boolean>(false);
  const currentReasoningMessageIdRef = useRef<string | null>(null);

  // Pre-measure message heights to prevent layout jumps
  useLayoutEffect(() => {
    if (measureTimeoutRef.current) clearTimeout(measureTimeoutRef.current);
    
    measureTimeoutRef.current = setTimeout(() => {
      messages.forEach(msg => {
        const el = document.querySelector(`[data-message-id="${msg.id}"]`) as HTMLElement;
        if (el && el.offsetHeight > 0) {
          msgHeightsRef.current.set(msg.id, el.offsetHeight);
        }
      });
    }, 100);

    return () => {
      if (measureTimeoutRef.current) clearTimeout(measureTimeoutRef.current);
    };
  }, [messages]);

  // Handle reasoning collapsible for current session
  const handleReasoningToggle = useCallback(
    (messageId: string, open: boolean) => {
      setReasoningCollapsibleState(messageId, open);
      if (wasReasoningActiveRef.current && messageId === currentReasoningMessageIdRef.current) {
        userOverrideThisSessionRef.current = true;
      }
    },
    [setReasoningCollapsibleState]
  );

  // Preserve scroll position during layout changes
  const preserveScrollPosition = useCallback((fn: () => void) => {
    const container = scrollContainerRef.current;
    if (!container) {
      fn();
      return;
    }

    const prevScrollHeight = container.scrollHeight;
    const prevScrollTop = container.scrollTop;
    const distanceFromBottom = prevScrollHeight - prevScrollTop;

    fn();

    requestAnimationFrame(() => {
      if (!container) return;
      const newScrollTop = container.scrollHeight - distanceFromBottom;
      container.scrollTop = Math.max(0, newScrollTop);
    });
  }, []);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    isScrollingProgrammaticallyRef.current = true;
    container.scrollTo({ top: container.scrollHeight, behavior });
    
    setTimeout(() => {
      isScrollingProgrammaticallyRef.current = false;
    }, behavior === 'smooth' ? 500 : 50);
  }, []);

  // Check scroll position with debouncing
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isScrollingProgrammaticallyRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const threshold = isTyping || tempReasoningMessage ? 150 : 100;
    const isNearBottom = distanceFromBottom <= threshold;

    setIsUserScrolledUpLocal(!isNearBottom);
    setIsUserScrolledUp(!isNearBottom);

    if (distanceFromBottom <= 20) {
      isUserScrollingRef.current = false;
    }

    setShouldAutoScroll(isNearBottom && !isUserScrollingRef.current);
  }, [isTyping, tempReasoningMessage, setShouldAutoScroll, setIsUserScrolledUp]);

  const debouncedCheckScroll = React.useMemo(
    () => debounce(checkScrollPosition, 100),
    [checkScrollPosition]
  );

  // Handle manual scroll to bottom
  const handleScrollToBottom = useCallback(() => {
    isUserScrollingRef.current = false;
    setShouldAutoScroll(true);
    setIsUserScrolledUpLocal(false);
    setIsUserScrolledUp(false);
    setHasNewContent(false);
    scrollToBottom('smooth');
  }, [scrollToBottom, setShouldAutoScroll, setIsUserScrolledUp]);

  // Auto-open reasoning when it starts
  useEffect(() => {
    if (!wasReasoningActiveRef.current && isReasoningActive && tempReasoningMessage) {
      userOverrideThisSessionRef.current = false;
      currentReasoningMessageIdRef.current = tempReasoningMessage.id;
      
      preserveScrollPosition(() => {
        setReasoningCollapsibleState(tempReasoningMessage.id, true);
      });
    }

    wasReasoningActiveRef.current = isReasoningActive;
  }, [isReasoningActive, tempReasoningMessage, setReasoningCollapsibleState, preserveScrollPosition]);

  // Auto-close reasoning when conversation completes - with delay for final answer rendering
  useEffect(() => {
    if (isConversationComplete && currentReasoningMessageIdRef.current && !userOverrideThisSessionRef.current) {
      // Add a delay to allow the final answer to be fully rendered before closing reasoning
      const timer = setTimeout(() => {
        preserveScrollPosition(() => {
          setReasoningCollapsibleState(currentReasoningMessageIdRef.current!, false);
        });
        currentReasoningMessageIdRef.current = null;
      }, 2000); // 2 second delay to let user see the final answer

      return () => clearTimeout(timer);
    }
  }, [isConversationComplete, setReasoningCollapsibleState, preserveScrollPosition]);

  // Show adaptive skeleton logic
  useEffect(() => {
    // Hide skeleton immediately if we have a final AI message
    const hasFinalAIMessage = messages.length > 0 && 
                              !messages[messages.length - 1].isUser && 
                              !messages[messages.length - 1].isTemporary;
    
    const shouldShow = (isTyping || tempAnswerMessage !== null || isPreparingFinalAnswer) && !hasFinalAIMessage;
    
    if (shouldShow !== showAdaptiveSkeleton) {
      setIsTransitioning(true);
      setShowAdaptiveSkeleton(shouldShow);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
  }, [isTyping, tempAnswerMessage, isPreparingFinalAnswer, showAdaptiveSkeleton, messages]);

  // Handle new user messages
  useEffect(() => {
    const newUserMessageAdded =
      messages.length > prevMessagesLengthRef.current &&
      messages.length > 0 &&
      messages[messages.length - 1].isUser;

    if (newUserMessageAdded) {
      userMessageJustSentRef.current = true;
      setShouldAutoScroll(true);
      setIsUserScrolledUpLocal(false);
      setIsUserScrolledUp(false);
      
      setTimeout(() => {
        scrollToBottom();
        setTimeout(() => {
          userMessageJustSentRef.current = false;
        }, 500);
      }, 100);
    }

    if (messages.length > lastMessageCountRef.current && isUserScrolledUpLocal) {
      setHasNewContent(true);
    }

    prevMessagesLengthRef.current = messages.length;
    lastMessageCountRef.current = messages.length;
  }, [messages, isUserScrolledUpLocal, setShouldAutoScroll, setIsUserScrolledUp, scrollToBottom]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (!shouldAutoScroll || isUserScrollingRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    if ((isTyping || tempReasoningMessage || tempAnswerMessage) && distanceFromBottom <= 200) {
      const timeoutId = setTimeout(() => {
        if (!isUserScrollingRef.current && shouldAutoScroll) {
          scrollToBottom();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isTyping, tempReasoningMessage, tempAnswerMessage, shouldAutoScroll, scrollToBottom]);

  // Scroll event handler
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isScrollingProgrammaticallyRef.current) return;

      const currentScrollTop = container.scrollTop;
      const scrollDelta = currentScrollTop - lastScrollTopRef.current;

      // Detect user scrolling up
      if (scrollDelta < -50) {
        isUserScrollingRef.current = true;
        userMessageJustSentRef.current = false;
      }

      // Detect scrolling near bottom
      if (scrollDelta > 0) {
        const { scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - (currentScrollTop + clientHeight);
        if (distanceFromBottom < 100) {
          isUserScrollingRef.current = false;
        }
      }

      lastScrollTopRef.current = currentScrollTop;
      debouncedCheckScroll();
    };

    container.style.overflowAnchor = 'none';
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      debouncedCheckScroll.cancel();
    };
  }, [debouncedCheckScroll]);

  // Initial scroll to bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || messages.length === 0) return;

    if (prevMessagesLengthRef.current === 0 && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages.length, scrollToBottom]);

  // UI state determination
  const uiState = React.useMemo(() => {
    if (expertLoadingState.isLoading) return { type: 'expertLoading' as const };
    if (expertTransferMessage) return { type: 'expertTransfer' as const };
    
    // Hide skeleton immediately if we have a final AI message (not temporary)
    // This prevents showing both skeleton and final message at the same time
    const hasFinalAIMessage = messages.length > 0 && 
                              !messages[messages.length - 1].isUser && 
                              !messages[messages.length - 1].isTemporary;
    
    if ((showAdaptiveSkeleton || tempReasoningMessage || isPreparingFinalAnswer) && !hasFinalAIMessage) {
      return { type: 'adaptiveAnswer' as const };
    }
    return { type: 'idle' as const };
  }, [
    expertLoadingState.isLoading,
    expertTransferMessage,
    showAdaptiveSkeleton,
    tempReasoningMessage,
    isPreparingFinalAnswer,
    messages,
  ]);

  return (
    <>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ overflowAnchor: 'none' }}
      >
        <div
          className="max-w-4xl mx-auto w-[85%] px-4 sm:px-6 py-4 sm:py-6 relative message-content"
          style={{
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        >
          {messages.map((msg, index) => {
            const isHighlighted =
              (msg.isUser && msg.id === highlightedUserMessageId) ||
              (!msg.isUser && msg.id === lastAIMessageId);

            return (
              <div
                key={msg.id}
                data-message-id={msg.id}
                style={{ transition: 'opacity 0.3s' }}
              >
                <AnimatedMessage
                  message={msg}
                  isVisible
                  isFocused={msg.isUser && msg.id === highlightedUserMessageId}
                  isPersistentlyHighlighted={!msg.isUser && msg.id === lastAIMessageId}
                  animationDelay={Math.min(index * 50, 200)}
                  collapsibleState={getReasoningCollapsibleState(msg.id)}
                  onCollapsibleChange={(open) => handleReasoningToggle(msg.id, open)}
                  allMessages={messages}
                  chatId={chatId}
                />
              </div>
            );
          })}

          {uiState.type === 'expertTransfer' && expertTransferMessage && (
            <div className="mb-4 flex justify-center animate-fade-in">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-blue-800 text-sm font-medium">
                Case transferred to {expertTransferMessage}
              </div>
            </div>
          )}

          {uiState.type === 'expertLoading' && (
            <ExpertLoadingIndicator
              isVisible={expertLoadingState.isLoading}
              expertName={expertLoadingState.expertName}
            />
          )}

          {uiState.type === 'adaptiveAnswer' && (
            <div style={{ transition: 'opacity 0.3s', opacity: showAdaptiveSkeleton ? 1 : 0 }}>
              <AdaptiveAnswerSkeleton
                expertName={
                  tempReasoningMessage?.expertName ||
                  tempAnswerMessage?.expertName ||
                  expertLoadingState.expertName ||
                  'Medical Expert'
                }
                isReasoningModel={modelType === 'reasoning_model'}
                tempAnswerMessage={tempAnswerMessage}
                tempReasoningMessage={tempReasoningMessage}
                permanentAnswerMessage={
                  messages.length > 0 && !messages[messages.length - 1].isUser
                    ? messages[messages.length - 1]
                    : null
                }
                isTyping={isTyping}
                showReasoningSkeleton={!!tempReasoningMessage}
                isReasoningOpen={
                  tempReasoningMessage
                    ? getReasoningCollapsibleState(tempReasoningMessage.id)
                    : false
                }
                isPreparingFinalAnswer={isPreparingFinalAnswer}
                onCollapsibleChange={(open) => {
                  if (tempReasoningMessage) {
                    handleReasoningToggle(tempReasoningMessage.id, open);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      <ScrollToBottomButton
        isVisible={isUserScrolledUpLocal}
        onClick={handleScrollToBottom}
        hasNewContent={hasNewContent}
      />
    </>
  );
}