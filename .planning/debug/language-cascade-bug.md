---
session_id: language-cascade-bug
status: root_cause_found
trigger: Language cascade bug — recipients see signing page in their own browser locale instead of the sender's language stored in documentMeta.language
created: 2026-06-20
updated: 2026-06-20
---

# Symptoms

## Expected Behavior

When a sender creates a document with a language set (e.g., French) in `documentMeta.language`, recipients visiting the signing page should see the UI in that sender-chosen language — regardless of their own browser/OS locale.

## Actual Behavior

The signing page (`_recipient+/sign.$token+/`) uses the recipient's browser `Accept-Language` header (detected in `root.tsx`) to determine the UI language. The `documentMeta.language` value stored on the document is ignored during the signing flow.

## Error Messages

None — this is a functional/logic bug, not a crash. The app renders without errors but in the wrong locale.

## Timeline

This is a pre-existing design gap. The `documentMeta.language` field exists and is populated at document send time, but the signing route loader never reads or applies it.

## Reproduction

1. Create and send a document with language set to "fr" (French)
2. Open the signing link in a browser whose `Accept-Language` is "en" (English)
3. The signing page renders in English (browser locale) instead of French (sender's language)
4. The HTML `lang` attribute also reflects the browser locale rather than the document language

---

# Current Focus

hypothesis: The signing route loader does not read `documentMeta.language` or pass it to the i18n activation logic; `root.tsx` and/or the signing loader only uses the browser's `Accept-Language` / cookie to set locale.
test: Inspect the signing route loader and i18n locale determination in `root.tsx` and signing-specific layouts/loaders
expecting: To find that `documentMeta.language` is available in the database but never consulted during locale resolution for the signing page
next_action: root cause confirmed — document findings
reasoning_checkpoint: null
diagnose_only: true

---

# Evidence

## E1: Locale resolution in entry.server.tsx ignores documentMeta
- timestamp: 2026-06-20
- file: apps/remix/app/entry.server.tsx (lines 24-28)
- finding: Language is resolved cookie-first, then Accept-Language header. `dynamicActivate(language)` runs before any route loaders execute. Document metadata is never consulted.

## E2: Locale resolution in root.tsx loader ignores documentMeta
- timestamp: 2026-06-20
- file: apps/remix/app/root.tsx (lines 52-56)
- finding: Identical logic to entry.server.tsx: `langCookie.parse(cookieHeader)` → `extractLocaleData({ headers }).lang` fallback. The `lang` is returned in loader data, used for `<html lang={lang}>` attribute. No document context available at this level.

## E3: Recipient _layout.tsx has no loader
- timestamp: 2026-06-20
- file: apps/remix/app/routes/_recipient+/_layout.tsx
- finding: The recipient layout has no `loader` function, so it cannot override the root-level `lang`. It only provides UI shell (header hiding for signing routes).

## E4: documentMeta.language IS available in V2 signing loader but unused
- timestamp: 2026-06-20
- file: packages/lib/server-only/envelope/get-envelope-for-recipient-signing.ts (lines 41-52)
- finding: `ZEnvelopeForSigningResponse` schema explicitly picks `language: true` from DocumentMeta. The `handleV2Loader` receives `envelope.documentMeta.language` in the response. It is never read nor passed to any i18n mechanism.

## E5: documentMeta.language IS available in V1 signing loader but unused
- timestamp: 2026-06-20
- file: packages/lib/server-only/document/get-document-by-token.ts (line 86)
- finding: `getDocumentAndSenderByToken` includes `documentMeta: true` in the Prisma query. The `handleV1Loader` receives `document.documentMeta` (full object with `language`). It is never read for locale purposes.

## E6: Main signing loader does not extract or propagate language
- timestamp: 2026-06-20
- file: apps/remix/app/routes/_recipient+/sign.$token+/_index.tsx (lines 328-386)
- finding: The main `loader` dispatches to V1/V2 handlers and returns `{ version, payload, branding }`. Neither the V1 nor V2 payload is inspected for `documentMeta.language`. No `lang` cookie is set. No `dynamicActivate` call is made from the signing components.

## E7: Signing page components never call dynamicActivate for document language
- timestamp: 2026-06-20
- file: apps/remix/app/routes/_recipient+/sign.$token+/_index.tsx (lines 388-587)
- finding: Both `SigningPageV1` and `SigningPageV2` receive data containing `documentMeta.language` but never call `dynamicActivate()`. Compare with embed signing pages (embed-document-signing-page-v1.tsx line 226, embed-document-signing-page-v2.tsx line 165) which DO call `dynamicActivate(data.language)` — though from embed hash data, not documentMeta.

## E8: langCookie scope is global, not signing-route-specific
- timestamp: 2026-06-20
- file: apps/remix/app/storage/lang-cookie.server.ts
- finding: `langCookie` has `path: '/'` and `maxAge: 2 years`. The signing loader could set this cookie to `documentMeta.language` to fix subsequent visits, but no code does so.

---

# Resolution

## ROOT CAUSE FOUND

**Specialist hint:** typescript

**Summary:**
The locale resolution pipeline has two independent entry points (`entry.server.tsx` for SSR and `root.tsx` loader for the HTML `lang` attribute + client hydration) that both use an identical two-step fallback: (1) read `lang` cookie → (2) parse `Accept-Language` header. Neither consults `documentMeta.language`.

The signing page loaders (both V1 and V2) have full access to `documentMeta.language` through their database queries but never:
1. Set the `lang` cookie so subsequent requests use the document's language
2. Call `dynamicActivate(documentMeta.language)` client-side to switch the i18n catalog on first visit
3. Return `lang` in their payload for the root layout to discover via `useMatches()`

**Evidence confirms hypothesis:** `documentMeta.language` is available in the database (loaded via `getEnvelopeForRecipientSigning` / `getDocumentAndSenderByToken`) and flows into the signing loader payload, but is never consumed by any language resolution pathway.

**Fix direction:** Two-part fix needed:
1. **Server-side (cookie):** Set `lang` cookie to `documentMeta.language` in the signing loader response headers (fixes SSR on subsequent visits)
2. **Client-side (dynamicActivate):** Call `dynamicActivate(documentMeta.language)` on mount in `SigningPageV1`/`SigningPageV2` components (fixes the first visit — covers the SSR gap since loaders run after `entry.server.tsx`)
