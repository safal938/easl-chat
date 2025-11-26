// services/unifiedChatService.ts
import { ChatService } from "./chatService";
import { LocalStorageChatService } from "./localStorageChatService";
import { Message } from "@/types/message";

const GUEST_USER_ID = "guest_user";

// Determine if we should use local storage (guest mode)
function isGuestMode(userId: string | null | undefined): boolean {
  return !userId || userId === GUEST_USER_ID;
}

/**
 * Unified Chat Service that automatically routes to either Firebase or LocalStorage
 * based on whether the user is authenticated or in guest mode
 */
export class UnifiedChatService {
  // ---------- Reads ----------
  static async loadMessages(userId: string | null, chatId: string): Promise<Message[]> {
    const effectiveUserId = userId || GUEST_USER_ID;
    
    if (isGuestMode(userId)) {
      return LocalStorageChatService.loadMessages(effectiveUserId, chatId);
    }
    return ChatService.loadMessages(effectiveUserId, chatId);
  }

  // ---------- Create chat ----------
  static async createChat(userId: string | null, firstUserText: string): Promise<string> {
    const effectiveUserId = userId || GUEST_USER_ID;
    
    if (isGuestMode(userId)) {
      return LocalStorageChatService.createChat(effectiveUserId, firstUserText);
    }
    return ChatService.createChat(effectiveUserId, firstUserText);
  }

  // ---------- Save message ----------
  static async saveMessage(userId: string | null, chatId: string, message: Message): Promise<void> {
    const effectiveUserId = userId || GUEST_USER_ID;
    
    if (isGuestMode(userId)) {
      return LocalStorageChatService.saveMessage(effectiveUserId, chatId, message);
    }
    return ChatService.saveMessage(effectiveUserId, chatId, message);
  }

  // ---------- Check if chat has messages ----------
  static async chatHasMessages(userId: string | null, chatId: string): Promise<boolean> {
    const effectiveUserId = userId || GUEST_USER_ID;
    
    if (isGuestMode(userId)) {
      return LocalStorageChatService.chatHasMessages(effectiveUserId, chatId);
    }
    return ChatService.chatHasMessages(effectiveUserId, chatId);
  }

  // ---------- Delete empty chat ----------
  static async deleteChatIfEmpty(userId: string | null, chatId: string): Promise<void> {
    const effectiveUserId = userId || GUEST_USER_ID;
    
    if (isGuestMode(userId)) {
      return LocalStorageChatService.deleteChatIfEmpty(effectiveUserId, chatId);
    }
    return ChatService.deleteChatIfEmpty(effectiveUserId, chatId);
  }

  // ---------- Delete all chats ----------
  static async deleteBoardAppChats(userId: string | null): Promise<{
    deletedChats: number;
    deletedMessages: number;
    errors: string[];
  }> {
    const effectiveUserId = userId || GUEST_USER_ID;
    
    if (isGuestMode(userId)) {
      return LocalStorageChatService.deleteBoardAppChats(effectiveUserId);
    }
    return ChatService.deleteBoardAppChats(effectiveUserId);
  }

  // ---------- Streaming ----------
  static async sendChatRequest(
    question: string,
    modelType: "reasoning_model",
    userInfo: { user_email: string },
    signal: AbortSignal
  ): Promise<Response> {
    // Streaming works the same for both modes
    return ChatService.sendChatRequest(question, modelType, userInfo, signal);
  }

  // ---------- Safety analysis helpers ----------
  static async saveSafetyAnalysis(
    userId: string | null,
    chatId: string,
    messageId: string,
    safetyAnalysis: any
  ): Promise<void> {
    const effectiveUserId = userId || GUEST_USER_ID;
    
    if (isGuestMode(userId)) {
      return LocalStorageChatService.saveSafetyAnalysis(effectiveUserId, chatId, messageId, safetyAnalysis);
    }
    return ChatService.saveSafetyAnalysis(effectiveUserId, chatId, messageId, safetyAnalysis);
  }

  static async getSafetyAnalysis(
    userId: string | null,
    chatId: string,
    messageId: string
  ): Promise<any | null> {
    const effectiveUserId = userId || GUEST_USER_ID;
    
    if (isGuestMode(userId)) {
      return LocalStorageChatService.getSafetyAnalysis(effectiveUserId, chatId, messageId);
    }
    return ChatService.getSafetyAnalysis(effectiveUserId, chatId, messageId);
  }

  // ---------- Helper to check mode ----------
  static isGuestMode(userId: string | null | undefined): boolean {
    return isGuestMode(userId);
  }

  static getGuestUserId(): string {
    return GUEST_USER_ID;
  }
}
