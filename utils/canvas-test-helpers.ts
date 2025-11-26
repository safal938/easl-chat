/**
 * Test helpers for Canvas iframe communication
 * Use these in browser console to test postMessage functionality
 */

import { CANVAS_CONFIG } from '@/lib/canvas-config';

/**
 * Simulate receiving a query from Canvas (for testing in browser console)
 * Usage in browser console:
 * 
 * window.testCanvasQuery('What are the side effects of aspirin?')
 */
export function testCanvasQuery(query: string, metadata?: any) {
  const message = {
    type: CANVAS_CONFIG.messageTypes.CANVAS_QUERY,
    payload: {
      query,
      timestamp: new Date().toISOString(),
      metadata: metadata || { test: true, source: 'console' },
    },
  };

  window.postMessage(message, window.location.origin);
  console.log('📤 Test query sent:', message);
}

/**
 * Log all postMessage events (for debugging)
 */
export function enableMessageLogging() {
  const originalPostMessage = window.postMessage.bind(window);
  
  window.postMessage = function(message: any, targetOrigin: string, transfer?: Transferable[]) {
    console.log('📨 postMessage called:', { message, targetOrigin, transfer });
    if (transfer) {
      return originalPostMessage(message, targetOrigin, transfer);
    }
    return originalPostMessage(message, targetOrigin);
  } as typeof window.postMessage;

  window.addEventListener('message', (event) => {
    console.log('📥 Message received:', {
      origin: event.origin,
      data: event.data,
      source: event.source === window ? 'self' : 'external',
    });
  });

  console.log('✅ Message logging enabled');
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testCanvasQuery = testCanvasQuery;
  (window as any).enableMessageLogging = enableMessageLogging;
}
