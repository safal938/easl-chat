"use client";

import React, { useState, useEffect } from "react";
import { FileText, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LocalGuidelineModal from "./LocalGuidelineModal";

export interface LocalGuidelineAnalysis {
  expert_name: string;
  response_type: string;
  response: string;
  timestamp: string;
  model_version: string;
  model_description: string;
}

interface LocalGuidelineButtonProps {
  analysisData?: LocalGuidelineAnalysis;
  isProcessing: boolean;
  className?: string;
}

export function LocalGuidelineButton({
  analysisData,
  isProcessing,
  className,
}: LocalGuidelineButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (analysisData && !isProcessing) {
      setHasData(true);
    }
  }, [analysisData, isProcessing]);

  const handleButtonClick = () => {
    if (hasData || isProcessing) {
      setIsOpen(true);
    }
  };

  return (
    <>
      <div className={className}>
        <Button
          onClick={handleButtonClick}
          variant="outline"
          size="sm"
          className="bg-white hover:bg-purple-600 hover:text-white border-[1.5px] text-black border-purple-600 hover:border-purple-800 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center"
          disabled={!isProcessing && !hasData}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing Guidelines...
            </>
          ) : hasData ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Show Guideline Analysis
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Local Guideline Analysis
            </>
          )}
        </Button>
      </div>

      <LocalGuidelineModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        analysisData={analysisData}
        isProcessing={isProcessing}
      />
    </>
  );
}

export default LocalGuidelineButton;
