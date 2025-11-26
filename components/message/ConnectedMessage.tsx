// components/message/ConnectedMessage.tsx

"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Brain, Stethoscope, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectedMessageProps {
  expertName?: string;
  isConnecting?: boolean;
  showConnectingIndicator?: boolean;
  className?: string;
}

export function ConnectedMessage({
  expertName = "Medical Expert",
  isConnecting = false,
  showConnectingIndicator = true,
  className,
}: ConnectedMessageProps) {
  // Format expert name for display
  const formatExpertName = (name: string) => {
    return name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const displayName = formatExpertName(expertName);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 transition-all duration-300 hover:opacity-100 group",
        className
      )}
    >
      <Avatar className="h-8 w-8 border border-gray-200 shadow-sm bg-gradient-to-br from-gray-300 to-gray-400 group-hover:from-blue-400 group-hover:to-blue-600 transition-all duration-900">
        <AvatarFallback className="bg-gradient-to-br from-gray-300 to-gray-400 group-hover:from-blue-400 group-hover:to-blue-600 transition-all duration-900">
          <Stethoscope className="text-white w-4 h-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 group-hover:text-gray-800 transition-colors duration-300">
            {displayName}
          </span>
          {showConnectingIndicator && (
            <span className="text-xs font-medium">
              {isConnecting ? (
                <span className="flex items-center gap-1 text-blue-600">
                  <span
                    className="inline-block w-1 h-1 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="inline-block w-1 h-1 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="inline-block w-1 h-1 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                  <span className="ml-1">Analyzing...</span>
                </span>
              ) : (
                <span className="text-gray-400 transition-colors duration-300">
                  Analyzed
                </span>
              )}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 group-hover:text-gray-600 mt-0.5 leading-tight transition-colors duration-300">
Guideline based Medical AI Agent
        </p>
      </div>
    </div>
  );
}
