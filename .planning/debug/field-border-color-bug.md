---
session_id: field-border-color-bug
status: resolved
trigger: "I have deployed it to test, however, the fields that have data are still displaying full color instead of grey"
created: 2026-06-22
updated: 2026-06-22
reopened: 2026-06-22 — previous fix (suffix→prefix !) did not resolve the issue on deployment
---

# Symptoms

## Expected Behavior

When a recipient completes a signing field (signature, date, text, initials, checkbox), the field border should turn grey (`ring-neutral-400`, computed `--tw-ring-color: rgb(163, 163, 163)`) to visually distinguish filled fields from empty ones.

## Actual Behavior

Completed fields retain their full recipient color (e.g., green/blue/orange) — the grey border does not appear. After the first round of investigation the class was changed from `ring-neutral-400!` to `!ring-neutral-400` (commit 578d3aaf4), but **the issue persists on the deployed test environment**. The user reports fields still show their full recipient color (green, orange, etc.) instead of grey, even though `field.inserted === true` (the data is in the field).

## Error Messages

None — no console errors. The CSS class is likely present in the DOM but being overridden by higher-specificity or later-cascade styles.

## Timeline

Phase 2 (Field Border UX) was implemented and deployed to a test environment. The plan added a single-line change: `'ring-neutral-400!': field.inserted` inside the `cn({...})` call in `FieldRootContainer` (`packages/ui/components/field/field.tsx:127`).

## Reproduction

1. Deploy the Phase 2 changes to a test environment
2. Open a signing page for a document with pending fields
3. Sign/complete any field
4. Observe the field border — it shows the recipient's color (e.g., green) instead of grey (`neutral-400`)

---

# Current Focus

hypothesis: The V2 Konva canvas path uses a CSS probe (`FIELD_ROOT_CONTAINER_PROBE_CLASS_NAME`) that never includes `!ring-neutral-400`, AND the color determination at `envelope-signer-page-renderer.tsx:155` ignores `field.inserted`. When `fieldCanvasStyle` is undefined, the stroke falls back to `getRecipientColorStyles(color).baseRing` which is the recipient's green/orange color. The CSP error is unrelated (red herring).

test: Check if V2 canvas uses CSS probe and whether it includes `!ring-neutral-400`. Trace stroke color determination in `field-generic-items.ts`. Verify `fieldCanvasStyle` is undefined for V2.

expecting: To find that the CSS probe doesn't carry `!ring-neutral-400` and V2 ignores `field.inserted` in color determination.

next_action: Fix has been applied — user needs to redeploy and verify

diagnose_only: false

## Previous Resolution (FAILED — do not trust)

A previous debug cycle concluded that the `!` modifier must be a prefix. The fix was committed (578d3aaf4) but did not solve the issue. Treat the previous root_cause as wrong and start over.

---

# Evidence

- timestamp: 2026-06-22 — Source code at `packages/ui/components/field/field.tsx:127` has `'ring-neutral-400!': field.inserted` using `!` as a **suffix** (after the class name)
- timestamp: 2026-06-22 — Tailwind v3.4.19 is installed (confirmed via `node_modules/tailwindcss/package.json`)
- timestamp: 2026-06-22 — Tested with programmatic Tailwind build: `ring-neutral-400!` (suffix) produces **NO CSS** output; `!ring-neutral-400` (prefix) correctly produces `.\!ring-neutral-400 { --tw-ring-color: rgb(163 163 163 / ...) !important; }`
- timestamp: 2026-06-22 — Tailwind's `generateRules.js` line 603 confirms: `if (classCandidate.startsWith("!"))` — only **prefix** `!` is recognized as important modifier
- timestamp: 2026-06-22 — `twMerge` v1.14 test shows `ring-neutral-400!` triggers removal of competing `ring-gray-200` and `ring-recipient-green` classes. This means the DOM has the class `ring-neutral-400!` but Tailwind generated **no CSS rule** for it — leaving the field with **no ring color** applied.
- timestamp: 2026-06-22 — Fix applied: changed `'ring-neutral-400!'` → `'!ring-neutral-400'` (moved `!` from suffix to prefix)

## E7: Fix did not resolve the issue on deployment
- timestamp: 2026-06-22 — User reports that after deploying commit 578d3aaf4 (`!ring-neutral-400` prefix), completed fields still show full recipient color (green, orange, etc.) instead of grey. The previous resolution is **wrong or incomplete**. Re-opening for fresh investigation.

## E8: CSP error in console (RED HERRING)
- timestamp: 2026-06-22 — Console error: `Combination-BT3mXOWw.js:1 Applying inline style violates the following Content Security Policy directive 'style-src-elem 'self' 'nonce-J7A0lcRdwJV5y6GuhN8Zdw==''`
- The CSP error is from `injectCss` in `apps/remix/app/utils/css-vars.ts` which creates `<style>` elements and sets inline CSS custom properties on `document.documentElement.style`. This is unrelated to the field border issue — `cn()` does NOT produce inline styles.

