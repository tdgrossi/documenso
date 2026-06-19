# External Integrations

**Analysis Date:** 2026-06-19

## APIs & External Services

**OAuth / Authentication Providers:**
- **Google OAuth** — Sign-in and sign-up via Google accounts
  - SDK: `arctic` ^3.7.0 (OAuth 2.0 client library)
  - Config: `packages/auth/server/config.ts` (lines 19-27)
  - Env vars: `NEXT_PRIVATE_GOOGLE_CLIENT_ID`, `NEXT_PRIVATE_GOOGLE_CLIENT_SECRET`
  - Endpoint: `POST /api/auth/authorize/google`, callback at `/api/auth/callback/google`
  - Well-known URL: `https://accounts.google.com/.well-known/openid-configuration`
- **Microsoft OAuth (Azure AD)** — Sign-in and sign-up via Microsoft accounts
  - SDK: `arctic` ^3.7.0
  - Config: `packages/auth/server/config.ts` (lines 29-37)
  - Env vars: `NEXT_PRIVATE_MICROSOFT_CLIENT_ID`, `NEXT_PRIVATE_MICROSOFT_CLIENT_SECRET`
  - Endpoint: `POST /api/auth/authorize/microsoft`, callback at `/api/auth/callback/microsoft`
  - Well-known URL: `https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration`
- **Generic OIDC** — Any OpenID Connect provider (custom/self-hosted identity)
  - SDK: `arctic` ^3.7.0
  - Config: `packages/auth/server/config.ts` (lines 39-47)
  - Env vars: `NEXT_PRIVATE_OIDC_WELL_KNOWN`, `NEXT_PRIVATE_OIDC_CLIENT_ID`, `NEXT_PRIVATE_OIDC_CLIENT_SECRET`, `NEXT_PRIVATE_OIDC_PROVIDER_LABEL`, `NEXT_PRIVATE_OIDC_SKIP_VERIFY`, `NEXT_PRIVATE_OIDC_PROMPT`
  - Endpoint: `POST /api/auth/authorize/oidc`, callback at `/api/auth/callback/oidc`
  - Supports bypass email verification via `NEXT_PRIVATE_OIDC_SKIP_VERIFY`
- **Organisation OIDC Portal** — Per-organisation OIDC authentication
  - Route: `POST /api/auth/authorize/oidc/org/:orgUrl`
  - Config: `packages/auth/server/lib/utils/organisation-portal.ts`
  - Uses `getOrganisationAuthenticationPortalOptions` to dynamically resolve org-specific OIDC settings

**Passkeys / WebAuthn:**
- **WebAuthn (FIDO2/Passkeys)** — Passwordless authentication
  - SDKs: `@simplewebauthn/browser` ^13.2.2, `@simplewebauthn/server` ^13.2.2
  - Server routes: `packages/auth/server/routes/passkey.ts`
  - Client integration: `packages/auth/client/index.ts`

**Payment Processing:**
- **Stripe** — Subscription billing (EE feature)
  - SDK: `stripe` ^12.18.0
  - Config: `packages/lib/server-only/stripe/index.ts` (singleton Stripe instance)
  - Env vars: `NEXT_PRIVATE_STRIPE_API_KEY`, `NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET`
  - Webhook handler: `packages/ee/server-only/stripe/webhook/`
  - Related services: `packages/ee/server-only/stripe/` — create-customer, create-checkout-session, get-portal-session, get-subscription, get-invoices, sync-stripe-customer-subscription, update-subscription-item-quantity
  - Stripe API version: `2022-11-15`

## AI Integration

- **Google Vertex AI (Gemini)** — AI-powered document features
  - SDK: `@ai-sdk/google-vertex` 3.0.81, `ai` ^5.0.104 (Vercel AI SDK)
  - Env vars: `GOOGLE_VERTEX_PROJECT_ID`, `GOOGLE_VERTEX_LOCATION` (default: "global"), `GOOGLE_VERTEX_API_KEY`
  - Routes: `apps/remix/server/api/ai/`

## Data Storage

