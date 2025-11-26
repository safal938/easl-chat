// services/chatService.ts
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  limit,
  deleteDoc,
} from "firebase/firestore";

import { Message } from "@/types/message";

function makeTitleFrom(text: string) {
  const t = (text || "").trim().replace(/\s+/g, " ");
  if (!t) return "New Chat";
  return t.slice(0, 50) + (t.length > 50 ? "…" : "");
}

export class ChatService {
  // ---------- Reads ----------
  static async loadMessages(userId: string, chatId: string): Promise<Message[]> {
    try {
      const messagesQuery = query(
        collection(db, "users", userId, "chats", chatId, "messages"),
        orderBy("timestamp", "asc")
      );
      const snapshot = await getDocs(messagesQuery);
      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          text: data.text || "",
          isUser: data.isUser || false,
          timestamp: data.timestamp?.toDate() || new Date(),
          uid: data.uid,
          isReasoning: data.isReasoning || false,
          isReasoningAnswer: data.isReasoningAnswer || false,
          reasoningText: data.reasoningText,
          isReasoningFinalAnswer: data.isReasoningFinalAnswer || false,
          expertName: data.expertName,
          safetyAnalysis: data.safetyAnalysis,
          source: data.source,
          boardAppMetadata: data.boardAppMetadata,
        } as Message;
      });
    } catch (err) {
      console.error("Error loading messages:", err);
      throw err;
    }
  }

  // ---------- Create chat (called only after user clicks Send) ----------
  static async createChat(userId: string, firstUserText: string): Promise<string> {
    const title = makeTitleFrom(firstUserText);
    const newChatRef = await addDoc(collection(db, "users", userId, "chats"), {
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newChatRef.id;
  }

  // ---------- Save message & keep parent chat fresh ----------
  static async saveMessage(userId: string, chatId: string, message: Message): Promise<void> {
    const msgRef = doc(db, "users", userId, "chats", chatId, "messages", message.id);
    
    // Clean up the message object - remove undefined values (Firestore doesn't allow them)
    const messageData: any = { ...message, timestamp: serverTimestamp() };
    Object.keys(messageData).forEach(key => {
      if (messageData[key] === undefined) {
        delete messageData[key];
      }
    });
    
    await setDoc(msgRef, messageData);

    // Also update the chat doc's updatedAt; if this is the first user message and the chat has a generic title,
    // set a better title derived from the message (without overwriting existing custom titles).
    const chatRef = doc(db, "users", userId, "chats", chatId);
    const chatSnap = await getDoc(chatRef);
    const fieldsToMerge: any = { updatedAt: serverTimestamp() };

    if (message.isUser && chatSnap.exists()) {
      const data = chatSnap.data() as any;
      const currentTitle = data?.title || "";
      // If the current title looks empty/generic, refresh it from user's text
      if (!currentTitle || currentTitle === "New Chat") {
        fieldsToMerge.title = makeTitleFrom(message.text || "");
      }
      // Track if this chat contains board app messages
      if (message.source === 'board-app') {
        fieldsToMerge.hasBoardAppMessages = true;
      }
    }

    await setDoc(chatRef, fieldsToMerge, { merge: true });
  }

  // ---------- Check if chat has any messages ----------
  static async chatHasMessages(userId: string, chatId: string): Promise<boolean> {
    const messagesQuery = query(
      collection(db, "users", userId, "chats", chatId, "messages"),
      limit(1)
    );
    const snap = await getDocs(messagesQuery);
    return !snap.empty;
  }

  // ---------- Remove an empty chat (used if first exchange fails) ----------
  static async deleteChatIfEmpty(userId: string, chatId: string): Promise<void> {
    // check if there is at least one message
    const messagesQuery = query(
      collection(db, "users", userId, "chats", chatId, "messages"),
      limit(1)
    );
    const snap = await getDocs(messagesQuery);
    if (snap.empty) {
      await deleteDoc(doc(db, "users", userId, "chats", chatId));
    }
  }

  // ---------- Delete all chats for user ----------
  static async deleteBoardAppChats(userId: string): Promise<{
    deletedChats: number;
    deletedMessages: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let deletedChats = 0;
    let deletedMessages = 0;

    try {
      // Get all chats for the user
      const chatsQuery = query(collection(db, "users", userId, "chats"));
      const chatsSnapshot = await getDocs(chatsQuery);

      console.log(`🔍 Found ${chatsSnapshot.docs.length} total chats to delete`);

      // Delete ALL chats and their messages
      for (const chatDoc of chatsSnapshot.docs) {
        const chatId = chatDoc.id;

        try {
          // Get all messages in this chat
          const messagesQuery = query(
            collection(db, "users", userId, "chats", chatId, "messages")
          );
          const messagesSnapshot = await getDocs(messagesQuery);

          console.log(`🗑️ Deleting chat ${chatId} with ${messagesSnapshot.docs.length} messages`);
          
          // Delete all messages
          for (const msgDoc of messagesSnapshot.docs) {
            await deleteDoc(msgDoc.ref);
            deletedMessages++;
          }

          // Delete the chat document
          await deleteDoc(chatDoc.ref);
          deletedChats++;
        } catch (err) {
          const errorMsg = `Error deleting chat ${chatId}: ${err}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`✅ Deleted ${deletedChats} chats with ${deletedMessages} messages`);

      return { deletedChats, deletedMessages, errors };
    } catch (err) {
      const errorMsg = `Error deleting chats: ${err}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      return { deletedChats, deletedMessages, errors };
    }
  }

  // ---------- Streaming ----------
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
      const messageRef = doc(db, "users", userId, "chats", chatId, "messages", messageId);
      await setDoc(messageRef, { safetyAnalysis }, { merge: true });
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
      const messageRef = doc(db, "users", userId, "chats", chatId, "messages", messageId);
      const messageDoc = await getDoc(messageRef);
      if (messageDoc.exists()) {
        return (messageDoc.data() as any).safetyAnalysis || null;
      }
      return null;
    } catch (err) {
      console.error("Error getting safety analysis:", err);
      return null;
    }
  }
}
