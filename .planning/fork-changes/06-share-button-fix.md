---
topic: Share Button Fix
commit: 04a18b74a
objective: Hide share button from non-logged users on signing complete page
files_changed:
  - apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx
---

# Share Button Fix

## Objective

Hide the share button from non-logged users on the signing complete page. Non-authenticated users (signers who completed signing without logging in) should only see the Download button for a simplified post-signing experience.

## Files Changed

| File | Change |
|------|--------|
| `apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx` | 7 insertions, 5 deletions |

## What Changed

**Before:**
```tsx
<div className="mt-8 flex w-full max-w-xs flex-col items-stretch gap-4 md:w-auto md:max-w-none md:flex-row md:items-center">
  <DocumentShareButton
    documentId={document.id}
    token={recipient.token}
    className="w-full max-w-none md:flex-1"
  />

  {isDocumentCompleted(document) && (
    <EnvelopeDownloadDialog ... />
  )}
</div>
```

**After:**
```tsx
<div className="mt-8 flex w-full max-w-xs flex-col items-stretch gap-4 md:w-auto md:max-w-none md:flex-row md:items-center">
  {user && (
    <DocumentShareButton
      documentId={document.id}
      token={recipient.token}
      className="w-full max-w-none md:flex-1"
    />
  )}

  {isDocumentCompleted(document) && (
    <EnvelopeDownloadDialog ... />
  )}
</div>
```

## Why It Works

The `user` object is only present when a user is authenticated (logged in). By wrapping `DocumentShareButton` in a `{user && (...)}` conditional render, the share button is hidden from non-authenticated users.

Non-logged users who complete the signing flow will only see:
- The Download button (when document is completed)
- The "Go Back Home" button

This provides a cleaner, more focused experience for external signers who don't have an account.

## Replication Steps

To apply this fix to a fresh clone:

1. Open `apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx`
2. Locate the `DocumentShareButton` component inside the button container div (around line 231-237)
3. Wrap the `DocumentShareButton` in a conditional: `{user && (<DocumentShareButton ... />)}`
4. Ensure the surrounding `isDocumentCompleted(document)` check for the Download button remains unchanged

**Key files:**
- Route: `apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx`
- Component used: `DocumentShareButton` (from `@documenso/ui` package)
- Auth check: `user` from `loaderData` (authenticated session)
