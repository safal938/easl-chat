/**
 * Medical Response Parser
 * Clean, focused parser for medical AI responses
 */

import { XMLParser } from "fast-xml-parser";

/**
 * Filter out RESPONSE tags and their content from the text
 * This prevents reasoning content from appearing in short/detailed answers
 */
function filterResponseTags(text: string): string {
  if (!text) return text;
  
  // Handle case where content appears after closing </RESPONSE> tag
  // This is for when reasoning data is incorrectly included in final_answer
  const afterClosingTagRegex = /<\/RESP?ONSE>\s*([\s\S]*?)$/gi;
  const afterClosingMatch = afterClosingTagRegex.exec(text);
  
  if (afterClosingMatch) {
    // If there's content after closing tag, return only that content
    const contentAfterTag = afterClosingMatch[1].trim();
    if (contentAfterTag) {
      return contentAfterTag;
    }
  }
  
  // Check for unclosed RESPONSE tags and handle them
  const unClosedResponseRegex = /<RESP?ONSE\b[^>]*>([\s\S]*?)(?!<\/RESP?ONSE>)/gi;
  const hasUnclosedResponse = unClosedResponseRegex.test(text);
  
  if (hasUnclosedResponse) {
    // If there's an unclosed RESPONSE tag, remove everything from the opening tag onwards
    const beforeOpeningTagRegex = /^([\s\S]*?)(?=<RESP?ONSE\b[^>]*>)/i;
    const beforeMatch = beforeOpeningTagRegex.exec(text);
    if (beforeMatch && beforeMatch[1].trim()) {
      return beforeMatch[1].trim();
    }
  }
  
  // Remove content between <RESPONSE> and </RESPONSE> tags (case insensitive)
  // This handles both <RESPONSE> and <REPONSE> (typo) variations
  const responseTagRegex = /<RESP?ONSE\b[^>]*>[\s\S]*?<\/RESP?ONSE>/gi;
  let filtered = text.replace(responseTagRegex, '');
  
  // Clean up any extra whitespace left behind
  filtered = filtered.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
  
  return filtered;
}

interface ProcessedResponse {
  reasoning?: string;
  answer: string;
  citations?: Citation[];
}

export interface Citation {
  source: string;
  link: string;
  supportingSnippet: string;
}

export type ParsedAnswer = {
  shortAnswer?: string;
  detailedAnswer?: string;
  references?: Array<{ Source?: string; Link?: string; Supporting?: string }>;
  raw?: string; // for debugging
};

const xmlOpts = {
  ignoreAttributes: true,
  trimValues: false, // keep whitespace; we'll clean later
  preserveOrder: false,
  allowBooleanAttributes: true,
};

/**
 * NEW: Parse XML sections from the new backend response format
 */
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

export function parseXmlSections(xmlLike: string): ParsedAnswer {
  // Filter out RESPONSE tags first to prevent reasoning content from appearing in answers
  xmlLike = filterResponseTags(xmlLike);
  
  // Unescape HTML entities
  xmlLike = unescapeHtml(xmlLike);
  
  // 1) Quick regex fallback for robustness (works on fragments)
  const take = (tag: string) => {
    const m = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i").exec(xmlLike);
    return m?.[1]?.trim();
  };

  const short = take("short_answer");
  const detailed = take("detailed_answer");

  // 2) guideline_references can be either:
  //    a) JSON blob inside <guideline_references> ... </guideline_references>
  //    b) XML with <reference><source/><link/><supporting/></reference>*
  let refs: ParsedAnswer["references"] = undefined;
  const rawRefs = take("guideline_references");

  if (rawRefs) {
    const looksJson =
      rawRefs.trim().startsWith("{") || rawRefs.trim().startsWith("[");
    if (looksJson) {
      try {
        let cleanRefs = rawRefs.trim();
        
        // Fix malformed JSON: detect "{...}, {...}" pattern and wrap as array
        if (cleanRefs.startsWith('{') && cleanRefs.includes('},') && !cleanRefs.startsWith('[')) {
          cleanRefs = `[${cleanRefs}]`;
        }
        
        const j = JSON.parse(cleanRefs);
        refs = Array.isArray(j) ? j : [j];
      } catch {
        refs = [{ Supporting: rawRefs }]; // fallback: keep as supporting text
      }
    } else {
      // Try parsing as XML block
      try {
        const parser = new XMLParser(xmlOpts);
        const obj = parser.parse(`<root>${rawRefs}</root>`);
        const list = Array.isArray(obj?.root?.reference)
          ? obj.root.reference
          : obj?.root?.reference
          ? [obj.root.reference]
          : [];

        if (list.length > 0) {
          refs = list.map((r: any) => ({
            Source: r?.source,
            Link: r?.link,
            Supporting: r?.supporting,
          }));
        } else {
          refs = [{ Supporting: rawRefs }];
        }
      } catch {
        refs = [{ Supporting: rawRefs }];
      }
    }
  }

  return {
    shortAnswer: short,
    detailedAnswer: detailed,
    references: refs,
    raw: xmlLike,
  };
}

