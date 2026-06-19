# Codebase Structure

**Analysis Date:** 2026-06-19

## Directory Layout

```
documenso/
├── apps/
│   ├── remix/           # Main application (React Router v7 + Hono)
│   ├── docs/            # Documentation site (Next.js + Nextra)
│   └── openpage-api/    # Public analytics API
├── packages/
│   ├── api/             # REST API V1 (ts-rest, deprecated)
│   ├── trpc/            # tRPC API layer (V2 + internal)
│   ├── lib/             # Core business logic (the center of the universe)
│   ├── prisma/          # Database schema, client, migrations
│   ├── ui/              # UI component library (Shadcn + Radix + Tailwind)
│   ├── auth/            # Authentication (OAuth, Passkeys, Sessions)
│   ├── email/           # Email templates (React Email) + mailer
│   ├── signing/         # PDF signing (P12, GCloud KMS)
│   ├── ee/              # Enterprise Edition features
│   ├── assets/          # Static assets (images, fonts, etc.)
│   ├── app-tests/       # Playwright E2E tests
│   ├── tailwind-config/ # Shared Tailwind CSS configuration
│   └── tsconfig/        # Shared TypeScript configuration
├── docker/              # Docker Compose files (development + production)
├── scripts/             # Build/dev utility scripts
├── assets/              # Top-level brand assets
├── patches/             # patch-package patches
└── [config files]       # turbo.json, biome.json, lingui.config.ts, etc.
```

## Directory Purposes

### `apps/remix/` — Main Application

- **Purpose:** The primary Documenso application — a React Router v7 (Remix) app served by a Hono HTTP server.
- **Contains:** Route modules, React components, server entry point, Hono route definitions, middleware
- **Key files:**
  - `server/main.js` — Server entry point, boots Hono + React Router adapter
  - `server/router.ts` — Hono route definitions, middleware pipeline, API mounting
  - `server/context.ts` — Per-request context (request metadata)
  - `server/middleware.ts` — Hono middleware (redirects, team cookie)
  - `server/trpc/hono-trpc-remix.ts` — tRPC ↔ React Router adapter
  - `server/trpc/hono-trpc-open-api.ts` — tRPC ↔ OpenAPI adapter
  - `app/root.tsx` — Root layout: session, theme, locale, providers
  - `app/entry.client.tsx` — Client-side hydration
  - `app/entry.server.tsx` — Server-side rendering
  - `app/routes.ts` — Flat route configuration
  - `vite.config.ts` — Vite build configuration
  - `react-router.config.ts` — React Router configuration

### `apps/remix/app/routes/` — React Router Route Groups

- **Purpose:** All page routes organized by access level and domain using flat-routes convention (`remix-flat-routes`).
- **Route groups:**
  - `_authenticated+/` — Authenticated pages (dashboard, inbox, admin, settings, teams, orgs)
  - `_unauthenticated+/` — Public pages (signin, signup, forgot-password, verify-email)
  - `_recipient+/` — Signing flows (sign.$token+, d.$token+, report.$token+)
  - `_share+/` — Public document sharing (share.$slug)
  - `_profile+/` — Public user profiles (p.$url)
  - `_internal+/` — Internal pages (HTML-to-PDF rendering)
  - `_redirects+/` — URL redirects
  - `embed+/` — Embedded signing flows (v0, v1, v2, playground)
  - `api+/` — App-specific API routes (avatar, branding, health, locale, stripe webhook, theme)
- **Naming convention:** Route groups use `+` suffix for directory-based routes. Files use kebab-case with RR7 param syntax (`$token`, `$id`).

### `apps/remix/app/components/` — App-Specific Components

- **Purpose:** Components specific to the Remix app, not reusable across projects.
- **Contains:**
  - `dialogs/` — Modal dialogs
  - `embed/` — Embed-specific components
  - `filters/` — List filters
  - `forms/` — Form components
  - `general/` — General UI (generic-error-layout)
  - `tables/` — Table components

### `apps/remix/app/providers/` — React Context Providers

- **Purpose:** React context providers for cross-cutting concerns
- **Contains:** `team.tsx` — Team/provider context

### `apps/remix/server/api/` — Hono API Sub-routes

- **Purpose:** Hono sub-routers for app-specific API endpoints not covered by tRPC/REST
- **Contains:**
  - `ai/` — AI-related endpoints
  - `download/` — Document download endpoints
  - `files/` — File upload/presigned URL endpoints

### `packages/lib/` — Core Library

- **Purpose:** Central business logic package. Every other package depends on this.
- **Structure:**
  - `server-only/` — 38 subdirectories, each a domain module (document, envelope, recipient, field, template, auth, team, organisation, webhooks, pdf, user, etc.). Each directory contains `*.ts` files for individual functions.
  - `client-only/` — Browser code: hooks (20 custom hooks), providers (6 context providers), utilities
  - `universal/` — Code usable in both environments: crypto, upload interfaces, stripe, webhook helpers
  - `jobs/` — Background job system: `client.ts` (provider interface), `client/` (provider implementations: local, bullmq, inngest), `definitions/` (job definitions split into `emails/` and `internal/`)
  - `errors/` — `app-error.ts` (AppError class + AppErrorCode enum), `user-exists.ts`
  - `constants/` — 34 constant files covering documents, auth, billing, branding, features, etc.
  - `types/` — 36 TypeScript type/interface files for domains
  - `schemas/` — Shared Zod schemas (`common.ts` with URL validation)
  - `utils/` — 43 utility modules (env, logger, fields, recipients, teams, i18n, etc.)
  - `translations/` — Lingui locale catalogs (12 languages)
  - `advanced-fields-validation/` — Advanced field type validation (checkbox, dropdown, number, radio, text)
  - `plain/` — Plain (external) integration logic

