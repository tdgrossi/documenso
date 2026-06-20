# Phase 3: Completion Page Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-19
**Phase:** 03-completion-page-cleanup
**Areas discussed:** Logo retrieval approach, Header hiding, Logo placement, Success card

---

## Logo Retrieval Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Extend loadRecipientBrandingByTeamId | Add brandingLogo to RecipientBrandingPayload — keeps logo + CSS vars in one call | ✓ |
| Call getTeamSettings directly | Add a separate getTeamSettings call in complete.tsx loader | |
| Fetch via /api/branding.logo.team endpoint | Use existing API endpoint — same pattern as signing page | |

**User's choice:** Extend loadRecipientBrandingByTeamId
**Notes:** User clarified — no logo image rendering needed. Sender's brand is delivered via `RecipientBranding` CSS vars only.

---

## Header Hiding

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, hide header on complete | Add complete route to hideHeader — consistent with signing page UX | |
| No, keep header visible | Keep header — user might want to navigate away | |
| Hide only when canSignUp=false | Hide header when no sign-up panel shown (authenticated users) | |

**User's choice:** Hide only when canSignUp=false
**Notes:** User later clarified to remove sign-up panel entirely, making header hiding decision moot (header should be hidden for all complete page users).

---

## Logo Placement

Not discussed — user stopped the discussion after clarifying the overall approach.

## Success Card

Not discussed — user stopped the discussion after clarifying the overall approach.

---

## Final Clarification (User-Initiated)

**User:** "Lets remove the right side panel all together. I dont want users to signup through this page, nor is it necessary if user is loged in."

**Decision captured:**
- Remove entire right-side sign-up panel unconditionally
- Hide AuthenticatedHeader on complete route via `_layout.tsx` `hideHeader`
- No logo image rendering needed — `RecipientBranding` CSS vars already deliver sender's brand
- Keep download button and "Go Back Home" link

---

## the agent's Discretion

- Layout centering approach (CSS adjustments to flex-col centering) — standard Tailwind patterns acceptable

## Deferred Ideas

None

---
*Phase: 03-Completion Page Cleanup*
*Discussion log: 2026-06-19*