/**
 * Main function: Processes complete medical AI response
 */
export function processFullResponse(rawResponse: string): string {
  // First try to parse as XML sections (new format)
  if (
    rawResponse.includes("<short_answer>") ||
    rawResponse.includes("<detailed_answer>")
  ) {
    const parsed = parseXmlSections(rawResponse);
    let result = "";

    if (parsed.shortAnswer) {
      result += cleanXmlContent(parsed.shortAnswer) + "\n\n";
    }

    if (parsed.detailedAnswer) {
      result += cleanXmlContent(parsed.detailedAnswer) + "\n\n";
    }

    if (parsed.references && parsed.references.length > 0) {
      result += formatXmlReferences(parsed.references);
    }

    return result.trim();
  }

  // Fallback to old format - filter RESPONSE tags from the raw response first
  const filteredResponse = filterResponseTags(rawResponse);
  const { answer } = extractReasoningAndAnswer(filteredResponse);
  const formatted = parseAndFormat(answer);
  return formatted.startsWith("\n") ? formatted : "\n" + formatted;
}

/**
 * Enhanced function that returns both reasoning and answer separately
 */
export function processFullResponseWithReasoning(
  rawResponse: string
): ProcessedResponse {
  // First try to parse as XML sections (new format)
  if (
    rawResponse.includes("<short_answer>") ||
    rawResponse.includes("<detailed_answer>")
  ) {
    const parsed = parseXmlSections(rawResponse);
    let answer = "";

    if (parsed.shortAnswer) {
      answer += cleanXmlContent(parsed.shortAnswer) + "\n\n";
    }

    if (parsed.detailedAnswer) {
      answer += cleanXmlContent(parsed.detailedAnswer) + "\n\n";
    }

    // Extract citations from references
    const citations: Citation[] = [];
    if (parsed.references && parsed.references.length > 0) {
      parsed.references.forEach((ref) => {
        if (ref.Source || ref.Link || ref.Supporting) {
          citations.push({
            source: ref.Source || "",
            link: ref.Link || "",
            supportingSnippet: ref.Supporting || "",
          });
        }
      });
    }

    // Extract reasoning from XML if present
    let reasoning: string | undefined;
    const reasoningMatch = rawResponse.match(
      /<THINKING>([\s\S]*?)<\/THINKING>/i
    );
    if (reasoningMatch) {
      reasoning = cleanXmlContent(reasoningMatch[1]);
    }

    return {
      reasoning,
      answer: answer.trim(),
      citations: citations.length > 0 ? citations : undefined,
    };
  }

  // Fallback to old format - filter RESPONSE tags from the raw response first
  const filteredResponse = filterResponseTags(rawResponse);
  const { reasoning, answer } = extractReasoningAndAnswer(filteredResponse);

  let processedAnswer = parseAndFormat(answer);
  let processedReasoning = reasoning ? parseAndFormat(reasoning) : undefined;

  if (processedAnswer && !processedAnswer.startsWith("\n")) {
    processedAnswer = "\n" + processedAnswer;
  }

  if (processedReasoning && !processedReasoning.startsWith("\n")) {
    processedReasoning = "\n" + processedReasoning;
  }

  // Extract citations from the processed answer
  const { citations, cleanedText } = extractCitationsFromText(processedAnswer);

  return {
    reasoning: processedReasoning,
    answer: cleanedText,
    citations: citations.length > 0 ? citations : undefined,
  };
}

/**
 * Extracts reasoning and answer from response
 */
function extractReasoningAndAnswer(rawResponse: string): ProcessedResponse {
  const reasoningStart = "<reasoning>";
  const reasoningEnd = "</reasoning>";

  const startIndex = rawResponse.indexOf(reasoningStart);
  const endIndex = rawResponse.indexOf(reasoningEnd);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const reasoning = rawResponse
      .slice(startIndex + reasoningStart.length, endIndex)
      .trim();
    const answer = rawResponse.slice(endIndex + reasoningEnd.length).trim();

    return { reasoning: cleanContent(reasoning), answer };
  }

  return { answer: rawResponse };
}

/**
 * Parse JSON content and format as markdown
 */
function parseAndFormat(content: string): string {
  const trimmed = content.trim();

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.response_type === "flash_answer" && parsed.response) {
      return formatContent(parsed.response);
    }
  } catch {
    // Not JSON, continue with text processing
  }

  return formatContent(trimmed);
}

/**
 * Main content formatting function
 */
