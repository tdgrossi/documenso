# Agent Guidelines for Documenso

## Build/Test/Lint Commands

- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run lint:fix` - Auto-fix linting issues
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run test:dev -w @documenso/app-tests` - Run single E2E test in dev mode
- `npm run test-ui:dev -w @documenso/app-tests` - Run E2E tests with UI
- `npm run format` - Format code with Biome
- `npm run dev` - Start development server for Remix app

**Important:** Do not run `npm run build` to verify changes unless explicitly asked. Builds take a long time (~2 minutes). Use `npx tsc --noEmit` for type checking specific packages if needed.

## Code Style Guidelines

- Use TypeScript for all code; prefer `type` over `interface`
- Use functional components with `const Component = () => {}`
- Never use classes; prefer functional/declarative patterns
- Use descriptive variable names with auxiliary verbs (isLoading, hasError)
- Directory names: lowercase with dashes (auth-wizard)
- Use named exports for components
- Never use 'use client' directive
- Never use 1-line if statements
- Structure files: exported component, subcomponents, helpers, static content, types

## Error Handling & Validation

- Use custom AppError class when throwing errors
- When catching errors on the frontend use `const error = AppError.parse(error)` to get the error code
- Use early returns and guard clauses
- Use Zod for form validation and react-hook-form for forms
- Use error boundaries for unexpected errors

## UI & Styling

- Use Shadcn UI, Radix, and Tailwind CSS with mobile-first approach
- Use `<Form>` `<FormItem>` elements with fieldset having `:disabled` attribute when loading
- Use Lucide icons with longhand names (HomeIcon vs Home)

## TRPC Routes

- Each route in own file: `routers/teams/create-team.ts`
- Associated types file: `routers/teams/create-team.types.ts`
- Request/response schemas: `Z[RouteName]RequestSchema`, `Z[RouteName]ResponseSchema`
- Only use GET and POST methods in OpenAPI meta
- Deconstruct input argument on its own line
- Prefer route names such as get/getMany/find/create/update/delete
- "create" routes request schema should have the ID and data in the top level
- "update" routes request schema should have the ID in the top level and the data in a nested "data" object

## Translations & Remix

- Use `<Trans>string</Trans>` for JSX translations from `@lingui/react/macro`
- Use `t\`string\`` macro for TypeScript translations
- Use `(params: Route.Params)` and `(loaderData: Route.LoaderData)` for routes
- Directly return data from loaders, don't use `json()`
- Use `superLoaderJson` when sending complex data through loaders such as dates or prisma decimals

<!-- GSD:project-start source:PROJECT.md -->

## Project

**Documenso — UX Fixes & Improvements**

