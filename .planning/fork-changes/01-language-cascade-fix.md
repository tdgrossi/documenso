---
topic: Language Cascade Fix
commit: 56ecd14d4
objective: Fix language cascade so sender's language is used for recipients
files_changed:
  - apps/remix/app/routes/_recipient+/sign.$token+/_index.tsx
  - packages/lib/server-only/envelope/create-envelope.ts
  - packages/lib/server-only/envelope/duplicate-envelope.ts
  - packages/lib/server-only/recipient/set-document-recipients.ts
  - packages/lib/server-only/template/create-document-from-template.ts
  - apps/remix/app/routes/_recipient+/_layout.tsx
  - apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx
---

# Language Cascade Fix

## Objective

Fix the language cascade bug so that when a sender creates a document with a specific language set in `documentMeta.language`, recipients visiting the signing page see the UI in the sender's chosen language — regardless of their own browser/OS locale.

**Problem:** The signing page (`_recipient+/sign.$token+/`) was using the recipient's browser `Accept-Language` header (detected in `root.tsx`) to determine the UI language. The `documentMeta.language` value stored on the document was being ignored during the signing flow.

**Expected behavior:** Recipients should see the signing page in the sender's language (as stored in `documentMeta.language`).

## Files Changed

### Primary Fix: Language Cascade

| File | Change Type | Purpose |
|------|-------------|---------|
| `apps/remix/app/routes/_recipient+/sign.$token+/_index.tsx` | Modified | Set language cookie in loader, activate language on client mount |
| `apps/remix/app/storage/lang-cookie.server.ts` | Reference | Cookie serialization used by the fix |

### Import Reordering (No Functional Change)

| File | Change Type | Purpose |
|------|-------------|---------|
| `packages/lib/server-only/envelope/create-envelope.ts` | Import reorder | `assertOrganisationRatesAndLimits` moved before `resolveSignatureLevel` |
| `packages/lib/server-only/envelope/duplicate-envelope.ts` | Import reorder | `assertOrganisationRatesAndLimits` moved before `resolveSignatureLevel` |
| `packages/lib/server-only/recipient/set-document-recipients.ts` | Import reorder | `assertOrganisationRatesAndLimits` moved before `assertCompatibleRecipientRole` |
| `packages/lib/server-only/template/create-document-from-template.ts` | Import reorder | `assertOrganisationRatesAndLimits` moved before `resolveSignatureLevel` |

### Related Changes (Part of Same Commit)

| File | Change Type | Purpose |
|------|-------------|---------|
| `apps/remix/app/routes/_recipient+/_layout.tsx` | Modified | Added `sign.$token+/complete` to `hideHeader` check |
| `apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx` | Modified | Completion page cleanup (sign-up panel removed) |

## What Changed

### 1. Loader — Set Language Cookie (Server-Side)

**File:** `apps/remix/app/routes/_recipient+/sign.$token+/_index.tsx` (lines 370-415)

**Before:**
```typescript
const payloadV2 = await handleV2Loader(loaderArgs);

const responseHeaders =
  'responseHeaders' in payloadV2 && payloadV2.responseHeaders ? payloadV2.responseHeaders : undefined;

return superLoaderJson(
  {
    version: 2,
    payload: payloadV2,
    branding,
  } as const,
  responseHeaders ? { headers: responseHeaders } : undefined,
);
```

**After:**
```typescript
const payloadV2 = await handleV2Loader(loaderArgs);

const headersInit: [string, string][] = [];

if ('responseHeaders' in payloadV2 && payloadV2.responseHeaders) {
  for (const [key, value] of Object.entries(payloadV2.responseHeaders)) {
    headersInit.push([key, value]);
  }
}

if (payloadV2.isDocumentAccessValid && 'envelopeForSigning' in payloadV2 && payloadV2.envelopeForSigning) {
  const language = payloadV2.envelopeForSigning.envelope.documentMeta.language;

  if (language) {
    headersInit.push(['Set-Cookie', await langCookie.serialize(language)]);
  }
}

return superLoaderJson(
  {
    version: 2,
    payload: payloadV2,
    branding,
  } as const,
  headersInit.length > 0 ? { headers: headersInit } : undefined,
);
```

**Same pattern applied to V1 loader (lines 398-415):**
```typescript
const v1Headers: [string, string][] = [];

if (payloadV1.isDocumentAccessValid && 'document' in payloadV1 && payloadV1.document) {
  const language = payloadV1.document.documentMeta?.language;

  if (language) {
    v1Headers.push(['Set-Cookie', await langCookie.serialize(language)]);
  }
}

return superLoaderJson(
  {
    version: 1,
    payload: payloadV1,
    branding,
  } as const,
  v1Headers.length > 0 ? { headers: v1Headers } : undefined,
);
```

### 2. Component — Activate Language on Mount (Client-Side)

**File:** `apps/remix/app/routes/_recipient+/sign.$token+/_index.tsx`

