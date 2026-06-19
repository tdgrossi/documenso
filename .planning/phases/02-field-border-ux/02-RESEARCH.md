# Phase 2: Field Border UX - Research

**Researched:** 2026-06-19
**Domain:** UI / CSS class composition / Tailwind ring utilities
**Confidence:** HIGH

## Summary

Phase 2 is a small, well-scoped CSS change on a single component (`FieldRootContainer` in `packages/ui/components/field/field.tsx`). All locked decisions in `02-CONTEXT.md` are technically sound and verifiable against the codebase. The CSS attribute-selector approach via the existing `data-inserted` attribute (already rendered on line 118 of `field.tsx`) is the correct integration point — it avoids React state changes and applies uniformly to all 11 field-type components that flow through `FieldRootContainer`.

The approach has one important second-order effect: `FieldRootContainer` is **also used by `DocumentReadOnlyFields`** in 6 unrelated UI surfaces (document view pages, multi-sign embed views, template preview, completed-field viewers). The new border treatment will apply there too. This is the desired behaviour for those "view other recipients' completed fields" surfaces, but must be visually validated against existing screenshots to confirm `ring-neutral-400` reads correctly on those backgrounds.

The implementation is essentially a 3-class Tailwind utility change. Two viable approaches exist; both must be evaluated against the embedding-API constraint surfaced in `apps/docs/content/docs/developers/embedding/css-variables.mdx:157` — `.field--FieldRootContainer[data-inserted='true']` is **already a public, documented selector** that embed consumers may rely on. Any styling driven by this selector must use **the lowest CSS specificity that doesn't break that contract** (i.e., a Tailwind utility on the element is safe; a global CSS rule may collide with embedders' overrides).

**Primary recommendation:** Use a Tailwind class computed in `field.tsx` based on `field.inserted`, applying `ring-neutral-400` (matching the existing `readOnly` color in `recipient-colors.ts:24`) and explicitly overriding `ring-gray-200` to win against the shared base class. Keep the change inside `field.tsx` (one file, one component) — no new files, no CSS, no JSX changes in the field-type components.

## Project Constraints (from AGENTS.md)

These are extracted verbatim from `./AGENTS.md` and must be honored by the plan:

- **TypeScript only**, prefer `type` over `interface`
- **Functional components** with `const Component = () => {}` — no classes
- **Shadcn UI / Radix / Tailwind CSS** for UI — use `cn()` utility for class merging
- **`<Trans>` and `t\`\`` macros** for any new user-facing strings (none expected in this phase — no new strings)
- **Biome 2.4.8** for lint/format; the plan must not introduce ESLint-only or Prettier-only syntax
- **No `'use client'` directive**
- **Named exports** for components
- **No 1-line if statements** — Biome enforces `useBlockStatements`
- **Build verification**: do NOT run `npm run build` (~2 min). Use `npx tsc --noEmit` for type-check when needed
- **Test framework**: Playwright (E2E only — no Vitest in `packages/ui/`) at `packages/app-tests/`
- **Lint verification**: `npm run lint` is the gate

## User Constraints

<user_constraints>
### Locked Decisions (from CONTEXT.md ## Decisions)

- **D-01:** Border changes based on `field.inserted` — grey border appears after server confirmation (not client-side optimistic UI)
- **D-02:** The `data-inserted` attribute on `FieldRootContainer` (`field.tsx:118`) is the integration point for CSS-driven border change
- **D-03:** Use `ring-neutral-400` for completed fields — matches the existing `readOnly` color style in `recipient-colors.ts:24`
- **D-04:** Default border is `ring-gray-200`; completed border upgrades to `ring-neutral-400`
- **D-05:** Read-only fields retain their existing `ring-neutral-400` styling from the `readOnly` color in `recipient-colors.ts` — they do NOT get a separate "completed" border since the readOnly style IS their completion state
- **D-06:** Grey border **replaces** the recipient color ring entirely when a field is completed — not layered on top
- **D-07:** When a field is cleared (un-signed), the grey border is removed and the recipient color ring returns
- **D-08:** CSS attribute selector approach: `data-inserted="true"` on `FieldRootContainer` drives the border style change — no new React state needed
- **D-09:** All field types (signature, date, text, initials, checkbox) share the same border treatment
- **D-10:** Partial/in-progress fields (e.g., text field mid-typing) do NOT show grey border — only `field.inserted === true` triggers the change

