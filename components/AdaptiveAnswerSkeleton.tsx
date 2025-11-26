"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Message } from "@/types/message";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { StreamingMarkdown } from "./StreamingMarkdown";
import { ConnectedMessage } from "./message/ConnectedMessage";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AdaptiveAnswerSkeletonProps {
  className?: string;
  expertName?: string;
  isReasoningModel?: boolean;
  tempAnswerMessage?: Message | null;
  tempReasoningMessage?: Message | null;
  permanentAnswerMessage?: Message | null;
  isTyping?: boolean;
  showReasoningSkeleton?: boolean;
  isReasoningOpen?: boolean;                // NEW (controlled)
  isPreparingFinalAnswer?: boolean;         // NEW (for preparing state)
  onCollapsibleChange?: (open: boolean) => void;
}

export function AdaptiveAnswerSkeleton({
  className,
  expertName = "Medical Expert",
  isReasoningModel = false,
  tempReasoningMessage,
  tempAnswerMessage,
  permanentAnswerMessage,
  showReasoningSkeleton = false,
  isReasoningOpen = false,
  isPreparingFinalAnswer = false,
  onCollapsibleChange,
}: AdaptiveAnswerSkeletonProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = onCollapsibleChange ? isReasoningOpen : internalOpen;
  const reasoningContentRef = React.useRef<HTMLDivElement>(null);

  const handleReasoningToggle = (o: boolean) => {
    console.log('🔄 AdaptiveAnswerSkeleton toggle called:', o);
    if (onCollapsibleChange) {
      onCollapsibleChange(o);
    } else {
      setInternalOpen(o);
    }
    
    // Scroll the reasoning content into view when opened
    if (o && reasoningContentRef.current) {
      setTimeout(() => {
        reasoningContentRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }, 100);
    }
  };

  // Only show skeleton - never render final message content
  // The final message should be rendered by AnimatedMessage in MessageList
  
  // Pure skeleton - no content display for smooth transition
  return (
    <div className={cn("mb-6", className)} data-skeleton="adaptive-answer">
      <div className="flex items-start">
        <div className="flex-1">
          {/* Big Container wrapping all sections - matches CollapsibleAnswerMessage */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm">
            {/* Top Section: Expert Info and AI Thinking */}
            <div className="flex items-center justify-between">
              {/* Left: Expert Info - Show skeleton until expert is actually loaded */}
              {expertName && expertName !== "Medical Expert" ? (
                <ConnectedMessage
                  expertName={expertName}
                  isConnecting={true}
                  showConnectingIndicator={false}
                  className="mb-0"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16 mt-1"></div>
                  </div>
                </div>
              )}

              {/* Right: AI Thinking Animation */}
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-blue-300 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  {isPreparingFinalAnswer
                    ? "Preparing final answer for you..."
                    : showReasoningSkeleton
                    ? "Medical reasoning in progress..."
                    : isReasoningModel
                    ? `Assigning a medical expert`
                    : "AI is thinking..."}
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-500 -mt-2">
            </div>

            {/* Show Medical Reasoning Button - Only show when showReasoningSkeleton is true */}
            {showReasoningSkeleton && (
              <Collapsible
                open={open}
                onOpenChange={handleReasoningToggle}
              >
                <div className="flex items-center justify-end">
                  <CollapsibleTrigger asChild>
                    <button 
                      type="button"
                      className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors text-xs font-medium text-gray-700"
                    >
                      <Brain className="w-3 h-3" />
                      <span>{open ? "Hide Medical Reasoning" : "Show Medical Reasoning"}</span>
                      {open ? <ChevronUp className="ml-auto w-3 h-3" /> : <ChevronDown className="ml-auto w-3 h-3" />}
                    </button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent
                  className={cn(
                    "transition-all duration-300 ease-out",
                    open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                  )}
                >
                  <div 
                    ref={reasoningContentRef}
                    className="prose prose-gray max-w-none p-6 bg-gray-50/30 rounded-xl border border-gray-200 mt-3 ai-response-content"
                  >
                   
                    {/* Show live reasoning stream if available, otherwise show skeleton */}
                    {tempReasoningMessage?.text ? (
                      <StreamingMarkdown
                        text={tempReasoningMessage.text}
                        isStreaming={tempReasoningMessage.isTemporary}
                        autoScroll={true}
                        className="text-sm text-gray-700 leading-relaxed"
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="h-4 bg-blue-200 rounded animate-pulse w-full"></div>
                          <div className="h-4 bg-blue-200 rounded animate-pulse w-5/6"></div>
                          <div className="h-4 bg-blue-200 rounded animate-pulse w-4/5"></div>
                        </div>
                        
                        {/* Skeleton Bullet Points */}
                        <div className="space-y-2">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-300 rounded-full mt-2 animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-blue-200 rounded animate-pulse w-full"></div>
                              <div className="h-3 bg-blue-200 rounded animate-pulse w-3/4"></div>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-300 rounded-full mt-2 animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-blue-200 rounded animate-pulse w-5/6"></div>
                              <div className="h-3 bg-blue-200 rounded animate-pulse w-2/3"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Short Answer Section - Always skeleton */}
            <div className="bg-gray-50 border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
              <div className="px-5 py-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  </div>
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-full"></div>
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-4/5"></div>
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            </div>

            {/* Detailed Answer Section - Always skeleton */}
            <div className="bg-gray-50 border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
              <div className="px-5 py-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  </div>
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                </div>
              </div>
            </div>

            {/* Reference Section - Always skeleton */}
            <div className="bg-gray-50 border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
              <div className="px-5 py-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  </div>
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5"></div>
                  </div>
           </div>
          
          </div></div>
        </div>
      </div>
    </div>
  );
}