**SigningPageV1 (lines 435-445):**
```typescript
useEffect(() => {
  if (
    data.isDocumentAccessValid &&
    'document' in data &&
    data.document?.documentMeta?.language &&
    data.document.documentMeta.language !== APP_I18N_OPTIONS.sourceLang
  ) {
    void dynamicActivate(data.document.documentMeta.language);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

**SigningPageV2 (lines 544-553):**
```typescript
useEffect(() => {
  if (data.isDocumentAccessValid && 'envelopeForSigning' in data && data.envelopeForSigning) {
    const language = data.envelopeForSigning.envelope.documentMeta.language;

    if (language && language !== APP_I18N_OPTIONS.sourceLang) {
      void dynamicActivate(language);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### 3. New Imports Added

**File:** `apps/remix/app/routes/_recipient+/sign.$token+/_index.tsx` (lines 12, 31, 38, 53)

```typescript
import { APP_I18N_OPTIONS } from '@documenso/lib/constants/i18n';
import { dynamicActivate } from '@documenso/lib/utils/i18n';
import { useEffect } from 'react';
import { langCookie } from '~/storage/lang-cookie.server';
```

## Why It Works

The fix has two parts that work together:

### Part 1: Cookie Setting (Server-Side)

When the signing page loader runs, it now:
1. Checks if document access is valid
2. Extracts `documentMeta.language` from the document/envelope
3. If a language is set, serializes it to the `lang` cookie via `langCookie.serialize(language)`

This means subsequent requests to the signing page will have the `lang` cookie set, which `root.tsx` and `entry.server.tsx` read first before falling back to `Accept-Language`.

### Part 2: Dynamic Activation (Client-Side)

The `useEffect` hooks in both `SigningPageV1` and `SigningPageV2` call `dynamicActivate(language)` when:
1. Document access is valid
2. A `documentMeta.language` exists
3. The language differs from `APP_I18N_OPTIONS.sourceLang` (the default/source language)

This switches the Lingui.js catalog on the client side, covering the SSR gap (since loaders run after `entry.server.tsx` language resolution).

### Why Both Parts Are Needed

- **Cookie alone is insufficient**: The cookie is read on subsequent requests, but the first render on the signing page happens before the cookie would be set and read.
- **dynamicActivate alone is insufficient**: Without the cookie, subsequent page visits would still use the browser locale.

## Replication Steps

To apply this fix to a fresh clone:

### Step 1: Add Required Imports

In `apps/remix/app/routes/_recipient+/sign.$token+/_index.tsx`, add these imports:

```typescript
import { APP_I18N_OPTIONS } from '@documenso/lib/constants/i18n';
import { dynamicActivate } from '@documenso/lib/utils/i18n';
import { useEffect } from 'react';
import { langCookie } from '~/storage/lang-cookie.server';
```

### Step 2: Modify V2 Loader

After the call to `handleV2Loader`, build a headers array that includes both existing response headers AND the language cookie:

```typescript
const payloadV2 = await handleV2Loader(loaderArgs);

const headersInit: [string, string][] = [];

if ('responseHeaders' in payloadV2 && payloadV2.responseHeaders) {
  for (const [key, value] of Object.entries(payloadV2.responseHeaders)) {
    headersInit.push([key, value]);
  }
}

if (payloadV2.isDocumentAccessValid && 'envelopeForSigning' in payloadV2 && payloadV2.envelopeForSigning) {
  const language = payloadV2.envelopeForSigning.envelope.documentMeta.language;

  if (language) {
    headersInit.push(['Set-Cookie', await langCookie.serialize(language)]);
  }
}

return superLoaderJson(
  { version: 2, payload: payloadV2, branding } as const,
  headersInit.length > 0 ? { headers: headersInit } : undefined,
);
```

### Step 3: Modify V1 Loader

Apply the same pattern after `handleV1Loader`:

```typescript
const payloadV1 = await handleV1Loader(loaderArgs);

const v1Headers: [string, string][] = [];

if (payloadV1.isDocumentAccessValid && 'document' in payloadV1 && payloadV1.document) {
  const language = payloadV1.document.documentMeta?.language;

  if (language) {
    v1Headers.push(['Set-Cookie', await langCookie.serialize(language)]);
  }
}

return superLoaderJson(
  { version: 1, payload: payloadV1, branding } as const,
  v1Headers.length > 0 ? { headers: v1Headers } : undefined,
);
```

### Step 4: Add useEffect Hooks

In `SigningPageV1`, add after the `const user = sessionData?.user;` line:

```typescript
useEffect(() => {
  if (
    data.isDocumentAccessValid &&
    'document' in data &&
    data.document?.documentMeta?.language &&
    data.document.documentMeta.language !== APP_I18N_OPTIONS.sourceLang
  ) {
    void dynamicActivate(data.document.documentMeta.language);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

In `SigningPageV2`, add after `const user = sessionData?.user;`:

```typescript
useEffect(() => {
  if (data.isDocumentAccessValid && 'envelopeForSigning' in data && data.envelopeForSigning) {
    const language = data.envelopeForSigning.envelope.documentMeta.language;

    if (language && language !== APP_I18N_OPTIONS.sourceLang) {
      void dynamicActivate(language);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### Step 5: Verify

1. Run `npm run lint` to ensure no linting errors
2. Run `npx tsc --noEmit` to verify type correctness
3. Test by creating a document with a non-English language and verifying recipients see the correct language

## Related Debug Documentation

See `.planning/debug/language-cascade-bug.md` for the full root cause analysis, evidence collection, and resolution details.