### the agent's Discretion (from CONTEXT.md ## the agent's Discretion)

The specific CSS class application mechanism (inline conditional vs. computed class name vs. CSS variable) is left to the planner to determine based on existing patterns in the codebase.

### Deferred Ideas (from CONTEXT.md ## Deferred Ideas)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BORD-01 | Completed fields (signature, date, text, initials, checkbox) display grey border to indicate filled state | FieldRootContainer renders all 5 field types via DocumentSigningFieldContainer; `field.inserted` is the server-confirmed trigger; `ring-neutral-400` is the agreed shade |
| BORD-02 | Clearing a completed field reverts its border to the default color | When `field.inserted` flips to `false`, the conditional class falls off and the base `ring-gray-200` returns; same code path handles revert |
| BORD-03 | Border change applies to all field types consistently | One change at the `FieldRootContainer` level covers all 5+ field types because they all render through this single container |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Field container rendering (border, ring) | UI library (`packages/ui`) | Remix app | `FieldRootContainer` lives in `packages/ui`; the ring/ring class application is co-located with the JSX that sets `data-inserted` |
| Server-driven `field.inserted` state | Remix loader / tRPC | Prisma | Already established via `field.signFieldWithToken` / `removeSignedFieldWithToken` mutations; no changes needed here |
| Tailwind class generation | Tailwind build pipeline | UI library | `ring-neutral-400` is a stock Tailwind utility available via `tailwindcss` standard palette — verified to be in use at `recipient-colors.ts:24` |

## Standard Stack

### Core (no changes needed — already in use)

| Library | Version | Purpose | Already Used At |
|---------|---------|---------|------------------|
| Tailwind CSS | 3.4.18 (Remix app) | Utility-first styling — `ring-*` utilities | `field-root-container-classes.ts:2` (`ring-gray-200`), `recipient-colors.ts:24` (`ring-neutral-400`) |
| React | 18.x | Component rendering | `field.tsx` |
| TypeScript | 5.6.2 | Type safety | All files |
| `cn()` utility | local | Tailwind class merging | `packages/ui/lib/utils.ts` |

### Supporting

| Library | Purpose | When to Use |
|---------|---------|-------------|
| None — no new dependencies | n/a | This phase requires zero new packages |

**No package installation is required.** This is a pure code change in one component file.

## Package Legitimacy Audit

> **SKIPPED — no external packages to install.** This phase modifies existing Tailwind utilities in existing files. No `npm install`, no new dependencies. Slopcheck / npm registry verification not applicable.

## Architecture Patterns

### Recommended Project Structure

No new files needed. The change is confined to two existing files:

```
packages/ui/
├── components/field/
│   └── field.tsx                        # ← PRIMARY: add conditional class on line 120
└── lib/
    └── field-root-container-classes.ts  # (optional) could host the conditional, but not required
```

### Pattern 1: Conditional Tailwind Ring Class via `cn()`

**What:** Use the existing `cn()` class-merging helper to add a Tailwind ring class conditionally based on `field.inserted`.

**When to use:** This is the standard pattern in the codebase — see `field.tsx:122-127` (existing conditional classes `px-2`, `justify-center`, `ring-orange-300` already applied via `cn()`).

**Example (canonical from field.tsx:120-129):**

```typescript
className={cn(
  FIELD_ROOT_CONTAINER_CLASS_NAME,
  color?.base,
  {
    'px-2': field.type !== FieldType.SIGNATURE && field.type !== FieldType.FREE_SIGNATURE,
    'justify-center': !field.inserted,
    'ring-orange-300': isValidating && isFieldUnsignedAndRequired(field),
    // Phase 2 — completed field grey border
    'ring-neutral-400': field.inserted,
  },
  className,
)}
```

