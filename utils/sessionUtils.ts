// utils/sessionUtils.ts

/**
 * Generates a unique session identifier for drug safety analysis
 * This ensures each analysis request has a unique identifier
 */
export function generateSessionId(): string {
  // Generate a UUID-like string without external dependencies
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  
  return `drug_safety_${timestamp}_${randomPart}_${randomPart2}`;
}

/**
 * Validates that a chat ID is properly formatted and not empty
 */
export function validateChatId(chatId: string | null | undefined): boolean {
  if (!chatId || typeof chatId !== 'string') {
    return false;
  }
  
  // Check for minimum length and valid characters
  const chatIdRegex = /^[a-zA-Z0-9_-]+$/;
  return chatId.length >= 3 && chatIdRegex.test(chatId);
}

/**
 * Validates that a message ID is properly formatted and not empty
 */
export function validateMessageId(messageId: string | null | undefined): boolean {
  if (!messageId || typeof messageId !== 'string') {
    return false;
  }
  
  // Check for minimum length and valid characters
  const messageIdRegex = /^[a-zA-Z0-9_-]+$/;
  return messageId.length >= 3 && messageIdRegex.test(messageId);
}

/**
 * Validates that a user ID is properly formatted and not empty
 */
export function validateUserId(userId: string | null | undefined): boolean {
  if (!userId || typeof userId !== 'string') {
    return false;
  }
  
  // Firebase UIDs are typically 28 characters long
  return userId.length >= 10;
}

/**
 * Creates a composite key for session isolation
 * This ensures data is properly segregated by user and chat
 */
export function createSessionKey(userId: string, chatId: string): string {
  if (!validateUserId(userId) || !validateChatId(chatId)) {
    throw new Error('Invalid userId or chatId provided for session key creation');
  }
  
  return `${userId}:${chatId}`;
}

/**
 * Validates that all required session parameters are present and valid
 */
export function validateSessionParams(params: {
  userId?: string | null;
  chatId?: string | null;
  messageId?: string | null;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!validateUserId(params.userId)) {
    errors.push('Invalid or missing userId');
  }
  
  if (!validateChatId(params.chatId)) {
    errors.push('Invalid or missing chatId');
  }
  
  if (!validateMessageId(params.messageId)) {
    errors.push('Invalid or missing messageId');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes input text for safe storage and comparison
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Creates a deterministic cache key based on content and session
 */
export function createCacheKey(params: {
  userId: string;
  chatId: string;
  messageId: string;
  contentHash: string;
}): string {
  const { userId, chatId, messageId, contentHash } = params;
  
  // Validate all parameters
  const validation = validateSessionParams({ userId, chatId, messageId });
  if (!validation.isValid) {
    throw new Error(`Invalid session parameters: ${validation.errors.join(', ')}`);
  }
  
  if (!contentHash || contentHash.length < 10) {
    throw new Error('Invalid content hash provided');
  }
  
  return `${userId}_${chatId}_${messageId}_${contentHash}`;
}