// components/chat/EmptyState.tsx

"use client";

import React from "react";
import { Stethoscope } from "lucide-react";
import { useServerStatus } from "@/hooks/useServerStatus";
import { ServerStatusChip } from "@/components/ServerStatusChip";

interface EmptyStateProps {
  children: React.ReactNode;
}

export function EmptyState({ children }: EmptyStateProps) {
  const { isServerHealthy, isChecking } = useServerStatus();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-gradient-to-br from-[#81D4FA] to-[#0288D1] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Stethoscope className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-3">
          How can I help you today?
        </h2>
        <p className="text-gray-600 text-lg max-w-md mx-auto">
          Ask me about hepatology related questions.
        </p>
      </div>
      {/* Server Status Chip - only shown in empty state */}
      <ServerStatusChip isServerHealthy={isServerHealthy} isChecking={isChecking} />
      {children}
    </div>
  );
}