**Databases:**
- **PostgreSQL 15** — Primary database (via Prisma ORM)
  - Connection: `NEXT_PRIVATE_DATABASE_URL`
  - Direct connection: `NEXT_PRIVATE_DIRECT_DATABASE_URL`
  - Read replicas: `NEXT_PRIVATE_DATABASE_REPLICA_URLS` (via `@prisma/extension-read-replicas`)
  - Client: `@prisma/client` ^6.19.0 with Prisma Migrate and Kysely query builder
  - Schema: `packages/prisma/schema.prisma` (1274 lines, ~30+ models)

**File Storage:**
- **Database storage (default)** — Document files stored as binary in PostgreSQL
  - Config: `NEXT_PUBLIC_UPLOAD_TRANSPORT=database`
- **S3-compatible storage** — Alternative file storage transport
  - SDK: `@aws-sdk/client-s3` ^3.998.0, `@aws-sdk/s3-request-presigner` ^3.998.0, `@aws-sdk/cloudfront-signer` ^3.998.0, `@aws-sdk/signature-v4-crt` ^3.998.0
  - Env vars: `NEXT_PRIVATE_UPLOAD_ENDPOINT`, `NEXT_PRIVATE_UPLOAD_FORCE_PATH_STYLE`, `NEXT_PRIVATE_UPLOAD_REGION`, `NEXT_PRIVATE_UPLOAD_BUCKET`, `NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID`, `NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY`, `NEXT_PRIVATE_UPLOAD_DISTRIBUTION_DOMAIN`, `NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_ID`, `NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_CONTENTS`
- **Azure Blob Storage** — Alternative file storage
  - SDK: `@azure/storage-blob` ^12.31.0
- **MinIO** — Development S3-compatible storage (Docker Compose, `docker/development/compose.yml`)

**Caching:**
- **Redis 8** — Job queue backend (BullMQ) and optional caching
  - Connection: `NEXT_PRIVATE_REDIS_URL` (default: `redis://localhost:63790`)
  - Key prefix: `NEXT_PRIVATE_REDIS_PREFIX` (default: "documenso")
  - Client: `ioredis` ^5.10.1

## Email

**Email Transport Options (configurable via `NEXT_PRIVATE_SMTP_TRANSPORT`):**
- **SMTP Auth** (default) — Standard SMTP with username/password
  - Config: `packages/email/mailer.ts` (lines 93-105)
  - Env vars: `NEXT_PRIVATE_SMTP_HOST`, `NEXT_PRIVATE_SMTP_PORT`, `NEXT_PRIVATE_SMTP_USERNAME`, `NEXT_PRIVATE_SMTP_PASSWORD`, `NEXT_PRIVATE_SMTP_SECURE`, `NEXT_PRIVATE_SMTP_UNSAFE_IGNORE_TLS`, `NEXT_PRIVATE_SMTP_SERVICE`, `NEXT_PRIVATE_SMTP_FROM_NAME`, `NEXT_PRIVATE_SMTP_FROM_ADDRESS`
- **SMTP API** — SMTP with API key auth
  - Env vars: `NEXT_PRIVATE_SMTP_HOST`, `NEXT_PRIVATE_SMTP_APIKEY_USER`, `NEXT_PRIVATE_SMTP_APIKEY`
- **Resend** — Resend.com email API
  - SDK: `resend` ^6.5.2, custom `@documenso/nodemailer-resend` 4.0.0 transport
  - Env var: `NEXT_PRIVATE_RESEND_API_KEY`
- **MailChannels** — MailChannels API for transactional email
  - Custom transport: `packages/email/transports/mailchannels.ts`
  - Env vars: `NEXT_PRIVATE_MAILCHANNELS_API_KEY`, `NEXT_PRIVATE_MAILCHANNELS_ENDPOINT`, `NEXT_PRIVATE_MAILCHANNELS_DKIM_DOMAIN`, `NEXT_PRIVATE_MAILCHANNELS_DKIM_SELECTOR`, `NEXT_PRIVATE_MAILCHANNELS_DKIM_PRIVATE_KEY`
- **AWS SES** — Email domain verification (EE feature)
  - SDK: `@aws-sdk/client-sesv2` ^3.998.0
  - Env vars: `NEXT_PRIVATE_SES_ACCESS_KEY_ID`, `NEXT_PRIVATE_SES_SECRET_ACCESS_KEY`, `NEXT_PRIVATE_SES_REGION`
  - Usage: `packages/ee/server-only/lib/sync-email-domains/`

