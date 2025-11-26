// types/message.ts

export interface LocalGuidelineAnalysis {
  expert_name: string;
  response_type: string;
  response: string;
  timestamp: string;
  model_version: string;
  model_description: string;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  uid?: string;
  isTemporary?: boolean;
  isReasoning?: boolean;
  isReasoningAnswer?: boolean;
  reasoningText?: string;
  isReasoningFinalAnswer?: boolean;
  expertName?: string;
  safetyAnalysis?: any; // Store the SafetyAnalysis data
  localGuidelineAnalysis?: LocalGuidelineAnalysis; // Store the Local Guideline Analysis data
  isProcessingGuideline?: boolean; // Flag to indicate guideline analysis is in progress
  source?: 'board-app' | 'main-app'; // Track where the message originated from
  boardAppMetadata?: any; // Store additional board app metadata
}