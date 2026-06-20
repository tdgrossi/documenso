# Phase 3: Completion Page Cleanup - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Simplify the post-signing completion page by removing the right-side sign-up panel and the top header ribbon, keeping only the sender's branding (CSS vars) and a centered success message with download/go-home actions.
</domain>

<decisions>
## Implementation Decisions

### UI Simplification
- **D-01:** Remove the entire right-side sign-up panel (`canSignUp` conditional block in complete.tsx lines 283-297) — no sign-up CTA for anyone
- **D-02:** Hide the AuthenticatedHeader on the `/sign/$token/complete` route by adding it to `hideHeader` in `_recipient+/_layout.tsx`
- **D-03:** No logo image rendering needed — sender's brand is already delivered via `RecipientBranding` CSS vars (from `loadRecipientBrandingByTeamId`)

### Layout
- **D-04:** Center the success content area when sign-up panel is gone — remove the `canSignUp` conditional layout wrappers and center the remaining content
- **D-05:** Keep `RecipientBranding` component call — it applies sender's CSS vars/colors without any changes needed
- **D-06:** Keep download button and "Go Back Home" link (COMP-05) — these are already gated behind `user` check

### Behavior
- **D-07:** No changes to `canSignUp` logic needed in loader — it remains for potential future use but is not rendered
- **D-08:** No changes to loader data returned — `canSignUp` can stay in loaderData, just don't render it in UI

### the agent's Discretion
- Layout centering approach (CSS adjustments to `flex-col` centering) — standard Tailwind patterns acceptable
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Signing Route Structure
- `apps/remix/app/routes/_recipient+/_layout.tsx` — Recipient layout with `hideHeader` logic
- `apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx` — Completion page (full file to understand current structure)
- `apps/remix/app/components/general/recipient-branding.tsx` — Existing branding component already used on complete page

### Branding
- `packages/lib/server-only/branding/load-recipient-branding.ts` — Returns CSS vars/colors; `brandingLogo` not needed for this phase
- `packages/lib/server-only/team/get-team-settings.ts` — Source of team/org branding settings

### Requirements (full)
- `.planning/REQUIREMENTS.md` — COMP-01 through COMP-05 (COMP-01/02/03 addressed by this phase)
- `.planning/ROADMAP.md` §Phase 3 — Success criteria for completion page

### Patterns
- `.planning/PROJECT.md` §Key Decisions — "Completion page uses sender's org/user logo" (via CSS vars, not image)
</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `RecipientBranding` component already on complete page — applies sender CSS vars, no changes needed
- `SigningCard3D` already shows recipient name/signature — keeps it
- `EnvelopeDownloadDialog` already handles download button — keeps it
- `DocumentShareButton` already present — keeps it

### Established Patterns
- Conditional rendering via `ts-pattern` (`match`) for status displays
- `RecipientBranding` used across all recipient routes (`complete.tsx`, `waiting.tsx`, `rejected.tsx`, `expired.tsx`)
- Loader returns `{ branding }` via `loadRecipientBrandingByTeamId`

### Integration Points
- `_layout.tsx` `hideHeader` — needs `complete` route added
- `complete.tsx` — remove right panel JSX, adjust layout centering
</codebase_context>

<specifics>
## Specific Ideas

- Center success content: remove `canSignUp` conditional wrappers (`mt-0 flex-col divide-y overflow-hidden pt-6 md:pt-16 lg:flex-row lg:divide-x lg:divide-y-0 lg:pt-20 xl:pt-24`) and use simple centered layout
- Remove lines 283-297 (the entire `{canSignUp && (...)}` block) from complete.tsx
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

---
*Phase: 03-Completion Page Cleanup*
*Context gathered: 2026-06-19*
