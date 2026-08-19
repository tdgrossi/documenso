---
topic: Checkbox Grid Direction
commit: 6dbbb5b1f
objective: Add grid direction option for checkbox fields
files_changed:
  - apps/remix/app/components/forms/editor/editor-field-checkbox-form.tsx
  - apps/remix/app/components/general/document-signing/document-signing-checkbox-field.tsx
  - packages/lib/server-only/pdf/insert-field-in-pdf-v1.ts
  - packages/lib/types/field-meta.ts
  - packages/lib/universal/field-renderer/field-renderer.ts
  - packages/ui/primitives/document-flow/field-content.tsx
  - packages/ui/primitives/document-flow/field-items-advanced-settings/checkbox-field.tsx
---

# Checkbox Grid Direction

**Commit:** `6dbbb5b1f` — feat(document-fields): add grid direction option for checkbox fields
**Date:** 2026-08-14
**Author:** tdgrossi

## Objective

Add a "Grid" layout option for checkbox and radio fields, allowing items to be displayed in a 2-column CSS grid format instead of only vertical or horizontal layouts.

## Summary of Changes

This feature adds `grid` as a third option for the `direction` field in checkbox and radio field metadata. When selected, checkbox/radio items are arranged in a square-ish grid layout (columns = ceil(sqrt(itemCount))) for better space utilization.

## Files Changed

### 1. `packages/lib/types/field-meta.ts`

**Purpose:** Add `grid` to the direction enum for both checkbox and radio field types.

**Before:**
```typescript
direction: z.enum(['vertical', 'horizontal']).optional().default('vertical'),
```

**After:**
```typescript
direction: z.enum(['vertical', 'horizontal', 'grid']).optional().default('vertical'),
```

**Affected schemas:**
- `ZRadioFieldMeta` (line 150)
- `ZCheckboxFieldMeta` (line 168)

---

### 2. `apps/remix/app/components/forms/editor/editor-field-checkbox-form.tsx`

**Purpose:** Add "Grid" option to the direction Select dropdown in the checkbox field editor form.

**Change:** Added `<SelectItem value="grid">Grid</SelectItem>` after the Horizontal option (lines 179-181).

---

### 3. `packages/ui/primitives/document-flow/field-items-advanced-settings/checkbox-field.tsx`

**Purpose:** Update the CheckboxFieldAdvancedSettings component to support the grid direction option.

**Changes:**
- Updated `direction` state type from `'vertical' | 'horizontal'` to `'vertical' | 'horizontal' | 'grid'` (line 39)
- Updated `handleToggleChange` to properly cast direction value when 'grid' is selected (lines 42-48)
- Added `<SelectItem value="grid">Grid</SelectItem>` to the Select dropdown (lines 160-162)

---

### 4. `packages/ui/primitives/document-flow/field-content.tsx`

**Purpose:** Update field preview display to render grid layout when direction is 'grid'.

**Change:** Updated the conditional class logic for both checkbox and radio field rendering:

**Before:**
```typescript
field.fieldMeta.direction === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col gap-y-1'
```

**After:**
```typescript
field.fieldMeta.direction === 'horizontal'
  ? 'flex-row flex-wrap'
  : field.fieldMeta.direction === 'grid'
    ? 'grid grid-cols-2 gap-1'
    : 'flex-col gap-y-1'
```

**Affected sections:**
- Checkbox field rendering (lines 55-59)
- Radio field rendering (lines 76-80)

---

### 5. `apps/remix/app/components/general/document-signing/document-signing-checkbox-field.tsx`

**Purpose:** Update the document signing component to display checkboxes in grid layout.

**Change:** Updated the conditional class logic in two places (readonly and editable modes):

**Before:**
```typescript
parsedFieldMeta.direction === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col gap-y-1'
```

**After:**
```typescript
parsedFieldMeta.direction === 'horizontal'
  ? 'flex-row flex-wrap'
  : parsedFieldMeta.direction === 'grid'
    ? 'grid grid-cols-2 gap-1'
    : 'flex-col gap-y-1'
```

**Affected sections:**
- Readonly checkbox display (lines 257-261)
- Editable checkbox display (lines 295-299)

---

### 6. `packages/lib/universal/field-renderer/field-renderer.ts`

**Purpose:** Add grid layout calculation for canvas-based field rendering.

**Changes:**
- Updated `direction` type to include `'grid'` (line 134)
- Added new `if (direction === 'grid')` block (lines 193-228) that calculates:
  - `numColumns = Math.ceil(Math.sqrt(itemCount))`
  - `numRows = Math.ceil(itemCount / numColumns)`
  - Item width/height based on inner field dimensions divided by columns/rows
  - X/Y position based on column and row index
  - Special handling for radio button centering

