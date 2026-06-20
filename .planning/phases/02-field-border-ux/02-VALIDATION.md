---
phase: 2
slug: field-border-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-19
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.56.1 (E2E only — `packages/app-tests/`) |
| **Config file** | `packages/app-tests/playwright.config.ts` |
| **Quick run command** | `npm run test:dev -w @documenso/app-tests` |
| **Full suite command** | `npm run test:e2e` |
| **Estimated runtime** | ~30s per spec, full suite several minutes |

---

## Sampling Rate

- **After every task commit:** `npm run lint` (Biome catches unused classes / format issues)
- **After every plan wave:** `npx tsc --noEmit -p packages/ui` (type-check only the touched package)
- **Phase gate:** Full E2E suite green before `/gsd-verify-work`
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | BORD-01 | — | N/A (pure visual) | unit-lint | `npm run lint` | ✅ | ⬜ pending |
| 02-01-02 | 01 | 1 | BORD-01, BORD-03 | — | N/A | unit-tsc | `npx tsc --noEmit -p packages/ui` | ✅ | ⬜ pending |
| 02-02-01 | 02 | 1 | BORD-01, BORD-02, BORD-03 | — | N/A | e2e | `npm run test:dev -w @documenso/app-tests -- field-border-ux` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/app-tests/e2e/field-border-ux.spec.ts` — stubs for BORD-01, BORD-02, BORD-03 covering all 5 field types (signature, date, text, initials, checkbox)
- [ ] No framework install needed (Playwright already present)
- [ ] No new fixtures needed (use existing signing-page fixtures from `packages/app-tests/e2e/envelope-editor-v2/` or `auth-action.spec.ts`)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Grey border visually reads as "completed" on `DocumentReadOnlyFields` surfaces (document view page for a signed document) | BORD-01 | Side effect across 6 unrelated UIs; visual judgment required | Open a signed document's view page in dev mode and confirm `ring-neutral-400` border on completed fields looks acceptable |
| Tailwind cascade actually applies `ring-neutral-400` over `ring-gray-200` | BORD-01 | Computed style requires DevTools inspection | Inspect a completed field in browser DevTools: `getComputedStyle(el).getPropertyValue('--tw-ring-color')` should equal `163, 163, 163` (#a3a3a3) |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending