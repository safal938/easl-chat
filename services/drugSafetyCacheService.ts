// services/drugSafetyCacheService.ts

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  deleteDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SafetyAnalysis } from '@/types/drugSafety';
import { 
  validateSessionParams, 
  createSessionKey, 
  sanitizeText,
  generateSessionId 
} from '@/utils/sessionUtils';

export interface CachedSafetyAnalysis {
  id: string;
  chatId: string;
  userId: string;
  messageId: string;
  contentHash: string; // Hash of medical_text + question for deduplication
  safetyData: SafetyAnalysis;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt?: Timestamp; // Optional expiration for cache invalidation
}

export interface SafetyAnalysisRequest {
  medical_text: string;
  question: string;
  chatId: string;
  userId: string;
  messageId: string;
}

export class DrugSafetyCacheService {
  private static readonly COLLECTION_NAME = "drugSafetyCache";
  private static readonly CACHE_EXPIRY_HOURS = 24 * 7; // 7 days

  /**
   * Generates a hash for the given content to enable content-based caching
   */
  private static generateContentHash(medicalText: string, question: string): string {
    const content = `${sanitizeText(medicalText)}|${sanitizeText(question)}`;
    
    // Simple hash function for browser compatibility
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate a unique cache ID for session isolation
   */
  private static generateCacheId(chatId: string, messageId: string, userId?: string): string {
    if (userId) {
      // Validate session parameters first
      const validation = validateSessionParams({
        userId: userId,
        chatId: chatId,
        messageId: messageId,
      });
      
      if (!validation.isValid) {
        throw new Error(`Invalid session parameters: ${validation.errors.join(', ')}`);
      }
      
      const sessionKey = createSessionKey(userId, chatId);
      return `${sessionKey}_${messageId}`;
    }
    
    return `${chatId}_${messageId}`;
  }

  /**
   * Gets cached analysis for a specific chat message
   */
  static async getCachedAnalysis(
    chatId: string, 
    messageId: string, 
    userId: string
  ): Promise<SafetyAnalysis | null> {
    try {
      // Validate session parameters
      const validation = validateSessionParams({ userId, chatId, messageId });
      if (!validation.isValid) {
        console.warn('Invalid session parameters for cache retrieval:', validation.errors);
        return null;
      }

      const cacheId = this.generateCacheId(chatId, messageId, userId);
      const docRef = doc(db, 'drugSafetyCache', cacheId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const cached = docSnap.data() as CachedSafetyAnalysis;
        
        // Verify session isolation - ensure the cached data belongs to the requesting user
        if (cached.userId !== userId || cached.chatId !== chatId) {
          console.warn('Session isolation violation detected - cached data does not belong to requesting user');
          return null;
        }

        // Check if cache is still valid (not expired)
        const now = new Date();
        if (cached.expiresAt && cached.expiresAt.toDate() < now) {
          console.log('Cache expired, removing entry');
          await deleteDoc(docRef);
          return null;
        }

        console.log('✅ Cache hit - returning cached analysis');
        return cached.safetyData;
      }

      return null;
    } catch (error) {
      console.error('Error getting cached analysis:', error);
      return null;
    }
  }

  /**
   * Caches a safety analysis result with session isolation
   */
  static async cacheAnalysis(
    request: SafetyAnalysisRequest,
    safetyData: SafetyAnalysis
  ): Promise<void> {
    try {
      // Validate session parameters
      const validation = validateSessionParams({
        userId: request.userId,
        chatId: request.chatId,
        messageId: request.messageId,
      });
      
      if (!validation.isValid) {
        throw new Error(`Invalid session parameters: ${validation.errors.join(', ')}`);
      }

      const contentHash = this.generateContentHash(request.medical_text, request.question);
      const sessionKey = createSessionKey(request.userId, request.chatId);
      const cacheId = `${sessionKey}_${request.messageId}_${contentHash}`;

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.CACHE_EXPIRY_HOURS);

      const cachedData: CachedSafetyAnalysis = {
        id: cacheId,
        chatId: request.chatId,
        userId: request.userId,
        messageId: request.messageId,
        contentHash,
        safetyData,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        expiresAt: Timestamp.fromDate(expiresAt),
      };

      const docRef = doc(db, 'drugSafetyCache', cacheId);
      await setDoc(docRef, cachedData);

      console.log('✅ Analysis cached successfully with session isolation');
    } catch (error) {
      console.error('Error caching analysis:', error);
      throw error;
    }
  }

