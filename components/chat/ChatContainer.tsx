// components/chat/ChatContainer.tsx

"use client";

import React from "react";

interface ChatContainerProps {
  children: React.ReactNode;
}

export function ChatContainer({ children }: ChatContainerProps) {
  return (
    <div className="h-screen bg-gradient-to-br from-[#ECECF1] via-[#E7E8ED] to-[#D4D2DE] flex flex-col">
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {children}
      </div>
    </div>
  );
}