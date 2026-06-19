# Codebase Concerns

**Analysis Date:** 2026-06-19

## Tech Debt

### RR7 Migration Incompleteness
- **Issue:** Multiple TODO(RR7) markers indicate a partial migration from the legacy Remix/Next.js auth stack to Remix v7 (React Router Framework). The migration is incomplete, leaving dead code paths and schema cruft.
- **Files:**
  - `packages/prisma/schema.prisma:27,44,51` — `IdentityProvider` enum, `User.password`, `User.identityProvider` fields marked for removal after RR7
  - `packages/lib/server-only/user/create-user.ts:33,38,46,54-55` — Commented-out RR7 account creation path, password drop TODO, and inline comments
  - `packages/auth/server/routes/email-password.ts:84` — Missing logging TODO
  - `packages/auth/server/lib/utils/get-session.ts:67` — "Rethink, this is pretty sketchy" for session handling
  - `packages/auth/server/lib/utils/handle-oauth-callback-url.ts:111,178` — Missing migration and logging TODOs
  - `packages/ee/server-only/lib/link-organisation-account.ts:135` — Missing account migration TODO
  - `packages/apps/remix/app/routes/_authenticated+/settings+/security._index.tsx:27` — Use providers instead after RR7
  - `packages/api/hono.ts:22` — Zapier methods TODO
- **Impact:** Schema stores deprecated fields, auth code has commented-out paths, risk of confusion between old/new auth paths.
- **Fix approach:** Complete the RR7 migration and clean up deprecated schema fields, commented-out code, and TODOs.

### Encryption Key Safety Check Disabled
- **Issue:** The validation that catches a default/insecure `NEXT_PRIVATE_ENCRYPTION_KEY` value of `"CAFEBABE"` is entirely commented out.
- **Files:** `packages/lib/constants/crypto.ts:7-27`
- **Impact:** If a production instance accidentally keeps the default `CAFEBABE` encryption key, there is no runtime warning. Encrypted data (OIDC client secrets, CSC service tokens, etc.) would be trivially decryptable by anyone who reads the public source.
- **Fix approach:** Re-enable the boot-time validation (or at minimum a `console.warn`) when `DOCUMENSO_ENCRYPTION_KEY` equals the known-default value.

### Encryption Key Not Required at Boot
- **Issue:** `DOCUMENSO_ENCRYPTION_KEY` and `DOCUMENSO_ENCRYPTION_SECONDARY_KEY` are read via `env()` which silently returns `undefined` if not set. There is no boot-time guard that the encryption keys are configured.
- **Files:** `packages/lib/constants/crypto.ts:3-5`
- **Impact:** An instance can boot without encryption keys, and the failure surfaces only when a feature that depends on encryption is exercised (e.g., organisation OIDC portal auth).
- **Fix approach:** Add explicit boot-time assertions for these keys, similar to how `requireEnv()` is used in the CSC transport.

### Prisma Extension Read Replica Type Casting
- **Issue:** The `readReplicas` extension is type-cast as `unknown as typeof prisma` because the augmented type is incompatible. Comment says "Nasty hack, means we can't do any fancy $primary/$replica queries."
- **Files:** `packages/prisma/index.ts:80-87`
- **Impact:** Type safety is lost for replica-aware queries. Developers cannot use `$primary()` or `$replica()` without manual casts.
- **Fix approach:** Find a typed wrapper or contribute upstream to the `@prisma/extension-read-replicas` types.

### Database URL Normalization Mutates `process.env`
- **Issue:** `getDatabaseUrl()` in `packages/prisma/helper.ts` directly mutates `process.env` variables to normalize the database URL from multiple env var sources (e.g., Vercel Postgres env vars). This is a side-effectful function that changes global state when called.
- **Files:** `packages/prisma/helper.ts:8-27,44`
- **Impact:** Calling `getDatabaseUrl()` has the side effect of setting `NEXT_PRIVATE_DATABASE_URL` and `NEXT_PRIVATE_DIRECT_DATABASE_URL` and modifying search params on the URL. Called during module initialization in `packages/prisma/index.ts`.
- **Fix approach:** Return the computed URL without mutating `process.env`. Use a local variable instead.

### Inngest Dead Dependency
- **Issue:** The `InngestJobProvider` class (`packages/lib/jobs/client/inngest.ts`) exists alongside the Local and BullMQ providers. It uses `@ai-sdk/google-vertex@3.0.81` which has a patch file (`patches/@ai-sdk+google-vertex+3.0.81.patch`) forcing a version bump to `"4.0.0-beta.73"` — meaning the installed version doesn't match the declared one. The Inngest SDK integration has 10+ eslint-disable directives for type safety violations.
- **Files:** `patches/@ai-sdk+google-vertex+3.0.81.patch`, `packages/lib/jobs/client/inngest.ts:41,52,102`
- **Impact:** The patch is a maintenance burden. The Inngest job provider has questionable production use.
- **Fix approach:** Either commit to full Inngest support (remove the patch by upgrading the dependency) or remove the Inngest provider entirely.

### `DANGEROUS_BYPASS_RATE_LIMITS` Production Risk
- **Issue:** An env var `DANGEROUS_BYPASS_RATE_LIMITS=true` completely disables rate limiting. Checking `process.env.DANGEROUS_BYPASS_RATE_LIMITS` at runtime means it can be set in production.
- **Files:**
  - `packages/lib/server-only/rate-limit/rate-limit.ts:73`
  - `packages/lib/server-only/rate-limit/assert-organisation-rates-and-limits.ts:32`
- **Impact:** Risk of accidental production use that would disable all API/document/email rate limits.
- **Fix approach:** Gate behind a compile-time constant or a more restrictive check (e.g., only allow in development).

### `@ai-sdk/google-vertex` Version Patching
- **Issue:** The `@ai-sdk/google-vertex@3.0.81` package is patched via `patch-package` to bump internal version strings and type definitions to `4.0.0-beta.73` / `ProviderV3` / `LanguageModelV3`. This means the codebase depends on types that don't ship with the declared npm version.
- **Files:** `patches/@ai-sdk+google-vertex+3.0.81.patch`, `package.json:89`
- **Impact:** Breaking on fresh installs if `patch-package` postinstall fails. Upgrades to `@ai-sdk/google-vertex` need to regenerate the patch.
- **Fix approach:** Upgrade to a version that natively supports ProviderV3 types, then remove the patch.

### `packages/trpc/server/trpc.ts` Ban-types Suppression
- **Issue:** `// eslint-disable-next-line @typescript-eslint/ban-types` is used at line 24 with `(string & {})` to work around OpenAPI content type typing limitations.
- **Files:** `packages/trpc/server/trpc.ts:24`
- **Impact:** Generic `string & {}` bypasses type safety for content types. This is a workaround for a trpc-to-openapi compatibility issue.
- **Fix approach:** Fix upstream or find a typed alternative for `contentTypes`.

### Legacy PDF Field Insertion
- **Issue:** Both old (`legacy-insert-field-in-pdf.ts`) and new (`insert-field-in-pdf-v1.ts`) PDF insertion code paths exist. The `Envelope` model has `useLegacyFieldInsertion: Boolean` and `internalVersion: Int` fields.
- **Files:**
  - `packages/lib/server-only/pdf/legacy-insert-field-in-pdf.ts`
  - `packages/lib/server-only/pdf/insert-field-in-pdf-v1.ts`
  - `packages/prisma/schema.prisma:453-454`
- **Impact:** Maintaining two PDF insertion implementations increases maintenance burden and surface area for bugs.
- **Fix approach:** Remove the legacy path once all documents have been migrated.

### Deprecated `Recipient.expired` Field
- **Issue:** The `Recipient.expired` field in the schema is marked as deprecated: "Not in use. To be removed in a future migration."
- **Files:** `packages/prisma/schema.prisma:638`
- **Impact:** Dead column in the database that still needs to be kept in sync.
- **Fix approach:** Create and run a migration to drop the column.

### Commented-Out Feature: `emailReplyToName`
- **Issue:** `OrganisationGlobalSettings` and `TeamGlobalSettings` have a commented-out `emailReplyToName` field.
- **Files:** `packages/prisma/schema.prisma:978` and `packages/prisma/schema.prisma:1021`
- **Impact:** Minor schema noise.
- **Fix approach:** Either implement or remove the field entirely.

---

## Known Bugs

### `getEnvelopeById` Returns Null Instead of 404
- **Issue:** `getEnvelopeById` returns `null` when the envelope is not found (via `prisma.envelope.findFirst`). Callers check `if (!envelope) { return { status: 404 } }` — but some callers in the V1 API implementation don't check for null properly, or throw generic `Error` instead of `AppError`.
- **Files:**
  - `packages/lib/server-only/envelope/get-envelope-by-id.ts`
  - `packages/api/v1/implementation.ts:1523-1524` — throws `new Error('Missing document data')` instead of `AppError`
- **Impact:** Stack traces from generic `Error` may leak internal details. Inconsistent error handling between routes.
- **Fix approach:** Replace `throw new Error(...)` with `throw new AppError(...)`.

### `console.error` Catch Blocks Without Structured Logging
- **Issue:** Many catch blocks throughout the server-side code use raw `console.error(err)` instead of structured logging through the `pino` logger. This means errors bypass the application's structured logging pipeline and can't be traced via request IDs.
- **Files (representative sample):**
  - `packages/lib/server-only/envelope/get-envelopes-by-ids.ts:146` — `console.error('[CRTICAL ERROR]: MUST NEVER HAPPEN')`
  - `packages/lib/server-only/envelope/get-envelope-by-id.ts:131` — same pattern (note typo "CRTICAL")
  - `packages/lib/server-only/webhooks/trigger/trigger-webhook.ts:34`
  - `packages/lib/server-only/team/create-team-email-verification.ts:82`
  - `packages/lib/server-only/team/update-team.ts:53`
  - `packages/lib/server-only/user/create-user.ts:67`
  - `packages/lib/server-only/user/send-confirmation-token.ts:62`
  - `packages/lib/server-only/organisation/create-organisation.ts:45,163,180`
  - `packages/lib/server-only/template/create-document-from-direct-template.ts:802`
  - `packages/lib/jobs/definitions/internal/bulk-send-template.handler.ts:138`
- **Impact:** Error observability is compromised. Production errors logged via `console.error` won't appear in structured log aggregation tools.
- **Fix approach:** Replace all `console.error` (and `console.log`/`console.warn`) in server-only code with the pino logger instance.

### `deleteField` Doesn't Verify Document Ownership
- **Issue:** In `packages/api/v1/implementation.ts:1616-1661`, the `deleteField` handler only verifies the field exists via `deleteDocumentField` but the `documentId` parameter is documented as unused: "documentId isn't actually used anywhere, so we just return it." The `unverifiedDocumentId` is reflected back in the response without validation.
- **Files:** `packages/api/v1/implementation.ts:1617-1645`
- **Impact:** The API response echoes back the caller-supplied `id` param even if it doesn't correspond to the actual field's document. Minor but confusing.
- **Fix approach:** Either validate the document ID or remove it from the response.

---

## Security Considerations

### Unauthenticated Routes with Direct Database Access
- **Issue:** Several routes are explicitly "unauthenticated public procedures" that directly access the database with minimal validation.
- **Files:**
  - `packages/trpc/server/document-router/share-document.ts:6` — "Note: This is an unauthenticated route."
  - `packages/trpc/server/envelope-router/sign-envelope-field.ts:14` — "Note that this is an unauthenticated public procedure route."
- **Impact:** These routes rely on recipient tokens for authorization which are passed in URLs. Token leakage (via referrer headers, logs, or shared links) grants access.
- **Mitigation:** Token-based auth is partially mitigated by required access auth checks (2FA, passkeys) for sensitive operations. But the surface area for token-based access is large.

### Embed Routes with Wildcard `frame-ancestors`
- **Issue:** Embed routes (`/embed/*`), signing routes (`/sign/:token`, `/d/:token`), and auth routes (`/signin`, etc.) all have `frame-ancestors *` in their CSP header. This is intentional for white-label embedding but means these pages can be iframed by any website.
- **Files:** `apps/remix/server/security-headers.ts:100-113`
- **Impact:** Clickjacking risk on signing and auth pages if a customer's integration is compromised. The code's own comments acknowledge this is a trade-off.
- **Fix approach:** Implement additional client-side frame-busting or require origin verification for sensitive operations within iframes.

### No Correlation Between `findMany` Queries for Multi-Tenant Isolation
- **Issue:** Many server-only functions fetch data using `findFirst`/`findMany` with a `userId` and/or `teamId` filter, but the filtering is manual in each query. The Kysely queries in `find-documents.ts` have complex, manually-crafted WHERE clauses for team access control. There is no centralized row-level security or Prisma middleware that enforces multi-tenant isolation.
- **Files:** `packages/lib/server-only/document/find-documents.ts:400-458` (team access filter logic), `packages/prisma/prisma-middleware.ts`
- **Impact:** Every new query must manually replicate the access control logic. A missed filter clause could expose documents across tenants.
- **Recommendation:** Consider Prisma client extensions or middleware to automatically apply tenant isolation.

### Telemetry Data Sent Without Explicit Consent
- **Issue:** The `telemetry-client.ts` sends usage data to a configured telemetry host by default. Disabling requires explicit `DOCUMENSO_DISABLE_TELEMETRY` or a license key.
- **Files:** `packages/lib/server-only/telemetry/telemetry-client.ts:13-17`
- **Impact:** Self-hosted instances may not be aware they're sending telemetry. The env var `TELEMETRY_KEY` and `TELEMETRY_HOST` default to some configured value.
- **Fix approach:** Default to opt-in (disabled) unless explicitly enabled via env var.

### Private Keys Stored in Database
- **Issue:** `EmailDomain` model stores DKIM private keys (`privateKey` field) in plaintext in the database.
- **Files:** `packages/prisma/schema.prisma:1189`
- **Impact:** Database compromise would expose DKIM signing keys, allowing email spoofing from the domain.
- **Fix approach:** Encrypt the private key at rest using the application encryption key.

### OIDC Client Secrets Can Be Stored in Database
- **Issue:** `OrganisationAuthenticationPortal` stores `clientSecret` and `clientId` as plaintext `String @default("")` fields.
- **Files:** `packages/prisma/schema.prisma:1249-1250`
- **Impact:** Database access leaks OIDC credentials. While some code paths use `symmetricDecrypt`, the schema allows plaintext storage.
- **Fix approach:** Always encrypt the `clientSecret` at the application layer before storing.

---

## Performance Bottlenecks

### `packages/api/v1/implementation.ts` — Monolithic File (1662 lines)
- **Problem:** The V1 API implementation is a single file with 1662 lines containing all route handlers. This file is imported by virtually everything in the API layer.
- **Files:** `packages/api/v1/implementation.ts`
- **Cause:** Original design placed all route handlers in one router definition.
- **Improvement path:** Split each endpoint group (documents, templates, fields, recipients, etc.) into separate files, similar to how `packages/trpc/server/` organizes routers.

### N+1 Query Risks in Document Queries
- **Problem:** `findDocuments` uses Kysely for the filtered/counted query to get IDs, then does a separate Prisma `findMany` with includes to hydrate. This two-phase pattern is intentional for performance (Kysely for filtering, Prisma for hydration), but the hydration query uses `include` which may generate JOINs rather than batched queries.
- **Files:** `packages/lib/server-only/document/find-documents.ts:513-524`
- **Improvement path:** Profile the hydration query to ensure the `include` recpipients/user/team/envelopeItems doesn't cause N+1 at scale. Consider `dataloader` patterns if needed.

