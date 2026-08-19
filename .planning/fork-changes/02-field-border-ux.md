---
topic: Field Border UX
commits:
  - e400a11b9
  - ccd1665ef
  - 578d3aaf4
  - 8d2fc8918
objective: Fix completed field borders to show neutral-400 grey styling
files_changed:
  - packages/ui/components/field/field.tsx
  - apps/remix/app/components/general/envelope-signing/envelope-signer-page-renderer.tsx
  - packages/lib/universal/field-renderer/field-generic-items.ts
---

# Field Border UX

**Analysis Date:** 2026-08-14

## Overview

Completed (inserted) document fields should display a neutral grey border (`neutral-400` / `#a3a3a3`) instead of the recipient's assigned color (green/orange). This change affects both the HTML rendering path (React components) and the V2 Konva canvas rendering path (envelope editor).

## Objective

When a field has `field.inserted === true`, the field border should render in `neutral-400` grey to indicate the field has been completed/signed, distinguishing it from pending fields that use the recipient's assigned color.

## Files Changed

### 1. `packages/ui/components/field/field.tsx`

**Purpose:** HTML rendering path for field containers

**Change:** Added `!ring-neutral-400` conditional class when `field.inserted === true`

```typescript
// Before (line 127):
'ring-orange-300': isValidating && isFieldUnsignedAndRequired(field),

// After (line 127):
'ring-orange-300': isValidating && isFieldUnsignedAndRequired(field),
'!ring-neutral-400': field.inserted,
```

**Why `!ring-neutral-400` prefix:**
- Tailwind v3 requires `!` prefix for `!important` modifiers (`!ring-neutral-400`)
- Suffix syntax (`ring-neutral-400!`) is silently ignored by the content scanner and generates no CSS
- The `!important` ensures the grey border takes precedence over recipient color classes

---

### 2. `apps/remix/app/components/general/envelope-signing/envelope-signer-page-renderer.tsx`

**Purpose:** V2 Konva canvas rendering - determines field color for canvas stroke

**Change:** Modified color determination logic to include `field.inserted` state

```typescript
// Before (line 155-156):
const color = fieldToRender.fieldMeta?.readOnly ? 'readOnly' : isValidating ? 'orange' : 'green';

// After (line 155-156):
const color =
  fieldToRender.fieldMeta?.readOnly || fieldToRender.inserted ? 'readOnly' : isValidating ? 'orange' : 'green';
```

**Why this fix was needed:**
- The CSS probe (`FIELD_ROOT_CONTAINER_PROBE_CLASS_NAME`) only had `ring-gray-200` and never included `!ring-neutral-400` for inserted fields
- So `borderColor` always read `gray-200` regardless of field state
- The renderer was ignoring `field.inserted` when determining color, causing completed fields to still get `color='green'`
- When `fieldCanvasStyle` is undefined (probe anchor not found), stroke falls back to `getRecipientColorStyles(color).baseRing` which is the recipient's green/orange color

---

### 3. `packages/lib/universal/field-renderer/field-generic-items.ts`

**Purpose:** V2 Konva canvas - sets stroke color for field rectangles

**Change:** Explicitly use `getRecipientColorStyles('readOnly').baseRing` when `field.inserted === true`

```typescript
// Before (line 61-63):
stroke: fieldCanvasStyle?.borderColor ?? (color ? getRecipientColorStyles(color).baseRing : '#e5e7eb'),

// After (line 61-63):
stroke: field.inserted
  ? getRecipientColorStyles('readOnly').baseRing
  : (fieldCanvasStyle?.borderColor ?? (color ? getRecipientColorStyles(color).baseRing : '#e5e7eb')),
```

**Why this fix was needed:**
- The CSS probe approach was broken for the canvas path (probe anchor not found in canvas context)
- By explicitly checking `field.inserted` and using `readOnly` color, we bypass the broken CSS probe
- `getRecipientColorStyles('readOnly').baseRing` returns the neutral-400 grey value

---

## Technical Explanation

### Two Rendering Paths

1. **HTML Path** (`FieldRootContainer` in `packages/ui/components/field/field.tsx`):
   - Uses CSS classes with `cn()` utility for conditional styling
   - The `!ring-neutral-400` class applies a grey ring via Tailwind `!important`
   - Works because CSS class evaluation happens in the DOM

2. **Canvas Path** (`EnvelopeSignerPageRenderer` + `field-generic-items.ts`):
   - Uses Konva.js to render fields on an HTML5 canvas
   - Cannot use CSS classes - must explicitly set canvas stroke color
   - The color determination in the renderer (`envelope-signer-page-renderer.tsx`) now checks `field.inserted`
   - The stroke assignment (`field-generic-items.ts`) explicitly uses `getRecipientColorStyles('readOnly').baseRing` for inserted fields

### Root Cause

The CSS probe mechanism (reading computed styles via `FIELD_ROOT_CONTAINER_PROBE_CLASS_NAME`) was failing because:
- The probe element only contained `ring-gray-200` classes
- It never included `!ring-neutral-400` for inserted fields
- Therefore `borderColor` always read `gray-200` regardless of actual field state

### Color Flow

```
field.inserted = true
    ↓
FieldRootContainer: cn() adds '!ring-neutral-400' → grey ring on HTML
    ↓
EnvelopeSignerPageRenderer: color = 'readOnly' → pass to renderField()
    ↓
field-generic-items.ts: stroke = getRecipientColorStyles('readOnly').baseRing → grey stroke on canvas
```

---

## Replication Steps

To apply this fix to a fresh clone:

### Step 1: Add CSS class for HTML path

**File:** `packages/ui/components/field/field.tsx`

In the `FieldRootContainer` component's `cn()` call (around line 120-130), add the conditional class:

```typescript
'!ring-neutral-400': field.inserted,
```

Place it after the `ring-orange-300` validation class. Ensure the `!` prefix is used (not suffix).

### Step 2: Fix color determination for canvas path

**File:** `apps/remix/app/components/general/envelope-signing/envelope-signer-page-renderer.tsx`

Around line 155, update the color assignment:

```typescript
const color =
  fieldToRender.fieldMeta?.readOnly || fieldToRender.inserted ? 'readOnly' : isValidating ? 'orange' : 'green';
```

### Step 3: Fix stroke assignment for canvas path

**File:** `packages/lib/universal/field-renderer/field-generic-items.ts`

In the `upsertFieldRect` function (around line 61), update the stroke assignment:

```typescript
stroke: field.inserted
  ? getRecipientColorStyles('readOnly').baseRing
  : (fieldCanvasStyle?.borderColor ?? (color ? getRecipientColorStyles(color).baseRing : '#e5e7eb')),
```

---

## Related Files

| File | Purpose |
|------|---------|
| `packages/ui/lib/field-root-container-classes.ts` | Defines `FIELD_ROOT_CONTAINER_CLASS_NAME` constant |
| `packages/ui/lib/recipient-colors.ts` | Defines `getRecipientColorStyles()` function returning color tokens |
| `packages/lib/universal/getRecipientColorStyles.ts` | Universal version of color styles getter |

## Verification

After applying these changes:

1. **HTML Path:** Open a document signing page, complete a field, observe the border changes from recipient color to grey (`neutral-400`)

2. **Canvas Path (V2):** Open the envelope editor V2, complete a field, observe the canvas border changes to grey

3. **CSS Generation:** Run `grep -r "!ring-neutral-400" packages/` to confirm the class is being generated by Tailwind
