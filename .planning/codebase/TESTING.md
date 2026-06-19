# Testing Patterns

**Analysis Date:** 2026-06-19

## Test Framework

**Unit Tests:**
- **Vitest** (config: `packages/lib/vitest.config.ts`)
- No separate assertion library — Vitest's built-in `expect` is used

```bash
# Run all unit tests (from package/lib, or via turbo)
npx vitest run
# Watch mode
npx vitest
```

**E2E Tests:**
- **Playwright** v1.56.1 (config: `packages/app-tests/playwright.config.ts`)
- Run commands from root:

```bash
npm run test:e2e                    # Run all E2E tests
npm run test:dev -w @documenso/app-tests  # Run single E2E in dev mode
npm run test-ui:dev -w @documenso/app-tests # Run E2E with Playwright UI
```

## Test File Organization

**Unit Tests (`*.test.ts`):**
- Co-located alongside source files in `packages/lib/`
- Mirror the source directory structure exactly
- Examples:
  - `packages/lib/utils/sanitize-branding-css.test.ts`
  - `packages/lib/server-only/webhooks/assert-webhook-url.test.ts`
  - `packages/lib/universal/field-renderer/field-canvas-style.test.ts`

**E2E Tests (`*.spec.ts`):**
- Located in `packages/app-tests/e2e/`
- Organized by feature area in subdirectories:
```
packages/app-tests/e2e/
├── api/
│   ├── v1/
│   └── v2/
│       └── unauthorized-api-access/
├── document-auth/
├── document-flow/
├── documents/
├── envelope-editor-v2/
├── envelopes/
├── features/
├── fixtures/
├── folders/
├── organisations/
├── pdf-viewer/
├── recipients/
├── scenarios/
├── templates/
├── templates-flow/
├── teams/
├── user/
└── webhooks/
```

**Naming:**
- Unit: `*.test.ts` (e.g., `sanitize-branding-css.test.ts`)
- E2E: `*.spec.ts` (e.g., `auth-flow.spec.ts`)
- Fixtures: `*.ts` in `e2e/fixtures/` (e.g., `authentication.ts`, `api-seeds.ts`)

## Test Structure

**Unit Tests (Vitest):**
```typescript
import { describe, expect, it } from 'vitest';
import { myFunction } from './my-function';

describe('myFunction', () => {
  describe('category name', () => {
    it('describes the expected behavior', () => {
      const result = myFunction(input);
      expect(result).toBe(expected);
    });
  });
});
```

**E2E Tests (Playwright):**
```typescript
import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test('[FEATURE_NAME]: description of what is tested', async ({ page }) => {
  // Setup (seed data, authenticate)
  const { user, team } = await seedUser();
  await apiSignin({ page, email: user.email, redirectPath: `/t/${team.url}/documents` });

  // Act (UI interactions)
  await page.goto('/settings/document');
  await page.getByRole('button', { name: 'Update' }).click();

  // Assert (UI and/or database verification)
  await expect(page.getByText('Settings updated')).toBeVisible();
  const settings = await prisma.settings.findUnique({ where: { teamId: team.id } });
  expect(settings.value).toBe('expected');
});
```

**Patterns:**
- E2E test names use bracketed feature prefix: `[ENVELOPE_EXPIRATION]: set custom expiration period`
- `test.describe.configure({ mode: 'parallel' })` for parallel execution
- `test.use({ storageState: { cookies: [], origins: [] } })` for unauthenticated tests
- `test.beforeEach` for shared setup (creating users, tokens, documents)
- UI assertions use Playwright's `toBeVisible()`, `toHaveText()`, `toHaveURL()`
- Database verification is performed directly via Prisma after UI actions
- API response verification uses `res.ok()`, `res.json()`, `expect(res.status()).toBe(200)`

## Mocking

**Unit Tests (Vitest):**
- **`vi`** from vitest for mocking (`vi.fn()`, `vi.mock()`, `vi.spyOn()`, `vi.hoisted()`)
- Dependency injection pattern: pass mock implementations as function options

