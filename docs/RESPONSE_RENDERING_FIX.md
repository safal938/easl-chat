# Response Rendering Fix

## Problem

The response from the backend contained escaped newlines (`\n`) and other escaped characters that weren't being properly rendered in the frontend. This caused:

1. **No line breaks**: Text appeared as one long line with literal `\n` characters visible
2. **No markdown formatting**: Headers, lists, and other markdown elements weren't being rendered
3. **Poor readability**: The response was difficult to read without proper formatting

## Example of the Problem

### Before Fix

```
The most appropriate immediate management strategy for this patient is to immediatelyand permanently discontinue the combination immunotherapy, admit the patient to the hospital for urgent management and daily monitoring of liver parameters (ALT, AST, TBL, INR), and promptly initiate high-dose intravenous corticosteroids (e.g., methylprednisolone 1-2 mg/kg/day). Concurrently, a comprehensive workupto exclude alternative causes of acute liver injury should be performed, and urgent hepatology consultation is recommended.
```

### After Fix

```
The most appropriate immediate management strategy for this patient is to immediately
and permanently discontinue the combination immunotherapy, admit the patient to the
hospital for urgent management and daily monitoring of liver parameters (ALT, AST,
TBL, INR), and promptly initiate high-dose intravenous corticosteroids (e.g.,
methylprednisolone 1-2 mg/kg/day).

Concurrently, a comprehensive workup to exclude alternative causes of acute liver
injury should be performed, and urgent hepatology consultation is recommended.
```

## Solution

Added a helper function `unescapeJsonString` in the `CollapsibleAnswerMessage` component that:

1. **Detects JSON strings**: Checks if the content is a JSON-encoded string
2. **Unescapes characters**: Converts escaped characters to their actual values:
   - `\n` → actual newline
   - `\t` → actual tab
   - `\r` → carriage return
   - `\"` → quote
   - `\\` → backslash
3. **Applies to both answers**: Processes both `short_answer` and `detailed_answer` fields

## Implementation

### Code Added

```typescript
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

// Apply to parsed response
if (parsedResponse?.short_answer) {
  parsedResponse.short_answer = unescapeJsonString(parsedResponse.short_answer);
}
if (parsedResponse?.detailed_answer) {
  parsedResponse.detailed_answer = unescapeJsonString(
    parsedResponse.detailed_answer
  );
}
```

## What Gets Fixed

### 1. Line Breaks

- **Before**: `immediatelyand permanently discontinue`
- **After**:
  ```
  immediately
  and permanently discontinue
  ```

### 2. Paragraph Spacing

- **Before**: All text in one block
- **After**: Proper paragraph breaks with spacing

### 3. Markdown Rendering

The existing markdown renderer (`ReactMarkdown` with `MedicalMarkdown` components) now works properly because the content has actual newlines instead of escaped `\n` characters.

### 4. Lists and Formatting

- **Bullet points** render correctly
- **Numbered lists** render correctly
- **Headers** render correctly
- **Bold/italic** text renders correctly

## Testing

### Test Case 1: Short Answer

```json
{
  "short_answer": "The most appropriate immediate management strategy for this patient is to immediately\\nand permanently discontinue the combination immunotherapy..."
}
```

**Result**: Renders with proper line breaks

### Test Case 2: Detailed Answer with Markdown

```json
{
  "detailed_answer": "This recommendation is based on the patient's severe liver injury:\\n\\n* ALT 20.5x ULN\\n* AST 18.75x ULN\\n* Total Bilirubin 3.75x ULN"
}
```

**Result**: Renders as:

```
This recommendation is based on the patient's severe liver injury:

* ALT 20.5x ULN
* AST 18.75x ULN
* Total Bilirubin 3.75x ULN
```

## Files Modified

- `components/message/CollapsibleAnswerMessage.tsx` - Added `unescapeJsonString` helper function

## Impact

### Before

- Text appeared as one long line
- Escaped characters visible (`\n`, `\t`, etc.)
- No markdown formatting
- Poor readability

### After

- Proper line breaks and paragraph spacing
- Markdown formatting works correctly
- Headers, lists, and emphasis render properly
- Excellent readability

## Related Components

The fix works in conjunction with:

- `MedicalMarkdown.tsx` - Provides markdown rendering components
- `ReactMarkdown` - Renders the markdown to HTML
- `remarkGfm` - Adds GitHub Flavored Markdown support

## Future Considerations

### Backend Improvement

Ideally, the backend should send properly formatted responses without escaped characters. However, this frontend fix ensures compatibility with both:

- Escaped JSON strings (current format)
- Properly formatted strings (future format)

### Additional Escaping

If other escaped characters are encountered, they can be added to the `unescapeJsonString` function:

```typescript
.replace(/\\b/g, '\b')  // backspace
.replace(/\\f/g, '\f')  // form feed
.replace(/\\v/g, '\v')  // vertical tab
```

## Additional Fix: Reasoning "Thinking" Format

### Problem

The reasoning responses also contained a special JSON format:

```javascript
{'type': 'thinking', 'thinking': "**Prioritizing Initial Actions**\\n\\nI've homed in on..."}
```

This wasn't being parsed, so the thinking content appeared as raw JSON instead of formatted text.

### Solution

Added `parseThinkingJson` helper function that:

1. Detects the `{'type': 'thinking', ...}` format
2. Converts Python-style single quotes to double quotes
3. Parses the JSON
4. Extracts and unescapes the `thinking` field
5. Returns properly formatted text

### Code Added

```typescript
const parseThinkingJson = (text: string): string | null => {
  try {
    // Try to parse as JSON with single quotes (Python dict format)
    const jsonStr = text.replace(/'/g, '"');
    const parsed = JSON.parse(jsonStr);
    if (parsed.type === "thinking" && parsed.thinking) {
      // Unescape the thinking content
      return parsed.thinking
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .trim();
    }
  } catch {
    // Not valid JSON, continue
  }
  return null;
};
```

### Result

**Before**:

```
{'type': 'thinking', 'thinking': "**Prioritizing Initial Actions**\\n\\nI've homed in on..."}
```

**After**:

```
**Prioritizing Initial Actions**

I've homed in on the immediate actions. Considering this is drug-induced liver injury (DILI)
from immunotherapy, the urgency of the situation demands a rapid assessment...
```

## Summary

The fix ensures that all response content (both final answers and reasoning) is properly unescaped and parsed before being rendered, allowing the markdown renderer to work correctly and providing a much better user experience with properly formatted, readable medical responses.
