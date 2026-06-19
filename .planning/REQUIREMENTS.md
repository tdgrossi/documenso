# Requirements: Documenso UX Fixes & Improvements

**Defined:** 2026-06-19
**Core Value:** Recipients have a seamless, branded signing experience regardless of where the sender is from or what interface they're using.

## v1 Requirements

### Language Cascade

- [ ] **LANG-01**: Recipient signing page displays UI in the sender's language (from documentMeta.language) instead of recipient's browser locale
- [ ] **LANG-02**: Language is read from document metadata on the signing route loader and used to set the HTML lang attribute and activate the correct Lingui catalog

### Field Border UX

- [ ] **BORD-01**: Completed fields (signature, date, text, initials, checkbox) display grey border to indicate filled state
- [ ] **BORD-02**: Clearing a completed field reverts its border to the default color
- [ ] **BORD-03**: Border change applies to all field types consistently

### Completion Page

- [ ] **COMP-01**: Completion page displays the sender's user/org logo (from branding settings) instead of Documenso branding
- [ ] **COMP-02**: Remove the top ribbon/header from the completion page
- [ ] **COMP-03**: Remove the right-side sign-up panel and CTA
- [ ] **COMP-04**: Show a minimal success message: document signed/viewed/approved status with sender's logo
- [ ] **COMP-05**: Keep the download button and "Go Back Home" link for authenticated users

## v2 Requirements

None.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Embed/v1/v2 completion pages | Only the main `_recipient+/sign.$token+/complete` route |
| Custom redirect URL changes | Existing redirectUrl in documentMeta already works, not changing |
| Document-level language picker on signing page | Sender sets language once when creating/sending |
| Completion page custom logo upload UI | Logo comes from existing user/org branding settings |
| Field border animations | Simple border color toggle only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LANG-01 | — | Pending |
| LANG-02 | — | Pending |
| BORD-01 | — | Pending |
| BORD-02 | — | Pending |
| BORD-03 | — | Pending |
| COMP-01 | — | Pending |
| COMP-02 | — | Pending |
| COMP-03 | — | Pending |
| COMP-04 | — | Pending |
| COMP-05 | — | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 0
- Unmapped: 10 ⚠️

---
*Requirements defined: 2026-06-19*
*Last updated: 2026-06-19 after initial definition*
