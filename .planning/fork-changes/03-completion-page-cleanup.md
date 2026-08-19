---
topic: Completion Page Cleanup
commit: 56ecd14d4
objective: Simplify post-signing completion page
files_changed:
  - apps/remix/app/routes/_recipient+/_layout.tsx
  - apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx
---

# Completion Page Cleanup

## Objective

Simplify the post-signing completion page by removing the right-side sign-up panel, hiding the authenticated header, and centering the success content for a cleaner recipient experience.

## Files Changed

| File | Change |
|------|--------|
| `apps/remix/app/routes/_recipient+/_layout.tsx` | Added complete route to `hideHeader` check |
| `apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx` | Removed sign-up panel, simplified layout, removed unused imports |

## What Changed

### `apps/remix/app/routes/_recipient+/_layout.tsx`

**Before (lines 29-35):**
```typescript
// Hide the header for signing routes.
const hideHeader = matches.some(
  (match) =>
    match?.id === 'routes/_recipient+/sign.$token+/_index' ||
    match?.id === 'routes/_recipient+/d.$token+/_index',
);
```

**After (lines 29-35):**
```typescript
// Hide the header for signing routes.
const hideHeader = matches.some(
  (match) =>
    match?.id === 'routes/_recipient+/sign.$token+/_index' ||
    match?.id === 'routes/_recipient+/sign.$token+/complete' ||
    match?.id === 'routes/_recipient+/d.$token+/_index',
);
```

**Change:** Added `routes/_recipient+/sign.$token+/complete` to the `hideHeader` check so the authenticated header is hidden on the completion page.

### `apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx`

**Import changes:**
- **Removed:** `cn` from `@documenso/ui/lib/utils`
- **Removed:** `ClaimAccount` from `~/components/general/claim-account`
- **Removed:** `useLingui` from `@lingui/react`

**Component destructuring change (line 107-116):**

**Before:**
```typescript
const {
  isDocumentAccessValid,
  canSignUp,
  recipientName,
  signatures,
  document,
  recipient,
  recipientEmail,
  returnToHomePath,
  branding,
} = loaderData;
```

**After:**
```typescript
const {
  isDocumentAccessValid,
  recipientName,
  signatures,
  document,
  recipient,
  recipientEmail,
  returnToHomePath,
  branding,
} = loaderData;
```

**Removed:** `canSignUp` from destructuring (was used to conditionally show sign-up panel).

**Layout markup change (lines 145-265):**

**Before:**
```typescript
<div
  className={cn(
    '-mx-4 flex flex-col items-center overflow-hidden px-4 pt-16 md:-mx-8 md:px-8 lg:pt-20 xl:pt-28',
    { 'pt-0 lg:pt-0 xl:pt-0': canSignUp },
  )}
>
  <div
    className={cn('relative mt-6 flex w-full flex-col items-center justify-center', {
      'mt-0 flex-col divide-y overflow-hidden pt-6 md:pt-16 lg:flex-row lg:divide-x lg:divide-y-0 lg:pt-20 xl:pt-24':
        canSignUp,
    })}
  >
    <div
      className={cn('flex flex-col items-center', {
        'mb-8 p-4 md:mb-0 md:p-12': canSignUp,
      })}
    >
      {/* ... success content ... */}
    </div>

    <div className="flex flex-col items-center">
      {canSignUp && (
        <div className="flex max-w-xl flex-col items-center justify-center p-4 md:p-12">
          <h2 className="mt-8 text-center font-semibold text-xl md:mt-0">
            <Trans>Need to sign documents?</Trans>
          </h2>

          <p className="mt-4 max-w-[55ch] text-center text-muted-foreground/60 leading-normal">
            <Trans>Create your account and start using state-of-the-art document signing.</Trans>
          </p>

          <ClaimAccount defaultName={recipientName} defaultEmail={recipient.email} />
        </div>
      )}
    </div>
  </div>
</div>
```

**After:**
```typescript
<div className="-mx-4 flex flex-col items-center overflow-hidden px-4 pt-16 md:-mx-8 md:px-8 lg:pt-20 xl:pt-28">
  <div className="relative mt-6 flex w-full max-w-2xl flex-col items-center justify-center">
    <div className="flex flex-col items-center">
      {/* ... success content ... */}
    </div>
  </div>
</div>
```

**Removed:** The entire sign-up panel section (the second `div` with `ClaimAccount` component and "Need to sign documents?" messaging).

## Why It Works

1. **Header hiding:** By adding the complete route to `hideHeader`, the `AuthenticatedHeader` is suppressed on the completion page, reducing visual clutter for recipients.

2. **Simplified layout:** Removing the `canSignUp` conditional classes and the split-panel layout means the page now uses a single centered column (`max-w-2xl flex-col items-center`), which is cleaner and more focused.

3. **Sign-up panel removal:** The `ClaimAccount` component was removed entirely. The `canSignUp` variable is still returned from the loader (for potential future use), but is no longer destructured or used in the component.

4. **Preserved functionality:** The `RecipientBranding` component remains, maintaining CSS variable-based branding. The `Download` button and `Go Back Home` link are preserved. The document status messaging and sharing functionality remain intact.

## Replication Steps

To apply these changes to a fresh clone:

### 1. Update `apps/remix/app/routes/_recipient+/_layout.tsx`

Find the `hideHeader` logic (around line 29-35) and add the complete route:

```typescript
// Hide the header for signing routes.
const hideHeader = matches.some(
  (match) =>
    match?.id === 'routes/_recipient+/sign.$token+/_index' ||
    match?.id === 'routes/_recipient+/sign.$token+/complete' ||
    match?.id === 'routes/_recipient+/d.$token+/_index',
);
```

### 2. Update `apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx`

**a) Remove unused imports:**
- Remove `cn` from `@documenso/ui/lib/utils`
- Remove `ClaimAccount` from `~/components/general/claim-account`
- Remove `useLingui` from `@lingui/react`

**b) Remove `canSignUp` from loaderData destructuring (line ~107)**

**c) Replace the layout markup (lines ~145-265) with simplified version:**

```typescript
return (
  <>
    <RecipientBranding branding={branding} cspNonce={cspNonce} />
    <div className="-mx-4 flex flex-col items-center overflow-hidden px-4 pt-16 md:-mx-8 md:px-8 lg:pt-20 xl:pt-28">
      <div className="relative mt-6 flex w-full max-w-2xl flex-col items-center justify-center">
        <div className="flex flex-col items-center">
          {/* Badge */}
          {/* SigningCard3D */}
          {/* Status heading */}
          {/* Status messaging */}
          {/* Action buttons (Download, Go Back Home) */}
        </div>
      </div>
    </div>
  </>
);
```

**Note:** The `canSignUp` variable can remain in the loader return object for future use, but should not be destructured or used in the component template.

## Verification

- Run `npx biome check apps/remix/app/routes/_recipient+/_layout.tsx apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx` to ensure no linting errors
- The completion page should display centered content without the sign-up panel
- The header should be hidden on the completion page
- The download button and Go Back Home link should remain functional
