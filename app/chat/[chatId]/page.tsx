'use client';

import Chat from '@/components/Chat';
import { useParams } from 'next/navigation';
import { ChatLoadingSkeleton } from '@/components/chat/ChatLoadingSkeleton';

export default function ChatPage() {
  const params = useParams();
  const chatId = params?.chatId as string;

  if (!chatId) {
    return <ChatLoadingSkeleton type="initializing" />;
  }
  
  return <Chat chatId={chatId} onChatCreated={() => {}} />;
}