**Email Templates:**
- Framework: `react-email` ^5.0.6 (development server on port 3002)
- Templates location: `packages/email/templates/` (25+ email templates)
- Rendering: `@react-email/render` 2.0.0 with Tailwind CSS
- Development: `npm run dev` in `packages/email/` starts email preview server

## Document Conversion

- **Gotenberg** — DOCX/Office to PDF conversion
  - Endpoint: `NEXT_PRIVATE_DOCUMENT_CONVERSION_URL` (default: `http://localhost:3005`)
  - Timeout: `NEXT_PRIVATE_DOCUMENT_CONVERSION_TIMEOUT_MS` (default 30s)
  - Auth: Basic auth via `NEXT_PRIVATE_DOCUMENT_CONVERSION_USERNAME` / `NEXT_PRIVATE_DOCUMENT_CONVERSION_PASSWORD`
  - Docker image: custom `documenso-dev-gotenberg:latest` (built from `docker/development/Dockerfile.gotenberg`)
  - SSRF protection: `--libreoffice-deny-private-ips` flag
  - Public flag: `NEXT_PUBLIC_DOCUMENT_CONVERSION_ENABLED` (derived from URL presence)

## Document Signing

- **Local P12/PFX Signing** — Default signing transport
  - Env vars: `NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH`, `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS`, `NEXT_PRIVATE_SIGNING_PASSPHRASE`
  - Implementation: `packages/signing/transports/local.ts`
- **Google Cloud HSM** — Cloud HSM-based signing
  - SDKs: `@google-cloud/kms` ^5.2.1, `@google-cloud/secret-manager` ^6.1.1
  - Env vars: `NEXT_PRIVATE_SIGNING_GCLOUD_HSM_KEY_PATH`, `NEXT_PRIVATE_SIGNING_GCLOUD_HSM_PUBLIC_CRT_FILE_PATH/CONTENTS`, `NEXT_PRIVATE_SIGNING_GCLOUD_HSM_CERT_CHAIN_FILE_PATH/CONTENTS`, `NEXT_PRIVATE_SIGNING_GCLOUD_HSM_SECRET_MANAGER_CERT_PATH`, `NEXT_PRIVATE_SIGNING_GCLOUD_APPLICATION_CREDENTIALS_CONTENTS`, `GOOGLE_APPLICATION_CREDENTIALS`
  - Implementation: `packages/signing/transports/google-cloud.ts`
- **CSC (Cloud Signature Consortium)** — Remote signing via CSC API
  - Env vars: `NEXT_PRIVATE_SIGNING_CSC_PROVIDER_BASE_URL`, `NEXT_PRIVATE_SIGNING_CSC_OAUTH_CLIENT_ID`, `NEXT_PRIVATE_SIGNING_CSC_OAUTH_CLIENT_SECRET`, `NEXT_PRIVATE_SIGNING_CSC_SIGNATURE_LEVEL` (AES/QES)
- **Timestamp Authority** — LTV/archival timestamps for signed PDFs
  - Env var: `NEXT_PRIVATE_SIGNING_TIMESTAMP_AUTHORITY` (comma-separated URLs)
- **Legacy Subfilter** — Optional `adbe.pkcs7.detached` subfilter via `NEXT_PRIVATE_USE_LEGACY_SIGNING_SUBFILTER`

## Authentication & Identity

**Session Auth:**
- **Custom session management** — Server-side sessions with database storage
  - Session lifetime: 30 days (`packages/auth/server/config.ts`, line 7)
  - Database model: `Session` in Prisma schema
  - Implementation: `packages/auth/server/routes/session.ts`
  - Session cookie managed via `@oslojs/crypto` and `@oslojs/encoding`

**Two-Factor Authentication:**
- **TOTP 2FA** — Time-based one-time passwords
  - Database: `twoFactorSecret`, `twoFactorEnabled`, `twoFactorBackupCodes` on User model
  - Routes: `packages/auth/server/routes/two-factor.ts`
- **Passkeys** — WebAuthn passwordless auth (see above)

**API Authentication:**
- **API Tokens** — Bearer token auth for programmatic access (v1 and v2 API)
  - Prefix: `api_` (standard convention)
  - Header: `Authorization: Bearer <token>` or `Authorization: api_<token>`
  - Implementation: `packages/trpc/server/trpc.ts` (lines 90-138) and `packages/api/v1/middleware/`
  - Database model: `ApiToken` in Prisma schema

