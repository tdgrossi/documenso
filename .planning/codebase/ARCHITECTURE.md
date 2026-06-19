<!-- refreshed: 2026-06-19 -->
# Architecture

**Analysis Date:** 2026-06-19

## System Overview

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                         Remix App (Hono Server)                            │
│                            apps/remix/                                      │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────────┤
│  /api/v1/*   │  /api/v2/*   │ /api/trpc/*  │  /api/jobs/* │  React Router  │
│  (ts-rest)   │  (tRPC OAI)  │   (tRPC)     │  (Inngest)   │  UI routes     │
├──────┴───────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴────────────┤
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐ │
│  │ @api     │ │ @trpc    │ │ @lib     │ │ @email   │ │ @signing          │ │
│  │ (REST)   │ │ (tRPC)   │ │ (CORE)   │ │ (React   │ │ (PDF)             │ │
│  │          │ │          │ │          │ │  Email)  │ │                   │ │
│  └──────────┘ └──────────┘ └─────┬────┘ └──────────┘ └───────────────────┘ │
│                                  │                                          │
│              ┌───────────────────┼──────────────────┐                       │
│              │                   │                  │                       │
│         ┌────▼────┐        ┌─────▼─────┐      ┌─────▼─────┐                │
│         │ Storage │        │   Jobs    │      │    PDF    │                │
│         │Provider │        │  Provider │      │  Signing  │                │
│         └────┬────┘        └─────┬─────┘      └─────┬─────┘                │
│              │                  │                  │                        │
└──────────────┼──────────────────┼──────────────────┼────────────────────────┘
               │                  │                  │
        ┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐
        │  PostgreSQL  │    │Inngest/BullMQ│    │Google KMS/ │
        │  (S3/MinIO)  │    │  /Local DB  │    │ Local P12   │
        └─────────────┘    └─────────────┘    └─────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Hono Server | HTTP entry point, middleware, route mounting | `apps/remix/server/router.ts` |
| React Router UI | Client-rendered pages and loaders | `apps/remix/app/routes/` |
| tRPC Layer | Type-safe RPC API procedures | `packages/trpc/server/` |
| REST API V1 | ts-rest contract-based REST endpoints | `packages/api/v1/` |
| Core Logic | Business logic (server-only, client-only, universal) | `packages/lib/` |
| Database | Prisma ORM + Kysely on PostgreSQL | `packages/prisma/` |
| UI Library | Shadcn/Radix component library | `packages/ui/` |
| Auth | Authentication (OAuth, WebAuthn, Passkeys) | `packages/auth/` |
| Email | React Email templates + Nodemailer | `packages/email/` |
| PDF Signing | Cryptographic PDF signing | `packages/signing/` |
| EE Features | Enterprise-only features | `packages/ee/` |

## Pattern Overview

**Overall:** Monorepo with domain-oriented vertical slices. Each feature (document, envelope, template, recipient, field, folder) owns its own tRPC routes, business logic, and database access. The codebase uses a **layered onion** architecture with strict import boundaries between server-only, client-only, and universal code.

**Key Characteristics:**
- **Monorepo** managed by npm workspaces + Turborepo
- **Domain-oriented tRPC routers** — each feature has a subdirectory under `packages/trpc/server/` and under `packages/lib/server-only/`
- **Provider strategy pattern** — Storage, Signing, Email, and Jobs are swappable via env vars using `ts-pattern` for dispatch
- **Zod-first validation** — schemas defined at router boundaries, auto-generated from prisma in some cases
- **Pino structured logging** — child loggers with request context passed through tRPC context

## Layers

### Hono Server Layer
- **Purpose:** HTTP entry point, mounts all API routes and static serving
- **Location:** `apps/remix/server/router.ts`
- **Entry:** `apps/remix/server/main.js` — boots Hono + React Router adapter
- **Contains:** Route definition, middleware (CORS, rate limiting, security headers, request context), redirects
- **Depends on:** All packages (`@documenso/api`, `@documenso/trpc`, `@documenso/lib`, `@documenso/auth`)
- **Used by:** Browser, API clients

### React Router UI Layer
- **Purpose:** Server-rendered + client-hydrated pages
- **Location:** `apps/remix/app/routes/`
- **Contains:** Route modules with loaders/actions, React components
- **Depends on:** `@documenso/trpc/react`, `@documenso/ui`, `@documenso/lib/client-only`
- **Used by:** Browser

### tRPC API Layer (V2 + Internal)
- **Purpose:** Type-safe RPC procedures for frontend and external API consumers
- **Location:** `packages/trpc/server/`
- **Contains:** Routers, procedures (queries/mutations), middleware (auth), Zod schemas, types files
- **Depends on:** `@documenso/lib/server-only` for business logic, `@documenso/prisma` for database
- **Used by:** React frontend (via `@documenso/trpc/react`), API clients (via trpc-to-openapi)

### REST API Layer (V1 — Deprecated)
- **Purpose:** Legacy REST API endpoints
- **Location:** `packages/api/v1/`
- **Contains:** ts-rest contract, implementation handlers, middleware
- **Used by:** External API consumers (maintained but deprecated)

### Core Business Logic Layer
- **Purpose:** All server-side business logic, divided into domain modules
- **Location:** `packages/lib/server-only/`
- **Contains:** ~38 domain directories (document, envelope, recipient, field, template, auth, team, organisation, webhooks, pdf, etc.)
- **Depends on:** `@documenso/prisma`, `@documenso/signing`, `@documenso/email`, `@documenso/lib/universal`
- **Used by:** tRPC router procedures, job handlers, REST handlers

### Database Layer
- **Purpose:** Schema definition, migrations, client generation
- **Location:** `packages/prisma/`
- **Contains:** `schema.prisma` (1274 lines, ~40+ models), Prisma client, Kysely types, Zod generators
- **Data model:** PostgreSQL with models: User, Envelope, EnvelopeItem, Recipient, Field, Signature, DocumentData, DocumentMeta, DocumentAuditLog, Organisation, Team, Folder, ApiToken, Webhook, Subscription, Passkey, etc.

## Data Flow

### Primary Request Path — Web Application

1. **Browser request** → Hono server (`apps/remix/server/main.js`)
2. **Middleware chain** on the Hono app (`apps/remix/server/router.ts`):
   - `contextStorage()` — per-request storage
   - `appContext` — extract request metadata, session cookie, IP
   - `securityHeadersMiddleware` — CSP, nonce for SRI
   - `appMiddleware` — redirect handling, team cookie setting
   - `requestId()` — generate request ID
   - Logger creation with bound metadata
3. **Route matching** in Hono:
   - `/api/v1/*` → ts-rest REST handlers (`packages/api/`)
   - `/api/v2/*` → tRPC OpenAPI handlers (`packages/trpc/server/`)
   - `/api/trpc/*` → tRPC internal handlers (`packages/trpc/server/`)
   - `/api/jobs/*` → Inngest handler (`packages/lib/jobs/client/`)
   - `/api/auth/*` → Auth routes (`packages/auth/server/`)
   - `/api/files/*` → File upload/download routes
   - `/*` → React Router handler
4. **React Router** loads route module → calls loader/action → renders component
   - Loaders call tRPC procedures or direct server functions
   - Components use `@documenso/ui` primitives and `@documenso/trpc/react` for data access

### tRPC Procedure Flow

1. **tRPC context creation** (`packages/trpc/server/context.ts`):
   - Extracts session via `getOptionalSession`
   - Reads `x-team-id` header for team scoping
   - Creates child logger with request context
2. **Middleware chain** (`packages/trpc/server/trpc.ts`):
   - `procedureMiddleware` — base logging
   - `authenticatedMiddleware` — session or API token auth
   - `adminMiddleware` — admin role check
3. **Route handler** — e.g. `get-document.ts`:
   - Validates input via Zod schema
   - Calls `@documenso/lib/server-only/document/` business logic
   - Returns typed response
4. **Response** → superjson-transformed → client

### Document Signing Flow

1. **Upload Document** → `create-document.ts` → `convertToPdf()` → `putNormalizedPdfFileServerSide()` → Storage provider
2. **Add Recipients** → `set-document-recipients.ts` → creates Recipient records
3. **Add Fields** → `set-fields-for-document.ts` → creates Field records
4. **Send Document** → `send-document.ts` → triggers `send.signing.requested.email` job
5. **Email Job** → email provider sends signing link to recipient
6. **Recipient Signs** → `sign-field-with-token.ts` → creates Signature → triggers `internal.seal-document` job
7. **seal-document Job** → Signing provider cryptographically signs PDF → Storage provider stores signed PDF

## Key Abstractions

### tRPC Routers
- **Purpose:** Organize API procedures by domain
- **Examples:**
  - `packages/trpc/server/document-router/` — 47 files, each procedure in own file + .types.ts
  - `packages/trpc/server/envelope-router/` — envelope operations
  - `packages/trpc/server/template-router/` — template operations
- **Pattern:** Each router directory has `router.ts` (composes sub-procedures) + `schema.ts` (shared Zod schemas) + individual `{action}.ts` + `{action}.types.ts` files

### Provider Strategy
- **Purpose:** Swappable implementations for infrastructure concerns
- **Location:** Various — `packages/lib/universal/upload/providers/`, `packages/lib/jobs/client/`, `packages/signing/transports/`, `packages/email/transports/`
- **Mechanism:** Environment variable selects provider, `ts-pattern` dispatches to the correct implementation
- **Providers:**
  - Storage: `database` | `s3`
  - Signing: `local` | `gcloud-hsm`
  - Email: `smtp-auth` | `smtp-api` | `resend` | `mailchannels`
  - Jobs: `local` | `bullmq` | `inngest`

### Server-Only / Client-Only / Universal Split
- **Purpose:** Enforce server-side code isolation, prevent client bundle leaks
- **Location:**
  - `packages/lib/server-only/` — all database-accessing logic, never bundled for client
  - `packages/lib/client-only/` — browser utilities, hooks, providers
  - `packages/lib/universal/` — shared code (types, validation, upload interfaces)
- **Pattern:** `server-only/` directories exist in `packages/lib/`, `packages/ee/`, and `packages/auth/`

### AppError
- **Purpose:** Structured application errors with typed error codes
- **File:** `packages/lib/errors/app-error.ts`
- **Pattern:** Custom `AppError` class with `AppErrorCode` enum (30+ codes). Frontend parses with `AppError.parse(error)` to extract code.

## Entry Points

### HTTP Server
- **Location:** `apps/remix/server/main.js`
- **Triggers:** `node build/server/main.js` or `npm run dev`
- **Responsibilities:** Bootstrap Hono, serve static assets, mount React Router, start telemetry + license client + cron

### Hono Router
- **Location:** `apps/remix/server/router.ts`
- **Triggers:** Each HTTP request
- **Responsibilities:** Middleware pipeline, route dispatch to tRPC/REST/React Router

### React Router Entry (Client)
- **Location:** `apps/remix/app/entry.client.tsx`
- **Responsibilities:** Hydrate React tree, initialize i18n + PostHog

### React Router Entry (Server)
- **Location:** `apps/remix/app/entry.server.tsx`
- **Responsibilities:** Server-side render React tree with i18n, stream response

### Root Layout
- **Location:** `apps/remix/app/root.tsx`
- **Responsibilities:** Load session, theme, locale; wrap app in providers (Theme, NuqsAdapter, Session, Tooltip, TrpcProvider, Toaster)

## Architectural Constraints

- **Single-threaded event loop:** Node.js with async I/O throughout; no worker threads used
- **Global state:** Module-level singletons in `packages/lib/jobs/client/` (provider selection cache), `packages/lib/utils/logger.ts` (root logger), `packages/lib/server-only/license/license-client.ts`, `packages/lib/server-only/telemetry/telemetry-client.ts`
- **Circular imports:** No known circular dependency chains. The package dependency graph is a DAG with `@documenso/lib` as the center node.
- **API auth:** API V2 supports both session cookies and Bearer API tokens. API V1 uses API tokens only.
- **Team scoping:** All procedures that operate on documents/recipients/fields accept an optional `teamId` from the tRPC context (populated from `x-team-id` header).
- **Rate limiting:** Database-backed rate limiting middleware applied per-route prefix (`/api/v1`, `/api/v2`, `/api/trpc`, `/api/ai`, `/api/files`).

## Anti-Patterns

### API V1 / V2 Coexistence
**What happens:** Two separate API stacks (ts-rest and tRPC-to-OpenAPI) serve overlapping concerns under `/api/v1/` and `/api/v2/`.
**Why it's wrong:** Maintains two code paths, two auth middlewares, and two documentation generation pipelines for the same domain.
**Do this instead:** Complete the V1→V2 migration and remove `packages/api/v1/`.

### Deprecated Endpoints in Active Routers
**What happens:** `documentRouter` in `packages/trpc/server/document-router/router.ts` exports deprecated procs like `downloadBeta` and `createDocumentTemporary` alongside active ones.
**Why it's wrong:** Increases surface area and confuses consumer expectations.
**Do this instead:** Move deprecated procs behind a dedicated namespace or remove them.

### Barrel Files with Re-exports
**What happens:** `packages/trpc/server/index.ts` re-exports everything from `@trpc/server`, creating a misleading import path.
**Why it's wrong:** Consumers importing from `@documenso/trpc/server` get the full trpc surface instead of just the app's custom setup.
**Do this instead:** Export only the app-specific `appRouter`, `createTrpcContext`, and related types.

## Error Handling

**Strategy:** `AppError` class with typed error codes (`AppErrorCode` enum) and Zod validation at every public boundary.

**Patterns:**
- tRPC errors: `AppError` is caught in `errorFormatter` and translated to TRPCError shapes with HTTP status codes
- Frontend catching: `const error = AppError.parse(error)` to extract the error code
- Zod validation: Every tRPC procedure validates input/output with Zod schemas
- HTTP errors: tRPC procedures throw `TRPCError` with standard codes (UNAUTHORIZED, FORBIDDEN, etc.)

## Cross-Cutting Concerns

**Logging:** Pino structured logger with per-request child loggers. Request metadata (IP, user agent, user ID, request ID) bound to each child logger. Controlled via `NEXT_PRIVATE_LOGGER_FILE_PATH`.

**Validation:** Zod schemas at every boundary. tRPC procedures have `.input()` and `.output()` schemas. Zod-prisma-types auto-generates Zod schemas from the Prisma schema. Separate `.types.ts` files define request/response schemas per procedure.

**Authentication:** Session-based (cookie) for web app, Bearer API token for API V1/V2. Auth middleware in `packages/auth/server/` with routes for OAuth (Google, OIDC), email/password, WebAuthn/Passkeys, and 2FA.

**i18n:** Lingui framework with compile-time message catalogs under `packages/lib/translations/`. 12 supported languages. `dynamicActivate()` called in entry points.

---

*Architecture analysis: 2026-06-19*
