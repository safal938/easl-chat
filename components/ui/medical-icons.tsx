// components/ui/medical-icons.tsx

"use client";

import React from "react";
import {
  FileText,
  BookOpen,
  ExternalLink,
  Lightbulb,
  List,
  AlertTriangle,
  Quote,
  Brain,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalIconProps {
  type:
    | "document"
    | "source"
    | "link"
    | "pdf"
    | "clinical-guidance"
    | "key-points"
    | "limitations"
    | "references"
    | "excerpt"
    | "access"
    | "brain"
    | "stethoscope"
    | "short-answer";
  className?: string;
  size?: "sm" | "md" | "lg";
  opacity?: number;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export function MedicalIcon({
  type,
  className,
  size = "md",
  opacity = 1,
}: MedicalIconProps) {
  const iconClass = cn(sizeClasses[size], className);
  const style = { opacity };

  switch (type) {
    case "document":
    case "pdf":
      return <FileText className={iconClass} style={style} />;
    case "source":
    case "references":
      return <BookOpen className={iconClass} style={style} />;
    case "link":
    case "access":
      return <ExternalLink className={iconClass} style={style} />;
    case "clinical-guidance":
      return <Lightbulb className={iconClass} style={style} />;
    case "key-points":
      return <List className={iconClass} style={style} />;
    case "limitations":
      return <AlertTriangle className={iconClass} style={style} />;
    case "excerpt":
      return <Quote className={iconClass} style={style} />;
    case "brain":
      return <Brain className={iconClass} style={style} />;
    case "stethoscope":
      return <Stethoscope className={iconClass} style={style} />;
    case "short-answer":
      return (
        <img
          src="/icons/short-answer.png"
          alt="Short Answer"
          className="h-12 w-12"
          style={style}
        />
      );
    default:
      return <FileText className={iconClass} style={style} />;
  }
}

// Helper component for inline medical icons in markdown
export function InlineMedicalIcon({
  type,
  className,
  opacity = 1,
}: Omit<MedicalIconProps, "size">) {
  return (
    <MedicalIcon
      type={type}
      size="sm"
      className={cn("inline mr-1", className)}
      opacity={opacity}
    />
  );
}
