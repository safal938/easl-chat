"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ExpertLoadingIndicatorProps {
  isVisible: boolean;
  expertName?: string;
  className?: string;
}

const EXPERT_MESSAGES = {
  Viral_Hepatitis: [
    "Connecting with Viral Hepatitis Expert...",
    "Analyzing hepatitis protocols...",
    "Reviewing treatment guidelines...",
    "Preparing specialized response...",
  ],

  Hepatocellular_Carcinoma: [
    "Connecting with Hepatocellular Carcinoma Expert...",
    "Reviewing liver imaging and lab results...",
    "Evaluating tumor staging and prognosis...",
    "Preparing personalized treatment insights...",
  ],

  default: [
    "Connecting with Medical Expert...",
    "Reviewing clinical data...",
    "Analyzing treatment options...",
    "Preparing expert response...",
  ],
};


export function ExpertLoadingIndicator({
  isVisible,
  expertName,
  className,
}: ExpertLoadingIndicatorProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasStartedCycling, setHasStartedCycling] = useState(false);

  const messages =
    EXPERT_MESSAGES[expertName as keyof typeof EXPERT_MESSAGES] ||
    EXPERT_MESSAGES.default;

  useEffect(() => {
    if (!isVisible) {
      // Reset state when not visible
      setCurrentMessageIndex(0);
      setDisplayText("");
      setIsTyping(false);
      setHasStartedCycling(false);
      return;
    }

    let messageTimer: NodeJS.Timeout;
    let typingTimer: NodeJS.Timeout;
    let charIndex = 0;

    const typeMessage = (message: string, isFirstMessage = false) => {
      setIsTyping(true);
      setDisplayText("");
      charIndex = 0;

      const typeChar = () => {
        if (charIndex < message.length) {
          setDisplayText(message.substring(0, charIndex + 1));
          charIndex++;
          typingTimer = setTimeout(typeChar, 50); // Typing speed
        } else {
          setIsTyping(false);

          if (isFirstMessage) {
            // For the first message, wait 5 seconds before starting cycling
            messageTimer = setTimeout(() => {
              setHasStartedCycling(true);
              setCurrentMessageIndex(1); // Move to second message
            }, 5000);
          } else {
            // For subsequent messages, wait 2 seconds before next message
            messageTimer = setTimeout(() => {
              setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
            }, 2000);
          }
        }
      };

      typeChar();
    };

    if (!hasStartedCycling && currentMessageIndex === 0) {
      // Show the first "Connecting..." message
      typeMessage(messages[0], true);
    } else {
      // Continue with normal cycling
      typeMessage(messages[currentMessageIndex]);
    }

    return () => {
      clearTimeout(messageTimer);
      clearTimeout(typingTimer);
    };
  }, [currentMessageIndex, messages, isVisible, hasStartedCycling]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex justify-start transition-all duration-300 mb-6",
        "opacity-100 translate-y-0",
        className
      )}
    >
      <div className="bg-white/90 backdrop-blur-md border border-white/60 px-6 py-5 rounded-3xl shadow-2xl max-w-[85%]">
        <div className="flex items-center space-x-2">
          {/* Animated dots - matching TypingIndicator */}
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-[#81D4FA] rounded-full animate-bounce" />
            <div
              className="w-2 h-2 bg-[#4FC3F7] rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="w-2 h-2 bg-[#29B6F6] rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>

          {/* Dynamic message */}
          <div className="flex items-center ml-2">
            <span className="text-sm text-gray-700 font-medium">
              {displayText}
            </span>
            {isTyping && (
              <span className="inline-block w-0.5 h-4 bg-[#29B6F6] ml-1 animate-pulse" />
            )}
          </div>
        </div>

        {/* Progress bar - using same blue tones */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
          <div
            className="bg-[#29B6F6] h-1 rounded-full transition-all duration-1000 ease-out"
            style={{
              width: hasStartedCycling
                ? `${((currentMessageIndex + 1) / messages.length) * 100}%`
                : `${(1 / messages.length) * 100}%`, // Show progress for first message
            }}
          />
        </div>
      </div>
    </div>
  );
}