Documenso is an open-source document signing platform. This project delivers three targeted improvements: fixing the language cascade bug (sender's language not used for recipients), improving field border UX for completed fields, and simplifying the post-signing completion page.

**Core Value:** Recipients have a seamless, branded signing experience regardless of where the sender is from or what interface they're using.

### Constraints

- **Tech stack**: TypeScript, React Router v7, Prisma, tRPC, Lingui.js, Tailwind CSS — must match existing conventions
- **i18n**: Lingui.js (`@lingui/core`, `@lingui/react`, `@lingui/detect-locale`) — translations use `<Trans>` and `t\`\`` macros
- **Design system**: Shadcn UI + Radix primitives + Tailwind — use `cn()` utility for class merging
- **Monorepo structure**: Changes should follow domain-oriented vertical slice pattern

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 5.6.2 - Used across the entire monorepo (apps, packages, server, client)
- CSS/Tailwind - Styling via Tailwind CSS v3/v4 across apps
- SQL (PostgreSQL) - Database queries via Prisma ORM and Kysely typed query builder
- Shell/Bash - Docker scripts, CI pipeline scripts, build scripts in `docker/` and `scripts/`
- YAML - Docker Compose, GitHub Actions CI/CD pipelines, Crowdin config

## Runtime

- Node.js >=22.0.0 (development); Node.js 22 (Alpine Docker production images via `node:22-alpine3.22`)
- npm 11.11.0 (package manager with `npm@11.11.0` as `packageManager` in root `package.json`)
- npm workspaces (monorepo: `apps/*`, `packages/*`)
- Lockfile: `package-lock.json` present
- Postinstall hook: `patch-package` for dependency patches in `patches/`
- Turborepo ^1.13.4 (`turbo.json` at root) — pipeline caching for build, dev, lint, test:e2e

## Frameworks

- React Router v7.12.0 (formerly Remix) — primary frontend framework in `apps/remix/app/`
- React 18 — UI component library used across all packages
- Next.js 16.2.6 — used in `apps/docs/` (documentation site) and `apps/openpage-api/`
- Hono ^4.12.14 — lightweight HTTP server for auth routes (`packages/auth/server/routes/`), trpc server adapter, and API layer (`packages/api/hono.ts`)
- React Router Serve v7.12.0 — production server for the Remix app
- tRPC v11.8.1 — type-safe API procedures (`packages/trpc/server/`) with client (`packages/trpc/client/`) and React Query integration (`packages/trpc/react/`)
- ts-rest ^3.52.1 — client/server contract-first API for v1 REST API (`packages/api/v1/contract.ts`)
- trpc-to-openapi ^2.1.5 — auto-generates OpenAPI 3.0 spec from tRPC routers
- zod-openapi ^4.2.4 — OpenAPI schema generation from Zod schemas
- Playwright 1.56.1 — E2E tests in `packages/app-tests/`
- Vitest ^4.0.18 — unit tests in `packages/lib/` and `packages/signing/`
- start-server-and-test — E2E test orchestration
- Vite ^7.2.4 — bundler for Remix app and documentation site
- Rollup ^4.53.3 — production server build (`apps/remix/rollup.config.mjs`)
- esbuild ^0.27.0 — used alongside Rollup for server builds
- Biome 2.4.8 — linting and formatting (replacing ESLint and Prettier)
- Commitlint ^20.1.0 — conventional commit enforcement
- Husky ^9.1.7 — git hooks
- lint-staged ^16.2.7 — staged file linting
- Prisma ^6.19.0 — primary ORM with PostgreSQL (`packages/prisma/schema.prisma`)
- Prisma Client — generated client for database operations
- Kysely 0.29.2 — typed SQL query builder (used alongside Prisma via `prisma-extension-kysely` and `prisma-kysely` codegen)
- Prisma JSON Types Generator — typed JSON fields in Prisma models
- Zod Prisma Types 3.3.5 — generates Zod schemas from Prisma models
- Prisma Read Replicas Extension ^0.4.1 — read replica support
- Inngest ^3.54.0 — cloud background jobs provider (`packages/lib/jobs/client/inngest.ts`)
- BullMQ ^5.71.1 — Redis-backed queue jobs provider (`packages/lib/jobs/client/bullmq.ts`)
- ioredis ^5.10.1 — Redis client for BullMQ
- Bull Board ^6.20.6 — job monitoring dashboard UI
- Tailwind CSS v3.4.18 (Remix app) and v4.1.18 (docs site)
- Radix UI primitives — comprehensive set (`@radix-ui/react-*` 20+ packages in `packages/ui/`)
- Shadcn UI pattern — component library built on Radix primitives with `class-variance-authority`
- Framer Motion ^12.23.24 — animations
- Lucide React ^0.554.0 — icon library
- TanStack React Table ^8.21.3 — data tables
- TanStack React Query 5.90.10 — server state management via tRPC
- react-hook-form ^7.66.1 — form management with `@hookform/resolvers`
- Recharts ^2.15.4 — charting library
- Konva ^10.0.9 — canvas-based signature/field placement editor
- react-rnd ^10.5.2 — resizable/draggable field components
- react-dropzone ^14.3.8 — file upload
- cmdk ^0.2.1 — command menu (used for combobox components)
- nuqs ^2.8.9 — URL query state management
- satori ^0.18.3 — SVG-based OG image generation
- framer-motion — animations
- LinguiJS ^5.6.0 — i18n framework with `.po` files (`packages/lib/translations/`)
- Crowdin — cloud translation management (`crowdin.yml`)
- @cantoo/pdf-lib ^2.5.3 — PDF manipulation (fork of pdf-lib)
- pdfjs-dist 5.4.296 — PDF rendering in the browser
- @napi-rs/canvas ^0.1.83 — native canvas for server-side PDF rendering
- skia-canvas ^3.0.8 — alternative canvas library
- sharp 0.34.5 — image processing
- @libpdf/core ^0.4.0 — PDF cryptographic signing primitives
- papaparse ^5.5.3 — CSV parsing
- csv-parse ^6.1.0 — CSV parsing
- AI SDK ^5.0.104 (`ai` package from Vercel) — AI integration framework
- @ai-sdk/google-vertex 3.0.81 — Google Vertex AI provider (Gemini)
- Gotenberg — document conversion (DOCX to PDF) via HTTP API (`NEXT_PRIVATE_DOCUMENT_CONVERSION_URL`)

## Key Dependencies

- `@prisma/client` ^6.19.0 / `prisma` ^6.19.0 — Database access, migrations, schema management
- `@trpc/*` 11.8.1 — End-to-end type-safe API procedures
- `react-router` ^7.12.0 — Frontend routing and server-side rendering framework
- `next` 16.2.6 — Documentation site and openpage API application
- `postgres:15` — Database (in Docker Compose)
- `redis:8-alpine` — Cache/job queue (in Docker Compose)
- `minio/minio` — S3-compatible storage (development Docker Compose)
- `inbucket/inbucket` — Email testing SMTP server (development Docker Compose)
- `gotenberg` — DOCX-to-PDF conversion (development Docker Compose)
- `stripe` ^12.18.0 — Payment processing (EE feature)
- `posthog-js` / `posthog-node` — Product analytics and feature flags
- `inngest` ^3.54.0 — Cloud background jobs (optional)
- `bullmq` ^5.71.1 — Redis-based background jobs (optional)
- `nodemailer` ^8.0.5 — Email sending
- `react-email` ^5.0.6 — Email template development and preview

## Configuration

- `.env.example` — Template for all configuration (235 lines, comprehensive)
- `.env` / `.env.local` — Actual environment (gitignored)
- `dotenv-cli` ^11.0.0 — Loads `.env` files for npm scripts via `npm run with:env -- ...`
- Turbo `globalEnv` array in `turbo.json` — Declares ~80 env vars available at build time
- `turbo.json` — Monorepo pipeline configuration
- `biome.json` — Lint and format configuration (Biome 2.4.8)
- `lingui.config.ts` — i18n catalog configuration
- `commitlint.config.cjs` — Commit convention enforcement
- `lint-staged.config.cjs` — Pre-commit linting
- `crowdin.yml` — Translation management
- `apps/remix/react-router.config.ts` — React Router configuration
- `apps/remix/tailwind.config.ts` — Tailwind CSS config for Remix app
- `apps/remix/vite.config.ts` — Vite bundler configuration
- `apps/remix/rollup.config.mjs` — Production server bundling
- `packages/prisma/schema.prisma` — Database schema
- `docker/development/compose.yml` — Local development services
- `docker/production/compose.yml` — Production deployment
- `docker/testing/compose.yml` — E2E test environment
- `render.yaml` — Render.com deployment config
- `railway.toml` — Railway deployment config
- `tsconfig.json` at root with `tsconfig.eslint.json`
- Per-package `tsconfig.json` files with shared `@documenso/tsconfig` base
- `turbo.json` defines build pipeline with `dependsOn`, `outputs`, and caching rules
- `lodash` pinned to 4.18.1
- `pdfjs-dist` pinned to 5.4.296
- `typescript` pinned to 5.6.2 across all packages
- `zod` aliased to consistent version via npm overrides

## Platform Requirements

- Node.js >=22.0.0, npm >=11.11.0
- Docker Desktop or compatible (for PostgreSQL, Redis, MinIO, Inbucket, Gotenberg)
- macOS, Linux, or Windows (cross-platform via Docker)
- Docker (official image built from `docker/Dockerfile`)
- Node.js 22 runtime (Alpine-based Docker images)
- PostgreSQL 15 database
- Redis 8 (optional, for BullMQ jobs provider)
- S3-compatible storage (optional, for file uploads)
- Deployment targets: Docker Compose, Render, Railway, or any container platform

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- Directory names: `lowercase-with-dashes` (e.g. `auth-wizard`, `envelope-router`)
- Component files: `kebab-case.tsx` (e.g. `button.tsx`, `data-table.tsx`)
- Route files follow the `remix-flat-routes` convention with `+` separators (e.g. `_authenticated+\t.$teamUrl+\documents._index.tsx`)
- Test files: `*.test.ts` (unit), `*.spec.ts` (E2E)
- Arrow functions exclusively via `export const fnName = async () => {}` — never `function` declarations
- Verb-based names: `createDocument`, `findDocuments`, `updateDocument`, `deleteDocument`
- `on` prefix for event handlers: `onSubmit`, `onClick`, `onFormSubmit`, `onFieldCopy`
- Destructured object parameters for functions with multiple arguments
- `camelCase` for all variables and functions
- Auxiliary verbs for booleans: `isLoading`, `hasError`, `canEdit`, `shouldRender`, `isDisabled`
- `UPPER_SNAKE_CASE` for true constants: `DEFAULT_DOCUMENT_DATE_FORMAT`, `MAX_FILE_SIZE`
- Descriptive over abbreviated: `recipientAuthenticationOptions` not `recipAuthOpts`
- `PascalCase` for all type definitions
- Prefer `type` over `interface`
- Prefix Zod schemas with `Z`: `ZCreateDocumentOptionsSchema`
- Prefix inferred types with `T`: `TCreateDocumentOptions = z.infer<typeof ZCreateDocumentOptionsSchema>`
- Export types alongside their implementation in paired `.types.ts` files:

## Code Style

- **Biome v2.4.8** (`biome.json`) — format on save via `biome format --write .`
- Indent: 2 spaces
- Line width: 120 characters
- Line endings: LF
- Single quotes for strings
- Semicolons: always
- Trailing commas: always (all contexts)
- Arrow parentheses: always
- JSX quote style: double quotes
- **Biome** with recommended rules enabled
- `biome check .` for linting, `biome check --write .` for auto-fix
- Key non-default rules:
- `lint-staged` runs `npm run lint:staged` on `*.{ts,tsx,cts,mts,js,jsx,cjs,mjs,json,css}` files pre-commit
- `commitlint` enforces conventional commit format via `@commitlint/config-conventional`

## Import Organization

- `~` maps to `apps/remix/app/` for route file imports (e.g. `import { Header } from '~/components/general/app-header'`)
- Direct `@documenso/*` workspace references for internal package imports

## Error Handling

- Throw `AppError` with a specific error code:
- Frontend error parsing:
- TRPC error transformation:
- `AppErrorCode` enum includes codes: `ALREADY_EXISTS`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `LIMIT_EXCEEDED`, `TOO_MANY_REQUESTS`, `ENVELOPE_*`, `CSC_*`, and more.
- Error code mapping to HTTP + tRPC error codes in `genericErrorCodeToTrpcErrorCodeMap`

## Logging

- Structured logging via tRPC context `ctx.logger`:
- Logger is passed as dependency to server-only functions:
- Use `NEXT_PRIVATE_LOGGER_FILE_PATH` env var for E2E test log capture

## Comments

- JSDoc for exported functions describing purpose, parameter intent, and return values
- Inline comments for non-obvious business logic, performance optimizations, or security-sensitive code
- Section header comments to separate logical sections: `// ─── Expected Output Tests ───────────────────────────────────────────────────`
- No comments for trivial self-documenting code
- `/** ... */` blocks for public API functions and complex logic
- `@deprecated` tag for deprecated exports
- `@example` tag for usage examples in complex seed/test fixtures

## Function Design

- Always use destructured object parameter pattern for 2+ parameters
- Destructure on dedicated lines:
- Provide defaults in destructuring: `{ status = ExtendedDocumentStatus.ALL, page = 1 }`
- Explicit return types on function signatures: `Promise<Document>`
- Always `return` at end of functions (blank line before return)

## Module Design

- Named exports for all components and functions
- Never use `export default`
- Barrel files (`index.ts`) used per directory

## React & Components

- Never use classes
- Never use `'use client'` directive
- `React.forwardRef` for primitives like `Button`
- **Shadcn UI / Radix** primitives in `packages/ui/primitives/` (Button, Dialog, Select, etc.)
- **Tailwind CSS** for styling with `cn()` utility for class merging
- **class-variance-authority (cva)** for component variant definitions
- **Lucide icons** with longhand names (`HomeIcon` vs `Home`)
- **`<Form>` / `<FormItem>`** elements with `fieldset` having `:disabled` attribute when loading
- Conditional rendering: `{isLoading && <Loader />}` or ternary for either/or
- `useCallback` for memoized handlers with dependencies
- Simple inline handlers for trivial cases: `<Button onClick={() => setOpen(false)}>`
- `<Trans>string</Trans>` from `@lingui/react/macro` for JSX
- `` t`string` `` macro for TypeScript

## Async/Await Patterns

## Pattern Matching

## TRPC Patterns

- Each route in its own file: `routers/teams/create-team.ts`
- Associated types file: `routers/teams/create-team.types.ts`
- Request/response schemas: `Z[RouteName]RequestSchema`, `Z[RouteName]ResponseSchema`
- Only GET and POST methods in OpenAPI meta
- Route names: `get`/`getMany`/`find`/`create`/`update`/`delete`
- `create` routes: ID and data at top level in request schema
- `update` routes: ID at top level, data in nested `data` object
- Procedure naming: route export name + `Route` suffix (e.g., `createEnvelopeRoute`)
- `authenticatedProcedure` for protected routes
- `ctx.logger.info()` for request logging

## Database & Prisma

- Destructure commonly used fields from results
- Use `select` to limit returned fields
- Use `include` for relations
- Use `prisma.$transaction` for related operations
- Build complex where clauses separately as typed `Prisma.WhereInput`
- Kysely query builder for complex queries in `find-documents.ts`
- Migrations run via `prisma:migrate-dev` / `prisma:migrate-deploy`

## General Principles

- **Functional over OOP**: No classes, prefer functional patterns
- **Explicit over implicit**: Be explicit about types, return values, and error cases
- **Early returns**: Use guard clauses to reduce nesting
- **Immutability**: Favor `const` over `let`
- **Whitespace**: Blank lines between imports, logical sections, and before returns
- **No 1-line if statements**: Biome enforces `useBlockStatements`
- **Clarity over brevity**: Descriptive names over abbreviations

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

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

### tRPC Procedure Flow

### Document Signing Flow

## Key Abstractions

### tRPC Routers

- **Purpose:** Organize API procedures by domain
- **Examples:**
- **Pattern:** Each router directory has `router.ts` (composes sub-procedures) + `schema.ts` (shared Zod schemas) + individual `{action}.ts` + `{action}.types.ts` files

### Provider Strategy

- **Purpose:** Swappable implementations for infrastructure concerns
- **Location:** Various — `packages/lib/universal/upload/providers/`, `packages/lib/jobs/client/`, `packages/signing/transports/`, `packages/email/transports/`
- **Mechanism:** Environment variable selects provider, `ts-pattern` dispatches to the correct implementation
- **Providers:**

### Server-Only / Client-Only / Universal Split

- **Purpose:** Enforce server-side code isolation, prevent client bundle leaks
- **Location:**
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

### Deprecated Endpoints in Active Routers

### Barrel Files with Re-exports

## Error Handling

- tRPC errors: `AppError` is caught in `errorFormatter` and translated to TRPCError shapes with HTTP status codes
- Frontend catching: `const error = AppError.parse(error)` to extract the error code
- Zod validation: Every tRPC procedure validates input/output with Zod schemas
- HTTP errors: tRPC procedures throw `TRPCError` with standard codes (UNAUTHORIZED, FORBIDDEN, etc.)

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

| Skill | Description | Path |
|-------|-------------|------|
| agent-browser | Browser automation CLI for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web apps, or automating any browser task. Triggers include requests to "open a website", "fill out a form", "click a button", "take a screenshot", "scrape data from a page", "test this web app", "login to a site", "automate browser actions", or any task requiring programmatic web interaction. | `.agents/skills/agent-browser/SKILL.md` |
| create-documentation | Generate markdown documentation for a module or feature | `.agents/skills/create-documentation/SKILL.md` |
| create-justification | Create a new justification file in .agents/justifications/ with a unique three-word ID, frontmatter, and formatted title | `.agents/skills/create-justification/SKILL.md` |
| create-plan | Create a new plan file in .agents/plans/ with a unique three-word ID, frontmatter, and formatted title | `.agents/skills/create-plan/SKILL.md` |
| create-scratch | Create a new scratch file in .agents/scratches/ with a unique three-word ID, frontmatter, and formatted title | `.agents/skills/create-scratch/SKILL.md` |
| envelope-editor-v2-e2e | Writing and maintaining Playwright E2E tests for the Envelope Editor V2. Use when the user needs to create, modify, debug, or extend E2E tests in packages/app-tests/e2e/envelope-editor-v2/. Triggers include requests to "write an e2e test", "add a test for the envelope editor", "test envelope settings/recipients/fields/items/attachments", "fix a failing envelope test", or any task involving Playwright tests for the envelope editor feature. | `.agents/skills/envelope-editor-v2-e2e/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