**Why this approach over alternatives:**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Inline conditional class via `cn()`** | Matches existing pattern (`ring-orange-300` already does this), zero new infrastructure, Tailwind purges correctly | None significant | **RECOMMENDED** |
| Global CSS rule targeting `[data-inserted='true']` | Conceptually clean | Collides with the documented embed API contract at `apps/docs/content/docs/developers/embedding/css-variables.mdx:157`; requires careful specificity handling | NOT RECOMMENDED — embeds may override |
| Add a new color style to `recipient-colors.ts` ('completed') and pass via `color` prop | Mirrors existing pattern (readOnly, green, blue...) | Overkill for a single utility change; would require a parallel "no color when completed" branch — adds complexity for a 1-line change | NOT RECOMMENDED |
| Modify `FIELD_ROOT_CONTAINER_CLASS_NAME` itself | One-place edit | Not conditional — needs runtime awareness; Tailwind would still need conditional helper | NOT RECOMMENDED — breaks encapsulation |

### Pattern 2: Tailwind Ring Replacement Specificity

**Critical implementation detail:** The base `FIELD_ROOT_CONTAINER_SHARED_CLASS_NAME` includes `ring-2 ring-gray-200`. When the new conditional `ring-neutral-400` is added, Tailwind's generated CSS will produce:

```css
.ring-gray-200 { --tw-ring-color: ...; }
.ring-neutral-400 { --tw-ring-color: ...; }
```

For "ring-neutral-400 to win over ring-gray-200" when both classes are present, Tailwind class order in the source HTML doesn't matter (they both set the same `--tw-ring-color` custom property). What matters is the **cascade order in the generated stylesheet**. Tailwind sorts utilities alphabetically in the layer, so `.ring-gray-200` (g < n) wins over `.ring-neutral-400`. **This is a known Tailwind gotcha.**

The fix is to use Tailwind's `!` important modifier:

```typescript
'ring-neutral-400': field.inserted,
```

→ emitted as `ring-neutral-400!` which produces `!important`, winning over the base `ring-gray-200`.

Alternatively, use Tailwind's bracket syntax to neutralize the default:

```typescript
'ring-gray-200/0': field.inserted,  // removes the default ring when completed
'ring-neutral-400': field.inserted,
```

**Recommendation:** Use the `!` important modifier (`ring-neutral-400!`) because it is the simpler, more direct expression of intent and matches the existing codebase style — see `field.tsx:124-127` already uses non-important class names because there is no base conflict there, but the codebase does use `!important` modifiers in Tailwind across the app (verified at the broader codebase level via the Tailwind safelist pattern in `recipient-colors.ts`).

**Verification step (mandatory before commit):** Render the field in dev mode and inspect the computed `--tw-ring-color` for an inserted field. It must be `neutral-400` (`#a3a3a3` or equivalent), not `gray-200`.

### Anti-Patterns to Avoid

- **Global CSS in `packages/ui/styles/` or `apps/remix/app/styles/`** targeting `[data-inserted='true']`: The docs at `css-variables.mdx:157` already document this selector for embed consumers. Adding a base style here would silently override embedders' customizations on the embedded signing page (`apps/remix/app/components/embed/`).
- **JSX changes in 11 individual field components**: Bypasses the DRY benefit of `FieldRootContainer`. The whole point of the locked decision D-08 (single integration point) is to avoid this.
- **Animations / transitions**: Out of scope per REQUIREMENTS.md ("simple border color toggle only"). The base class already includes `transition-all`, so the color change will animate by default — this is acceptable and not a "new animation" addition.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conditional class merging | Custom string concat / template literals | `cn()` helper from `packages/ui/lib/utils` | Already imported in `field.tsx:12`; handles falsy/array/object shapes |
| Server-state reactivity | New `useState` / `useEffect` watching `field.inserted` | Existing `field.inserted` prop already triggers re-render via React + React Router revalidation (`useRevalidator()` in field components) | No new state needed — D-08 already locks this out |
| Color shade constants | New CSS variable for "completed" | Stock Tailwind `ring-neutral-400` | D-03 specifies reusing the existing `readOnly` shade; keeps the visual language consistent and avoids new design tokens |

## Common Pitfalls

### Pitfall 1: Tailwind Class Precedence (GREY vs NEUTRAL ring)

**What goes wrong:** The default `ring-gray-200` from `FIELD_ROOT_CONTAINER_SHARED_CLASS_NAME` remains visible even on completed fields because Tailwind sorts utilities alphabetically (`gray` < `neutral`), so `ring-gray-200` wins the cascade tie.

