// hooks/useDrugSafetyCache.ts

import { useState, useEffect, useCallback } from 'react';
import { DrugSafetyCacheService } from '@/services/drugSafetyCacheService';
import { SafetyAnalysis } from '@/types/drugSafety';
import { useAuth } from '@/hooks/use-auth';

export interface UseDrugSafetyCacheProps {
  chatId: string;
  messageId: string;
  userMessage: string;
  aiResponse: string;
}

export interface UseDrugSafetyCacheReturn {
  cachedData: SafetyAnalysis | null;
  isLoadingCache: boolean;
  cacheError: string | null;
  hasCachedData: boolean;
  cacheAnalysis: (data: SafetyAnalysis) => Promise<void>;
  findSimilarAnalysis: () => Promise<SafetyAnalysis | null>;
  clearCacheError: () => void;
}

export function useDrugSafetyCache({
  chatId,
  messageId,
  userMessage,
  aiResponse,
}: UseDrugSafetyCacheProps): UseDrugSafetyCacheReturn {
  const { user } = useAuth();
  const [cachedData, setCachedData] = useState<SafetyAnalysis | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(false);
  const [cacheError, setCacheError] = useState<string | null>(null);

  // Check for cached analysis when dependencies change
  useEffect(() => {
    if (!user?.uid || !chatId || !messageId) {
      setCachedData(null);
      return;
    }

    checkCachedAnalysis();
  }, [user?.uid, chatId, messageId]);

  const checkCachedAnalysis = useCallback(async () => {
    if (!user?.uid || !chatId || !messageId) return;

    setIsLoadingCache(true);
    setCacheError(null);

    try {
      const cached = await DrugSafetyCacheService.getCachedAnalysis(
        chatId,
        messageId,
        user.uid
      );

      if (cached) {
        setCachedData(cached);
        console.log('Cache hit: Loaded cached drug safety analysis');
      } else {
        setCachedData(null);
        console.log('Cache miss: No cached analysis found');
      }
    } catch (error) {
      console.error('Error checking cached analysis:', error);
      setCacheError('Failed to check cached analysis');
      setCachedData(null);
    } finally {
      setIsLoadingCache(false);
    }
  }, [user?.uid, chatId, messageId]);

  const cacheAnalysis = useCallback(async (data: SafetyAnalysis) => {
    if (!user?.uid || !chatId || !messageId || !userMessage || !aiResponse) {
      console.warn('Missing required data for caching analysis');
      return;
    }

    try {
      await DrugSafetyCacheService.cacheAnalysis(
        {
          medical_text: aiResponse.trim(),
          question: userMessage.trim(),
          chatId,
          userId: user.uid,
          messageId,
        },
        data
      );

      setCachedData(data);
      console.log('✅ Analysis cached successfully');
    } catch (error) {
      console.error('Error caching analysis:', error);
      setCacheError('Failed to cache analysis');
      // Don't throw - caching failure shouldn't break the main flow
    }
  }, [user?.uid, chatId, messageId, userMessage, aiResponse]);

  const findSimilarAnalysis = useCallback(async (): Promise<SafetyAnalysis | null> => {
    if (!user?.uid || !userMessage || !aiResponse) {
      return null;
    }

    try {
      const similar = await DrugSafetyCacheService.findSimilarAnalysis(
        aiResponse.trim(),
        userMessage.trim(),
        user.uid
      );

      if (similar) {
        console.log('✅ Found similar analysis for reuse');
      }

      return similar;
    } catch (error) {
      console.error('Error finding similar analysis:', error);
      setCacheError('Failed to find similar analysis');
      return null;
    }
  }, [user?.uid, userMessage, aiResponse]);

  const clearCacheError = useCallback(() => {
    setCacheError(null);
  }, []);

  return {
    cachedData,
    isLoadingCache,
    cacheError,
    hasCachedData: !!cachedData,
    cacheAnalysis,
    findSimilarAnalysis,
    clearCacheError,
  };
}