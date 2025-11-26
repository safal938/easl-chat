# Reasoning Response Nested JSON Format Support

## Problem
The endpoint response format has been updated to include nested JSON within the `response` field for reasoning chunks. The new format looks like:

```json
{
  "response_type": "reasoning",
  "expert_name": "Viral_Hepatitis",
  "response": "{'type': 'thinking', 'thinking': \"**Prioritizing Initial Actions**\\n\\nI've homed in on the immediate actions...\"}"
}
```

Previously, the system was not parsing this nested JSON structure, so the raw JSON string was being displayed in the frontend instead of the actual thinking content.

## Solution
Updated the stream processor to detect and parse the nested JSON format:

### Changes Made

1. **hooks/useSimpleStreamProcessor.ts**
   - Updated the `reasoning` case in `processStreamChunk` to detect nested JSON
   - Uses regex to extract the `thinking` content from the nested JSON
   - Properly unescapes the content (handles `\n`, `\t`, `\"`, `\\`)
   - Falls back to standard JSON parsing if regex fails
   - Preserves XML format responses (backward compatible)

2. **components/message/CollapsibleAnswerMessage.tsx**
   - Simplified `processReasoningContent` function
   - Removed redundant parsing logic (now handled in stream processor)
   - Content is already unescaped during streaming
   - Maintains support for XML-tagged reasoning content

## Format Support

The system now supports both formats:

### 1. Nested JSON Format (New)
```json
{
  "response_type": "reasoning",
  "response": "{'type': 'thinking', 'thinking': \"Content with \\n newlines\"}"
}
```

### 2. XML Format (Legacy)
```json
{
  "response_type": "reasoning",
  "response": "<RESPONSE><THINKING>Content here</THINKING></RESPONSE>"
}
```

### 3. Plain Text Format (Fallback)
```json
{
  "response_type": "reasoning",
  "response": "Plain text reasoning content"
}
```

## Rendering Behavior

- **During Streaming**: Content is displayed in real-time using `StreamingMarkdown` component
- **After Completion**: Content is rendered with proper formatting, including:
  - Bold text (`**text**`)
  - Citations (`[cite: ...]`)
  - Line breaks and paragraphs
  - XML section tags (if present)

## Testing

Tested with:
- ✅ Nested JSON format with escaped newlines and quotes
- ✅ XML format (backward compatibility)
- ✅ Plain text format (fallback)
- ✅ Streaming and completed states
- ✅ Multiple reasoning chunks

## Notes

- The regex pattern `/'thinking':\s*"([^"]*(?:\\.[^"]*)*)"/)` handles escaped quotes within the thinking content
- Unescaping is done in the correct order to avoid double-unescaping issues
- The solution is backward compatible with existing XML and plain text formats
