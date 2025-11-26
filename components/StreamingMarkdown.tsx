"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { createMedicalReasoningMarkdownComponents } from "./message/MedicalMarkdown";

interface StreamingMarkdownProps {
  text: string;
  isStreaming?: boolean;
  className?: string;
  autoScroll?: boolean;
}

// Helper function to process XML content into readable format
function processXmlContent(content: string): string {
  if (!content) return content;

  let processed = content;

  // Handle incomplete XML gracefully - don't process if we're in the middle of a tag
  const hasIncompleteTag = /<[^>]*$/.test(processed);
  if (hasIncompleteTag) {
    // If we have an incomplete tag at the end, process everything except the incomplete part
    const lastCompleteTagIndex = processed.lastIndexOf(">");
    if (lastCompleteTagIndex > 0) {
      const completeContent = processed.substring(0, lastCompleteTagIndex + 1);
      const incompleteContent = processed.substring(lastCompleteTagIndex + 1);
      return processXmlContent(completeContent) + incompleteContent;
    }
  }

  // Convert XML tags to markdown headers
  processed = processed
    // Main sections
    .replace(/<RESPONSE>/g, "")
    .replace(/<\/RESPONSE>/g, "")
    .replace(/<QUESTION>/g, "\n#### Question Analysis\n\n")
    .replace(/<\/QUESTION>/g, "\n\n")
    .replace(/<THINKING>/g, "\n#### Medical Reasoning\n\n")
    .replace(/<\/THINKING>/g, "\n\n")

    // Patient context sections  
    .replace(/<PATIENT_CONTEXT>/g, "\n#### Patient Context\n\n")
    .replace(/<\/PATIENT_CONTEXT>/g, "\n\n")
    .replace(/<GAP_ANALYSIS>/g, "\n#### Gap Analysis\n\n")
    .replace(/<\/GAP_ANALYSIS>/g, "\n\n")
    .replace(/<LOCAL_MAPPING>/g, "\n#### Local Mapping\n\n")
    .replace(/<\/LOCAL_MAPPING>/g, "\n\n")
    .replace(/<LOCAL_DIVERGENT>/g, "\n#### Local Divergent\n\n")
    .replace(/<\/LOCAL_DIVERGENT>/g, "\n\n")
    .replace(/<LOCAL_CONVERGENT>/g, "\n#### Local Convergent\n\n")
    .replace(/<\/LOCAL_CONVERGENT>/g, "\n\n")
    .replace(/<CONVERGENT>/g, "\n#### Convergent Analysis\n\n")
    .replace(/<\/CONVERGENT>/g, "\n\n")
    .replace(/<DIVERGENT>/g, "\n#### Divergent Analysis\n\n")
    .replace(/<\/DIVERGENT>/g, "\n\n")
    .replace(/<RISK_ANALYSIS>/g, "\n#### Risk Analysis\n\n")
    .replace(/<\/RISK_ANALYSIS>/g, "\n\n")
     .replace(/<\/plan_steps>/g, "\n**Plan Steps:**\n\n")
    .replace(/<\/plan_steps>/g, "\n\n")



    // Subsections with better formatting
    .replace(/<type>/g, "\n**Type:** ")
    .replace(/<\/type>/g, "\n\n")
    .replace(/<clinical_intent>/g, "\n**Clinical Intent:** ")
    .replace(/<\/clinical_intent>/g, "\n\n")
    .replace(/<plan>/g, "\n**Plan:**\n\n")
    .replace(/<\/plan>/g, "\n\n")
    .replace(/<step>/g, "• ")
    .replace(/<\/step>/g, "\n")
    .replace(/<thinking_intensity>/g, "\n**Thinking Intensity:** ")
    .replace(/<\/thinking_intensity>/g, "\n\n");

  // Handle citation references
  processed = processed.replace(/\[cite:\s*([^\]]+)\]/g, " *$1*");

  return processed;
}

export function StreamingMarkdown({
  text,
  isStreaming = false,
  className = "",
  autoScroll = false,
}: StreamingMarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Process the text for display
  const processedText = processXmlContent(text);

  // Auto-scroll when text updates during streaming
  useEffect(() => {
    if (autoScroll && isStreaming && !isUserScrolling && containerRef.current) {
      const container = containerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [processedText, autoScroll, isStreaming, isUserScrolling]);

  // Handle scroll events to detect user scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !autoScroll) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const scrollDirection = currentScrollTop - lastScrollTop;

      const { scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - (currentScrollTop + clientHeight);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Detect upward scrolling (user is reading)
      if (scrollDirection < -5) {
        setIsUserScrolling(true);

        // Resume auto-scroll after user stops scrolling for 3 seconds
        scrollTimeoutRef.current = setTimeout(() => {
          setIsUserScrolling(false);
        }, 3000);
      }

      // If user scrolls near bottom, resume auto-scroll immediately
      if (distanceFromBottom <= 20) {
        setIsUserScrolling(false);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      }

      setLastScrollTop(currentScrollTop);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [autoScroll, lastScrollTop]);

  // Reset scroll state when streaming stops
  useEffect(() => {
    if (!isStreaming) {
      setIsUserScrolling(false);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    }
  }, [isStreaming]);

  const reasoningComponents = createMedicalReasoningMarkdownComponents();

  return (
    <div className="relative">
      {/* Auto-scroll paused indicator */}
      {autoScroll && isStreaming && isUserScrolling && (
        <div className="absolute top-2 right-2 z-10 bg-blue-100 border border-blue-300 rounded-md px-2 py-1 text-xs text-yellow-800">
          Auto-scroll paused
        </div>
      )}

      <div
        ref={containerRef}
        className={`${autoScroll ? "max-h-96 overflow-y-auto" : ""}`}
      >
        <div className="prose prose-sm prose-gray max-w-none prose-headings:font-semibold prose-headings:text-gray-800 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-strong:font-semibold">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={reasoningComponents}
            disallowedElements={[]} // ⚠️ Don't disallow any elements
            unwrapDisallowed={false} // ⚠️ Don't unwrap elements
          >
            {processedText}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}