### `packages/trpc/` — tRPC API Layer

- **Purpose:** Type-safe procedure definitions and React client.
- **Structure:**
  - `server/` — Server-side:
    - `trpc.ts` — Core tRPC initialization, middleware (authenticated, admin, maybeAuthenticated, base procedure)
    - `context.ts` — tRPC context creation (session, team, logger, request metadata)
    - `router.ts` — App router composition (imports all domain routers)
    - `schema.ts` — Shared tRPC schemas
    - `open-api.ts` — OpenAPI document generation from tRPC
    - `{domain}-router/` — Domain routers, each containing:
      - `router.ts` — Composes sub-procedures
      - `schema.ts` — Domain-specific Zod schemas
      - `{action}.ts` — Individual procedure handler (one file per endpoint)
      - `{action}.types.ts` — Request/Response Zod schemas for that procedure
  - `react/` — Client-side React provider and hooks (`index.tsx`)
  - `utils/` — Shared utilities (`data-transformer.ts`)

### `packages/prisma/` — Database Layer

- **Purpose:** Single source of truth for the data model.
- **Contains:**
  - `schema.prisma` — Full schema (~1274 lines, ~40+ models)
  - `client.ts` — Re-exports `@prisma/client`
  - `migrations/` — Prisma migration history
  - `seed/` — Seed scripts
  - `seed-database.ts` — Seed entry point
  - `guards/` — Type guards for domain models
  - `types/` — Extended type definitions (document-with-recipient, field-with-signature, etc.)
  - `utils/` — Utility helpers (`remember.ts`)
  - `prisma-middleware.ts` — Prisma client middleware
- **Generators:** prisma-client-js, prisma-kysely, prisma-json-types-generator, zod-prisma-types

### `packages/ui/` — UI Component Library

- **Purpose:** Reusable UI components built on Shadcn UI, Radix, and Tailwind CSS.
- **Structure:**
  - `primitives/` — 60+ primitive components (button, dialog, form, table, card, etc.)
  - `components/` — Higher-level domain components:
    - `common/` — Copy-text-button, language-switcher, local-time
    - `document/` — Document-related components
    - `field/` — Field-related components
    - `recipient/` — Recipient-related components
    - `template/` — Template-related components
    - `animate/` — Animation wrappers
  - `icons/` — Icon components
  - `lib/` — UI utility functions
  - `styles/` — Global styles

### `packages/auth/` — Authentication

- **Purpose:** Complete auth system including OAuth, Passkeys, Sessions, 2FA.
- **Structure:**
  - `server/` — Server-side auth:
    - `index.ts` — Hono route mounting for `/api/auth/*`
    - `config.ts` — Auth configuration
    - `routes/` — 9 route files (account, callback, email-password, oauth, passkey, session, sign-out, two-factor)
    - `lib/` — Auth internals: `session/` (session management), `utils/` (get-session helpers), `errors/` (auth-specific errors)
    - `types/` — Auth-specific types
  - `client/` — Client-side auth utilities

### `packages/email/` — Email System

- **Purpose:** Transactional email templates and sending.
- **Structure:**
  - `templates/` — 28 React Email template components
  - `template-components/` — 21 reusable email template sub-components
  - `transports/` — Email transport implementations (SMTP, Resend, MailChannels)
  - `providers/` — Provider selection logic
  - `mailer.ts` — Email sending entry point
  - `render.tsx` — Email rendering utilities
  - `utils/` — Email utilities
  - `components.ts` — Shared email components

### `packages/signing/` — PDF Signing

- **Purpose:** Cryptographic document signing.
- **Structure:**
  - `transports/` — Signing transport implementations (local P12, Google Cloud KMS proxy)
  - `helpers/` — Signing helpers

### `packages/ee/` — Enterprise Edition

- **Purpose:** Closed-source enterprise features.
- **Structure:**
  - `server-only/` — Server-only EE features:
    - `limits/` — Document/email/api usage limits
    - `signing/` — CSC (Cloud Signature Consortium) QES signing
    - `stripe/` — Stripe billing
    - `lib/` — EE shared utilities

## Key File Locations

**Entry Points:**
- `apps/remix/server/main.js` — Server bootstrap (Hono + React Router adapter)
- `apps/remix/app/entry.client.tsx` — Client hydration
- `apps/remix/app/entry.server.tsx` — Server rendering
- `apps/remix/app/root.tsx` — Root layout + provider tree