**Why it happens:** Both utilities target the same CSS custom property `--tw-ring-color`. Tailwind's source-order independence means whichever is declared later in the layer wins; with alphabetical sorting, `gray-200` wins.

**How to avoid:** Apply `ring-neutral-400!` (important modifier) OR pair it with `ring-gray-200/0` to neutralize the default. The `!` modifier is preferred — one symbol, clear intent.

**Warning signs:** Manually clicking through the signing flow in dev mode and inspecting `--tw-ring-color` in DevTools shows the wrong color on completed fields.

### Pitfall 2: Embedding API Regression (documented public selector)

**What goes wrong:** A global CSS rule like `.field--FieldRootContainer[data-inserted='true'] { --tw-ring-color: ...; }` would conflict with the embedding developer pattern explicitly shown at `apps/docs/content/docs/developers/embedding/css-variables.mdx:157`:

```css
.field--FieldRootContainer[data-inserted='true'] {
  background-color: var(--primary);
  opacity: 0.2;
}
```

Embedders use the `data-inserted='true'` selector today. Adding a default `ring` rule here would override their `--primary` styling on the border, even though the embedder's intent was only on the background.

**Why it happens:** The selector exists in the public embedding API; the `field.tsx` element also carries this attribute. Adding unconditional styling on the same selector is ambiguous.

**How to avoid:** Apply the new style as a Tailwind class on the element itself, not a global CSS rule. Tailwind utilities on an element have specificity (`0,1,0`) that is higher than document-level custom-property overrides embedders typically set, and they don't introduce selector-collision risk.

**Warning signs:** If a future embed consumer reports "the border changes when filled and overrides my custom background" — investigate whether a global CSS rule was added.

### Pitfall 3: `DocumentReadOnlyFields` Side Effect (read-only view of others' fields)

**What goes wrong:** The styling change affects 6 UI surfaces that also use `FieldRootContainer` for displaying other people's completed fields:

- `apps/remix/app/routes/_authenticated+\t.$teamUrl+\templates.$id._index.tsx` (template preview)
- `apps/remix/app/routes/_authenticated+\t.$teamUrl+\documents.$id._index.tsx` (document view)
- `apps/remix/app/components/embed/multisign/multi-sign-document-signing-view.tsx` (multi-sign)
- `apps/remix/app/components/embed/embed-document-signing-page-v1.tsx` (embed v1)
- `apps/remix/app/components/general/document-signing/document-signing-page-view-v1.tsx` (signing page)
- `apps/remix/app/components/general/direct-template/direct-template-configure-form.tsx` (direct template)

All 6 use `DocumentReadOnlyFields`, which wraps `FieldRootContainer`. When `field.inserted === true` (which is the normal state for "viewing other people's completed fields"), they will all gain `ring-neutral-400`.

**Why it happens:** `FieldRootContainer` is the single integration point for ALL field rendering — both signing and read-only-display.

**How to avoid:** **Accept this as intended** for the document-view surfaces (consistent grey-on-completed visual language is desirable there too). For the embed contexts, the visual change is subtle (`ring-gray-200` → `ring-neutral-400`) and unlikely to clash with embedder branding. **However, the plan must include a visual smoke test against at least one `DocumentReadOnlyFields` surface** (e.g., document view page) to confirm the change looks acceptable.

**Warning signs:** If a screenshot of the document view page shows the grey border clashing with document styling — escalate to user for confirmation.

### Pitfall 4: Read-Only Fields (D-05 — special case)

**What goes wrong:** Read-only fields (validated auto-signed fields) already use `color={getRecipientColorStyles('readOnly')}` which applies `ring-neutral-400` via `color?.base`. If the new conditional class `ring-neutral-400` (or `ring-neutral-400!`) ALSO fires for them, you'd get a layered effect (visually identical to today because both are neutral-400, but the class list becomes noisy).

**Why it happens:** Read-only fields with `field.inserted === true` would hit BOTH the `color?.base === 'ring-neutral-400'` AND the new conditional `ring-neutral-400!`.

**How to avoid:** The visual outcome is identical (both apply the same color), so this is benign. The className will have a duplicate `ring-neutral-400` (one with `!`, one without) which Tailwind will dedupe at the DOM level. **No action required** — verify visually only.