### Large Component Files in UI Layer
- **Problem:** Multiple React component files exceed 1000 lines, making them hard to maintain and causing slow IDE performance.
- **Files (largest >1000 lines):**
  - `apps/remix/app/components/general/envelope-editor/envelope-editor-recipient-form.tsx`
  - `apps/remix/app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx`
  - `packages/ui/primitives/template-flow/add-template-fields.tsx`
  - `packages/ui/primitives/document-flow/add-signers.tsx`
  - `packages/ui/primitives/document-flow/add-fields.tsx`
- **Impact:** Difficult to understand component logic, increased cognitive load for modifications.
- **Improvement path:** Extract subcomponents and custom hooks from these large files.

### No Caching Layer for Frequent Queries
- **Problem:** The application does not use any caching layer (Redis, Memcached, or in-memory). Every document listing, recipient lookup, and template query hits PostgreSQL directly.
- **Files (representative):** All server-only functions in `packages/lib/server-only/` use direct Prisma queries.
- **Impact:** Under high load, repeated queries (e.g., document listing, recipient token lookups, signing page loads) will hammer the database without any caching.
- **Improvement path:** Add Redis-based caching for high-frequency read queries (document metadata, recipient info, templates, organization settings).

### Rate Limiter Uses Database for Every Check
- **Problem:** The rate limiter (`packages/lib/server-only/rate-limit/rate-limit.ts`) uses Prisma upserts on the `RateLimit` table for every rate-limited action. This adds database round-trips to every rate-limited API call.
- **Files:** `packages/lib/server-only/rate-limit/rate-limit.ts`
- **Impact:** Rate limiting itself adds latency to every action. Under high traffic, the rate limit table becomes a write bottleneck.
- **Improvement path:** Use Redis or an in-memory sliding window for rate limiting, falling back to the database only for distributed consistency when Redis is unavailable.

### Job Queue Logs Everything to `console`
- **Problem:** Both `local.ts` and `bullmq.ts` job providers use extensive `console.log` statements for every job lifecycle event (registration, triggering, completion, failure). This generates significant noise in production logs.
- **Files:**
  - `packages/lib/jobs/client/local.ts:78,114,166,254,275,314,378,453,461,463,464`
  - `packages/lib/jobs/client/bullmq.ts:73,77,80,126,129,221,226,242,267,367,375,377,378`
- **Impact:** Log pollution. Structured logging through pino is partially used but mixed with raw console calls.
- **Improvement path:** Remove all `console.log` from job providers and use structured logging exclusively.

---

## Fragile Areas

### Envelope Creation Flow (`create-envelope.ts`)
- **Files:** `packages/lib/server-only/envelope/create-envelope.ts`
- **Why fragile:** This file orchestrates creating an envelope with document data, recipients, fields, attachments, and audit logs in a single transaction with complex nesting. It has multiple `require-atomic-updates` suppressions, manual `createMany` with no return, and complex ordering requirements. Any change to the transaction ordering can break the entire document creation flow.
- **Test coverage:** Covered by E2E tests but has limited unit test coverage for the transaction logic.
- **Safe modification:** Make changes in small increments. Always test with E2E tests after any change to this file.

### Document Signing Completion (`complete-document-with-token.ts`)
- **Files:** `packages/lib/server-only/document/complete-document-with-token.ts`
- **Why fragile:** The document completion flow handles parallel vs sequential signing, field insertion, audit log creation, webhook triggering, and status updates. It interacts with multiple Prisma relations and the signing engine. Race conditions between parallel signers are a known risk.
- **Test coverage:** E2E tests cover basic signing flows but edge cases around sequential signing ordering and concurrent signers are under-tested.

### Stripe Webhook Handler
- **Files:** `packages/ee/server-only/stripe/webhook/handler.ts`
- **Why fragile:** Handles subscription lifecycle events from Stripe. Any mis-handling of webhook events can result in incorrect billing state, subscription sync failures, or duplicate processing. The webhook handler has multiple `eslint-disable` suppressions and type assertions.
- **Safe modification:** Always replay Stripe webhook events in test mode after changes. Maintain idempotency guarantees.

