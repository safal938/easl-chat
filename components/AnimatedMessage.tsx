"use client";

import React, { useState, useEffect } from "react";
import { UserMessage } from "@/components/message/UserMessage";
import { CollapsibleAnswerMessage } from "@/components/message/CollapsibleAnswerMessage";
import { Message } from "@/types/message";

interface AnimatedMessageProps {
  message: Message;
  isVisible: boolean;
  isFocused?: boolean;
  isPersistentlyHighlighted?: boolean;
  animationDelay?: number;
  collapsibleState?: boolean;
  onCollapsibleChange?: (open: boolean) => void;
  userMessage?: string;
  allMessages?: Message[];
  chatId?: string | null;
}

export function AnimatedMessage({
  message,
  isVisible,
  isFocused = false,
  isPersistentlyHighlighted = false,
  animationDelay = 0,
  collapsibleState,
  onCollapsibleChange,
  userMessage,
  allMessages = [],
  chatId,
}: AnimatedMessageProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [localShowThinking, setLocalShowThinking] = useState(collapsibleState ?? false);

  // Sync with external state
  useEffect(() => {
    if (collapsibleState !== undefined) {
      setLocalShowThinking(collapsibleState);
    }
  }, [collapsibleState]);

  // Handle animation timing
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [isVisible, animationDelay]);

  const handleCollapsibleChange = (open: boolean) => {
    setLocalShowThinking(open);
    onCollapsibleChange?.(open);
  };

  if (message.isUser) {
    return (
      <UserMessage
        message={message}
        isAnimating={isAnimating}
        isFocused={isFocused}
      />
    );
  }

  return (
    <div className={`message-transition ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
      <CollapsibleAnswerMessage
        message={message}
        isAnimating={isAnimating}
        allMessages={allMessages}
        reverseLayout={false}
        chatId={chatId}
        showThinking={localShowThinking}
        onCollapsibleChange={handleCollapsibleChange}
        isPersistentlyHighlighted={isPersistentlyHighlighted}
      />
    </div>
  );
}