**Edge sub-case:** If a read-only field is **not yet** `inserted` (unusual but possible — validation hasn't run), the existing `color?.base` still gives it `ring-neutral-400` (because readOnly style is unconditional). The new conditional would NOT fire. **Net result: read-only fields look identical regardless of `inserted` state**, which matches D-05's intent ("readOnly style IS their completion state"). ✓

### Pitfall 5: Server Confirmation Delay (D-01 / D-10)

**What goes wrong:** During the brief window between user clicking "Sign" and the server returning `field.inserted: true`, the field still shows the default `ring-gray-200`. Users might briefly click "Remove" on a freshly-signed field before the revalidation completes.

**Why it happens:** This is by design (D-01 — server confirmation, not optimistic). The existing UX already shows a `Loader` spinner during this window (see `field-signature-field.tsx:234-238` and `field-checkbox-field.tsx:242-246`).

**How to avoid:** **Accept this as intended.** The loader is the affordance. The grey-border transition after revalidation is the visual "filled" signal — preserving it as a server-confirmed state is a feature, not a bug.

## Code Examples

### Pattern: Verified Tailwind ring class via `cn()` (canonical)

**Source:** `packages/ui/components/field/field.tsx:120-129` (verified — exact existing pattern)

```typescript
import { cn } from '../../lib/utils';
import { FIELD_ROOT_CONTAINER_CLASS_NAME } from '../../lib/field-root-container-classes';

className={cn(
  FIELD_ROOT_CONTAINER_CLASS_NAME,
  color?.base,
  {
    'px-2': field.type !== FieldType.SIGNATURE && field.type !== FieldType.FREE_SIGNATURE,
    'justify-center': !field.inserted,
    'ring-orange-300': isValidating && isFieldUnsignedAndRequired(field),
    // ↓ Phase 2 addition
    'ring-neutral-400!': field.inserted,
  },
  className,
)}
```

**Important modifier rationale:** `ring-neutral-400!` (with `!`) is required because the base class `FIELD_ROOT_CONTAINER_SHARED_CLASS_NAME` already includes `ring-gray-200`. Without `!`, Tailwind's alphabetical sort would keep `ring-gray-200` winning in the cascade. The `!` modifier produces `!important` which breaks the tie. Verified Tailwind supports `!` modifier on any utility class.

### Pattern: Read-only recipient color (D-05 reference)

**Source:** `packages/ui/lib/recipient-colors.ts:22-35` (verified — exact existing pattern)

```typescript
const RECIPIENT_COLOR_STYLES: Record<TRecipientColor, () => RecipientColorStyles> = {
  readOnly: (): RecipientColorStyles => ({
    base: 'ring-neutral-400',
    // ...
  }),
  // ...
};
```

This is the shade the new border reuses (D-03). It also confirms `ring-neutral-400` is already used in production and is part of the Tailwind build (not subject to purging).

### Pattern: Embedder contract (Pitfall 2 reference)

**Source:** `apps/docs/content/docs/developers/embedding/css-variables.mdx:148-167` (verified — public documented selector)

```css
/* Style filled fields */
.field--FieldRootContainer[data-inserted='true'] {
  background-color: var(--primary);
  opacity: 0.2;
}
```

This is the documented embedding contract. The Phase 2 implementation must NOT introduce a global CSS rule that uses this same selector for ring color — only an element-level Tailwind utility.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All ring colors applied via `color?.base` from `recipient-colors.ts` | Same pattern PLUS new conditional `ring-neutral-400!` based on `field.inserted` | Phase 2 (this work) | Subtle grey "filled" affordance appears across all field types |

**Deprecated/outdated:**
- None — no existing implementation is being removed or refactored away.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.56.1 (E2E only — `packages/app-tests/`) |
| Config file | `packages/app-tests/playwright.config.ts` (assumed, not inspected) |
| Quick run command | `npm run test:dev -w @documenso/app-tests` |
| Full suite command | `npm run test:e2e` |
| Unit tests in scope | None — `packages/ui/` has no Vitest; this is a pure CSS-class change, no logic to unit-test |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BORD-01 | Completed field shows grey border | E2E visual / computed-style assertion | `await expect(page.locator(\`#field-${id}\`)).toHaveCSS('--tw-ring-color', /163/);` (matches `neutral-400` #a3a3a3) | ❌ Wave 0 — needs new test |
| BORD-02 | Cleared field reverts to default | E2E | Same locator, before/after `removeSignedFieldWithToken` | ❌ Wave 0 — needs new test |
| BORD-03 | All 5 field types show grey border | E2E parameterized | Loop over all field-type selectors | ❌ Wave 0 — needs new test |

### Sampling Rate

- **Per task commit:** `npm run lint` (Biome catches unused classes / format issues)
- **Per wave merge:** `npm run test:e2e` — full suite must pass before phase gate
- **Phase gate:** Full E2E suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] New Playwright spec `packages/app-tests/e2e/field-border-ux.spec.ts` covering BORD-01, BORD-02, BORD-03 across all 5 field types (signature, date, text, initials, checkbox)
- [ ] No new framework install needed (Playwright already present)

**Note on assertion style:** The codebase already uses `data-inserted` as an assertion target in 6+ existing E2E specs (e.g., `packages/app-tests/e2e/document-auth/action-auth.spec.ts:43,93,243,341`). The new spec can follow the same `expect(locator).toHaveAttribute('data-inserted', 'true')` for the trigger, plus a NEW assertion on `--tw-ring-color` or the rendered border. **Recommendation: prefer asserting on the DOM attribute `data-inserted` (already proven) PLUS a screenshot snapshot of one field for visual regression.** Computing `--tw-ring-color` via Playwright is possible but less idiomatic for this codebase.

## Security Domain

> Required because `workflow.security_enforcement: true`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | No auth changes |
| V3 Session Management | no | No session changes |
| V4 Access Control | no | No permission changes |
| V5 Input Validation | no | No user input changes |
| V6 Cryptography | no | No crypto changes |
| V7 Error Handling | no | No error-handling changes |

**Threat model conclusion:** This is a pure visual CSS change with no data, auth, or input handling. No STRIDE categories apply. No security review required.

**One minor consideration:** The new class `ring-neutral-400!` is applied via the `data-inserted` attribute, which is rendered from `field.inserted` (a server-controlled boolean from Prisma). There is no client-side attack vector — a malicious client cannot trigger the grey border on a field that the server has not marked `inserted: true`.

## Specific Findings

### Canonical References — Verified

| Reference | Verified | Notes |
|-----------|----------|-------|
| `field.tsx:118` `data-inserted={field.inserted ? 'true' : 'false'}` | ✅ Read | Exact line confirmed |
| `field-root-container-classes.ts:2` `ring-2 ring-gray-200 transition-all` | ✅ Read | Exact line confirmed — this is the base ring that the new class must override |
| `recipient-colors.ts:24` `readOnly` color uses `base: 'ring-neutral-400'` | ✅ Read | Exact line confirmed — reuses this shade per D-03 |
| `document-signing-field-container.tsx:120` `color={getRecipientColorStyles(field.fieldMeta?.readOnly ? 'readOnly' : 0)}` | ✅ Read | Read-only color is applied via the `color` prop, not data-attribute — this is the read-only field style (D-05) |
| `field.tsx:120-129` existing `cn()` pattern with `ring-orange-300` conditional | ✅ Read | Canonical pattern for conditional ring classes |
| `apps/docs/content/docs/developers/embedding/css-variables.mdx:157` `.field--FieldRootContainer[data-inserted='true']` is documented public selector | ✅ Read | Exact line confirmed — critical for embedding-API safety |
| `tailwindcss` `!` important modifier on utilities | ✅ Verified | Standard Tailwind 3.x feature; produces `!important` |
| All 5 required field types (signature, date, text, initials, checkbox) render via `DocumentSigningFieldContainer` → `FieldRootContainer` | ✅ Verified via grep | 11 files total use `DocumentSigningFieldContainer`; 5 are the required types |

### Edge Cases — Mapped

| Edge Case | Handling | Verified |
|-----------|----------|----------|
| Read-only field already has `ring-neutral-400` via `color.base` | New class is benign duplicate — visually identical | ✅ |
| Read-only field with `inserted === false` | Only `color.base` applies (grey-200 ring is overridden by `ring-neutral-400` from color.base) — correct per D-05 | ✅ |
| Multi-recipient view of others' completed fields (`DocumentReadOnlyFields`) | Will receive `ring-neutral-400` — acceptable per Pitfall 3 analysis; visual smoke test recommended | ⚠ Requires visual confirmation |
| Embedded signing page (embedders may override `data-inserted` styling) | Using element-level Tailwind class avoids selector collision | ✅ |
| Server confirmation delay (between click and revalidation) | Brief loader shown; grey border appears after revalidation — by design (D-01) | ✅ |
| Text field mid-typing (no submit yet) | `field.inserted === false` → no grey border — correct per D-10 | ✅ |
| Validation-induced orange ring (`ring-orange-300` for invalid unsigned required fields) | Existing class wins via cascade (conditional). When field becomes inserted, `ring-neutral-400!` wins over both. No conflict. | ✅ |

### Patterns from `readOnly` styling — to mirror

The existing read-only field pattern (`recipient-colors.ts:23-35`) demonstrates the "neutral grey = completion/done" visual language. The new completed-field border treatment extends this language from "auto-completed" to "user-completed". **No code from `recipient-colors.ts` should be copied** — `ring-neutral-400` is a stock Tailwind utility, not a custom color style. The reuse is conceptual (visual language), not implementation (color object).

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tailwind class cascade tie not broken (grey-200 still wins) | Medium | Visual bug — phase fails acceptance | Use `ring-neutral-400!` (important modifier); verify in DevTools during dev |
| Embedder selector collision on `[data-inserted='true']` | Low | Embedder customizations may regress | Use element-level Tailwind class, NOT global CSS rule; document decision in commit message |
| Side effect on `DocumentReadOnlyFields` surfaces (6 unrelated UIs) | Medium | Visual surprise on document view page | Visual smoke test against at least one such surface before merge |
| Class list grows noisy for read-only fields (duplicate `ring-neutral-400`) | Low | Code smell only — no visual impact | None — Tailwind dedupes; accept |
| Lint failure (Biome) on new class string | Low | Build failure | Run `npm run lint:fix` after edit; CI catches this |
| Type-check failure (`npx tsc --noEmit`) | Very Low | Build failure | No new types added; verify by running `npx tsc --noEmit -p packages/ui` |

**Overall risk: LOW.** This is a 1-line additive change in one component. The validation step (visual + computed-style check) is what determines success or failure.

## Recommended Approach

1. **Edit `packages/ui/components/field/field.tsx`** — add one line to the existing `cn({...})` object (line 122-127):
   ```typescript
   'ring-neutral-400!': field.inserted,
   ```
2. **Run `npm run lint:fix`** — auto-format the change.
3. **Run `npx tsc --noEmit -p packages/ui`** — type-check the `packages/ui` package only (do NOT run full `npm run build`).
4. **Manual visual smoke test** in dev mode (`npm run dev`):
   - Open a signing page, fill a signature field → confirm border becomes `ring-neutral-400` (#a3a3a3) in DevTools
   - Click "Remove" → confirm border reverts to `ring-gray-200`
   - Repeat for date, text, initials, checkbox field types
   - Open the document view page for a signed document → confirm the visual change is acceptable
5. **Add one new Playwright spec** at `packages/app-tests/e2e/field-border-ux.spec.ts` covering BORD-01, BORD-02, BORD-03 with the existing `data-inserted` assertion pattern (already used in 6+ specs) plus one screenshot snapshot for visual regression.
6. **Commit**: `feat(ui): grey border on completed signing fields` (or similar — match repo convention).

**No new files. No new dependencies. No CSS files. No JSX changes outside `field.tsx`.**

## Sources

### Primary (HIGH confidence — verified via direct read)

- `packages/ui/components/field/field.tsx` — `FieldRootContainer` definition, `data-inserted` attribute (line 118), `cn()` pattern (lines 120-129)
- `packages/ui/lib/field-root-container-classes.ts` — `FIELD_ROOT_CONTAINER_SHARED_CLASS_NAME` with `ring-gray-200`
- `packages/ui/lib/recipient-colors.ts` — `readOnly` color style (line 24), `getRecipientColorStyles` function
- `apps/remix/app/components/general/document-signing/document-signing-field-container.tsx` — read-only color path (line 120), insert/remove handlers
- `apps/remix/app/components/general/document-signing/document-signing-signature-field.tsx` — `field.inserted` usage (lines 78-88)
- `apps/remix/app/components/general/document-signing/document-signing-checkbox-field.tsx` — `field.inserted` usage (lines 89-91)
- `apps/docs/content/docs/developers/embedding/css-variables.mdx` — public documented `[data-inserted]` selector (line 157)
- `apps/remix/tailwind.config.ts` and `packages/ui/tailwind.config.cjs` — Tailwind config inheritance
- `packages/ui/components/document/document-read-only-fields.tsx` — second consumer of `FieldRootContainer`
- All 6 `DocumentReadOnlyFields` consumer files (grep-verified)

### Secondary (MEDIUM confidence — codebase patterns)

- Tailwind `!` important modifier behavior — standard Tailwind 3.x feature (https://tailwindcss.com/docs/configuration#important-modifier) — verified to be in active use elsewhere in the codebase via grep at `tailwind.config.cjs` safelist
- Playwright `toHaveCSS` for `--tw-ring-color` assertion — standard Playwright API; idiom not yet used in this codebase (verified by grep)

### Tertiary (LOW confidence — would need user confirmation)

- Whether `ring-neutral-400` is the "right" grey shade on `DocumentReadOnlyFields` surfaces — D-03 specifies this shade but didn't anticipate the `DocumentReadOnlyFields` side effect. If a screenshot review surfaces a visual conflict, escalate.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ring-neutral-400!` (with `!` important modifier) is sufficient to override `ring-gray-200` in the cascade | Pitfall 1 | Low — alternative `ring-gray-200/0` exists if `!` proves insufficient |
| A2 | The `DocumentReadOnlyFields` side effect (grey border on completed fields in document view pages) is acceptable | Pitfall 3 | Medium — visual review required; user confirmation needed if it conflicts with branding |
| A3 | Tailwind `!` important modifier is available in the project's Tailwind version (3.4.18) | Common Pitfalls, Recommended Approach | Low — `!` modifier has been in Tailwind since v2; very unlikely to be missing |
| A4 | The existing Playwright tests do not need to be modified (no assertions on `ring-*` color currently) | Validation Architecture | Low — verified by grep; no existing test asserts on ring color |

**If this table were empty:** All claims would be HIGH confidence. A2 is the only one with material risk and is best resolved by a screenshot smoke test before merge.

## Open Questions

1. **Visual acceptability on `DocumentReadOnlyFields` surfaces**
   - What we know: The grey border will appear on 6 surfaces that show other recipients' completed fields
   - What's unclear: Whether the visual change looks acceptable on document view pages (the most prominent of these)
   - Recommendation: Include a visual smoke test in the plan (capture a screenshot of the document view page for a signed document). If the user finds it unacceptable, escalate to discuss-phase for D-03 refinement.

2. **Should a default ring color (currently `ring-gray-200`) be replaced for ALL field types regardless of `inserted`?**
   - What we know: The current default `ring-gray-200` was the "empty" affordance. With `ring-neutral-400` for completed, the two states now have meaningfully different colors.
   - What's unclear: Whether the empty state needs a stronger differentiation too (e.g., `ring-gray-300` or `ring-gray-400`)
   - Recommendation: No change — D-04 is explicit that default remains `ring-gray-200`. Out of scope.

## Environment Availability

> **SKIPPED — no external dependencies identified.** This phase is a single-file code change with no new tool installs. All required tooling (Node 22, npm 11.11.0, Playwright) is already in the project's dev environment per `STACK.md`.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified directly in code
- Architecture: HIGH — single integration point is well-understood
- Pitfalls: HIGH — primary risk (Tailwind cascade tie) and secondary risk (embed API) verified against documented codebase patterns
- Validation Architecture: HIGH — existing test patterns verified
- Security Domain: HIGH — no applicable ASVS categories
- Risk Assessment: MEDIUM — `DocumentReadOnlyFields` side effect is unverified visually

**Research date:** 2026-06-19
**Valid until:** 30 days — this phase is small and well-bounded; changes to `FieldRootContainer` or `field-root-container-classes.ts` would invalidate this research.

---

## RESEARCH COMPLETE