function formatContent(text: string): string {
  let result = text;

  // Clean up content
  result = cleanContent(result);

  // Process citations
  result = processCitations(result);

  // Format sections
  result = formatSections(result);

  // Final cleanup
  result = result.replace(/\n{3,}/g, "\n\n").trim();

  return result;
}

/**
 * Clean up content by removing unwanted elements
 */
function cleanContent(text: string): string {
  return (
    text
      // Remove emojis
      .replace(/[📋📚🔗📄💡⚠️📖💬📊🏥⚕️🩺]/g, "")
      .replace(
        /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
        ""
      )
      // Remove RAG tags
      .replace(/<RAG:[^>]*>/gi, "")
      // Remove internal markers
      .replace(/\*\*\d+\.\s*[^*]*\*\*/g, "")
      // Clean up spacing
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\s*[\*\-]\s*$/gm, "")
      .trim()
  );
}

/**
 * Extract citations from text and return both citations array and cleaned text
 */
function extractCitationsFromText(text: string): {
  citations: Citation[];
  cleanedText: string;
} {
  const allCitations: Citation[] = [];
  let processedText = text;

  // Handle JSON citation format (like in flash model responses)
  const jsonCitationPattern =
    /Citation:\s*\{[\s\S]*?"Source":\s*"([^"]+)"[\s\S]*?"Link":\s*"([^"]*)"[\s\S]*?"Supporting Snippet":\s*"([^"]*)"[\s\S]*?\}/gi;

  let match;
  while ((match = jsonCitationPattern.exec(text)) !== null) {
    allCitations.push({
      source: match[1].trim(),
      link: match[2].trim(),
      supportingSnippet: match[3].trim(),
    });

    // Remove the citation block from the text
    processedText = processedText.replace(match[0], "");
  }

  // Handle markdown citation format
  const markdownCitationPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  while ((match = markdownCitationPattern.exec(text)) !== null) {
    // Only add if it's not already in citations and looks like a real citation
    const source = match[1].trim();
    const link = match[2].trim();

    if (link.startsWith("http") && !allCitations.some((c) => c.link === link)) {
      allCitations.push({
        source: source,
        link: link,
        supportingSnippet: "", // No snippet available in markdown format
      });
    }
  }

  // Clean up the processed text
  processedText = processedText
    .replace(/Citation:\s*\{[\s\S]*?\}/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { citations: allCitations, cleanedText: processedText };
}

/**
 * Process various citation formats
 */
function processCitations(text: string): string {
  const allCitations: Citation[] = [];
  let processedText = text;

  // Handle JSON citation format (like in flash model responses)
  const jsonCitationPattern =
    /Citation:\s*\{[\s\S]*?"Source":\s*"([^"]+)"[\s\S]*?"Link":\s*"([^"]*)"[\s\S]*?"Supporting Snippet":\s*"((?:[^"\\]|\\.)*)"\s*\}/g;

  processedText = processedText.replace(
    jsonCitationPattern,
    (match, source, link, supportingSnippet) => {
      allCitations.push({ source, link, supportingSnippet });
      return `__CITATION_PLACEHOLDER_${allCitations.length - 1}__`;
    }
  );

  // Handle multiple citations pattern
  const multiCitationPattern =
    /Citation:\s*"Source":\s*"([^"]+)",?\s*"Link":\s*"([^"]*)",?\s*"Supporting Snippet":\s*"([^"]+)"(?:\s*Citation:\s*"Source":\s*"([^"]+)",?\s*"Link":\s*"([^"]*)",?\s*"Supporting Snippet":\s*"([^"]+)")*(?:\s*Citation:\s*"Source":\s*"([^"]+)",?\s*"Link":\s*"([^"]*)",?\s*"Supporting Snippet":\s*"([^"]+)")*/g;

  processedText = processedText.replace(multiCitationPattern, (...args) => {
    const startIndex = allCitations.length;

    // Extract all citation groups from the match
    for (let i = 1; i < args.length - 2; i += 3) {
      if (args[i] && args[i + 2]) {
        allCitations.push({
          source: args[i],
          link: args[i + 1] || "",
          supportingSnippet: args[i + 2],
        });
      }
    }

    // Create placeholders for all citations in this group
    let placeholders = "";
    for (let j = startIndex; j < allCitations.length; j++) {
      if (j > startIndex) placeholders += "\n\n";
      placeholders += `__CITATION_PLACEHOLDER_${j}__`;
    }
    return placeholders;
  });

  // Handle single citation
  const singleCitationPattern =
    /Citation:\s*"Source":\s*"([^"]+)",?\s*"Link":\s*"([^"]*)",?\s*"Supporting Snippet":\s*"([^"]+)"/g;

  processedText = processedText.replace(
    singleCitationPattern,
    (match, source, link, supportingSnippet) => {
      allCitations.push({ source, link, supportingSnippet });
      return `__CITATION_PLACEHOLDER_${allCitations.length - 1}__`;
    }
  );

  // Now replace all placeholders with properly numbered citations
  allCitations.forEach((citation, index) => {
    const placeholder = `__CITATION_PLACEHOLDER_${index}__`;
    const formattedCitation = formatSingleCitation(citation, index + 1);
    processedText = processedText.replace(placeholder, formattedCitation);
  });

  return processedText;
}

