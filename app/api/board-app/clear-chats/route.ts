import { NextRequest, NextResponse } from 'next/server';
import { UnifiedChatService } from '@/services/unifiedChatService';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * CORS headers for Board App integration
 * Allows requests from Board App (production and local development)
 */
function getCorsHeaders(origin: string | null) {
  // Allowed origins
  const allowedOrigins = [
    'https://iso-clinic.vercel.app',
    'https://iso-clinic-v2.vercel.app',
    'https://boardv27.vercel.app', 
    'https://boardv28.vercel.app',
    'https://iso-clinic-v3-481780815788.europe-west1.run.app',
    'https://boardv29.vercel.app',// Production Board App
    'http://localhost:3000',        // Local Board App development
    'http://localhost:3001',        // Alternative local port
  ];

  // Check if origin is allowed
  const isAllowed = origin && allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Handle OPTIONS preflight request
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

/**
 * API endpoint to clear ALL chats for the user
 * 
 * This endpoint deletes ALL chats and their messages for the user,
 * regardless of source (board app or main app). This provides a complete reset.
 * 
 * Supports both:
 * - Authenticated users (Firebase): Requires ID token
 * - Guest users: Uses special "guest" token
 * 
 * POST /api/board-app/clear-chats
 * Headers:
 *   Authorization: Bearer <firebase-id-token> OR Bearer guest
 * 
 * Response:
 *   {
 *     success: boolean,
 *     deletedChats: number,
 *     deletedMessages: number,
 *     errors?: string[]
 *   }
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  try {
    // Extract authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing or invalid authorization header',
          message: 'Authorization header must be in format: Bearer <firebase-id-token> or Bearer guest'
        },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let userId: string | null = null;
    
    // Check if it's a guest user
    if (token === 'guest') {
      // Guest mode - no authentication needed
      userId = null;
      console.log('Clear chats request for guest user');
    } else {
      // Authenticated user - verify Firebase token
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        userId = decodedToken.uid;
        console.log('Clear chats request for authenticated user:', userId);
      } catch (error) {
        console.error('Token verification failed:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid or expired token',
            message: 'Please provide a valid Firebase ID token or use "guest" for guest mode'
          },
          { status: 401, headers: corsHeaders }
        );
      }
    }

    // Delete chats using UnifiedChatService (handles both Firebase and localStorage)
    const result = await UnifiedChatService.deleteBoardAppChats(userId);

    // Return success response
    return NextResponse.json({
      success: true,
      deletedChats: result.deletedChats,
      deletedMessages: result.deletedMessages,
      errors: result.errors.length > 0 ? result.errors : undefined,
      message: `Successfully deleted ${result.deletedChats} chat(s) with ${result.deletedMessages} message(s)`,
      mode: userId ? 'authenticated' : 'guest',
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in clear-chats endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Only allow POST requests
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405, headers: getCorsHeaders(origin) }
  );
}
