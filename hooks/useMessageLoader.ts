'use client';

import { useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useAuthContext } from '@/components/auth-provider';
import { UnifiedChatService } from '@/services/unifiedChatService';
import { Message } from '@/types/message';

export function useMessageLoader({
  chatId,
  setMessages,
  setIsLoadingMessages,
}: {
  chatId: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsLoadingMessages: (b: boolean) => void;
}) {
  const { user } = useAuth();
  const { isGuestMode } = useAuthContext();

  useEffect(() => {
    const userId: string | null = isGuestMode ? null : (user?.uid || null);
    
    // Need either authenticated user or guest mode
    if (!userId && !isGuestMode) return;
    if (!chatId) return;

    setIsLoadingMessages(true);

    // Guest mode: Load from localStorage
    if (isGuestMode) {
      (async () => {
        try {
          const msgs = await UnifiedChatService.loadMessages(userId, chatId);
          console.log('LocalStorage loaded messages:', msgs.length);
          setMessages(msgs);
          setIsLoadingMessages(false);
        } catch (error) {
          console.error('Error loading messages from localStorage:', error);
          setIsLoadingMessages(false);
        }
      })();
      return; // No cleanup needed for localStorage
    }

    // Authenticated mode: Use Firebase listener
    const q = query(
      collection(db, `users/${userId}/chats/${chatId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id, // Use Firestore document ID
          timestamp: data.timestamp?.toDate() || new Date(),
        } as Message;
      });
      
      console.log('Firebase listener loaded messages:', msgs.length);
      
      // Use a small delay to ensure temp messages are cleared first
      // This prevents the flicker of seeing both temp and real messages
      requestAnimationFrame(() => {
        setMessages(msgs);
        setIsLoadingMessages(false);
      });
    });

    return () => unsub();
  }, [chatId, user?.uid, isGuestMode, setMessages, setIsLoadingMessages]);
}
