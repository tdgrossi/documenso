# Roadmap: Documenso UX Fixes & Improvements

## Overview

Three targeted improvements to the Documenso signing experience: fixing the language cascade so recipients see the sender's language, adding visual completion state to signing fields via grey borders, and cleaning up the post-signing completion page to show only the sender's brand with a minimal success message.

## Phases

- [ ] **Phase 1: Language Cascade** - Recipient signing page displays UI in sender's language from document metadata
- [ ] **Phase 2: Field Border UX** - Completed signing fields show grey border; cleared fields revert
- [ ] **Phase 3: Completion Page Cleanup** - Post-signing page shows sender's logo with minimal success message

## Phase Details

### Phase 1: Language Cascade

**Goal**: Recipients see the signing page in the sender's chosen language
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: LANG-01, LANG-02
**Success Criteria** (what must be TRUE):

  1. Recipient visiting a signing page sees UI in the language set in documentMeta.language (not their browser locale)
  2. The HTML `lang` attribute on the signing page matches the document language
  3. Recipients whose browser locale differs from the document language still see the document language consistently
  4. Changing the document language and re-sending a signing link shows the new language on the signing page

**Plans**: TBD
**UI hint**: yes

Plans:

- *(Plans to be defined during phase planning)*

### Phase 2: Field Border UX

**Goal**: Users can visually distinguish completed signing fields from empty fields via border color
**Mode:** mvp
**Depends on**: Nothing (independent change)
**Requirements**: BORD-01, BORD-02, BORD-03
**Success Criteria** (what must be TRUE):

  1. After filling a field (signature, date, text, initials, checkbox) on the signing page, its border turns grey
  2. Clearing a completed field reverts its border to the default color
  3. All field types (signature, date, text, initials, checkbox) consistently show grey border when completed
  4. Partially filled fields (e.g., text field mid-typing) do not show grey border until explicitly completed

**Plans**: 1 plan
**UI hint**: yes
Plans:

- [ ] 02-01-PLAN.md — Add `ring-neutral-400!` conditional class to FieldRootContainer + Playwright E2E for BORD-01/02/03 across all 5 field types + visual smoke test

### Phase 3: Completion Page Cleanup

**Goal**: The post-signing page shows a minimal, branded success message with sender's identity
**Mode:** mvp
**Depends on**: Nothing (independent change)
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05
**Success Criteria** (what must be TRUE):

  1. Completion page displays the sender's user/organization logo (from branding settings) instead of Documenso logo
  2. The top ribbon/header bar is removed from the completion page
  3. The right-side sign-up panel and CTA are removed
  4. The page shows a clean success message with document status (signed/viewed/approved) and sender's logo
  5. The download button and "Go Back Home" link remain available for authenticated users

**Plans**: 2 plans
**UI hint**: yes

Plans:

- [ ] 03-01-PLAN.md — Hide AuthenticatedHeader via hideHeader + remove sign-up panel + center layout (COMP-02/03/04/05)
- [ ] 03-02-PLAN.md — Display sender's logo from branding settings on completion page (COMP-01)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Language Cascade | 0/TBD | Not started | - |
| 2. Field Border UX | 0/TBD | Not started | - |
| 3. Completion Page Cleanup | 0/TBD | Not started | - |