  /**
   * Finds similar analysis based on content similarity with session isolation
   */
  static async findSimilarAnalysis(
    medical_text: string,
    question: string,
    userId: string
  ): Promise<SafetyAnalysis | null> {
    try {
      // Validate user ID
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new Error('Invalid userId provided');
      }

      const contentHash = this.generateContentHash(medical_text, question);
      
      // Query for similar content within user's data only
      const q = query(
        collection(db, 'drugSafetyCache'),
        where('userId', '==', userId),
        where('contentHash', '==', contentHash),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No similar analysis found');
        return null;
      }

      const doc = querySnapshot.docs[0];
      const cached = doc.data() as CachedSafetyAnalysis;

      // Validate session isolation
      if (!this.validateSessionIsolation(cached, userId, cached.chatId)) {
        console.warn('Session isolation validation failed for similar analysis');
        return null;
      }

      // Check if cache is still valid
      const now = new Date();
      if (cached.expiresAt && cached.expiresAt.toDate() < now) {
        console.log('Similar analysis found but expired, removing');
        await deleteDoc(doc.ref);
        return null;
      }

      console.log('✅ Similar analysis found and valid');
      return cached.safetyData;
    } catch (error) {
      console.error('Error finding similar analysis:', error);
      return null;
    }
  }

  /**
   * Gets all cached analyses for a specific chat with session validation
   */
  static async getChatAnalyses(
    chatId: string,
    userId: string
  ): Promise<CachedSafetyAnalysis[]> {
    try {
      // Validate session parameters
      const validation = validateSessionParams({
        userId,
        chatId,
        messageId: 'temp' // messageId not needed for this query
      });
      
      if (!validation.isValid) {
        console.warn('Invalid session parameters for getChatAnalyses');
        return [];
      }

      const q = query(
        collection(db, 'drugSafetyCache'),
        where('userId', '==', userId),
        where('chatId', '==', chatId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const analyses: CachedSafetyAnalysis[] = [];

      for (const doc of querySnapshot.docs) {
        const cached = doc.data() as CachedSafetyAnalysis;
        
        // Validate session isolation
        if (this.validateSessionIsolation(cached, userId, chatId)) {
          // Check if not expired
          const now = new Date();
          if (!cached.expiresAt || cached.expiresAt.toDate() >= now) {
            analyses.push(cached);
          } else {
            // Clean up expired entries
            await deleteDoc(doc.ref);
          }
        }
      }

      console.log(`✅ Retrieved ${analyses.length} valid analyses for chat ${chatId}`);
      return analyses;
    } catch (error) {
      console.error('Error getting chat analyses:', error);
      return [];
    }
  }

  /**
   * Clears expired cache entries across all users
   */
  static async clearExpiredCache(): Promise<number> {
    try {
      const now = Timestamp.fromDate(new Date());
      const q = query(
        collection(db, 'drugSafetyCache'),
        where('expiresAt', '<=', now)
      );

      const querySnapshot = await getDocs(q);
      let deletedCount = 0;

      for (const doc of querySnapshot.docs) {
        await deleteDoc(doc.ref);
        deletedCount++;
      }

      console.log(`✅ Cleared ${deletedCount} expired cache entries`);
      return deletedCount;
    } catch (error) {
      console.error('Error clearing expired cache:', error);
      return 0;
    }
  }

  /**
   * Validate that a cache entry belongs to the correct session
   */
  private static validateSessionIsolation(
    cachedData: CachedSafetyAnalysis,
    expectedUserId: string,
    expectedChatId: string
  ): boolean {
    return cachedData.userId === expectedUserId && cachedData.chatId === expectedChatId;
  }
}