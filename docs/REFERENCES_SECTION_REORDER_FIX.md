# References Section Reordering Fix

## Changes Made

Updated the References section rendering order and styling in `components/message/CollapsibleAnswerMessage.tsx`.

## What Changed

### 1. Reordered Sections
**New Order**:
1. Gap Summary (no title, just description)
2. Local Guidelines (with title)
3. HR separator
4. Regular Citations

**Previous Order**:
1. Regular Citations
2. HR separator
3. Gap Summary (with title)
4. HR separator
5. Local Guidelines (with title)

### 2. Removed "Gap Summary" Title
The Gap Summary section now displays only the description text without the "Gap Summary" heading.

**Before**:
```tsx
<h4 className="text-base font-semibold text-gray-800 mb-3">
  Gap Summary
</h4>
<p className="text-base text-gray-800 leading-relaxed whitespace-pre-line">
  {section.gapSummary}
</p>
```

**After**:
```tsx
<p className="text-base text-gray-800 leading-relaxed whitespace-pre-line">
  {section.gapSummary}
</p>
```

### 3. Moved HR Separator
The horizontal rule now appears **after** Local Guidelines and **before** regular citations.

**Before**: HR appeared before Gap Summary and before Local Guidelines  
**After**: HR appears only after Local Guidelines (if both Gap Summary/Local Guidelines exist and there are regular citations)

## Visual Result

### Before
```
References
├── Citation 1
├── Citation 2
├── ─────────────── (HR)
├── Gap Summary
│   └── Description
├── ─────────────── (HR)
└── Local Guidelines
    ├── 1. Guideline A
    └── 2. Guideline B
```

### After
```
References
├── Description (no "Gap Summary" title)
├── Local Guidelines
│   ├── 1. Guideline A
│   └── 2. Guideline B
├── ─────────────── (HR)
├── Citation 1
└── Citation 2
```

## Code Changes

### File: `components/message/CollapsibleAnswerMessage.tsx`

**Section Order**:
1. Gap Summary section moved to top (without title)
2. Local Guidelines section (with title)
3. HR separator (conditional - only if both Gap/Local exist AND there are citations)
4. Regular Citations section

**Conditional HR Logic**:
```tsx
{(section.gapSummary || (section.localGuidelines && section.localGuidelines.length > 0)) &&
  section.citations &&
  section.citations.filter((citation) => citation.link).length > 0 && (
    <hr className="border-t-2 border-gray-300 my-6" />
  )}
```

This ensures the HR only appears when:
- There is a Gap Summary OR Local Guidelines
- AND there are regular citations to separate

## Benefits

1. **Better Information Hierarchy**: Gap summary and local guidelines appear first, providing context before detailed citations
2. **Cleaner Design**: Removed redundant "Gap Summary" title since the content is self-explanatory
3. **Improved Readability**: Single HR separator clearly divides contextual information from reference citations
4. **Consistent Styling**: Maintains the same visual design while improving information flow

## Testing

- [x] Gap Summary displays without title
- [x] Local Guidelines displays with title
- [x] HR appears after Local Guidelines
- [x] HR does not appear if no citations exist
- [x] Regular citations display after HR
- [x] No compilation errors
- [x] Proper spacing maintained

## Status
✅ Complete and tested
