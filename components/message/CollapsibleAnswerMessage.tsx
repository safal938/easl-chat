"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Brain, FileText } from "lucide-react";
import {
  processFullResponseWithReasoning,
  parseXmlSections,
} from "@/lib/response-parser";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { StreamingMarkdown } from "../StreamingMarkdown";

import {
  createMedicalMarkdownComponents,
  createMedicalReasoningMarkdownComponents,
} from "./MedicalMarkdown";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DrugSafetyButton } from "@/components/drug-safety/DrugSafetyButton";
import { LocalGuidelineButton } from "@/components/local-guideline";
import { ConnectedMessage } from "./ConnectedMessage";
import { Message } from "@/types/message";

// PreparingIndicator component for reasoning cards after completion
function PreparingIndicator({
  text = "Preparing final answer...",
}: {
  text?: string;
}) {
  return (
    <div className="p-4 bg-blue-50 border-t border-blue-100">
      <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
        <span>{text}</span>
      </div>
    </div>
  );
}

// FinalAnswerSkeleton component for early skeleton rendering
function FinalAnswerSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm ai-response-content">
      {/* Expert header skeleton */}
      <div className="mb-6 -mt-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
      </div>

      {/* Short answer skeleton */}
      <div className="bg-gray-50 border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="px-5 py-2 pb-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
          </div>
          <div className="space-y-2 mt-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
      </div>

      {/* Detailed answer skeleton */}
      <div className="bg-gray-50 border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="px-5 py-2 pb-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
          </div>
          <div className="space-y-2 mt-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to unescape HTML entities
function unescapeHtml(s: string): string {
  if (!s) return s;
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'");
}