### Team and Organisation Access Control Logic
- **Files:** `packages/lib/server-only/document/find-documents.ts` (lines 400-458), multiple files in `packages/lib/server-only/organisation/`
- **Why fragile:** Multi-tenant access control is manually implemented with complex WHERE clause branches in every query. The team email-based access (allowing team members to see documents sent to their team email) adds significant complexity. A missed OR branch could lock users out or expose documents.
- **Test coverage:** E2E tests exist for basic team flows but edge cases (e.g., CC recipients in teams, mixed visibility scopes) are lightly tested.

### License Check Client
- **Files:** `packages/lib/server-only/license/license-client.ts`
- **Why fragile:** This file has 30+ `console.log`/`console.warn`/`console.error` calls, communicates with an external license server, and caches license files to disk. Network failures, disk write failures, or license server changes can cause unpredictable behavior (falling back to cached license, `unauthorizedFlagUsage` tracking, etc.).
- **Safe modification:** Always test behavior with and without network access to the license server.

### `packages/lib/server-only/envelope/get-envelopes-by-ids.ts` — Typo in Critical Error Message
- **Problem:** Critical error message says `[CRTICAL ERROR]` (missing `I`). Same typo in `get-envelope-by-id.ts:131`.
- **Files:**
  - `packages/lib/server-only/envelope/get-envelopes-by-ids.ts:146`
  - `packages/lib/server-only/envelope/get-envelope-by-id.ts:131`
- **Impact:** Minimal, but suggests these logging paths are rarely exercised (dead code risk).

---

## Scaling Limits

### `RateLimit` Table — Single Table for All Rate Limiting
- **Current capacity:** Uses a single PostgreSQL table with `@@id([key, action, bucket])` composite primary key. Every rate-limited action writes an upsert.
- **Limit:** At high throughput, writes to this table become contended. The table has a single index on `createdAt`.
- **Scaling path:** Move rate limiting to Redis. The database approach does not scale horizontally.

### `DocumentAuditLog` Table — No Data Retention Policy
- **Current capacity:** Every document action creates an audit log entry. The table has only one index on `envelopeId`.
- **Limit:** For organisations with high document volumes, this table will grow unbounded. No archival or retention mechanism exists.
- **Scaling path:** Add audit log retention policies, archival to cold storage, and an index on `createdAt` to support time-based queries and cleanup.

### `WebhookCall` Table — No Retention or Cleanup
- **Current capacity:** Every webhook delivery creates a `WebhookCall` record with full request/response bodies stored as JSON.
- **Limit:** No cleanup mechanism. Failed webhook deliveries accumulate indefinitely.
- **Scaling path:** Add TTL-based cleanup for old webhook call records.

---

## Dependencies at Risk

### `@ai-sdk/google-vertex@3.0.81` — Heavily Patched
- **Risk:** The patch overrides provider types to match a beta version. The package is declared at `3.0.81` but forced to `4.0.0-beta.73` via patch.
- **Impact:** npm install failures if `patch-package` postinstall fails. Future upgrades must regenerate the patch.
- **Migration plan:** Upgrade to the next stable version that natively supports ProviderV3.

### `typescript@5.6.2` — Overridden in `overrides`
- **Risk:** TypeScript 5.6.2 is pinned via `overrides`. The ecosystem has moved to 5.7+.
- **Impact:** Missing newer TypeScript features and fixes. Some packages may require newer TS for compatibility.
- **Migration plan:** Bump to latest TypeScript 5.8+ and fix any compilation errors.

### `zod@^3.25.76` — Overridden in `overrides`
- **Risk:** Zod 4 has been released. The codebase is pinned to 3.x via `overrides` (except `zod@^4.3.5` for `fumadocs-mdx`).
- **Impact:** Missing Zod 4 improvements. Dual zod versions in node_modules due to fumadocs override.
- **Migration plan:** Migrate to Zod 4 once all dependencies support it.

