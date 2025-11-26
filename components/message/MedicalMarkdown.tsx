// components/message/MedicalMarkdown.tsx

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { MedicalIcon } from "@/components/ui/medical-icons";

interface MedicalMarkdownProps {
  isTemporary?: boolean;
}

export function createMedicalMarkdownComponents({
  isTemporary = false,
}: MedicalMarkdownProps) {
  return {
    h1: ({ children }: any) => (
      <h1
        className={cn(
          "text-sm font-semibold mb-3 flex items-center",
          isTemporary ? "text-gray-800" : "text-gray-900"
        )}
      >
        {renderWithMedicalIcons(children)}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2
        className={cn(
          "text-base font-semibold mb-2 flex items-center",
          isTemporary ? "text-gray-800" : "text-gray-900"
        )}
      >
        {renderWithMedicalIcons(children)}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3
        className={cn(
          "text-sm font-semibold mb-2 flex items-center",
          isTemporary ? "text-gray-800" : "text-gray-900"
        )}
      >
        {renderWithMedicalIcons(children)}
      </h3>
    ),
    p: ({ children }: any) => (
      <p
        className={cn(
          "mb-4 leading-relaxed",
          isTemporary ? "text-gray-700" : "text-gray-900"
        )}
      >
        {children}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul
        className={cn(
          "list-disc list-inside mb-4 space-y-1",
          isTemporary ? "text-gray-700" : "text-gray-900"
        )}
      >
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol
        className={cn(
          "list-decimal list-inside mb-4 space-y-1",
          isTemporary ? "text-gray-700" : "text-gray-900"
        )}
      >
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li
        className={cn(
          "leading-relaxed",
          isTemporary ? "text-gray-700" : "text-gray-900"
        )}
      >
        {children}
      </li>
    ),
    code: ({ inline, children }: any) =>
      inline ? (
        <code
          className={cn(
            "px-1 rounded text-sm font-mono",
            isTemporary
              ? "bg-gray-100 text-gray-800"
              : "bg-gray-100 text-gray-900"
          )}
        >
          {children}
        </code>
      ) : (
        // For block code, render as regular paragraph to avoid unwanted code blocks
        <p
          className={cn(
            "mb-4 leading-relaxed",
            isTemporary ? "text-gray-700" : "text-gray-900"
          )}
        >
          {children}
        </p>
      ),
    pre: ({ children }: any) => (
      // Convert pre blocks to regular paragraphs for medical content
      <div
        className={cn(
          "mb-4 leading-relaxed",
          isTemporary ? "text-gray-700" : "text-gray-900"
        )}
      >
        {children}
      </div>
    ),
    a: ({ href, children }: any) => {
      const childrenStr = typeof children === "string" ? children : "";
      const isDocumentLink =
        childrenStr.includes("View") ||
        childrenStr.includes("Document") ||
        childrenStr.includes("PDF") ||
        /[📄🔗📋]/.test(childrenStr);

      if (isDocumentLink) {
        // Clean the text of any emojis
        const cleanText = childrenStr
          .replace(/[📄🔗📋📚💡⚠️📖💬📊]/g, "")
          .trim();
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors underline decoration-dotted underline-offset-4 font-medium",
              isTemporary
                ? "text-blue-600 hover:text-blue-800"
                : "text-blue-600 hover:text-blue-800"
            )}
            title={`Open ${href}`}
          >
            <MedicalIcon type="pdf" size="md" />
            {cleanText || "View Document"}
          </a>
        );
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "underline",
            isTemporary ? "text-blue-600" : "text-blue-600"
          )}
        >
          {children}
        </a>
      );
    },
    table: ({ children }: any) => (
      <div className="overflow-x-auto mb-4 rounded-lg border border-gray-200">
        <table className="min-w-full">{children}</table>
      </div>
    ),
    th: ({ children }: any) => (
      <th className="bg-gray-50 border-b border-gray-200 px-4 py-3 text-left font-semibold">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="border-b border-gray-100 px-4 py-3">{children}</td>
    ),
    blockquote: ({ children }: any) => (
      <div className="mb-6">
        <blockquote
          className={cn(
            "border-l-4 pl-6 py-4 rounded-r-lg flex items-start gap-3 shadow-sm",
            isTemporary
              ? "border-blue-400 bg-blue-50 text-gray-800"
              : "border-blue-400 bg-blue-50 text-gray-800"
          )}
        >
          <MedicalIcon
            type="excerpt"
            size="lg"
            className="mt-1 flex-shrink-0 text-gray-400 opacity-60"
          />
          <div className="flex-1">{children}</div>
        </blockquote>
      </div>
    ),
    strong: ({ children }: any) => (
      <strong
        className={cn(
          "font-bold",
          isTemporary ? "text-gray-800" : "text-gray-900"
        )}
      >
        {children}
      </strong>
    ),
    em: ({ children }: any) => (
      <em
        className={cn(
          "italic",
          isTemporary ? "text-gray-700" : "text-gray-900"
        )}
      >
        {children}
      </em>
    ),
    hr: () => (
      <hr
        className={cn(
          "my-6 border-t-2",
          isTemporary ? "border-gray-200" : "border-gray-200"
        )}
      />
    ),
  };
}

