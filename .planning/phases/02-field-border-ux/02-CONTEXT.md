# Phase 2: Field Border UX - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Completed signing fields (signature, date, text, initials, checkbox) display a neutral grey border to visually distinguish filled fields from empty fields. Clearing a completed field reverts its border to the default recipient color.
</domain>

<decisions>
## Implementation Decisions

### Border Trigger
- **D-01:** Border changes based on `field.inserted` — grey border appears after server confirmation (not client-side optimistic UI)
- **D-02:** The `data-inserted` attribute on `FieldRootContainer` (`field.tsx:118`) is the integration point for CSS-driven border change

### Grey Shade
- **D-03:** Use `ring-neutral-400` for completed fields — matches the existing `readOnly` color style in `recipient-colors.ts:24`, creating a consistent "filled/done" visual language
- **D-04:** Default border is `ring-gray-200` (from `FIELD_ROOT_CONTAINER_SHARED_CLASS_NAME` in `field-root-container-classes.ts:2`); completed border upgrades to `ring-neutral-400`

### Read-Only Fields
- **D-05:** Read-only fields (auto-signed via validation rules) retain their existing `ring-neutral-400` styling from the `readOnly` color in `recipient-colors.ts` — they should NOT get a separate "completed" border since the readOnly style IS their completion state

### Border Replacement vs Additive
- **D-06:** Grey border **replaces** the recipient color ring entirely when a field is completed — not layered on top
- **D-07:** When a field is cleared (un-signed), the grey border is removed and the recipient color ring returns

### Implementation Approach
- **D-08:** CSS attribute selector approach: `data-inserted="true"` on `FieldRootContainer` drives the border style change — no new React state needed
- **D-09:** All field types (signature, date, text, initials, checkbox) share the same border treatment — consistent visual language across field types
- **D-10:** Partial/in-progress fields (e.g., text field mid-typing) do NOT show grey border — only `field.inserted === true` triggers the change

### the agent's Discretion
The specific CSS class application mechanism (inline conditional vs. computed class name vs. CSS variable) is left to the planner to determine based on existing patterns in the codebase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Field Rendering System
- `packages/ui/components/field/field.tsx` — `FieldRootContainer` with `data-inserted` attribute (line 118), CSS class application via `FIELD_ROOT_CONTAINER_CLASS_NAME`
- `packages/ui/lib/field-root-container-classes.ts` — `FIELD_ROOT_CONTAINER_SHARED_CLASS_NAME` defines base border (`ring-gray-200`)
- `packages/ui/lib/recipient-colors.ts` — `readOnly` color uses `ring-neutral-400` (line 24), `getRecipientColorStyles` function
- `apps/remix/app/components/general/document-signing/document-signing-field-container.tsx` — `DocumentSigningFieldContainer` wraps `FieldRootContainer`, handles `onSign`/`onRemove` callbacks
- `apps/remix/app/components/general/document-signing/document-signing-signature-field.tsx` — Signature field implementation with `field.inserted` state
- `apps/remix/app/components/general/document-signing/document-signing-checkbox-field.tsx` — Checkbox field implementation with `field.inserted` state

### Requirements
- `.planning/REQUIREMENTS.md` — BORD-01, BORD-02, BORD-03 requirements
- `.planning/ROADMAP.md` — Phase 2 success criteria

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `FieldRootContainer` already renders with `data-inserted={field.inserted ? 'true' : 'false'}` — CSS can target this directly
- `FIELD_ROOT_CONTAINER_CLASS_NAME` contains `ring-gray-200` as default border — one place to understand the base state
- `getRecipientColorStyles('readOnly')` returns `ring-neutral-400` — reuse this shade, not a new one
- `DocumentSigningFieldContainer` passes `field` and handles `onSign`/`onRemove` — all field types flow through this container

### Established Patterns
- Recipient color rings use Tailwind `ring-*` utilities — grey completed border should also use `ring-*` for consistency
- Color change is driven by `field.inserted` boolean — same pattern used for conditional "Remove" button display (line 140 in `document-signing-field-container.tsx`)
- All field types (signature, date, text, initials, checkbox) use the same `FieldRootContainer` — one change covers all types

### Integration Points
- `FieldRootContainer` in `field.tsx` — primary modification point for border style
- `FIELD_ROOT_CONTAINER_SHARED_CLASS_NAME` in `field-root-container-classes.ts` — base border color
- Optional: `recipient-colors.ts` if adding a new color style is preferred over inline conditional classes

</codebase_context>

<specifics>
## Specific Ideas

- "Like the readOnly fields but for user-completed fields" — the `readOnly` color (`ring-neutral-400`) is the reference for the completed field grey shade
- No animations requested — "simple border color toggle only" per out-of-scope note in REQUIREMENTS.md
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Field Border UX*
*Context gathered: 2026-06-19*