### `@prisma/extension-read-replicas@^0.4.1` — Alpha/Experimental
- **Risk:** This extension is pre-1.0 and has known type compatibility issues (the current codebase uses `as unknown as typeof prisma` to work around them).
- **Impact:** Breaking changes on minor version bumps. TypeScript compilation may break on upgrade.
- **Migration plan:** Monitor Prisma's roadmap for built-in replica support.

### `patch-package` — Build Step Dependency
- **Risk:** The postinstall script runs `patch-package`. If the patch fails to apply (e.g., after a dependency update or reinstall without the exact npm version), the entire build fails.
- **Impact:** CI breakage on fresh installs with slightly different dependency resolutions.
- **Migration plan:** Eliminate patches by upgrading dependencies to versions that don't need patching.

---

## Test Coverage Gaps

### Transactional Business Logic
- **What's not tested:** The complex Prisma transaction flows in `create-envelope.ts`, `complete-document-with-token.ts`, `send-document.ts`, and `create-document-from-template.ts`.
- **Files:** `packages/lib/server-only/envelope/create-envelope.ts`, `packages/lib/server-only/document/complete-document-with-token.ts`, `packages/lib/server-only/document/send-document.ts`, `packages/lib/server-only/template/create-document-from-template.ts`
- **Risk:** Race conditions, partial transaction failures, and rollback issues could silently corrupt document state.
- **Priority:** High

### Rate Limiting Edge Cases
- **What's not tested:** The rate limiter's behavior under concurrent requests, exact window boundary handling, and the interaction between global and per-action rate limits.
- **Files:** `packages/lib/server-only/rate-limit/rate-limit.ts`
- **Risk:** Rate limit bypass or false positives under high concurrency.
- **Priority:** Medium

### PDF Insertion (Legacy vs V1)
- **What's not tested:** The legacy vs v1 PDF field insertion code paths are not compared for identical output. The `useLegacyFieldInsertion` flag switching logic has no dedicated tests.
- **Files:** `packages/lib/server-only/pdf/legacy-insert-field-in-pdf.ts`, `packages/lib/server-only/pdf/insert-field-in-pdf-v1.ts`
- **Risk:** Documents rendered with different code paths may produce visually different PDFs.
- **Priority:** Medium

### Stripe Webhook Idempotency
- **What's not tested:** The Stripe webhook handler's idempotency guarantees under duplicate webhook delivery.
- **Files:** `packages/ee/server-only/stripe/webhook/handler.ts`
- **Risk:** Duplicate subscription updates can cause billing inconsistencies.
- **Priority:** High

---

## Quality & Maintainability

### Heavy Use of `eslint-disable` Suppressions (32+ instances)
- **Issue:** At least 32 eslint-disable comments exist across the packages directory, suppressing rules like `consistent-type-assertions`, `no-explicit-any`, `require-await`, `ban-types`, and `require-atomic-updates`.
- **Impact:** These suppressions indicate areas where type safety or async correctness is bypassed. Each is a potential source of runtime bugs.
- **Top offenders by rule:**
  - `consistent-type-assertions` — ~16 instances (mostly `as` assertions)
  - `no-explicit-any` — ~10 instances (loss of type safety)
  - `require-await` — ~6 instances (async functions that don't await)
  - `require-atomic-updates` — ~8 instances (potential race conditions)
  - `ban-types` — ~4 instances

### Inconsistent Error Handling
- **Issue:** Some routes throw `new Error(...)` while others throw `new AppError(...)` or use `throw new Response(...)` or return status response objects. The handling of errors in the TRPC layer is different from the API V1 layer.
- **Files:** Multiple — `packages/api/v1/implementation.ts` mixes `throw new Error`, `throw new AppError`, and `return { status: 4xx }`.
- **Impact:** Inconsistent error propagation makes debugging harder and may leak internal details in 500 errors.

---

*Concerns audit: 2026-06-19*
