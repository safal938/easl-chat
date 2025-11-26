'use client';

import { useEffect, useCallback } from 'react';
import { CANVAS_CONFIG } from '@/lib/canvas-config';

interface CanvasQueryPayload {
  query: string;
  timestamp: string;
  metadata?: {
    patientId?: string;
    context?: string;
    source?: 'user' | 'voice' | 'api';
    [key: string]: any;
  };
}

interface ClearChatsPayload {
  timestamp?: string;
}

interface CanvasQueryMessage {
  type: 'CANVAS_QUERY';
  payload: CanvasQueryPayload;
}

interface ClearChatsMessage {
  type: 'CLEAR_CHATS';
  payload: ClearChatsPayload;
}

type CanvasMessage = CanvasQueryMessage | ClearChatsMessage;

interface UseCanvasMessageListenerProps {
  onQueryReceived: (query: string, metadata?: any) => void;
  onClearChats?: () => void;
  allowedOrigins?: string[];
}

/**
 * Hook to listen for postMessage events from the parent Canvas window
 * and process incoming queries.
 */
export function useCanvasMessageListener({
  onQueryReceived,
  onClearChats,
  allowedOrigins = CANVAS_CONFIG.allowedOrigins,
}: UseCanvasMessageListenerProps) {
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Security: Verify the origin
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('⚠️ Message from untrusted origin:', event.origin);
        return;
      }

      // Check message type and structure
      const message = event.data as CanvasMessage;
      
      if (message?.type === 'CANVAS_QUERY') {
        const { query, timestamp, metadata } = message.payload;

        console.log('📥 Received query from Canvas:', {
          query,
          timestamp,
          metadata,
          origin: event.origin,
        });

        // Process the query
        onQueryReceived(query, metadata);
      } else if (message?.type === 'CLEAR_CHATS') {
        console.log('🗑️ Received clear chats request from Canvas:', {
          timestamp: message.payload.timestamp,
          origin: event.origin,
        });

        // Process the clear chats request
        if (onClearChats) {
          onClearChats();
        }
      }
    },
    [onQueryReceived, onClearChats, allowedOrigins]
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);

    // Log that listener is active
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  /**
   * Send a response back to the parent Canvas window
   */
  const sendResponseToCanvas = useCallback(
    (response: any, status: 'success' | 'error' = 'success', metadata?: any) => {
      if (window.parent && window.parent !== window) {
        const message = {
          type: 'EASL_RESPONSE',
          payload: {
            response,
            timestamp: new Date().toISOString(),
            status,
            metadata,
          },
        };

        // Send to all allowed origins
        allowedOrigins.forEach((origin) => {
          try {
            window.parent.postMessage(message, origin);
            console.log('📤 Sent response to Canvas:', { origin, status });
          } catch (error) {
            console.error('❌ Failed to send response to Canvas:', error);
          }
        });
      }
    },
    [allowedOrigins]
  );

  return { sendResponseToCanvas };
}