**Rate Limiting:**
- Rate limiting system present (can be bypassed via `DANGEROUS_BYPASS_RATE_LIMITS` for E2E tests)
- Cron job: `cleanup-rate-limits` (`packages/lib/jobs/definitions/internal/cleanup-rate-limits.ts`)

## Monitoring & Observability

**Analytics:**
- **PostHog** — Product analytics and feature flags
  - Client SDK: `posthog-js` ^1.297.2
  - Server SDK: `posthog-node` 4.18.0
  - Config: `NEXT_PUBLIC_POSTHOG_KEY`
  - Server-side client: `packages/lib/server-only/telemetry/telemetry-client.ts`
  - Client-side hook: `packages/lib/client-only/hooks/use-analytics.ts`
  - Not strictly external: PostHog self-hosted or cloud

**Telemetry:**
- **Anonymous usage telemetry** — Self-hosted instances send anonymous usage data
  - Env: `DOCUMENSO_DISABLE_TELEMETRY` to disable
  - Keys: `NEXT_PRIVATE_TELEMETRY_KEY`, `NEXT_PRIVATE_TELEMETRY_HOST`
  - Baked into Docker image at build time (see `docker/Dockerfile`)

**Logging:**
- **Pino** ^9.14.0 — Structured JSON logging
  - Pretty-printing: `pino-pretty` ^13.1.2 (development)
  - Config: `NEXT_PRIVATE_LOGGER_FILE_PATH` (optional file output, disables stdout)
  - Usage: `ctx.logger` throughout tRPC procedures and server code

**Error Tracking:**
- Not detected (no Sentry, Datadog RUM, or similar in dependencies — only `@datadog/pprof` as dev dep for profiling)

**Browserless:**
- **Browserless** — Headless browser for document rendering/PDF generation
  - Env var: `NEXT_PRIVATE_BROWSERLESS_URL`
  - Config: `NEXT_PUBLIC_USE_INTERNAL_URL_BROWSERLESS`

## Customer Support

- **Plain** — Customer support platform integration
  - SDK: `@team-plain/typescript-sdk` ^5.11.0
  - Client: `packages/lib/plain/client.ts`
  - Env var: `NEXT_PRIVATE_PLAIN_API_KEY`

## Security & Anti-Bot

- **Cloudflare Turnstile** — CAPTCHA/challenge for sign-up and sign-in
  - SDK: `@marsidev/react-turnstile` ^1.5.0
  - Env vars: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PRIVATE_TURNSTILE_SECRET_KEY`
  - Visible challenge on sign-up, invisible on sign-in

## Webhooks & Callbacks

**Incoming Webhooks (user-configurable):**
- Users can configure outgoing webhooks triggered by document/envelope events
  - Events: document creation, sending, completion, signing, cancellation, viewing, etc.
  - Event triggers defined in Prisma model (`WebhookTriggerEvents`)
  - Config: `packages/trpc/server/webhook-router/` — CRUD operations
  - Trigger engine: `packages/lib/server-only/webhooks/trigger/trigger-webhook.ts`
  - Execution: `packages/lib/jobs/definitions/internal/execute-webhook.ts` (background job)
  - Webhook call persistence and retry: `packages/lib/server-only/webhooks/execute-webhook-call.ts`
  - Zapier integration: `packages/lib/server-only/webhooks/zapier/` (subscribe, unsubscribe, list-documents)
  - SSRF protection: `packages/lib/server-only/webhooks/assert-webhook-url.ts` blocks private IPs, with bypass via `NEXT_PRIVATE_WEBHOOK_SSRF_BYPASS_HOSTS`

**Incoming Stripe Webhooks:**
- **Stripe Webhook** — Subscription lifecycle events
  - Handler: `packages/ee/server-only/stripe/webhook/`
  - Secret: `NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET`

## Background Jobs

**Job Provider Options (configurable via `NEXT_PRIVATE_JOBS_PROVIDER`):**
- **Local** (default) — In-process job execution using `setTimeout`/`setInterval`
  - Implementation: `packages/lib/jobs/client/local.ts`
- **Inngest** — Cloud job orchestration
  - SDK: `inngest` ^3.54.0
  - Env vars: `NEXT_PRIVATE_INNGEST_APP_ID`, `INNGEST_EVENT_KEY` / `NEXT_PRIVATE_INNGEST_EVENT_KEY`
  - Development: `inngest dev -u http://localhost:3000/api/jobs`
  - Implementation: `packages/lib/jobs/client/inngest.ts`
