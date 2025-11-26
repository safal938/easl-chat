'use client';

import { useEffect, useState } from 'react';

interface CanvasQueryIndicatorProps {
  show: boolean;
  query: string;
  source?: string;
}

/**
 * Visual indicator that shows when a query is received from Canvas
 */
export function CanvasQueryIndicator({ show, query, source }: CanvasQueryIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Query from Canvas</p>
            <p className="text-xs text-blue-100 mt-1 truncate">{query}</p>
            {source && (
              <p className="text-xs text-blue-200 mt-1">Source: {source}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
