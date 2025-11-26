// lib/formatting-utils.ts
// Centralized formatting utilities for medical content processing

export const unescapeHtml = (s: string): string =>
  s?.replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'") || "";

export const cleanXmlTags = (content: string): string =>
  unescapeHtml(content || "")
    .replace(/<[^>]*>/g, "")
    .replace(/`/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s{4,}/gm, "")
    .replace(/\s+/g, " ")
    .trim();

export function parseReferences(refs: any): any[] {
  if (!refs) return [];

  try {
    if (typeof refs === "string") {
      // Handle malformed JSON: detect "{...}, {...}" pattern and wrap as array
      let cleanRefs = refs.trim();
      if (cleanRefs.startsWith('{') && cleanRefs.includes('},') && !cleanRefs.startsWith('[')) {
        cleanRefs = `[${cleanRefs}]`;
      }
      refs = JSON.parse(cleanRefs);
    }
    
    if (!Array.isArray(refs)) refs = [refs];
    
    return refs.map((r: any) => ({
      source: r.Source || r.source || "",
      link: r.Link || r.link || "",
      supportingSnippet: r.Supporting || r.Supporting_Snippet || r.supportingSnippet || "",
    }));
  } catch {
    return [];
  }
}

// Tag patterns for reasoning content
export const REASONING_TAG_PATTERNS = [
  ["QUESTION", "Question Analysis"],
  ["PATIENT_CONTEXT", "Patient Context"],
  ["LOCAL_MAPPING", "Local Mapping"],
  ["CONVERGENT", "Convergent Analysis"],
  ["DIVERGENT", "Divergent Analysis"],
  ["RISK_ANALYSIS", "Risk Analysis"],
] as const;

export function processReasoningContent(content: string): { tag: string; label: string; content: string }[] {
  let cleaned = unescapeHtml(content)
    .replace(/<RESPONSE>([\s\S]*?)<\/RESPONSE>/gi, "$1")
    .trim();

  // ⚠️ CRITICAL FIX: Don't limit to THINKING content only - process all tags first
  const results = REASONING_TAG_PATTERNS.map(([tag, label]) => {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
    const match = cleaned.match(regex);
    if (!match?.[1]) return null;

    return {
      tag,
      label,
      content: cleanXmlTags(match[1]),
    };
  }).filter(Boolean) as { tag: string; label: string; content: string }[];

  // If we found results, return them
  if (results.length > 0) return results;

  // FALLBACK: Extract content from THINKING wrapper if present and try again
  const thinkingMatch = cleaned.match(/<THINKING>([\s\S]*?)<\/THINKING>/i);
  if (thinkingMatch) {
    const thinkingContent = thinkingMatch[1].trim();
    return REASONING_TAG_PATTERNS.map(([tag, label]) => {
      const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
      const match = thinkingContent.match(regex);
      if (!match?.[1]) return null;

      return {
        tag,
        label,
        content: cleanXmlTags(match[1]),
      };
    }).filter(Boolean) as { tag: string; label: string; content: string }[];
  }

  return results;
}