// Helper function to render headings with appropriate medical icons
function renderWithMedicalIcons(children: any): React.ReactNode {
  if (typeof children === "string") {
    // Clean any emojis from the heading text
    let cleanText = children.replace(/[📋📚🔗📄💡⚠️📖💬📊]/g, "").trim();

    // Define icon mappings with cleaner text
    const iconMappings = [
      {
        keywords: ["Clinical Guidance"],
        icon: "clinical-guidance" as const,
        displayText: "Clinical Guidance",
      },
      {
        keywords: ["Key Clinical Points", "Key Points"],
        icon: "key-points" as const,
        displayText: "Key Clinical Points",
      },
      {
        keywords: ["Clinical Limitations", "Limitations"],
        icon: "limitations" as const,
        displayText: "Clinical Limitations",
      },
      {
        keywords: ["Medical References", "References", "Source Document"],
        icon: "references" as const,
        displayText: "Source Document",
      },
      {
        keywords: ["Document Information", "Document"],
        icon: "document" as const,
        displayText: "Document Information",
      },
      {
        keywords: ["Access Document", "Access"],
        icon: "access" as const,
        displayText: "Access Document",
      },
    ];

    // Find matching icon mapping
    for (const mapping of iconMappings) {
      if (mapping.keywords.some((keyword) => cleanText.includes(keyword))) {
        return (
          <>
            <MedicalIcon type={mapping.icon} size="md" className="mr-2" />
            {mapping.displayText}
          </>
        );
      }
    }

    // Return cleaned text if no specific icon matches
    return cleanText !== children ? cleanText : children;
  }
  return children;
}

export function createMedicalReasoningMarkdownComponents() {
  return {
    p: ({ children }: any) => (
      <p className="leading-relaxed mb-4 text-gray-800">{children}</p>
    ),
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
        {renderWithMedicalIcons(children)}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-bold mb-3 text-gray-900 flex items-center">
        {renderWithMedicalIcons(children)}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-lg font-bold mb-2 text-gray-900 flex items-center">
        {renderWithMedicalIcons(children)}
      </h3>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-800">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-800">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="leading-relaxed text-gray-800">{children}</li>
    ),
    strong: ({ children }: any) => (
      <strong className="font-bold text-gray-900">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-gray-800">{children}</em>
    ),
    code: ({ inline, children }: any) =>
      inline ? (
        <code className="bg-gray-200 px-1 rounded text-sm font-mono text-gray-900">
          {children}
        </code>
      ) : (
        // For block code in reasoning, render as regular paragraph
        <p className="leading-relaxed mb-4 text-gray-800">{children}</p>
      ),
    pre: ({ children }: any) => (
      // Convert pre blocks to regular content for reasoning
      <div className="leading-relaxed mb-4 text-gray-800">{children}</div>
    ),
    blockquote: ({ children }: any) => (
      <div className="mb-6">
        <blockquote className="pl-6 py-4 bg-gray-100 rounded-lg text-gray-800 flex items-start gap-3 shadow-sm">
          <MedicalIcon
            type="excerpt"
            size="lg"
            className="mt-1 flex-shrink-0 text-gray-500"
          />
          <div className="flex-1">{children}</div>
        </blockquote>
      </div>
    ),
  };
}
