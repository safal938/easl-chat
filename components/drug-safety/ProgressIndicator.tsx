// components/drug-safety/CompactProgressIndicator.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Database,
  FileText,
  AlertTriangle,
  Pill,
  TrendingUp,
  Brain,
  Shield,
  CheckCircle,
} from "lucide-react";

interface CompactProgressIndicatorProps {
  isVisible: boolean;
  hasError?: boolean;
  progress: number;
  stageIndex: number;
  stageProgress: number;
  isStalled: boolean;
}

const CompactProgressIndicator: React.FC<CompactProgressIndicatorProps> = ({
  isVisible,
  hasError = false,
  progress,
  stageIndex,
  stageProgress,
  isStalled,
}) => {
  const stages = [
    {
      title: "Extracting Drugs",
      icon: Search,
      duration: 6,
      color: "text-blue-500",
    },
    {
      title: "FDA Adverse Events",
      icon: Database,
      duration: 6,
      color: "text-red-500",
    },
    {
      title: "Drug Labels",
      icon: FileText,
      duration: 6,
      color: "text-green-500",
    },
    {
      title: "Interactions",
      icon: AlertTriangle,
      duration: 6,
      color: "text-orange-500",
    },
    {
      title: "Toxicity Analysis",
      icon: Pill,
      duration: 6,
      color: "text-purple-500",
    },
    {
      title: "Safety Trends",
      icon: TrendingUp,
      duration: 6,
      color: "text-pink-500",
    },
    {
      title: "AI Analysis",
      icon: Brain,
      duration: 6,
      color: "text-indigo-500",
    },
    { title: "Finalizing", icon: Shield, duration: 10, color: "text-cyan-500" },
  ];

  // Use the progress data passed from parent component

  if (!isVisible) return null;

  const currentStage = stages[stageIndex];
  const CurrentIcon = currentStage?.icon || Search;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 bg-white rounded-lg shadow-sm ${
              currentStage?.color || "text-blue-500"
            }`}
          >
            <CurrentIcon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="font-semibold text-gray-800 text-sm">
              {currentStage?.title || "Processing..."}
            </div>
            <div className="text-xs text-gray-600">
              Stage {stageIndex + 1} of {stages.length} •{" "}
              {Math.round(stageProgress)}% of stage
              {isStalled && (
                <span className="text-orange-600 ml-1">
                  (waiting for data...)
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">
            {Math.round(progress)}%
          </div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className="bg-gradient-to-r from-blue-300 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mini stage indicators */}
      <div className="flex justify-between">
        {stages.map((stage, index) => {
          const StageIcon = stage.icon;
          const isCompleted = index < stageIndex;
          const isCurrent = index === stageIndex;

          return (
            <div
              key={index}
              className={`flex flex-col items-center transition-all duration-500 ${
                isCompleted
                  ? "opacity-80"
                  : isCurrent
                  ? "opacity-100 scale-110"
                  : "opacity-40"
              }`}
              title={stage.title}
            >
              <div
                className={`p-1 rounded-full mb-1 transition-all duration-300 ${
                  isCompleted
                    ? "bg-green-100 text-green-600"
                    : isCurrent
                    ? `bg-white shadow-md ${stage.color} ring-2 ring-blue-200`
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <StageIcon
                    className={`w-3 h-3 ${isCurrent ? "animate-pulse" : ""}`}
                  />
                )}
              </div>
              <div
                className={`text-xs font-medium transition-all duration-300 ${
                  isCompleted
                    ? "text-green-600"
                    : isCurrent
                    ? "text-gray-700 font-semibold"
                    : "text-gray-400"
                }`}
              >
                {stage.title.split(" ")[0]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompactProgressIndicator;