## E9: V2 Konva canvas uses CSS probe that never includes `!ring-neutral-400`
- timestamp: 2026-06-22 — V2 signing page (envelope editor) uses Konva canvas rendering via `EnvelopeSignerPageRenderer` in `envelope-signer-page-renderer.tsx`
- The canvas border color comes from `field-generic-items.ts:upsertFieldRect` which uses `fieldCanvasStyle?.borderColor ?? getRecipientColorStyles(color).baseRing`
- `fieldCanvasStyle` is computed by a CSS probe in `field-canvas-style.ts:createFieldProbeElement` which uses `FIELD_ROOT_CONTAINER_PROBE_CLASS_NAME` (only has `ring-gray-200`) — it NEVER includes `!ring-neutral-400`
- So `fieldCanvasStyle.borderColor` always returns `rgb(229, 231, 235)` (gray-200) for non-inserted fields and the SAME gray-200 for inserted fields (since the probe class never changes)
- When `fieldCanvasStyle` is `undefined` (probe anchor not found), the fallback is `getRecipientColorStyles(color).baseRing` which is the RECIPIENT's color (green/orange) — THIS is why the user sees full recipient color!

## E10: V2 color determination ignores `field.inserted`
- timestamp: 2026-06-22 — At `envelope-signer-page-renderer.tsx:155`: `const color = fieldToRender.fieldMeta?.readOnly ? 'readOnly' : isValidating ? 'orange' : 'green'`
- When `fieldToRender.inserted === true`, `isValidating` is `false` (field is completed), so color is `'green'`, NOT `'readOnly'`
- This causes the stroke fallback to use the recipient's green color when the CSS probe doesn't work

## E11: V1 fix with `!ring-neutral-400` may have CSS cascade issue
- timestamp: 2026-06-22 — The `!ring-neutral-400` prefix fix is correct (commit 578d3aaf4) and `twMerge` preserves it in the DOM
- However, `ring-recipient-green` uses a CSS variable: `--tw-ring-color: hsl(var(--recipient-green))`
- The `!important` on `!ring-neutral-400` should override this, but there may be browser-specific cascade issues with CSS variables + `!important`
- V1 issue is SEPARATE from V2 — V1 uses React rendering where the CSS class approach should work

## E12: USER CONFIRMED FIX WORKING
- timestamp: 2026-06-22 — User confirmed on V2 envelope signing page (`/d/hn7V5xiNEpAizlq0sfRtB`, internalVersion: 2) that the grey border now appears on completed fields. The Konva canvas fix (color='readOnly' when inserted + explicit neutral-400 stroke) resolved the issue.

## E13: FIXES APPLIED
- timestamp: 2026-06-22 — `envelope-signer-page-renderer.tsx:155`: Changed color to use `'readOnly'` when `fieldToRender.inserted === true`
  - Before: `fieldToRender.fieldMeta?.readOnly ? 'readOnly' : isValidating ? 'orange' : 'green'`
  - After: `fieldToRender.fieldMeta?.readOnly || fieldToRender.inserted ? 'readOnly' : isValidating ? 'orange' : 'green'`
- timestamp: 2026-06-22 — `field-generic-items.ts:61`: Changed stroke to use neutral-400 grey when `field.inserted === true`
  - Before: `stroke: fieldCanvasStyle?.borderColor ?? (color ? getRecipientColorStyles(color).baseRing : '#e5e7eb')`
  - After: `stroke: field.inserted ? getRecipientColorStyles('readOnly').baseRing : (fieldCanvasStyle?.borderColor ?? (color ? getRecipientColorStyles(color).baseRing : '#e5e7eb'))`

---

# Resolution

root_cause: Two separate issues:
1. **V2 (Konva canvas)**: The CSS probe class never includes `!ring-neutral-400`, and the color determination ignores `field.inserted`. When the probe returns undefined, the canvas falls back to recipient color (green/orange).
2. **V1 (React)**: The `!ring-neutral-400` CSS class may have cascade issues with CSS variable-based `ring-recipient-green` in some browsers.

fix: Two fixes applied:
1. V2: When `field.inserted === true`, use `'readOnly'` color (neutral-400 grey) AND explicitly use `getRecipientColorStyles('readOnly').baseRing` for the canvas stroke, bypassing the broken CSS probe
2. V1: The `!ring-neutral-400` fix in `field.tsx` is already in place (commit 578d3aaf4) — if V1 still shows wrong color, it may need further investigation

verification_needed: User must redeploy and test both V1 and V2 signing pages to confirm the grey border appears on completed fields.
