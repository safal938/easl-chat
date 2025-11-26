'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useAuthContext } from '@/components/auth-provider';
import { UnifiedChatService } from '@/services/unifiedChatService';
import { ChatLoadingSkeleton } from '@/components/chat/ChatLoadingSkeleton';

/**
 * Root page creates a new chat and redirects to /chat/[id].
 * Shows loading state while creating the chat.
 * Supports both authenticated and guest modes.
 */
export default function NewChatPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isGuestMode } = useAuthContext();
  const once = useRef(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;
    
    // Don't create chat if neither authenticated nor in guest mode
    if (!user && !isGuestMode) return;
    
    // Only run once
    if (once.current) return;
    once.current = true;
    
    setIsCreatingChat(true);

    (async () => {
      try {
        const userId: string | null = isGuestMode ? null : (user?.uid || null);
        const newChatId = await UnifiedChatService.createChat(userId, '');
        router.replace(`/chat/${newChatId}`);
      } catch (error) {
        console.error('Failed to create new chat:', error);
        setIsCreatingChat(false);
        // Could add error handling UI here
      }
    })();
  }, [user, loading, isGuestMode, router]);

  // Show loading state while creating chat
  if (isCreatingChat) {
    return <ChatLoadingSkeleton type="initializing" />;
  }

  // Show loading state while waiting for auth (but not in guest mode)
  if (loading && !isGuestMode) {
    return <ChatLoadingSkeleton type="initializing" />;
  }

  return null; // fallback - should not be reached
}
