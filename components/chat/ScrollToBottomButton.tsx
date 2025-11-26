// components/chat/ScrollToBottomButton.tsx

"use client";

import React from "react";
import { ArrowDown } from "lucide-react";

interface ScrollToBottomButtonProps {
  isVisible: boolean;
  onClick: () => void;
  hasNewContent?: boolean;
  unreadCount?: number;
}

export function ScrollToBottomButton({
  isVisible,
  onClick,
  hasNewContent = false,
  unreadCount = 0,
}: ScrollToBottomButtonProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-8 z-10">
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full shadow-lg transition-all duration-200 text-sm font-medium ${
          hasNewContent
            ? "bg-white text-black hover:bg-blue-700 hover:text-white"
            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
        }`}
      >
        <ArrowDown className={`w-4 h-4 ${hasNewContent ? "animate-bounce" : ""}`} />
        <span className="text-[12px]"> 
        Jump to bottom
          {unreadCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-white text-blue-600 rounded-full text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