**Configuration:**
- `turbo.json` — Turborepo pipeline configuration
- `biome.json` — Linting and formatting
- `lingui.config.ts` — i18n configuration
- `commitlint.config.cjs` — Commit message conventions
- `lint-staged.config.cjs` — Pre-commit linting
- `apps/remix/vite.config.ts` — Vite build config
- `apps/remix/tailwind.config.ts` — Tailwind config
- `apps/remix/react-router.config.ts` — React Router config

**Core Logic:**
- `packages/lib/server-only/` — All business logic by domain
- `packages/lib/universal/upload/` — Upload provider abstraction
- `packages/lib/jobs/client/` — Job provider implementations
- `packages/lib/errors/app-error.ts` — Application error framework
- `packages/lib/utils/logger.ts` — Pino logger setup
- `packages/lib/utils/env.ts` — Environment variable access

**Database:**
- `packages/prisma/schema.prisma` — Full data model definition
- `packages/prisma/migrations/` — Migration history

**API Layer:**
- `packages/trpc/server/router.ts` — tRPC app router composition
- `packages/trpc/server/trpc.ts` — tRPC middleware + procedure factories
- `packages/trpc/server/context.ts` — tRPC context factory
- `packages/trpc/react/index.tsx` — React client provider
- `packages/trpc/server/open-api.ts` — OpenAPI spec generation
- `packages/api/v1/contract.ts` — ts-rest contract for V1 API

**Testing:**
- `packages/app-tests/` — Playwright E2E tests
- `packages/lib/vitest.config.ts` — Vitest config for unit tests
- `packages/lib/server-only/webhooks/assert-webhook-url.test.ts` — Example unit test

## Naming Conventions

**Files:**
- kebab-case for most files: `get-document-by-token.ts`, `create-document.ts`
- PascalCase for React components: `button.tsx`, `dialog.tsx` (files export PascalCase components)
- `.types.ts` suffix for tRPC procedure type definitions: `get-document.types.ts`
- `.handler.ts` suffix for job handlers: `seal-document.handler.ts`
- `.test.ts` suffix for tests (co-located): `assert-webhook-url.test.ts`

**Directories:**
- kebab-case for route directories: `_authenticated+`, `document-router/`, `envelope-router/`
- kebab-case with `+` suffix for React Router flat-route groups: `_authenticated+`, `_recipient+`, `sign.$token+`
- kebab-case for domain directories: `server-only/document/`, `server-only/envelope/`, `lib/jobs/`

**Functions:**
- camelCase for all functions: `getDocumentWithDetailsById()`, `createEnvelope()`
- Verb-noun pairs: `createDocument`, `sendEmail`, `findRecipients`

**Types:**
- PascalCase for types/interfaces: `AppRouter`, `TrpcContext`, `HonoEnv`
- `Z` prefix for Zod schemas: `ZCreateDocumentRequestSchema`, `ZGetDocumentResponseSchema`
- `AppErrorCode` enum for error codes

## Where to Add New Code

**New Feature (e.g., "bulk download"):**
1. **tRPC procedure** → `packages/trpc/server/{domain}-router/{action}.ts` + `{action}.types.ts`
2. **Business logic** → `packages/lib/server-only/{domain}/{action}.ts`
3. **Register in router** → Update `packages/trpc/server/{domain}-router/router.ts`
4. **UI page** → `apps/remix/app/routes/_authenticated+/{route}.tsx`
5. **UI components** → `packages/ui/components/{domain}/` or `apps/remix/app/components/`
6. **Tests** → Co-located `*.test.ts` or `packages/app-tests/`

**New API Endpoint (V2):**
1. **Procedure file** → `packages/trpc/server/{domain}-router/{action}.ts`
2. **Types file** → `packages/trpc/server/{domain}-router/{action}.types.ts`
3. **OpenAPI meta** → Add `.meta({ openapi: { enabled: true, method, path } })`
4. **Register** → `packages/trpc/server/{domain}-router/router.ts`

**New Background Job:**
1. **Definition** → `packages/lib/jobs/definitions/{emails|internal}/{name}.ts`
2. **Handler** → `packages/lib/jobs/definitions/{emails|internal}/{name}.handler.ts`

**New Email Template:**
1. **Template** → `packages/email/templates/{name}.tsx`
2. **Sub-components** → `packages/email/template-components/`

**New UI Component:**
1. **Primitive** → `packages/ui/primitives/{name}.tsx`
2. **Domain component** → `packages/ui/components/{domain}/`

## Special Directories

**.planning/:**
- Purpose: GSD planning artifacts (codebase mapping, plans, roadmaps)
- Generated: Yes
- Committed: Yes

**.agents/:**
- Purpose: GSD agent skills and configurations
- Generated: No
- Committed: Yes

**docker/:**
- Purpose: Docker Compose files for development and production
- Contains: `development/compose.yml` (PostgreSQL, Inbucket, MinIO), production configs
- Committed: Yes

**patches/:**
- Purpose: patch-package patches for dependency fixes
- Generated: Yes (manually created)
- Committed: Yes

**packages/prisma/migrations/:**
- Purpose: Database migration files
- Generated: Yes (by Prisma)
- Committed: Yes

---

*Structure analysis: 2026-06-19*
