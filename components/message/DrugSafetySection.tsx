// components/message/DrugSafetySection.tsx

"use client";

import React from "react";
import DrugSafetyButton from "@/components/drug-safety/DrugSafetyButton";
import { Message } from "@/types/message";

interface DrugSafetySectionProps {
  message: Message;
  allMessages: Message[];
  chatId?: string | null;
}

export function DrugSafetySection({ message, allMessages, chatId }: DrugSafetySectionProps) {
  // Check if we should show the DrugSafetyButton
  const shouldShowSafetyButton = () => {
    if (message.isUser || message.isTemporary || message.isReasoning) return false;
    
    // Look for drug-related content
    const text = message.text.toLowerCase();
    const drugKeywords = [
      'medication', 'drug', 'prescription', 'dose', 'dosage', 'mg', 'tablet', 'pill',
      'treatment', 'therapy', 'medicine', 'pharmaceutical', 'adverse', 'side effect',
      'interaction', 'contraindication', 'toxicity', 'overdose', 'withdrawal'
    ];
    
    return drugKeywords.some(keyword => text.includes(keyword));
  };

  // Get the corresponding user message for this AI response
  const getCorrespondingUserMessage = () => {
    if (!allMessages || allMessages.length === 0) return "";
    
    const currentIndex = allMessages.findIndex(m => m.id === message.id);
    if (currentIndex <= 0) return "";
    
    // Look backwards for the most recent user message
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (allMessages[i].isUser) {
        return allMessages[i].text;
      }
    }
    
    return "";
  };

  if (!shouldShowSafetyButton()) return null;

  return (
    <div className="mt-4">
      <hr></hr>
      <DrugSafetyButton
        userMessage={getCorrespondingUserMessage()}
        aiResponse={message.text}
        className=""
        messageId={message.id}
        chatId={chatId}
      />
    </div>
  );
}