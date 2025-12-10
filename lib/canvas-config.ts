/**
 * Configuration for Canvas iframe communication
 */

export const CANVAS_CONFIG = {
  // Allowed origins for postMessage communication
  allowedOrigins: [
    'https://iso-clinic.vercel.app',
    'https://boardv27.vercel.app',
    'https://boardv28.vercel.app',
    'https://boardv29.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173', // Vite default
  ] as string[],

  // EASL app URL (this app)
  easlAppUrl: 'https://easl-board.vercel.app',

  // Message types
  messageTypes: {
    CANVAS_QUERY: 'CANVAS_QUERY',
    EASL_RESPONSE: 'EASL_RESPONSE',
  },
};
