
"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";
import { Message } from "@/types/message";

interface UserMessageProps {
  message: Message;
  isAnimating: boolean;
  isFocused?: boolean;
}

export function UserMessage({ message, isAnimating, isFocused = false }: UserMessageProps) {
  return (
    <div
      data-message-id={message.id}
      className={cn(
        "flex justify-end mb-4 transition-all duration-300 ease-out",
        isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] px-4 py-3 rounded-2xl shadow-sm text-gray-900 transition-all duration-300",
          isFocused ? "bg-blue-100 border border-blue-200" : "bg-white"
        )}
      >
        <div className="text-sm leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
          >
            {message.text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}