// Citation tooltip component
interface CitationTooltipProps {
  citationText: string;
}
function CitationTooltip({ citationText }: CitationTooltipProps) {
  // Parse citation text to extract name and URL
  // Expected format: "Name, URL" or "Name - Description, URL" or "Name, p.XX, URL"
  const parseCitationText = (text: string) => {
    // Look for URL pattern (starts with http/https and ends with backticks or is at the end)
    const urlMatch = text.match(/`(https?:\/\/[^`]+)`|https?:\/\/\S+$/);

    if (urlMatch) {
      const url = urlMatch[1] || urlMatch[0]; // Get URL from backticks or direct match
      const urlIndex = text.indexOf(urlMatch[0]);
      let name = text.substring(0, urlIndex).trim();

      // Remove trailing comma, dash, or page info if present
      name = name.replace(/[,\-]\s*(p\.\d+)?\s*$/, "").trim();

      return { name, url };
    }

    // Fallback: if no URL found, treat entire text as name
    return { name: text, url: null };
  };

  const { name, url } = parseCitationText(citationText);

  // Truncate text to 50 characters
  const truncateText = (text: string, maxLength: number = 70) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const truncatedName = truncateText(name);

  const handleTooltipClick = () => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          className="inline-flex items-center justify-center w-5 h-5 text-blue-600 bg-blue-100 border border-blue-200 rounded-full hover:bg-blue-200 transition-colors ml-0.5 mr-0.5 align-baseline cursor-pointer"
          onClick={handleTooltipClick}
        >
          <FileText className="w-3 h-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        className={`max-w-md p-3 ${
          url ? "cursor-pointer hover:bg-gray-50" : ""
        }`}
        onClick={handleTooltipClick}
      >
        <div className="flex items-start gap-2">
          <FileText className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs leading-relaxed">
            {url ? (
              <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                {truncatedName}
              </span>
            ) : (
              <span>{truncatedName}</span>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Helper function to process citations in content
function processCitations(content: string): React.ReactNode[] {
  if (!content) return [content];
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let citationCounter = 1;
  const citationRegex = /\[cite:\s*([^\]]+)\]/g;
  let match;
  while ((match = citationRegex.exec(content)) !== null) {
    if (match.index > lastIndex)
      parts.push(content.slice(lastIndex, match.index));
    const citationText = match[1].trim();
    parts.push(
      <CitationTooltip
        key={`citation-${citationCounter}-${match.index}`}
        citationText={citationText}
      />
    );
    citationCounter++;
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) parts.push(content.slice(lastIndex));
  return parts.length > 0 ? parts : [content];
}

// Helper function to clean XML tags from content (but preserve citations)
function cleanXmlTags(content: string): string {
  if (!content) return "";
  return unescapeHtml(content)
    .replace(/<[^>]*>/g, "")
    .replace(/`/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/```/g, "")
    .replace(/^\s{4,}/gm, "")
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

// Helper function to extract GAP_SUMMARY and LOCAL_GUIDELINE_LIST from response
function extractGapAndGuidelines(text: string): {
  gapSummary: string | null;
  localGuidelines: any[] | null;
} {
  let gapSummary: string | null = null;
  let localGuidelines: any[] | null = null;

  console.log('🔍 Extracting GAP_SUMMARY and LOCAL_GUIDELINE_LIST from response...');
  console.log('Response text length:', text.length);
  console.log('Response preview:', text.substring(0, 500));

  // Extract GAP_SUMMARY
  const gapMatch = text.match(/<GAP_SUMMARY>([\s\S]*?)<\/GAP_SUMMARY>/i);
  if (gapMatch) {
    gapSummary = gapMatch[1].trim();
    console.log('✅ Found GAP_SUMMARY:', gapSummary.substring(0, 100) + '...');
  } else {
    console.log('❌ No GAP_SUMMARY found in response');
  }

  // Extract LOCAL_GUIDELINE_LIST
  const guidelineMatch = text.match(
    /<LOCAL_GUIDELINE_LIST>([\s\S]*?)<\/LOCAL_GUIDELINE_LIST>/i
  );
  if (guidelineMatch) {
    try {
      const jsonContent = guidelineMatch[1].trim();
      console.log('📋 Found LOCAL_GUIDELINE_LIST JSON:', jsonContent);
      const parsed = JSON.parse(jsonContent);
      if (parsed.local_guidelines && Array.isArray(parsed.local_guidelines)) {
        localGuidelines = parsed.local_guidelines;
        console.log('✅ Parsed local guidelines:', localGuidelines?.length || 0, 'items');
      }
    } catch (e) {
      console.error("❌ Failed to parse LOCAL_GUIDELINE_LIST:", e);
      console.error("JSON content was:", guidelineMatch[1]);
    }
  } else {
    console.log('❌ No LOCAL_GUIDELINE_LIST found in response');
  }

  return { gapSummary, localGuidelines };
}

type ContentType =
  | "short-answer"
  | "detailed-answer"
  | "reference"
  | "ai-disclaimer";

interface ContentSection {
  id: number;
  contentType: ContentType;
  content: string | any;
  citations?: any[];
  gapSummary?: string;
  localGuidelines?: any[];
}

interface CollapsibleAnswerMessageProps {
  message: Message;
  isAnimating: boolean;
  allMessages?: Message[];
  reverseLayout?: boolean;
  chatId?: string | null;
  showThinking?: boolean; // controlled by parent
  onCollapsibleChange?: (open: boolean) => void;
  isPersistentlyHighlighted?: boolean;
}

export function CollapsibleAnswerMessage({
  message,
  isAnimating,
  allMessages = [],
  reverseLayout = false,
  chatId,
  showThinking: externalShowThinking,
  onCollapsibleChange,
  isPersistentlyHighlighted = false,
}: CollapsibleAnswerMessageProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([1])
  );
  const [localShowThinking, setLocalShowThinking] = useState<boolean>(
    externalShowThinking ?? false
  );
  const wasTemporaryRef = React.useRef<boolean>(!!message.isTemporary);

  React.useEffect(() => {
    if (externalShowThinking !== undefined)
      setLocalShowThinking(externalShowThinking);
  }, [externalShowThinking]);

  // When streaming finishes (temporary -> final), default to parent control
  React.useEffect(() => {
    const wasTemporary = wasTemporaryRef.current;
    const nowTemporary = !!message.isTemporary;
    if (wasTemporary && !nowTemporary) {
      // parent drives final visibility; close unless parent keeps it open
      setLocalShowThinking(externalShowThinking ?? false);
      onCollapsibleChange?.(externalShowThinking ?? false);
    }
    wasTemporaryRef.current = nowTemporary;
  }, [message.isTemporary, externalShowThinking, onCollapsibleChange]);

  const toggleSection = (sectionId: number) => {
    const next = new Set(expandedSections);
    if (next.has(sectionId)) next.delete(sectionId);
    else next.add(sectionId);
    setExpandedSections(next);
  };

  const handleReasoningToggle = (open: boolean) => {
    setLocalShowThinking(open);
    onCollapsibleChange?.(open);
  };

  const addAIDisclaimer = (sections: ContentSection[], aiDisclaimer?: any) => {
    const defaultDisclaimer = {
      sections: [
        {
          title: "Legal & Regulatory Notice",
          content:
            "This chatbot is an AI-powered assistant designed to provide informational responses based on established clinical guidelines and literature. It is not a licensed medical practitioner, and its outputs do not constitute medical advice, diagnosis, or treatment. By using this service, you agree that any decisions related to patient care remain solely the responsibility of qualified healthcare professionals. Compliance with GDPR and applicable health data protection laws is maintained; no personal health data is stored or reused.",
        },
        {
          title: "Clinical Safety & Risk Warning",
          content:
            "The information provided by this system is intended for educational or support purposes only. It is not a substitute for professional clinical judgment. Do not rely solely on this tool for making critical health decisions. In all cases involving medical emergencies, diagnostic uncertainties, or treatment planning, users must consult certified physicians or specialists. The AI may not reflect the latest clinical updates, local protocols, or individualized patient factors.",
        },
        {
          title: "Intended Use & Limitations",
          content:
            "This tool is optimized for use by medical professionals, researchers, and validated users. It uses automated reasoning over medical guidelines and retrieved sources, and while accuracy is a priority, responses may still contain errors or outdated information. The developers assume no liability for consequences arising from the misuse or overreliance on this system. End-users are advised to critically evaluate the outputs and verify with up-to-date clinical resources when needed.",
        },
      ],
    };
    sections.push({
      id: sections.length + 1,
      contentType: "ai-disclaimer",
      content: aiDisclaimer || defaultDisclaimer,
      citations: [],
    });
    return sections;
  };

  const {
    contentSections,
    safetyRequired: parsedSafetyRequired,
    userMessage,
    aiDisclaimer,
  } = useMemo(() => {
    let parsedResponse: any = null;
    let citations: any[] = [];
    let safetyRequired = false;
    let userMessage = "";
    let aiDisclaimer: any = null;

    // find user message before this AI message
    const messageIndex = allMessages.findIndex((msg) => msg.id === message.id);
    if (messageIndex > 0) {
      const previousMessage = allMessages[messageIndex - 1];
      if (previousMessage?.isUser) {
        userMessage = previousMessage.text;
      }
    }

    // Helper function to unescape JSON strings and convert \n to actual newlines
    const unescapeJsonString = (str: string): string => {
      if (!str) return str;
      try {
        // If it's a JSON string, parse it to unescape
        if (str.startsWith('"') && str.endsWith('"')) {
          return JSON.parse(str);
        }
        // Otherwise, manually replace escaped characters
        return str
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "\t")
          .replace(/\\r/g, "\r")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
      } catch {
        return str;
      }
    };

    try {
      parsedResponse = JSON.parse(message.text);

      // Check if we have the expected answer structure
      const hasAnswerStructure =
        parsedResponse?.short_answer && parsedResponse?.detailed_answer;

      // Fallback: if response_type is complete but no answer structure, try to extract from response field
      if (
        !hasAnswerStructure &&
        parsedResponse?.response_type === "complete" &&
        parsedResponse?.response
      ) {
        try {
          const innerResponse =
            typeof parsedResponse.response === "string"
              ? JSON.parse(parsedResponse.response)
              : parsedResponse.response;

          if (innerResponse?.short_answer || innerResponse?.detailed_answer) {
            parsedResponse = innerResponse;
          }
        } catch {
          // If parsing fails, treat the response as plain text
          // We'll handle this in the fallback section below
        }
      }

      // Unescape the short_answer and detailed_answer if they contain escaped newlines
      if (parsedResponse?.short_answer) {
        parsedResponse.short_answer = unescapeJsonString(
          parsedResponse.short_answer
        );
      }
      if (parsedResponse?.detailed_answer) {
        parsedResponse.detailed_answer = unescapeJsonString(
          parsedResponse.detailed_answer
        );
      }

      if (parsedResponse?.short_answer && parsedResponse?.detailed_answer) {
        const sections: ContentSection[] = [];

        // parse safety from JSON if present (fallback only)
        safetyRequired =
          parsedResponse.safety_flag === true ||
          parsedResponse.safety_flag === 1 ||
          parsedResponse.safety_flag === "1";

        if (parsedResponse.ai_disclaimer)
          aiDisclaimer = parsedResponse.ai_disclaimer;

        sections.push({
          id: 1,
          contentType: "short-answer",
          content: cleanXmlTags(parsedResponse.short_answer),
          citations: [],
        });

        let cleanDetailedAnswer = parsedResponse.detailed_answer;
        cleanDetailedAnswer = cleanDetailedAnswer.replace(
          /<guideline_references>[\s\S]*?<\/guideline_references>/gi,
          ""
        );
        sections.push({
          id: 2,
          contentType: "detailed-answer",
          content: cleanXmlTags(cleanDetailedAnswer),
          citations: [],
        });

        // references (multiple formats supported)
        let referenceCitations: any[] = [];
        if (parsedResponse.guideline_reference?.length > 0) {
          const refs = Array.isArray(parsedResponse.guideline_reference)
            ? parsedResponse.guideline_reference
            : [parsedResponse.guideline_reference];
          refs.forEach((ref: any) => {
            referenceCitations.push({
              source: ref.Source || "",
              link: ref.Link || "",
              supportingSnippet: ref.Supporting_Snippet || "",
            });
          });
        } else {
          const fullContent = parsedResponse.detailed_answer || "";
          const xmlParsed = parseXmlSections(fullContent);
          if (
            Array.isArray(xmlParsed.references) &&
            xmlParsed.references.length > 0
          ) {
            referenceCitations = xmlParsed.references.map((ref: any) => ({
              source: ref.Source || "",
              link: ref.Link || "",
              supportingSnippet: ref.Supporting || "",
            }));
          }
        }
        if (typeof parsedResponse.references === "string") {
          try {
            const jsonRefs = JSON.parse(parsedResponse.references);
            if (Array.isArray(jsonRefs)) {
              referenceCitations = jsonRefs.map((ref: any) => ({
                source: ref.Source || ref.source || "",
                link: ref.Link || ref.link || "",
                supportingSnippet:
                  ref.Supporting ||
                  ref.Supporting_Snippet ||
                  ref.supportingSnippet ||
                  "",
              }));
            }
          } catch {}
        } else if (parsedResponse.references?.length > 0) {
          referenceCitations = parsedResponse.references.map((ref: string) => {
            const parts = ref.split(", ");
            let source = ref;
            let link = "";
            if (parts.length >= 2) {
              const lastPart = parts[parts.length - 1];
              if (lastPart.startsWith("http")) {
                link = lastPart;
                source = parts.slice(0, -1).join(", ");
              }
            }
            return {
              source: source.trim(),
              link: link.trim(),
              supportingSnippet: "",
            };
          });
        }
        // Extract GAP_SUMMARY and LOCAL_GUIDELINE_LIST from the full response
        const { gapSummary, localGuidelines } = extractGapAndGuidelines(
          message.text
        );

        if (referenceCitations.length > 0 || gapSummary || localGuidelines) {
          sections.push({
            id: 3,
            contentType: "reference",
            content: "",
            citations: referenceCitations,
            gapSummary: gapSummary || undefined,
            localGuidelines: localGuidelines || undefined,
          });
        }

        return {
          contentSections: addAIDisclaimer(sections, aiDisclaimer),
          safetyRequired,
          userMessage,
          aiDisclaimer,
        };
      }
    } catch (parseError) {
      // Text isn't valid JSON, will try XML or fallback parsing
      console.log("JSON parse failed, trying alternative formats");
    }

    // If we have a parsed response but no answer structure, try to create one from available data
    if (
      parsedResponse &&
      !parsedResponse.short_answer &&
      !parsedResponse.detailed_answer
    ) {
      // Check if there's a response field with content
      if (parsedResponse.response) {
        const responseText =
          typeof parsedResponse.response === "string"
            ? parsedResponse.response
            : JSON.stringify(parsedResponse.response);

        // Create a simple structure from the response
        const sections: ContentSection[] = [];

        // If response is short, use it as short answer
        if (responseText.length < 300) {
          sections.push({
            id: 1,
            contentType: "short-answer",
            content: cleanXmlTags(responseText),
            citations: [],
          });
        } else {
          // Split into short and detailed
          const sentences = responseText.split(/[.!?]+\s+/);
          const shortAnswer =
            sentences.slice(0, 2).join(". ") +
            (sentences.length > 2 ? "." : "");
          const remaining =
            sentences.slice(2).join(". ") + (sentences.length > 2 ? "." : "");

          sections.push({
            id: 1,
            contentType: "short-answer",
            content: cleanXmlTags(shortAnswer),
            citations: [],
          });

          if (remaining.trim()) {
            sections.push({
              id: 2,
              contentType: "detailed-answer",
              content: cleanXmlTags(remaining),
              citations: [],
            });
          }
        }

        return {
          contentSections: addAIDisclaimer(sections),
          safetyRequired: parsedResponse.safety_flag === true,
          userMessage,
          aiDisclaimer: null,
        };
      }
    }

    // XML mode
    if (
      message.text.includes("<short_answer>") ||
      message.text.includes("<detailed_answer>")
    ) {
      const xmlParsed = parseXmlSections(message.text);
      const sections: ContentSection[] = [];
      if (xmlParsed.shortAnswer) {
        sections.push({
          id: 1,
          contentType: "short-answer",
          content: xmlParsed.shortAnswer,
          citations: [],
        });
      }
      if (xmlParsed.detailedAnswer) {
        sections.push({
          id: 2,
          contentType: "detailed-answer",
          content: xmlParsed.detailedAnswer,
          citations: [],
        });
      }
      // Extract GAP_SUMMARY and LOCAL_GUIDELINE_LIST
      const { gapSummary, localGuidelines } = extractGapAndGuidelines(
        message.text
      );

      if (
        Array.isArray(xmlParsed.references) &&
        xmlParsed.references.length > 0
      ) {
        const referenceCitations = xmlParsed.references.map((ref: any) => ({
          source: ref.Source || "",
          link: ref.Link || "",
          supportingSnippet: ref.Supporting || "",
        }));
        sections.push({
          id: 3,
          contentType: "reference",
          content: "",
          citations: referenceCitations,
          gapSummary: gapSummary || undefined,
          localGuidelines: localGuidelines || undefined,
        });
      } else if (gapSummary || localGuidelines) {
        // Add reference section even if no citations, but gap/guidelines exist
        sections.push({
          id: 3,
          contentType: "reference",
          content: "",
          citations: [],
          gapSummary: gapSummary || undefined,
          localGuidelines: localGuidelines || undefined,
        });
      }
      return {
        contentSections: addAIDisclaimer(sections),
        safetyRequired: false, // merged later with message flag
        userMessage,
        aiDisclaimer: null,
      };
    }

    // Fallback parsing (Markdown/free text)
    const { answer, citations: extractedCitations } =
      processFullResponseWithReasoning(message.text);
    const sections: ContentSection[] = [];
    const lines = answer.split("\n");
    let currentSection: ContentSection | null = null;
    let currentContent = "";

    for (const line of lines) {
      const t = line.trim();
      if (t.match(/^##?\s*(short\s*answer|quick\s*answer)/i)) {
        if (currentSection) {
          currentSection.content = currentContent.trim();
          sections.push(currentSection);
        }
        currentSection = {
          id: sections.length + 1,
          contentType: "short-answer",
          content: "",
          citations: [],
        };
        currentContent = "";
      } else if (t.match(/^##?\s*(detailed\s*answer|detailed\s*analysis)/i)) {
        if (currentSection) {
          currentSection.content = currentContent.trim();
          sections.push(currentSection);
        }
        currentSection = {
          id: sections.length + 1,
          contentType: "detailed-answer",
          content: "",
          citations: [],
        };
        currentContent = "";
      } else if (t.match(/^##?\s*(reference|citation|guideline)/i)) {
        if (currentSection) {
          currentSection.content = currentContent.trim();
          sections.push(currentSection);
        }
        currentSection = {
          id: sections.length + 1,
          contentType: "reference",
          content: "",
          citations: [],
        };
        currentContent = "";
      } else {
        currentContent += line + "\n";
      }
    }
    if (currentSection) {
      currentSection.content = currentContent.trim();
      sections.push(currentSection);
    }

    if (sections.length === 0) {
      const full = answer.trim();
      if (full.length < 300) {
        sections.push({
          id: 1,
          contentType: "short-answer",
          content: full,
          citations: [],
        });
      } else {
        const sentences = full.split(/[.!?]+\s+/);
        const shortAnswer =
          sentences.slice(0, 2).join(". ") + (sentences.length > 2 ? "." : "");
        const remaining =
          sentences.slice(2).join(". ") + (sentences.length > 2 ? "." : "");
        sections.push({
          id: 1,
          contentType: "short-answer",
          content: shortAnswer,
          citations: [],
        });
        if (remaining.trim()) {
          sections.push({
            id: 2,
            contentType: "detailed-answer",
            content: remaining,
            citations: [],
          });
        }
      }
    }

    const refs = extractedCitations || [];
    const { gapSummary, localGuidelines } = extractGapAndGuidelines(
      message.text
    );

    if (refs.length > 0 || gapSummary || localGuidelines) {
      sections.push({
        id: sections.length + 1,
        contentType: "reference",
        content: "",
        citations: refs,
        gapSummary: gapSummary || undefined,
        localGuidelines: localGuidelines || undefined,
      });
    }

    return {
      contentSections: addAIDisclaimer(sections, aiDisclaimer),
      safetyRequired: false,
      userMessage,
      aiDisclaimer,
    };
  }, [message.text, allMessages, message.id]);

  // merge parsed safety flag with message-level flag
  const mergedSafetyRequired =
    parsedSafetyRequired ||
    (message as any).safetyAnalysis?.safetyRequired === true;

  const getMessageIcon = (contentType: ContentType): string => {
    switch (contentType) {
      case "short-answer":
        return "/icons/short-answer.png";
      case "detailed-answer":
        return "/icons/detailed-answer.png";
      case "reference":
        return "/icons/references.png";
      case "ai-disclaimer":
        return "/icons/references.png";
      default:
        return "/icons/short-answer.png";
    }
  };
  const getMessageLabel = (contentType: ContentType): string => {
    switch (contentType) {
      case "short-answer":
        return "Short Answer";
      case "detailed-answer":
        return "Detailed Answer";
      case "reference":
        return "References";
      case "ai-disclaimer":
        return "Disclaimer";
      default:
        return "Content";
    }
  };

  const getShortPreview = (
    content: string | any,
    contentType: ContentType,
    citations?: any[]
  ): string => {
    if (contentType === "short-answer") {
      return content.length > 200 ? content.substring(0, 200) + "..." : content;
    }
    if (contentType === "reference" && citations && citations.length > 0) {
      const previewItems = citations.slice(0, 2).map((citation, index) => {
        const pageMatch = citation.link?.match(/#page=(\d+)/);
        const pageInfo = pageMatch ? ` (Page ${pageMatch[1]})` : "";
        let cleanSource = (citation.source || "")
          .replace(/_/g, " ")
          .replace(/\b\d+\b/g, "")
          .replace(/\s+/g, " ")
          .replace(/^EASL\s+/, "EASL ")
          .trim();
        if (
          cleanSource.includes("Treatment") &&
          cleanSource.includes("Hepatitis")
        ) {
          cleanSource = "EASL Recommendations on Treatment of Hepatitis C";
        }
        return `${index + 1}. ${cleanSource}${pageInfo}`;
      });
      let preview = previewItems.join("\n");
      if (citations.length > 2) {
        preview += `\n... and ${citations.length - 2} more reference${
          citations.length - 2 > 1 ? "s" : ""
        }`;
      }
      return preview;
    }
    if (
      contentType === "ai-disclaimer" &&
      typeof content === "object" &&
      content.sections
    ) {
      const firstSection = content.sections[0];
      if (firstSection) {
        return `${firstSection.title}: ${firstSection.content.substring(
          0,
          150
        )}...`;
      }
      return "AI safety and usage guidelines...";
    }
    const lines = (content as string).split("\n");
    const previewLines = lines.slice(0, 4);
    let preview = previewLines.join("\n");
    if (lines.length > 4 || preview.length > 300) {
      preview =
        preview.length > 300
          ? preview.substring(0, 300) + "..."
          : preview + "...";
    }
    return preview;
  };

  const formatPreviewContent = (content: string) => {
    const cleanContent = content
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\[cite:\s*([^\]]+)\]/g, "");
    const parts = cleanContent.split(/(\> .*)/g);
    return parts.map((part: string, index: number) => {
      if (part.startsWith("> ")) {
        return (
          <span key={index} className="italic text-gray-600">
            {part.slice(2)}
          </span>
        );
      }
      return part.split("\n").map((line: string, lineIndex: number) => (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < part.split("\n").length - 1 && <br />}
        </span>
      ));
    });
  };

  const ContentWithCitations = ({
    content,
    className = "",
  }: {
    content: string;
    className?: string;
  }) => {
    const citationParts = processCitations(content);
    return (
      <div className={className}>
        {citationParts.map((part, index) => {
          if (typeof part === "string") {
            const lines = part.split("\n");
            return lines.map((line, lineIndex) => (
              <span key={`${index}-${lineIndex}`}>
                {line.split(/(\*\*.*?\*\*)/).map((segment, segIndex) => {
                  if (segment.startsWith("**") && segment.endsWith("**")) {
                    return (
                      <strong key={segIndex}>{segment.slice(2, -2)}</strong>
                    );
                  }
                  return segment;
                })}
                {lineIndex < lines.length - 1 && <br />}
              </span>
            ));
          }
          return part;
        })}
      </div>
    );
  };

  const processReasoningContent = (content: string): React.ReactNode[] => {
    if (!content) return [content];

    // The content is already unescaped during streaming, so we can render it directly
    // Just clean up any remaining XML tags and format it nicely
    let cleaned = unescapeHtml(content)
      .replace(/<RESPONSE>([\s\S]*?)<\/RESPONSE>/gi, "$1")
      .trim();
    const parts: React.ReactNode[] = [];
    const tagPatterns = [
      {
        regex: /<QUESTION>([\s\S]*?)<\/QUESTION>/i,
        label: "Question Analysis",
      },
      {
        regex: /<PATIENT_CONTEXT>([\s\S]*?)<\/PATIENT_CONTEXT>/i,
        label: "Patient Context",
      },
      {
        regex: /<GAP_ANALYSIS>([\s\S]*?)<\/GAP_ANALYSIS>/i,
        label: "Gap Analysis",
      },
      {
        regex: /<LOCAL_MAPPING>([\s\S]*?)<\/LOCAL_MAPPING>/i,
        label: "Local Mapping",
      },
      {
        regex: /<LOCAL_DIVERGENT>([\s\S]*?)<\/LOCAL_DIVERGENT>/i,
        label: "Local Divergent",
      },
      {
        regex: /<LOCAL_CONVERGENT>([\s\S]*?)<\/LOCAL_CONVERGENT>/i,
        label: "Local Convergent",
      },
      {
        regex: /<CONVERGENT>([\s\S]*?)<\/CONVERGENT>/i,
        label: "Convergent Analysis",
      },
      {
        regex: /<DIVERGENT>([\s\S]*?)<\/DIVERGENT>/i,
        label: "Divergent Analysis",
      },
      {
        regex: /<RISK_ANALYSIS>([\s\S]*?)<\/RISK_ANALYSIS>/i,
        label: "Risk Analysis",
      },
    ];
    for (const { regex, label } of tagPatterns) {
      const match = cleaned.match(regex);
      if (match?.[1]?.trim()) {
        const cleanContent = match[1]
          .trim()
          .replace(/<[^>]*>/g, "")
          .trim();
        parts.push(
          <div
            key={label}
            className="mb-4 pb-4 border-b border-gray-200 last:border-b-0"
          >
            <h5 className="font-medium text-gray-700 mb-2 text-sm">{label}</h5>
            <ContentWithCitations
              content={cleanContent}
              className="text-sm text-gray-700 leading-relaxed whitespace-pre-line"
            />
          </div>
        );
        cleaned = cleaned.replace(regex, "");
      }
    }
    if (parts.length > 0) return parts;

    const thinkingMatch = cleaned.match(/<THINKING>([\s\S]*?)<\/THINKING>/i);
    if (thinkingMatch) {
      const thinkingContent = thinkingMatch[1].trim();
      for (const { regex, label } of tagPatterns) {
        const match = thinkingContent.match(regex);
        if (match?.[1]?.trim()) {
          const cleanContent = match[1]
            .trim()
            .replace(/<[^>]*>/g, "")
            .trim();
          parts.push(
            <div
              key={label}
              className="mb-4 pb-4 border-b border-gray-200 last:border-b-0"
            >
              <h5 className="font-medium text-gray-700 mb-2 text-sm">
                {label}
              </h5>
              <ContentWithCitations
                content={cleanContent}
                className="text-sm text-gray-700 leading-relaxed whitespace-pre-line"
              />
            </div>
          );
        }
      }
      if (parts.length > 0) return parts;
    }

    const stripped = cleaned
      .replace(/<[^>]*>/g, "")
      .replace(/(\* [^:]+: \*)/g, "\n\n$1")
      .replace(/(\* [^:]+:)/g, "\n\n$1")
      .replace(/^\n+/, "")
      .trim();
    return [
      <ContentWithCitations
        key="fallback"
        content={stripped}
        className="text-sm text-gray-700 leading-relaxed whitespace-pre-line"
      />,
    ];
  };

  const markdownComponents = createMedicalMarkdownComponents({
    isTemporary: message.isTemporary,
  });
  const reasoningComponents = createMedicalReasoningMarkdownComponents();

  // Pure reasoning messages
  if (message.isReasoning) {
    return (
      <TooltipProvider>
        <div data-message-id={message.id} className="mb-6">
          <div className="flex items-start">
            <div className="flex-1">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm ai-response-content">
                <div className="p-4 border-b border-gray-200">
                  <ConnectedMessage
                    expertName={message.expertName || "Medical Expert"}
                    isConnecting={message.isTemporary}
                    showConnectingIndicator={true}
                    className="mb-0"
                  />
                </div>
                {message.isTemporary ? (
                  <div className="p-4 bg-blue-50">
                    <div className="flex items-center gap-2 mb-4 text-sm font-medium text-blue-800">
                      <Brain className="w-4 h-4 text-blue-600" />
                      <span>Medical reasoning in progress...</span>
                    </div>
                    <div className="prose prose-gray max-w-none p-6 bg-gray-50/50 text-gray-800 ai-response-content rounded-xl">
                      <StreamingMarkdown
                        text={
                          message.text || "Waiting for reasoning content..."
                        }
                        isStreaming={message.isTemporary}
                        autoScroll={true}
                        className="text-sm leading-relaxed"
                      />
                    </div>
                  </div>
                ) : (
                  <Collapsible
                    open={localShowThinking}
                    onOpenChange={handleReasoningToggle}
                  >
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-blue-50 hover:bg-blue-100 transition-colors text-sm font-medium text-blue-800">
                      <Brain className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">
                        {localShowThinking
                          ? "Hide medical reasoning"
                          : "Show medical reasoning"}
                      </span>
                      {localShowThinking ? (
                        <ChevronUp className="ml-auto" />
                      ) : (
                        <ChevronDown className="ml-auto" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent
                      className={cn(
                        "transition-all duration-300 ease-out",
                        localShowThinking
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 -translate-y-2"
                      )}
                    >
                      <div className="prose prose-gray max-w-none p-6 bg-gray-50/50 text-gray-800 ai-response-content">
                        {processReasoningContent(message.text)}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Temporary message with no text => skeleton
  if (message.isTemporary && !message.text) {
    return (
      <TooltipProvider>
        <div data-message-id={message.id} className="mb-6">
          <div className="flex items-start">
            <div className="flex-1">
              <FinalAnswerSkeleton />
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div data-message-id={message.id} className="mb-6">
        <div className="flex items-start">
          <div className="flex-1">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm ai-response-content relative z-10">
              {(message.expertName || message.reasoningText) && (
                <div className="mb-6 -mt-2">
                  <div
                    className={`flex items-center justify-between ${
                      reverseLayout ? "flex-row-reverse" : ""
                    }`}
                  >
                    {message.expertName && (
                      <ConnectedMessage
                        expertName={message.expertName || "Medical Expert"}
                        isConnecting={message.isTemporary}
                        showConnectingIndicator={true}
                        className="mb-0"
                      />
                    )}
                    {message.reasoningText && (
                      <Collapsible
                        open={localShowThinking}
                        onOpenChange={handleReasoningToggle}
                      >
                        <CollapsibleTrigger className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors text-xs font-medium text-gray-700">
                          <Brain className="w-3 h-3" />
                          <span>
                            {localShowThinking
                              ? "Hide Medical Reasoning"
                              : "Show Medical Reasoning"}
                          </span>
                          {localShowThinking ? (
                            <ChevronUp className="ml-auto w-3 h-3" />
                          ) : (
                            <ChevronDown className="ml-auto w-3 h-3" />
                          )}
                        </CollapsibleTrigger>
                      </Collapsible>
                    )}
                  </div>

                  {message.reasoningText && (
                    <div className="mt-4">
                      {message.isTemporary ? (
                        <div className="prose prose-gray max-w-none p-6 bg-gray-50/30 rounded-xl border border-gray-200 mt-3 ai-response-content">
                          <div className="flex items-center gap-2 mb-4 text-sm font-medium text-blue-800">
                            <Brain className="w-4 h-4 text-blue-600" />
                            <span>Medical reasoning in progress...</span>
                          </div>
                          <StreamingMarkdown
                            text={message.reasoningText || ""}
                            isStreaming={message.isTemporary}
                            autoScroll={true}
                            className="text-sm leading-relaxed"
                          />
                        </div>
                      ) : (
                        <Collapsible
                          open={localShowThinking}
                          onOpenChange={handleReasoningToggle}
                        >
                          <CollapsibleContent
                            className={cn(
                              "transition-all duration-300 ease-out",
                              localShowThinking
                                ? "animate-collapsible-down opacity-100"
                                : "animate-collapsible-up opacity-0"
                            )}
                          >
                            <div className="prose prose-gray max-w-none p-6 bg-gray-50/30 rounded-xl border border-gray-200 mt-3 ai-response-content">
                              {processReasoningContent(
                                message.reasoningText || ""
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Content sections */}
              {useMemo(
                () =>
                  contentSections.map((section) => {
                    const isExpanded = expandedSections.has(section.id);
                    return (
                      <React.Fragment key={section.id}>
                        {section.contentType === "ai-disclaimer" && (
                          <div className="my-6">
                            <hr className="border-t-2 border-gray-200" />
                          </div>
                        )}

                        <div className="bg-gray-50 border border-gray-100 shadow-sm rounded-2xl overflow-hidden relative transition-all duration-300 ease-in-out hover:shadow-md">
                          {/* Header row with stable layout (no absolute button) */}
                          <div className="flex items-center justify-between px-5 py-2">
                            <div className="flex items-center gap-3">
                              <img
                                src={getMessageIcon(section.contentType)}
                                alt={getMessageLabel(section.contentType)}
                                className="w-5 h-5 opacity-60"
                              />
                              <h3 className="text-xs font-normal pt-3 text-gray-500 tracking-wide section-header">
                                {getMessageLabel(section.contentType)}
                              </h3>
                            </div>
                            <button
                              onClick={() => toggleSection(section.id)}
                              className="p-2 hover:bg-gray-200 rounded-full transition-all duration-300 ease-out"
                              aria-label={
                                isExpanded
                                  ? "Collapse section"
                                  : "Expand section"
                              }
                            >
                              <ChevronDown
                                className={`text-gray-500 transition-transform duration-300 ${
                                  isExpanded ? "rotate-180" : "rotate-0"
                                }`}
                              />
                            </button>
                          </div>

                          {/* Preview */}
                          <div
                            className={`px-5 transition-all duration-700 ease-out ${
                              isExpanded
                                ? "opacity-0 max-h-0 pointer-events-none"
                                : "opacity-100 max-h-24"
                            }`}
                            aria-hidden={isExpanded}
                          >
                            <div
                              className={`${
                                section.contentType === "short-answer"
                                  ? "text-base sm:text-lg leading-relaxed text-gray-700 font-normal bg-blue-200/30 rounded-md"
                                  : "text-sm sm:text-base text-gray-600 leading-relaxed font-normal"
                              }`}
                            >
                              {formatPreviewContent(
                                getShortPreview(
                                  section.content,
                                  section.contentType,
                                  section.citations
                                )
                              )}
                            </div>
                            <div
                              className="relative pointer-events-none"
                              style={{
                                height: "2.2rem",
                                marginTop: "-2.2rem",
                                background:
                                  "linear-gradient(to top, rgb(249 250 251) 0%, rgb(249 250 251 / 0.9) 20%, rgb(249 250 251 / 0.7) 40%, rgb(249 250 251 / 0.3) 70%, transparent 100%)",
                              }}
                            />
                          </div>

                          {/* Expanded content */}
                          <div
                            className={`transition-all duration-700 ease-out ${
                              isExpanded
                                ? "opacity-100"
                                : "max-h-0 opacity-0 overflow-hidden"
                            }`}
                          >
                            <div className="px-5 pb-5">
                              <div className="border-t border-gray-200 pt-4">
                                {section.contentType === "reference" ? (
                                  <div className="space-y-6">
                                    {/* Gap Summary Section - NO TITLE, just description */}
                                    {section.gapSummary && (
                                      <div className="mb-6">
                                        <p className="text-base text-gray-800 leading-relaxed whitespace-pre-line">
                                          {section.gapSummary}
                                        </p>
                                      </div>
                                    )}

                                    {/* Local Guidelines Section */}
                                    {section.localGuidelines &&
                                      section.localGuidelines.length > 0 && (
                                        <div className="mb-6">
                                          <h4 className="text-base font-semibold text-gray-800 mb-3">
                                            Local Guidelines
                                          </h4>
                                          <ul className="space-y-2">
                                            {section.localGuidelines.map(
                                              (guideline, index) => (
                                                <li
                                                  key={index}
                                                  className="text-base text-gray-800 leading-relaxed"
                                                >
                                                  {index + 1}. {guideline.name}
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      )}

                                    {/* HR after Local Guidelines, before regular citations */}
                                    {(section.gapSummary || (section.localGuidelines && section.localGuidelines.length > 0)) &&
                                      section.citations &&
                                      section.citations.filter((citation) => citation.link).length > 0 && (
                                        <hr className="border-t-2 border-gray-300 my-6" />
                                      )}

                                    {/* Regular Citations */}
                                    {section.citations &&
                                      section.citations.filter(
                                        (citation) => citation.link
                                      ).length > 0 && (
                                        <div className="space-y-4">
                                          {section.citations
                                            .filter((citation) => citation.link)
                                            .map((citation, index) => {
                                              const pageMatch =
                                                citation.link?.match(
                                                  /#page=(\d+)/
                                                );
                                              const pageInfo = pageMatch
                                                ? ` (Page ${pageMatch[1]})`
                                                : "";
                                              let cleanSource =
                                                citation.source || "";
                                              cleanSource = cleanSource
                                                .replace(/_/g, " ")
                                                .replace(/\b\d+\b/g, "")
                                                .replace(/\s+/g, " ")
                                                .replace(/^EASL\s+/, "EASL ")
                                                .trim();
                                              if (
                                                cleanSource.includes(
                                                  "Treatment"
                                                ) &&
                                                cleanSource.includes("Hepatitis")
                                              ) {
                                                cleanSource =
                                                  "EASL Recommendations on Treatment of Hepatitis C";
                                              }
                                              let referenceTitle = `${
                                                index + 1
                                              }. ${cleanSource}${pageInfo}`;
                                              referenceTitle = referenceTitle
                                                .replace(
                                                  /,\s*https?:\/\/[^\s,]+/g,
                                                  ""
                                                )
                                                .replace(/\s+/g, " ")
                                                .trim();
                                              const supportingSnippet =
                                                citation.supportingSnippet ||
                                                "This reference supports the medical guidance provided above. Please refer to the source document for complete details.";
                                              return (
                                                <div key={index} className="mb-6">
                                                  <a
                                                    href={citation.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 cursor-pointer block mb-4 text-sm font-medium hover:underline transition-colors"
                                                  >
                                                    {referenceTitle}
                                                  </a>
                                                  <blockquote className="border-l-4 border-gray-400 bg-gradient-to-r from-gray-50 to-gray-100 pl-6 py-4 rounded-r-xl shadow-sm">
                                                    <div className="flex items-start gap-4">
                                                      <div className="flex-shrink-0 mt-1">
                                                        <svg
                                                          className="w-6 h-6 text-gray-500 opacity-50"
                                                          fill="currentColor"
                                                          viewBox="0 0 24 24"
                                                        >
                                                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
                                                        </svg>
                                                      </div>
                                                      <p className="text-gray-900 text-base leading-relaxed font-semibold italic">
                                                        "{supportingSnippet}"
                                                      </p>
                                                    </div>
                                                  </blockquote>
                                                </div>
                                              );
                                            })}
                                        </div>
                                      )}
                                  </div>
                                ) : section.contentType === "ai-disclaimer" ? (
                                  <div className="space-y-4">
                                    {(section.content as any).sections.map(
                                      (
                                        disclaimerSection: any,
                                        index: number
                                      ) => (
                                        <div key={index}>
                                          <h4 className="text-lg font-semibold text-gray-800 mb-3">
                                            {disclaimerSection.title}
                                          </h4>
                                          <ContentWithCitations
                                            content={disclaimerSection.content}
                                            className="text-base text-gray-800 leading-relaxed prose max-w-none ai-response-content"
                                          />
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <ContentWithCitations
                                    content={section.content as string}
                                    className={`prose max-w-none ai-response-content ${
                                      section.contentType === "short-answer"
                                        ? "text-base sm:text-lg leading-relaxed text-gray-900 font-medium bg-blue-200/30 p-1 border-md"
                                        : "text-sm sm:text-base text-gray-800 leading-relaxed"
                                    }`}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  }),
                [contentSections, expandedSections]
              )}

              {/* SAFETY BUTTON AND LOCAL GUIDELINE BUTTON */}
              <div className="pt-4 flex flex-wrap gap-3">
                {mergedSafetyRequired && (
                  <DrugSafetyButton
                    userMessage={userMessage}
                    aiResponse={message.text}
                    className=""
                    messageId={message.id}
                    chatId={chatId}
                  />
                )}

                {/* Show local guideline button if processing or data is available */}
                {(message.isProcessingGuideline ||
                  message.localGuidelineAnalysis) && (
                  <LocalGuidelineButton
                    analysisData={message.localGuidelineAnalysis}
                    isProcessing={message.isProcessingGuideline || false}
                    className=""
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
