// components/HighlightedTextarea.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface HighlightedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  onFocusChange?: (isFocused: boolean) => void;
  disabled?: boolean;
  onHighlightModeChange?: (mode: "word" | "phrase" | "none") => void;
}

export default function HighlightedTextarea({
  value,
  onChange,
  placeholder,
  className,
  onKeyPress,
  onFocusChange,
  disabled = false,
  onHighlightModeChange,
}: HighlightedTextareaProps) {
  const [highlightMode, setHighlightMode] = useState<
    "word" | "phrase" | "none"
  >("none");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const phraseHighlightTimeout = useRef<NodeJS.Timeout | null>(null);
  const fadeHighlightTimeout = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize functionality
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate the new height based on content
      const scrollHeight = textarea.scrollHeight;
      const minHeight = 40; // Minimum height in pixels
      const maxHeight = 200; // Maximum height in pixels (about 8-10 lines)
      
      // Set the height within bounds
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
      
      // Also update the highlight layer height
      if (highlightRef.current) {
        highlightRef.current.style.height = `${newHeight}px`;
      }
    }
  };

  useEffect(() => {
    onHighlightModeChange?.(highlightMode);
  }, [highlightMode, onHighlightModeChange]);

  const handleScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Handle input changes with immediate callback
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Call onChange immediately when user types - this triggers the parent's handleInputChange
    onChange(newValue);
    
    // Adjust textarea height after content changes
    setTimeout(() => adjustTextareaHeight(), 0);
  };

  // Auto-resize on mount and when value changes externally
  useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  // Handle highlight modes based on value changes
  useEffect(() => {
    if (value.trim().length > 0) {
      setHighlightMode("word");

      if (phraseHighlightTimeout.current)
        clearTimeout(phraseHighlightTimeout.current);
      phraseHighlightTimeout.current = setTimeout(() => {
        setHighlightMode("phrase");
      }, 300);

      if (fadeHighlightTimeout.current)
        clearTimeout(fadeHighlightTimeout.current);
      fadeHighlightTimeout.current = setTimeout(() => {
        setHighlightMode("none");
      }, 3000);
    } else {
      setHighlightMode("none");
      if (phraseHighlightTimeout.current)
        clearTimeout(phraseHighlightTimeout.current);
      if (fadeHighlightTimeout.current)
        clearTimeout(fadeHighlightTimeout.current);
    }

    return () => {
      if (phraseHighlightTimeout.current)
        clearTimeout(phraseHighlightTimeout.current);
      if (fadeHighlightTimeout.current)
        clearTimeout(fadeHighlightTimeout.current);
    };
  }, [value]);

  // Handle focus changes
  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onFocusChange?.(false);
  };

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (phraseHighlightTimeout.current)
        clearTimeout(phraseHighlightTimeout.current);
      if (fadeHighlightTimeout.current)
        clearTimeout(fadeHighlightTimeout.current);
    };
  }, []);

  const renderHighlightedText = () => {
    if (highlightMode === "none" || !value) {
      return value.replace(/\n/g, "<br>");
    }

    const highlightClass =
      highlightMode === "phrase" ? "bg-blue-200/70" : "bg-blue-200/70";

    if (highlightMode === "phrase") {
      // For phrase mode, highlight the entire text as one continuous block
      return `<span class="${highlightClass}">${value.replace(/\n/g, "<br>")}</span>`;
    } else {
      // For word mode, highlight individual words
      const words = value.split(/(\s+)/);
      const highlightedWords = words.map((word) => {
        if (/^\s+$/.test(word)) {
          return word.replace(/\n/g, "<br>");
        }
        return `<span class="${highlightClass}">${word}</span>`;
      });
      return highlightedWords.join("").replace(/\n/g, "<br>");
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Highlight layer */}
      <div
        ref={highlightRef}
        className="absolute inset-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words"
        style={{
          padding: "6px 16px",
          lineHeight: "1.4",
          fontSize: "14px",
          fontFamily: "inherit",
          color: "transparent",
        }}
        onScroll={handleScroll}
        dangerouslySetInnerHTML={{
          __html: renderHighlightedText(),
        }}
      />

      {/* Actual textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyPress={onKeyPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onScroll={handleScroll}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "relative z-10 w-full min-h-[40px] resize-none bg-transparent border-0 outline-none overflow-y-auto",
          "px-4 py-1.5 text-sm leading-normal",
          "placeholder:text-gray-400",
          "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
          disabled && "cursor-not-allowed opacity-50"
        )}
        style={{
          lineHeight: "1.4",
          fontSize: "14px",
        }}
      />
    </div>
  );
}
