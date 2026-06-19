# Phase 2: Field Border UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-19
**Phase:** 2-field-border-ux
**Areas discussed:** Border trigger, Grey shade, Read-only fields, Border replacement vs additive

---

## Border Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| After server confirmation | Grey border appears once `field.inserted` is set via server response | ✓ |
| Client-side immediately | Grey border appears on click before server confirmation | |

**User's choice:** use recommended solutions
**Notes:** Recommended solution: use `field.inserted` server state. The `data-inserted` attribute on `FieldRootContainer` (field.tsx:118) is already set after server confirmation and provides a clean CSS integration point.

---

## Grey Shade

| Option | Description | Selected |
|--------|-------------|----------|
| ring-neutral-400 | Matches readOnly color, consistent "filled/done" visual language | ✓ |
| ring-gray-400 | Slightly lighter, less neutral | |

**User's choice:** use recommended solutions
**Notes:** Recommended solution: `ring-neutral-400`. The `readOnly` color in recipient-colors.ts already uses this shade, creating consistent visual language across all completed/filled field states.

---

## Read-Only Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Keep existing readOnly styling | Read-only fields retain `ring-neutral-400` from readOnly color — no change needed | ✓ |
| Apply "completed" border on top | Add additional border treatment for auto-signed read-only fields | |

**User's choice:** use recommended solutions
**Notes:** Recommended solution: Keep existing readOnly styling. Read-only fields (auto-signed via validation rules) already have `ring-neutral-400` via the `readOnly` color in recipient-colors.ts:24. They should NOT get a separate "completed" border since the readOnly style IS their completion state.

---

## Border Replacement vs Additive

| Option | Description | Selected |
|--------|-------------|----------|
| Replace recipient color | Grey border replaces the colorful ring entirely when completed | ✓ |
| Layer on top | Grey border adds over the existing recipient color | |

**User's choice:** use recommended solutions
**Notes:** Recommended solution: Grey border replaces the recipient color ring. When a field is completed, the colorful recipient ring disappears and neutral grey takes its place. When cleared, grey disappears and recipient color returns.

---

## the agent's Discretion

- CSS class application mechanism (inline conditional vs. computed class name vs. CSS variable) — left to planner to determine based on existing patterns

## Deferred Ideas

None — discussion stayed within phase scope.