- **BullMQ** — Redis-backed queue
  - SDK: `bullmq` ^5.71.1
  - Redis: `ioredis` ^5.10.1
  - Env vars: `NEXT_PRIVATE_REDIS_URL`, `NEXT_PRIVATE_REDIS_PREFIX`, `NEXT_PRIVATE_BULLMQ_CONCURRENCY`
  - Dashboard: Bull Board UI at Hono route
  - Implementation: `packages/lib/jobs/client/bullmq.ts`

**Defined Jobs (background tasks):**
- Email jobs: 14 email notification jobs (confirmation, signing, completion, rejection, expiration, reminders, etc.)
- Internal jobs: 12 jobs (webhook execution, document sealing, recipient expiration, signing reminders, rate limit cleanup, subscription sync, template bulk send, etc.)
- Definitions: `packages/lib/jobs/definitions/emails/` and `packages/lib/jobs/definitions/internal/`

## CI/CD & Deployment

**Hosting:**
- **Docker** — Primary deployment artifact (multi-stage Alpine build)
  - Dockerfile: `docker/Dockerfile` (3-stage: base, builder, runner)
  - Docker Compose: development, testing, and production compose files
- **Render** — Documented deployment target (`render.yaml`)
  - Service type: web, Node runtime, free plan
  - Health check: `/api/health`
- **Railway** — Alternative deployment target (`railway.toml`)
  - Builder: Dockerfile

**CI Pipeline:**
- **GitHub Actions** — CI/CD pipeline
  - CI: `.github/workflows/ci.yml` — Build app, build Docker image
  - E2E Tests: `.github/workflows/e2e-tests.yml`
  - Deploy: `.github/workflows/deploy.yml` — Tag push triggers release branch push
  - CodeQL: `.github/workflows/codeql-analysis.yml` — Security analysis
  - Dependabot: `.github/dependabot.yml` — Dependency updates
  - Labeler: `.github/labeler.yml` — PR/issue auto-labeling
  - Semantic PRs: `.github/workflows/semantic-pull-requests.yml`
  - Stale management: `.github/workflows/stale.yml`
  - Translation sync: Multiple workflows for Crowdin ↔ GitHub sync

**Publishing:**
- Docker image published via `.github/workflows/publish.yml`

## Environment Configuration

**Required env vars (core):**
- `NEXTAUTH_SECRET` — Session encryption secret
- `NEXT_PRIVATE_ENCRYPTION_KEY` — Encryption key (min 32 chars)
- `NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY` — Secondary encryption key
- `NEXT_PUBLIC_WEBAPP_URL` — Public-facing application URL
- `NEXT_PRIVATE_DATABASE_URL` — PostgreSQL connection string
- `NEXT_PRIVATE_DIRECT_DATABASE_URL` — Direct database connection (bypassing poolers)

**Required env vars (SMTP):**
- `NEXT_PRIVATE_SMTP_FROM_NAME` — Sender name for outgoing emails
- `NEXT_PRIVATE_SMTP_FROM_ADDRESS` — Sender email address

**Secrets location:**
- `.env` / `.env.local` — Local development (gitignored)
- `turbo.json` `globalEnv` — Declares all expected env vars
- Docker Compose environment variables — Production deployment
- Render.com — Sync or generate values per service
- Railway — Via Dockerfile build args

## Encryption & Cryptography

- **Symmetric encryption** — `@noble/ciphers` 0.6.0, `@noble/hashes` 1.8.0, `@scure/base` ^1.2.6
- **JWT / JOSE** — `jose` ^6.1.2
- **Password hashing** — `@node-rs/bcrypt` ^1.10.7
- **Crypto helpers** — `@oslojs/crypto` ^1.0.1, `@oslojs/encoding` ^1.1.0, `oslo` ^0.17.0

---

*Integration audit: 2026-06-19*