**Grid algorithm:**
```typescript
const numColumns = Math.ceil(Math.sqrt(itemCount));
const numRows = Math.ceil(itemCount / numColumns);
const itemWidth = innerFieldWidth / numColumns;
const itemHeight = innerFieldHeight / numRows;
const col = itemIndex % numColumns;
const row = Math.floor(itemIndex / numColumns);
```

---

### 7. `packages/lib/server-only/pdf/insert-field-in-pdf-v1.ts`

**Purpose:** Add PDF output support for grid layout with even item distribution.

**Change:** Added new `else if (direction === 'grid')` block (lines 275-317) that:
- Calculates optimal column/row count using `Math.ceil(Math.sqrt(itemCount))`
- Distributes items evenly across the field area
- Creates checkboxes with proper positioning
- Draws labels next to each checkbox

**PDF grid algorithm:**
```typescript
const numColumns = Math.ceil(Math.sqrt(itemCount));
const numRows = Math.ceil(itemCount / numColumns);
const fieldWidth = pageWidth * (Number(field.width) / 100);
const fieldHeight = pageHeight * (Number(field.height) / 100);
const innerWidth = fieldWidth - leftCheckboxPadding * 2;
const itemWidth = innerWidth / numColumns;
const itemHeight = (fieldHeight - topPadding * 2) / numRows;
```

---

## Database Changes

None. This feature only adds a new enum value to an existing Zod schema. No Prisma migration required.

---

## UI Changes

### User Experience

1. **Editor Form:** When editing a checkbox or radio field, users can now select "Grid" from the Direction dropdown alongside existing "Vertical" and "Horizontal" options.

2. **Field Preview:** The field preview in the document flow shows items arranged in a 2-column grid when Grid is selected.

3. **Signing Experience:** Recipients see checkbox items displayed in a 2-column grid layout when the field is configured with Grid direction.

4. **PDF Output:** Generated PDFs distribute checkbox items evenly across the field area in a grid pattern.

### Visual Layout

- **Grid Layout:** Uses `grid grid-cols-2 gap-1` CSS classes for 2-column layout
- **Square-ish Grid:** Column count is calculated as `ceil(sqrt(itemCount))`, which produces a near-square grid for any number of items
  - 4 items → 2×2 grid
  - 6 items → 3×2 grid
  - 9 items → 3×3 grid

---

## Replication Steps

To apply this feature to a fresh clone:

### Prerequisites
```bash
git checkout 6dbbb5b1f
```

### Step-by-Step

1. **Update type definitions** in `packages/lib/types/field-meta.ts`:
   - Change `z.enum(['vertical', 'horizontal'])` to `z.enum(['vertical', 'horizontal', 'grid'])` in both `ZRadioFieldMeta` and `ZCheckboxFieldMeta` schemas

2. **Update field renderer** in `packages/lib/universal/field-renderer/field-renderer.ts`:
   - Add `'grid'` to the direction type union
   - Add grid layout calculation block with `numColumns = Math.ceil(Math.sqrt(itemCount))` algorithm

3. **Update PDF generation** in `packages/lib/server-only/pdf/insert-field-in-pdf-v1.ts`:
   - Add `else if (direction === 'grid')` block with even distribution algorithm

4. **Update UI components** to add grid CSS class:
   - `apps/remix/app/components/forms/editor/editor-field-checkbox-form.tsx` — add SelectItem for "Grid"
   - `apps/remix/app/components/general/document-signing/document-signing-checkbox-field.tsx` — add grid conditional class
   - `packages/ui/primitives/document-flow/field-content.tsx` — add grid conditional class for preview
   - `packages/ui/primitives/document-flow/field-items-advanced-settings/checkbox-field.tsx` — add SelectItem and update type

### Verification

1. Create a document with a checkbox field
2. Add multiple checkbox items (e.g., 4-6 items)
3. Set direction to "Grid"
4. Preview the field in the editor
5. Sign the document and verify grid layout in signing flow
6. Generate PDF and verify grid layout in output

---

## Technical Notes

- The grid layout uses `Math.ceil(Math.sqrt(itemCount))` to calculate columns, ensuring a near-square arrangement for any item count
- CSS grid is used (`grid-cols-2`) for consistent rendering across browsers
- PDF generation handles grid layout with proper coordinate calculations for the pdf-lib library
- The `field-renderer.ts` handles canvas-based rendering used in the field placement editor
