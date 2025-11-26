// services/localStorageChatService.ts
import { Message } from "@/types/message";

const STORAGE_KEY_PREFIX = "easl_chat_";
const CHATS_LIST_KEY = "easl_chats_list";
const GUEST_USER_ID = "guest_user";

interface ChatMetadata {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  hasBoardAppMessages?: boolean;
}

function makeTitleFrom(text: string) {
  const t = (text || "").trim().replace(/\s+/g, " ");
  if (!t) return "New Chat";
  return t.slice(0, 50) + (t.length > 50 ? "…" : "");
}

export class LocalStorageChatService {
  // ---------- Helper methods ----------
  private static getChatKey(chatId: string): string {
    return `${STORAGE_KEY_PREFIX}${chatId}`;
  }

  private static getAllChats(): ChatMetadata[] {
    try {
      const chatsJson = localStorage.getItem(CHATS_LIST_KEY);
      return chatsJson ? JSON.parse(chatsJson) : [];
    } catch (err) {
      console.error("Error reading chats list:", err);
      return [];
    }
  }

  private static saveAllChats(chats: ChatMetadata[]): void {
    try {
      localStorage.setItem(CHATS_LIST_KEY, JSON.stringify(chats));
    } catch (err) {
      console.error("Error saving chats list:", err);
    }
  }

  // ---------- Reads ----------
  static async loadMessages(userId: string, chatId: string): Promise<Message[]> {
    try {
      const chatKey = this.getChatKey(chatId);
      const messagesJson = localStorage.getItem(chatKey);
      
      if (!messagesJson) {
        return [];
      }

      const messages = JSON.parse(messagesJson);
      // Convert timestamp strings back to Date objects
      return messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    } catch (err) {
      console.error("Error loading messages from localStorage:", err);
      return [];
    }
  }

  // ---------- Create chat ----------
  static async createChat(userId: string, firstUserText: string): Promise<string> {
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const title = makeTitleFrom(firstUserText);
    const now = new Date().toISOString();

    const newChat: ChatMetadata = {
      id: chatId,
      title,
      createdAt: now,
      updatedAt: now,
    };

    const chats = this.getAllChats();
    chats.unshift(newChat); // Add to beginning
    this.saveAllChats(chats);

    // Initialize empty messages array
    localStorage.setItem(this.getChatKey(chatId), JSON.stringify([]));

    return chatId;
  }

  // ---------- Save message ----------
  static async saveMessage(userId: string, chatId: string, message: Message): Promise<void> {
    try {
      const chatKey = this.getChatKey(chatId);
      const messagesJson = localStorage.getItem(chatKey);
      const messages: Message[] = messagesJson ? JSON.parse(messagesJson) : [];

      // Add or update message
      const existingIndex = messages.findIndex((m) => m.id === message.id);
      if (existingIndex >= 0) {
        messages[existingIndex] = message;
      } else {
        messages.push(message);
      }

      localStorage.setItem(chatKey, JSON.stringify(messages));

      // Update chat metadata
      const chats = this.getAllChats();
      const chatIndex = chats.findIndex((c) => c.id === chatId);
      
      if (chatIndex >= 0) {
        chats[chatIndex].updatedAt = new Date().toISOString();
        
        // Update title if it's the first user message and title is generic
        if (message.isUser && (!chats[chatIndex].title || chats[chatIndex].title === "New Chat")) {
          chats[chatIndex].title = makeTitleFrom(message.text || "");
        }
        
        // Track board app messages
        if (message.source === "board-app") {
          chats[chatIndex].hasBoardAppMessages = true;
        }
        
        this.saveAllChats(chats);
      }
    } catch (err) {
      console.error("Error saving message to localStorage:", err);
      throw err;
    }
  }

  // ---------- Check if chat has messages ----------
  static async chatHasMessages(userId: string, chatId: string): Promise<boolean> {
    try {
      const chatKey = this.getChatKey(chatId);
      const messagesJson = localStorage.getItem(chatKey);
      const messages = messagesJson ? JSON.parse(messagesJson) : [];
      return messages.length > 0;
    } catch (err) {
      console.error("Error checking chat messages:", err);
      return false;
    }
  }

  // ---------- Delete empty chat ----------
  static async deleteChatIfEmpty(userId: string, chatId: string): Promise<void> {
    const hasMessages = await this.chatHasMessages(userId, chatId);
    
    if (!hasMessages) {
      // Remove from chats list
      const chats = this.getAllChats();
      const filteredChats = chats.filter((c) => c.id !== chatId);
      this.saveAllChats(filteredChats);
      
      // Remove messages
      localStorage.removeItem(this.getChatKey(chatId));
    }
  }

  // ---------- Delete all chats ----------
  static async deleteBoardAppChats(userId: string): Promise<{
    deletedChats: number;
    deletedMessages: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let deletedChats = 0;
    let deletedMessages = 0;

    try {
      const chats = this.getAllChats();
      
      for (const chat of chats) {
        try {
          const chatKey = this.getChatKey(chat.id);
          const messagesJson = localStorage.getItem(chatKey);
          const messages = messagesJson ? JSON.parse(messagesJson) : [];
          
          deletedMessages += messages.length;
          localStorage.removeItem(chatKey);
          deletedChats++;
        } catch (err) {
          errors.push(`Error deleting chat ${chat.id}: ${err}`);
        }
      }

      // Clear the chats list
      localStorage.removeItem(CHATS_LIST_KEY);

      return { deletedChats, deletedMessages, errors };
    } catch (err) {
      errors.push(`Error deleting chats: ${err}`);
      return { deletedChats, deletedMessages, errors };
    }
  }

  // ---------- Get all chats (for sidebar) ----------
  static async getAllChatsMetadata(userId: string | null): Promise<ChatMetadata[]> {
    return this.getAllChats();
  }

  // ---------- Streaming (same as Firebase version) ----------
  static async sendChatRequest(
    question: string,
    modelType: "reasoning_model",
    userInfo: { user_email: string },
    signal: AbortSignal
  ): Promise<Response> {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, model_type: modelType, user_info: userInfo }),
      signal,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!response.body) throw new Error("No response body");
    return response;
  }

  // ---------- Safety analysis helpers ----------
  static async saveSafetyAnalysis(
    userId: string,
    chatId: string,
    messageId: string,
    safetyAnalysis: any
  ): Promise<void> {
    try {
      const chatKey = this.getChatKey(chatId);
      const messagesJson = localStorage.getItem(chatKey);
      const messages: Message[] = messagesJson ? JSON.parse(messagesJson) : [];
      
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex >= 0) {
        messages[messageIndex].safetyAnalysis = safetyAnalysis;
        localStorage.setItem(chatKey, JSON.stringify(messages));
      }
    } catch (err) {
      console.error("Error saving safety analysis:", err);
      throw err;
    }
  }

  static async getSafetyAnalysis(
    userId: string,
    chatId: string,
    messageId: string
  ): Promise<any | null> {
    try {
      const chatKey = this.getChatKey(chatId);
      const messagesJson = localStorage.getItem(chatKey);
      const messages: Message[] = messagesJson ? JSON.parse(messagesJson) : [];
      
      const message = messages.find((m) => m.id === messageId);
      return message?.safetyAnalysis || null;
    } catch (err) {
      console.error("Error getting safety analysis:", err);
      return null;
    }
  }
}