```typescript
import { describe, expect, it, vi } from 'vitest';

// Mock factory helper
const fakeLookup = (addresses: Array<{ address: string; family: number }>) => {
  return vi.fn().mockResolvedValue(addresses);
};

// Pass mock as dependency injection parameter
await expect(assertNotPrivateUrl('https://evil.example.com', { lookup })).rejects.toThrow(AppError);

// Verify mock not called
expect(lookup).not.toHaveBeenCalled();

// Mock rejection
const lookup = vi.fn().mockRejectedValue(new Error('ENOTFOUND'));
```

**E2E Tests (Playwright):**
- No mocking of backend services (test against real DB with seed data)
- `page.context().request` for programmatic API calls within tests
- `apiSignin` fixture for authentication via API (not UI)

**What to Mock (unit tests):**
- External network calls (DNS lookups, HTTP calls)
- File system operations
- Unpredictable or slow dependencies

**What NOT to Mock:**
- Database queries in E2E tests (use real Prisma to verify state)
- Internal business logic (test the real implementation)

## Fixtures and Factories

**E2E Test Data:**
- Primary seed function: `seedUser()` from `@documenso/prisma/seed/users`
- Document seeds: `seedDraftDocument()`, `seedPendingDocument()`, `seedCompletedDocument()`, `seedBlankDocument()` from `@documenso/prisma/seed/documents`
- Team seeds: `seedTeam()`, `seedTeamEmail()`, `seedTeamMember()` from `@documenso/prisma/seed/teams`
- API V2 seed fixtures: `packages/app-tests/e2e/fixtures/api-seeds.ts`

```typescript
// Using Prisma seed functions (direct DB setup)
const { user, team } = await seedUser();
const { document } = await seedDraftDocument({ userId: user.id, teamId: team.id });

// Using API V2 seed fixtures (exercises real API endpoints)
const { envelope, token, user, team } = await apiSeedDraftDocument(request, {
  title: 'My Document',
  recipients: [{ email: 'signer@test.com', name: 'Signer', role: 'SIGNER' }],
});
```

**Location:**
- Prisma seeds: inside `packages/prisma/seed/`
- E2E fixtures: `packages/app-tests/e2e/fixtures/`
  - `authentication.ts` — `apiSignin`, `apiSignout`, `checkSessionValid`
  - `generic.ts` — `expectTextToBeVisible`, `openDropdownMenu`, `expectToastTextToBeVisible`
  - `api-seeds.ts` — `apiSeedDraftDocument`, `apiSeedPendingDocument`, `apiSeedTemplate`, `apiCreateEnvelope`, etc.
  - `signature.ts` — `signSignaturePad`
  - `documents.ts` — document creation helpers
  - `envelope-editor.ts` — envelope editor helpers
  - `konva.ts` — Canvas/Konva interaction helpers

## Coverage

**Requirements:** Not enforced (no coverage thresholds configured).

**View Coverage:**
```bash
npx vitest --coverage
```

**Current Coverage Gaps:**
- E2E tests cover most user-facing flows but are the primary quality gate
- Unit tests are sparse and only cover isolated utility functions
- Few server-only functions have unit tests
- No integration tests for Prisma queries outside E2E

## Test Types

**Unit Tests:**
- Scope: Pure utility functions, data transformations, validators, security assertions
- Approach: Test edge cases, valid/invalid inputs, error conditions
- Thoroughly cover categories: empty input, edge values, blocked/allowed categories, mixed scenarios
- Example patterns:
  - Parameterized tests via `for` loops (`for (const prop of blockedProperties)`)
  - Table-driven tests with arrays of tuples
  - Structured with nested `describe` blocks for each behavior category

