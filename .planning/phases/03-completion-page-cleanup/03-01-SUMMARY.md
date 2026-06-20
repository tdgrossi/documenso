# Plan 03-01 SUMMARY: Simplify completion page layout

## Objective

Simplify the post-signing completion page by removing the right-side sign-up panel, hiding the authenticated header, and centering success content.

## What Changed

### `apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx`
- Removed `cn()` wrapping on outer and inner divs — replaced with simple fixed classNames
- Removed all `canSignUp` conditional classes (`pt-0 lg:pt-0 xl:pt-0`, flex-row/divide-x layout)
- **Deleted entire sign-up panel** (previously lines 283-297): "Need to sign documents?" heading, description, and `ClaimAccount` component
- Removed unused imports: `cn`, `ClaimAccount`, `useLingui`
- `RecipientBranding` preserved
- `canSignUp` preserved in loader return (D-07) but removed from component destructuring
- Layout now centers naturally via `flex-col items-center` on a `max-w-2xl` container

### `apps/remix/app/routes/_recipient+/_layout.tsx`
- Added `routes/_recipient+/sign.$token+/complete` to `hideHeader` check (D-02)

## Files Changed

| File | Change |
|------|--------|
| `apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx` | Removed sign-up panel, simplified layout, removed unused imports |
| `apps/remix/app/routes/_recipient+/_layout.tsx` | Added complete route to hideHeader |

## Requirements Covered

- **COMP-02**: Header hidden on completion page (via hideHeader)
- **COMP-03**: Right-side sign-up panel removed unconditionally
- **COMP-04**: Success content centered
- **COMP-05**: Download button and "Go Back Home" link preserved

## Verification

- `npx biome check` passes on both modified files — no errors or warnings
- All acceptance criteria met:
  - ✅ canSignUp panel JSX deleted
  - ✅ Outer div uses simple fixed className
  - ✅ Inner div uses simple centered layout (max-w-2xl)
  - ✅ RecipientBranding preserved
  - ✅ Download + Go Back Home preserved
  - ✅ canSignUp in loaderData, not rendered

## Note

**COMP-01** (sender's logo display) is already handled by the existing `RecipientBranding` component (D-03 from CONTEXT.md) — no additional logo rendering needed. Phase 3 requirements fully met by this plan alone.
