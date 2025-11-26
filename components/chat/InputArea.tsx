// components/chat/InputArea.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Mic, Send, Wand2, Square, ChevronsUpDown } from "lucide-react";
import HighlightedTextarea from "@/components/HighlightedTextarea";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useServerStatus } from "@/hooks/useServerStatus";
import { ServerStatusOverlay } from "@/components/ServerStatusOverlay";

interface InputAreaProps {
  currentInput: string;
  setCurrentInput: (value: string) => void;
  isTyping: boolean;
  modelType: "reasoning_model";
  setModelType: (type: "reasoning_model") => void;
  onSendMessage: () => void;
  onStop: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onFocusChange: (isFocused: boolean) => void;
  maxWidth?: string;
}

export function InputArea({
  currentInput,
  setCurrentInput,
  isTyping,
  modelType,
  setModelType,
  onSendMessage,
  onStop,
  onKeyPress,
  onFocusChange,
  maxWidth = "max-w-2xl",
}: InputAreaProps) {
  const [isIdle, setIsIdle] = useState(false);
  const [isModalClosed, setIsModalClosed] = useState(false);
  const { isServerHealthy, isChecking } = useServerStatus();

  useEffect(() => {
    setIsIdle(false);
    if (currentInput.trim()) {
      const timer = setTimeout(() => setIsIdle(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentInput]);

  // Reset modal closed state when server becomes healthy
  useEffect(() => {
    if (isServerHealthy) {
      setIsModalClosed(false);
    }
  }, [isServerHealthy]);

  const handleModelTypeChange = (newModelType: "reasoning_model") => {
    setModelType(newModelType);
  };

  const handleCloseModal = () => {
    setIsModalClosed(true);
  };

  const handleSendAttempt = () => {
    if (!isServerHealthy) {
      // Show modal again if user tries to send while server is unhealthy
      setIsModalClosed(false);
      return;
    }
    onSendMessage();
  };

  // Determine if input should be disabled
  const isInputDisabled = isTyping || !isServerHealthy;
  
  // Show modal if server is unhealthy and user hasn't closed it
  const shouldShowModal = !isServerHealthy && !isChecking && !isModalClosed;

  return (
    <>
      <ServerStatusOverlay isVisible={shouldShowModal} onClose={handleCloseModal} />
      <div className={`w-full ${maxWidth} mx-auto`}>
        <div className="bg-white p-1 rounded-3xl border border-gray-300 w-full">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden w-full">
            <div className="border-b border-gray-100">
              <HighlightedTextarea
                value={currentInput}
                onChange={setCurrentInput}
                onKeyPress={onKeyPress}
                onFocusChange={onFocusChange}
                disabled={isInputDisabled}
                placeholder="Message Hepatology AI"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center space-x-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-1 px-1.5 py-0.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100/60 rounded text-xs h-6 min-h-0"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span className="text-xs font-medium">
                        Reasoning
                      </span>
                      <ChevronsUpDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-xs py-1 px-2"
                      onClick={() => handleModelTypeChange("reasoning_model")}
                    >
                      🧠 Reasoning Model
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center">
                {currentInput.trim() ? (
                  <button
                    onClick={isTyping ? onStop : handleSendAttempt}
                    disabled={isInputDisabled && !isTyping}
                    className={cn(
                      "p-2 rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400/50",
                      isTyping
                        ? "bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:scale-105"
                        : isIdle && !isInputDisabled
                        ? "bg-[#0288D1] text-white hover:bg-[#0277BD] hover:shadow-lg hover:scale-105"
                        : !isInputDisabled
                        ? "bg-gray-300 text-gray-500 hover:bg-[#0277BD]  hover:text-white hover:shadow-lg hover:scale-105"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    )}
                  >
                    {isTyping ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4 -rotate-45" />
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={isTyping ? onStop : undefined}
                    className={cn(
                      "p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400/50",
                      isTyping
                        ? "bg-gray-300 text-gray-500 hover:bg-gray-200 hover:shadow-lg hover:scale-105"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/80"
                    )}
                    disabled={isInputDisabled && !isTyping}
                  >
                    {isTyping ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