/**
 * Format a single citation with proper numbering
 */
function formatSingleCitation(
  citation: Citation,
  citationNumber: number
): string {
  if (!citation.supportingSnippet?.trim()) return "";

  const cleanSnippet = citation.supportingSnippet
    .trim()
    .replace(/^["']|["']$/g, "");
  const pageInfo = extractPageInfo(citation.link);

  let formatted = "";

  // Enhanced quote block with larger, more prominent snippet text (snippet first!)
  formatted += `> ### "${cleanSnippet}"\n\n`;

  // Source information (smaller, less prominent)
  formatted += `*${citationNumber}. ${citation.source}${pageInfo}*\n\n`;

  // View source link
  if (citation.link?.trim()) {
    formatted += `[View Source Document](${citation.link})\n\n`;
  }

  return formatted;
}

/**
 * Format citations with numbered design matching the image (legacy function)
 */
function formatCitations(citations: Citation[]): string {
  let formatted = "";

  citations.forEach((citation, index) => {
    if (citation.supportingSnippet?.trim()) {
      // Add spacing between citations
      if (index > 0) formatted += "\n\n---\n\n";

      formatted += formatSingleCitation(citation, index + 1);
    }
  });

  return formatted;
}

/**
 * Format section headers
 */
function formatSections(text: string): string {
  return (
    text
      // Format section headers
      .replace(/### SHORT ANSWER\s*\n/g, "## Short Answer\n\n")
      .replace(/## SHORT ANSWER\s*\n/g, "## Short Answer\n\n")
      .replace(/### DETAILED ANSWER\s*\n/g, "## Detailed Answer\n\n")
      .replace(/## DETAILED ANSWER\s*\n/g, "## Detailed Answer\n\n")
      .replace(/### GUIDELINES REFERENCE\s*\n/g, "## Guidelines Reference\n\n")
      .replace(/## GUIDELINES REFERENCE\s*\n/g, "## Guidelines Reference\n\n")
      .replace(/### AI Disclaimer\s*\n/g, "## AI Disclaimer\n\n")
      .replace(/## AI Disclaimer\s*\n/g, "## AI Disclaimer\n\n")
      // Add spacing around headings
      .replace(/^(#{1,6}\s.*)$/gm, "\n\n$1\n")
      // Add spacing around horizontal rules
      .replace(/^(-{3,}|\*{3,})$/gm, "\n$1\n")
  );
}

/**
 * Clean XML content by removing XML tags and formatting properly
 */
function cleanXmlContent(content: string): string {
  if (!content) return "";

  return (
    content
      // Remove XML tags but keep content
      .replace(/<[^>]*>/g, "")
      // Clean up citation references like [cite: ...]
      .replace(/\[cite:\s*([^\]]+)\]/g, "")
      // Remove any backticks that might trigger code blocks
      .replace(/`/g, "")
      // Remove any code block markers
      .replace(/```[\s\S]*?```/g, "")
      .replace(/```/g, "")
      // Remove any indentation that might trigger code blocks
      .replace(/^\s{4,}/gm, "")
      // Remove extra whitespace and normalize line breaks
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      // Remove leading/trailing whitespace
      .trim()
  );
}

/**
 * Format XML references into clean markdown
 */
function formatXmlReferences(
  references: Array<{ Source?: string; Link?: string; Supporting?: string }>
): string {
  let formatted = "\n\n## References\n\n";

  references.forEach((ref, index) => {
    if (ref.Source || ref.Link || ref.Supporting) {
      formatted += `${index + 1}. `;

      if (ref.Source) {
        if (ref.Link) {
          formatted += `[${ref.Source}](${ref.Link})`;
        } else {
          formatted += ref.Source;
        }
      } else if (ref.Link) {
        formatted += `[View Source](${ref.Link})`;
      }

      if (ref.Supporting) {
        formatted += `\n\n> "${ref.Supporting}"\n\n`;
      } else {
        formatted += "\n\n";
      }
    }
  });

  return formatted;
}

/**
 * Extract page info from URL
 */
function extractPageInfo(url: string): string {
  if (!url) return "";
  const pageMatch = url.match(/#page=(\d+)/);
  return pageMatch ? ` **(Page ${pageMatch[1]})**` : "";
}