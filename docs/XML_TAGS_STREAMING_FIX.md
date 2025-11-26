# XML Tags Streaming Support Fix

## Problem
XML tags like `<GAP_ANALYSIS>`, `<LOCAL_DIVERGENT>`, and `<LOCAL_CONVERGENT>` were not being converted to readable labels during streaming. They appeared as raw XML tags instead of formatted section headers.

## Root Cause
The `processXmlContent` function in `StreamingMarkdown.tsx` was missing these XML tag definitions, so they weren't being converted to markdown headers during streaming.

## Solution
Added the missing XML tag conversions to the `processXmlContent` function.

## Complete List of Supported XML Tags

### Main Sections
| XML Tag | Converts To | Display |
|---------|-------------|---------|
| `<RESPONSE>` | (removed) | - |
| `<QUESTION>` | `#### Question Analysis` | **Question Analysis** |
| `<THINKING>` | `#### Medical Reasoning` | **Medical Reasoning** |

### Analysis Sections
| XML Tag | Converts To | Display |
|---------|-------------|---------|
| `<PATIENT_CONTEXT>` | `#### Patient Context` | **Patient Context** |
| `<GAP_ANALYSIS>` | `#### Gap Analysis` | **Gap Analysis** ✅ ADDED |
| `<LOCAL_MAPPING>` | `#### Local Mapping` | **Local Mapping** |
| `<LOCAL_DIVERGENT>` | `#### Local Divergent` | **Local Divergent** ✅ ADDED |
| `<LOCAL_CONVERGENT>` | `#### Local Convergent` | **Local Convergent** ✅ ADDED |
| `<CONVERGENT>` | `#### Convergent Analysis` | **Convergent Analysis** |
| `<DIVERGENT>` | `#### Divergent Analysis` | **Divergent Analysis** |
| `<RISK_ANALYSIS>` | `#### Risk Analysis` | **Risk Analysis** |

### Subsections
| XML Tag | Converts To | Display |
|---------|-------------|---------|
| `<type>` | `**Type:** ` | **Type:** |
| `<clinical_intent>` | `**Clinical Intent:** ` | **Clinical Intent:** |
| `<plan>` | `**Plan:**` | **Plan:** |
| `<step>` | `• ` | Bullet point |
| `<thinking_intensity>` | `**Thinking Intensity:** ` | **Thinking Intensity:** |
| `<plan_steps>` | `**Plan Steps:**` | **Plan Steps:** |

### Special Processing
| Pattern | Converts To | Display |
|---------|-------------|---------|
| `[cite: Source, URL]` | ` *Source, URL*` | *Source, URL* |

## Code Changes

### File: `components/StreamingMarkdown.tsx`

**Before**:
```typescript
.replace(/<PATIENT_CONTEXT>/g, "\n#### Patient Context\n\n")
.replace(/<\/PATIENT_CONTEXT>/g, "\n\n")
.replace(/<LOCAL_MAPPING>/g, "\n#### Local Mapping\n\n")
.replace(/<\/LOCAL_MAPPING>/g, "\n\n")
.replace(/<CONVERGENT>/g, "\n#### Convergent Analysis\n\n")
.replace(/<\/CONVERGENT>/g, "\n\n")
```

**After**:
```typescript
.replace(/<PATIENT_CONTEXT>/g, "\n#### Patient Context\n\n")
.replace(/<\/PATIENT_CONTEXT>/g, "\n\n")
.replace(/<GAP_ANALYSIS>/g, "\n#### Gap Analysis\n\n")          // ✅ ADDED
.replace(/<\/GAP_ANALYSIS>/g, "\n\n")                           // ✅ ADDED
.replace(/<LOCAL_MAPPING>/g, "\n#### Local Mapping\n\n")
.replace(/<\/LOCAL_MAPPING>/g, "\n\n")
.replace(/<LOCAL_DIVERGENT>/g, "\n#### Local Divergent\n\n")   // ✅ ADDED
.replace(/<\/LOCAL_DIVERGENT>/g, "\n\n")                        // ✅ ADDED
.replace(/<LOCAL_CONVERGENT>/g, "\n#### Local Convergent\n\n") // ✅ ADDED
.replace(/<\/LOCAL_CONVERGENT>/g, "\n\n")                       // ✅ ADDED
.replace(/<CONVERGENT>/g, "\n#### Convergent Analysis\n\n")
.replace(/<\/CONVERGENT>/g, "\n\n")
```

## Example

### Input (Streaming)
```xml
<GAP_ANALYSIS>
There is a clear divergence between the two local guideline tables.
</GAP_ANALYSIS>

<LOCAL_DIVERGENT>
The first table recommends delaying hospitalization.
</LOCAL_DIVERGENT>

<LOCAL_CONVERGENT>
Both guidelines agree on immediate discontinuation.
</LOCAL_CONVERGENT>
```

### Output (Rendered)
```
#### Gap Analysis

There is a clear divergence between the two local guideline tables.

#### Local Divergent

The first table recommends delaying hospitalization.

#### Local Convergent

Both guidelines agree on immediate discontinuation.
```

### User Sees
**Gap Analysis**

There is a clear divergence between the two local guideline tables.

**Local Divergent**

The first table recommends delaying hospitalization.

**Local Convergent**

Both guidelines agree on immediate discontinuation.

## Consistency

Now both streaming and completed states handle the same XML tags:

✅ **Streaming** (`StreamingMarkdown.tsx`): Converts XML to markdown headers  
✅ **Completed** (`CollapsibleAnswerMessage.tsx`): Parses XML into labeled sections  

Both states now support:
- `<GAP_ANALYSIS>`
- `<LOCAL_DIVERGENT>`
- `<LOCAL_CONVERGENT>`
- All other analysis section tags

## Testing

Test each XML tag during streaming:

- [ ] `<GAP_ANALYSIS>` → Shows "Gap Analysis" header
- [ ] `<LOCAL_DIVERGENT>` → Shows "Local Divergent" header
- [ ] `<LOCAL_CONVERGENT>` → Shows "Local Convergent" header
- [ ] `<PATIENT_CONTEXT>` → Shows "Patient Context" header
- [ ] `<CONVERGENT>` → Shows "Convergent Analysis" header
- [ ] `<DIVERGENT>` → Shows "Divergent Analysis" header
- [ ] `<RISK_ANALYSIS>` → Shows "Risk Analysis" header

## Status
✅ Fixed  
✅ All XML tags now supported during streaming  
✅ Consistent with completed state  
✅ Build successful  
