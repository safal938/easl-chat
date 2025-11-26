"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DrugSafetyModal from "./DrugSafetyModal";
import { DrugSafetyButtonProps, SafetyAnalysis } from "@/types/drugSafety";
import { ChatService } from "@/services/chatService";
import { useDrugSafetyCache } from "@/hooks/useDrugSafetyCache";
import { useAuth } from "@/hooks/use-auth";

// @ts-ignore
import mockData from "@/data/drugsafety.json";

type ProgressState = {
  progress: number; // 0–100%
  stageIndex: number; // 0-based
  stageProgress: number; // 0–100% within current stage
  isStalled: boolean; // true once we've frozen at ~95–99%
};

const stages = [
  { title: "Extracting Drugs", duration: 6 },
  { title: "FDA Adverse Events", duration: 6 },
  { title: "Drug Labels", duration: 6 },
  { title: "Interactions", duration: 6 },
  { title: "Toxicity Analysis", duration: 6 },
  { title: "Safety Trends", duration: 6 },
  { title: "AI Analysis", duration: 6 },
  { title: "Finalizing", duration: 10 }, // Extended by 15 seconds (was 2, now 17)
];
const totalDuration = stages.reduce((sum, s) => sum + s.duration, 0); // ~45s

export function DrugSafetyButton({
  userMessage,
  aiResponse,
  className,
  messageId,
  chatId,
  userId,
}: DrugSafetyButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [safetyData, setSafetyData] = useState<SafetyAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [analysisStarted, setAnalysisStarted] = useState(false);

  // Use the custom caching hook
  const {
    cachedData,
    isLoadingCache,
    cacheError,
    hasCachedData,
    cacheAnalysis,
    findSimilarAnalysis,
    clearCacheError,
  } = useDrugSafetyCache({
    chatId: chatId || '',
    messageId: messageId || '',
    userMessage,
    aiResponse,
  });

  const [progressState, setProgressState] = useState<ProgressState>({
    progress: 0,
    stageIndex: 0,
    stageProgress: 0,
    isStalled: false,
  });

  // timer ID ref
  const intervalRef = useRef<number | null>(null);
  // simulated elapsed time ref
  const timeRef = useRef(0);
  // stall position ref to maintain consistent stall position
  const stallPositionRef = useRef<number | null>(null);



  // Reset state when key props change to ensure fresh analysis
  useEffect(() => {
    setSafetyData(null);
    setHasAnalyzed(false);
    setDataLoaded(false);
    setAnalysisStarted(false);
    setError(null);
    clearCacheError();
    
    // Check if we have cached data from the hook
    if (hasCachedData && cachedData) {
      setSafetyData(cachedData);
      setHasAnalyzed(true);
      setDataLoaded(true);
      console.log('✅ Loaded cached drug safety analysis');
    }
  }, [messageId, chatId, userMessage, aiResponse, hasCachedData, cachedData, clearCacheError]);



  // Advance progress by one tick (0.2s simulated time)
  const advanceOnce = () => {
    setProgressState((prev) => {
      if (prev.isStalled) return prev;

      // advance simulated time
      const curr = timeRef.current + 0.2;
      timeRef.current = curr;

      const rawPct = (curr / totalDuration) * 100;

      // stall if data isn't loaded and we've reached ≥95%
      if (!dataLoaded && rawPct >= 95) {
        // Use consistent stall position or generate new one
        if (stallPositionRef.current === null) {
          stallPositionRef.current = 95 + Math.random() * 4; // 95-99%
        }

        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return {
          progress: stallPositionRef.current,
          stageIndex: prev.stageIndex,
          stageProgress: prev.stageProgress,
          isStalled: true,
        };
      }

      const clampedTime = Math.min(curr, totalDuration);
      let cumulative = 0;
      let newStageIndex = 0;
      for (let i = 0; i < stages.length; i++) {
        if (clampedTime <= cumulative + stages[i].duration) {
          newStageIndex = i;
          break;
        }
        cumulative += stages[i].duration;
      }
      const stageElapsed = clampedTime - cumulative;
      const stagePct = Math.min(
        (stageElapsed / stages[newStageIndex].duration) * 100,
        100
      );
      const overallPct = Math.min((clampedTime / totalDuration) * 100, 100);

      return {
        progress: overallPct,
        stageIndex: newStageIndex,
        stageProgress: stagePct,
        isStalled: false,
      };
    });
  };

  // Start the interval loop
  const startProgress = () => {
    if (intervalRef.current != null) return; // already running

    // Only reset if this is the first time starting analysis
    if (!analysisStarted) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = null;
      timeRef.current = 0;
      stallPositionRef.current = null;
      setDataLoaded(false);
      setProgressState({
        progress: 0,
        stageIndex: 0,
        stageProgress: 0,
        isStalled: false,
      });
      setAnalysisStarted(true);
    }

    // immediate tick
    advanceOnce();

    // then schedule regular ticks
    intervalRef.current = window.setInterval(advanceOnce, 150);
  };

  // Clean up on unmount and when key props change
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Reset time reference when component unmounts or key props change
      timeRef.current = 0;
      stallPositionRef.current = null;
    };
  }, [messageId, chatId, userMessage, aiResponse]);

  // Called whenever real or mock data finally arrives
  const finishLoading = async (data: SafetyAnalysis) => {
    setSafetyData(data);
    setHasAnalyzed(true);
    setDataLoaded(true);

    // Cache the analysis result for future use
    try {
      await cacheAnalysis(data);
    } catch (error) {
      console.error("Error caching analysis:", error);
      // Don't fail the entire operation if caching fails
    }

    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgressState({
      progress: 100,
      stageIndex: stages.length - 1,
      stageProgress: 100,
      isStalled: false,
    });
    // Modal is already open, no need to set it again
  };

  const fetchSafetyAnalysisMock = async () => {
    setIsLoading(true);
    setError(null);
    setIsOpen(true); // Open modal immediately to show loading state
    startProgress();

    try {
      await new Promise((r) => setTimeout(r, 500));
      await finishLoading(mockData as unknown as SafetyAnalysis);
    } catch (err) {
      console.error("Mock load error:", err);
      setError("Error loading demo data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSafetyAnalysis = async () => {
    // If we already have cached data, don't make a new request
    if (hasAnalyzed && safetyData) {
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsOpen(true); // Open modal immediately to show loading state
    startProgress();

    // Check for similar analysis first (optimization)
    try {
      const similarAnalysis = await findSimilarAnalysis();

      if (similarAnalysis) {
        console.log("Found similar analysis, reusing data");
        await finishLoading(similarAnalysis);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error checking for similar analysis:", error);
      // Continue with fresh analysis if similarity check fails
    }

    const req = {
      medical_text: aiResponse?.trim() || "",
      question: userMessage?.trim() || "No question provided",
      session_id: `session_${Date.now()}`,
      analyze_primary_drug_only: false,
      include_adverse_events: true,
      include_labeling: true,
    };

    console.log("Drug Safety API Request:", req);

    try {
      const controller = new AbortController();
      const to = window.setTimeout(() => controller.abort(), 120000);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_EXTERNAL_API_URL_FIX}/query/extract-and-analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req),
          signal: controller.signal,
        }
      );
      clearTimeout(to);

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API ${res.status}: ${txt}`);
      }

      const data = (await res.json()) as SafetyAnalysis;
      await finishLoading(data);
    } catch (err: any) {
      console.error("Fetch error:", err);
      if (err.name === "AbortError") {
        setError("Request timed out—please try again.");
      } else {
        setError(err.message || "Unknown error, loading demo data");
        await fetchSafetyAnalysisMock();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (analysisStarted && isLoading) {
      // Analysis is in progress, just reopen the modal
      setIsOpen(true);
    } else {
      // Always start new analysis
      fetchSafetyAnalysis();
    }
  };

  return (
    <>
      <div className={className}>
        <Button
          onClick={handleButtonClick}
          variant="outline"
          size="sm"
          className="bg-white hover:bg-blue-600  hover:text-white border-[1.5px] text-black  border-blue-600 hover:border-blue-800 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center"
        >
          {isLoading || (analysisStarted && !hasAnalyzed) ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Safety... ({Math.round(progressState.progress)}%)
            </>
          ) : hasAnalyzed ? (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Show Drug Safety Analysis
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Drug Safety Analysis
            </>
          )}
        </Button>
      </div>

      <DrugSafetyModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        safetyData={safetyData}
        error={error}
        isLoading={isLoading}
        progress={progressState.progress}
        stageIndex={progressState.stageIndex}
        stageProgress={progressState.stageProgress}
        isStalled={progressState.isStalled}
      />
    </>
  );
}

export default DrugSafetyButton;
