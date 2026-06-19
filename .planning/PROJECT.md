# Documenso — UX Fixes & Improvements

## What This Is

Documenso is an open-source document signing platform. This project delivers three targeted improvements: fixing the language cascade bug (sender's language not used for recipients), improving field border UX for completed fields, and simplifying the post-signing completion page.

## Core Value

Recipients have a seamless, branded signing experience regardless of where the sender is from or what interface they're using.

## Requirements

### Validated

- ✓ Document creation, sending, and signing workflows — existing
- ✓ User/organization language settings — existing
- ✓ Document-level language setting (via documentMeta.language) — existing
- ✓ Field rendering on signing pages (signature, date, text, initials, checkbox) — existing
- ✓ Branding system (RecipientBranding, team logos) — existing
- ✓ i18n with Lingui.js, per-user/org language preference — existing

### Active

- [ ] **LANG-01**: Recipient signing page uses sender's language (from documentMeta.language) instead of recipient's browser locale
- [ ] **BORD-01**: Completed signing fields display grey border; cleared fields revert to default border color
- [ ] **COMP-01**: Completion page shows only sender's user/org logo + success message — no Documenso branding, top ribbon, or sign-up panel

### Out of Scope

- Custom completion page redirect (user already has redirectUrl in documentMeta) — existing feature, not changing
- Document-level language picker on the signing page — sender sets it once
- Embed/v1/v2 completion pages — only the main `_recipient+` route

## Context

The codebase is a TypeScript monorepo (npm workspaces + Turborepo) using React Router v7, Prisma, tRPC, and Lingui.js for i18n. The signing page locale is currently determined by the recipient's browser `Accept-Language` header or cookie (`root.tsx`), not the sender's document language stored in `documentMeta.language`. The completion page at `_recipient+/sign.$token+/complete.tsx` currently shows Documenso branding, a sign-up CTA panel, and a full header ribbon.

## Constraints

- **Tech stack**: TypeScript, React Router v7, Prisma, tRPC, Lingui.js, Tailwind CSS — must match existing conventions
- **i18n**: Lingui.js (`@lingui/core`, `@lingui/react`, `@lingui/detect-locale`) — translations use `<Trans>` and `t\`\`` macros
- **Design system**: Shadcn UI + Radix primitives + Tailwind — use `cn()` utility for class merging
- **Monorepo structure**: Changes should follow domain-oriented vertical slice pattern

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Completion page uses sender's org/user logo | Branded minimal approach — user wants their own brand, not Documenso's | — Pending |
| Language cascade via documentMeta.language | Already stored per-document at send time; just needs to be read in signing route | — Pending |
| All field types get grey border on complete | Consistent UX across signature, date, text, initials, checkbox | — Pending |

---
*Last updated: 2026-06-19 after initialization*
