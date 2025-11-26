"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FileText, XCircle, Loader2, CheckCircle, Clock } from "lucide-react";
import { LocalGuidelineAnalysis } from "./LocalGuidelineButton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface LocalGuidelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisData?: LocalGuidelineAnalysis;
  isProcessing: boolean;
}

const LoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-full"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    <div className="space-y-2 mt-6">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
    </div>
  </div>
);

const LocalGuidelineModal: React.FC<LocalGuidelineModalProps> = ({
  isOpen,
  onClose,
  analysisData,
  isProcessing,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[9999] overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Local Guideline Analysis
              </h2>
              {isProcessing && (
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <XCircle className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isProcessing && !analysisData && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-purple-800">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">
                    Analyzing local guidelines...
                  </span>
                </div>
                <p className="text-sm text-purple-700 mt-2">
                  This may take a few moments as we compare the clinical
                  reasoning with institutional guidelines.
                </p>
              </div>
              <LoadingSkeleton />
            </div>
          )}

          {analysisData && (
            <div className="space-y-6">
              {/* Expert Info */}
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">
                    Analysis Complete
                  </span>
                </div>
                <div className="text-sm text-purple-700 space-y-1">
                  <div>
                    <span className="font-medium">Expert:</span>{" "}
                    {analysisData.expert_name.replace(/_/g, " ")}
                  </div>
                  <div>
                    <span className="font-medium">Model:</span>{" "}
                    {analysisData.model_description}
                  </div>
                  {analysisData.timestamp && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(analysisData.timestamp)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis Content */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Guideline Comparison
                </h3>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1 className="text-xl font-bold mt-4 mb-2" {...props} />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className="text-lg font-semibold mt-3 mb-2" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-base font-semibold mt-2 mb-1" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-5 space-y-1 my-2" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="text-gray-700" {...props} />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="mb-3" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-semibold text-gray-900" {...props} />
                      ),
                    }}
                  >
                    {analysisData.response}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 px-6 py-3 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              {analysisData && (
                <span>
                  Analysis based on institutional clinical guidelines
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {analysisData?.model_version || ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) {
    return null;
  }

  return createPortal(modalContent, document.body);
};

export default LocalGuidelineModal;