```typescript
for (const prop of blockedProperties) {
  it(`strips the "${prop}" property`, () => {
    const result = sanitizeBrandingCss(`.x { ${prop}: 10px; color: red; }`);
    expect(result.css).not.toContain(`${prop}:`);
    expect(result.warnings).toHaveLength(1);
  });
}

const allowedProperties: Array<[string, string]> = [
  ['color', 'red'],
  ['background', '#fff'],
];
for (const [prop, value] of allowedProperties) {
  it(`keeps the "${prop}" property`, () => {
    expect(result.css).toContain(`${prop}: ${value}`);
  });
}
```

**Integration Tests:**
- Not separately categorized (E2E tests serve this role)
- `packages/app-tests/` E2E tests integrate with real Prisma database and API

**E2E Tests:**
- Scope: Full user workflows through the browser interface and API
- Approach:
  - Seed test data via Prisma or API V2 endpoints
  - Authenticate via `apiSignin` (API-based, faster than UI login)
  - Perform UI interactions with Playwright locators
  - Verify UI state changes AND database state via Prisma
- Projects in Playwright config:
  - `api` — API tests (10 workers, no browser)
  - `license` — License tests (1 worker, serial)
  - `ui` — UI tests (browser, adaptive workers based on CPU count)
- Video + trace captured on failure (`retain-on-failure`)
- Retries: 1 locally, 4 on CI
- Animations disabled via `__disable_animations` cookie for stable tests
- Timeout: 60s per test, 15s action timeout, 30s navigation timeout
- `fullyParallel: true` for parallel test execution

## Common Patterns

**Async Testing (Unit):**
```typescript
// Await async assertions
await expect(assertNotPrivateUrl('http://localhost')).rejects.toThrow(AppError);
await expect(assertNotPrivateUrl('https://example.com')).resolves.toBeUndefined();

// try/catch for error code verification
try {
  await assertNotPrivateUrl('http://localhost');
  expect.unreachable('should have thrown');
} catch (err) {
  expect(err).toBeInstanceOf(AppError);
  expect((err as AppError).code).toBe(AppErrorCode.WEBHOOK_INVALID_REQUEST);
}
```

**Error Testing (Unit):**
```typescript
it('returns undefined for non-finite or unparseable values', () => {
  expect(getPixelValue('')).toBeUndefined();
  expect(getPixelValue('auto')).toBeUndefined();
});
```

**Visual Comparison Testing (E2E):**
- Uses `pixelmatch` and `pngjs` for pixel-level canvas comparisons in signing tests
- Canvas-based signature pad interactions via `fixtures/signature.ts` and `fixtures/konva.ts`

**API E2E Testing Pattern:**
```typescript
import { expect, test } from '@playwright/test';
import { seedUser } from '@documenso/prisma/seed/users';
import { createApiToken } from '@documenso/lib/server-only/public-api/create-api-token';
import { apiSignin } from '../../fixtures/authentication';

test.describe.configure({ mode: 'parallel' });

test('[API] find envelopes returns expected data', async ({ request }) => {
  const { user, team } = await seedUser();
  const { token } = await createApiToken({ userId: user.id, teamId: team.id, tokenName: 'test', expiresIn: null });

  const res = await request.get(`${baseUrl}/envelope`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.count).toBe(0);
});
```

**Document Fixture Pattern:**
```typescript
// High-level seed (recommended for most tests)
const { envelope, token, user, team } = await apiSeedDraftDocument(request, {
  title: 'My Test Doc',
  recipients: [{ email: 'signer@test.com', name: 'Signer', role: 'SIGNER' }],
});

// Multi-document bulk seed
const { documents } = await apiSeedMultipleDraftDocuments(request, [
  { title: 'Doc A' },
  { title: 'Doc B' },
]);

// Context reuse for test isolation + efficiency
const ctx = await apiCreateTestContext('my-test');
const doc1 = await apiSeedDraftDocument(request, { context: ctx, title: '1' });
const doc2 = await apiSeedDraftDocument(request, { context: ctx, title: '2' });
```

---

*Testing analysis: 2026-06-19*
