# Technology Stack

**Analysis Date:** 2026-06-19

## Languages

**Primary:**
- TypeScript 5.6.2 - Used across the entire monorepo (apps, packages, server, client)

**Secondary:**
- CSS/Tailwind - Styling via Tailwind CSS v3/v4 across apps
- SQL (PostgreSQL) - Database queries via Prisma ORM and Kysely typed query builder
- Shell/Bash - Docker scripts, CI pipeline scripts, build scripts in `docker/` and `scripts/`
- YAML - Docker Compose, GitHub Actions CI/CD pipelines, Crowdin config

## Runtime

**Environment:**
- Node.js >=22.0.0 (development); Node.js 22 (Alpine Docker production images via `node:22-alpine3.22`)
- npm 11.11.0 (package manager with `npm@11.11.0` as `packageManager` in root `package.json`)

**Package Manager:**
- npm workspaces (monorepo: `apps/*`, `packages/*`)
- Lockfile: `package-lock.json` present
- Postinstall hook: `patch-package` for dependency patches in `patches/`

**Monorepo Orchestration:**
- Turborepo ^1.13.4 (`turbo.json` at root) — pipeline caching for build, dev, lint, test:e2e

## Frameworks

**Core Web Frameworks:**
- React Router v7.12.0 (formerly Remix) — primary frontend framework in `apps/remix/app/`
- React 18 — UI component library used across all packages
- Next.js 16.2.6 — used in `apps/docs/` (documentation site) and `apps/openpage-api/`
- Hono ^4.12.14 — lightweight HTTP server for auth routes (`packages/auth/server/routes/`), trpc server adapter, and API layer (`packages/api/hono.ts`)
- React Router Serve v7.12.0 — production server for the Remix app

**API Layer:**
- tRPC v11.8.1 — type-safe API procedures (`packages/trpc/server/`) with client (`packages/trpc/client/`) and React Query integration (`packages/trpc/react/`)
- ts-rest ^3.52.1 — client/server contract-first API for v1 REST API (`packages/api/v1/contract.ts`)
- trpc-to-openapi ^2.1.5 — auto-generates OpenAPI 3.0 spec from tRPC routers
- zod-openapi ^4.2.4 — OpenAPI schema generation from Zod schemas

**Testing:**
- Playwright 1.56.1 — E2E tests in `packages/app-tests/`
- Vitest ^4.0.18 — unit tests in `packages/lib/` and `packages/signing/`
- start-server-and-test — E2E test orchestration

**Build/Dev:**
- Vite ^7.2.4 — bundler for Remix app and documentation site
- Rollup ^4.53.3 — production server build (`apps/remix/rollup.config.mjs`)
- esbuild ^0.27.0 — used alongside Rollup for server builds
- Biome 2.4.8 — linting and formatting (replacing ESLint and Prettier)
- Commitlint ^20.1.0 — conventional commit enforcement
- Husky ^9.1.7 — git hooks
- lint-staged ^16.2.7 — staged file linting

**ORM / Data Access:**
- Prisma ^6.19.0 — primary ORM with PostgreSQL (`packages/prisma/schema.prisma`)
- Prisma Client — generated client for database operations
- Kysely 0.29.2 — typed SQL query builder (used alongside Prisma via `prisma-extension-kysely` and `prisma-kysely` codegen)
- Prisma JSON Types Generator — typed JSON fields in Prisma models
- Zod Prisma Types 3.3.5 — generates Zod schemas from Prisma models
- Prisma Read Replicas Extension ^0.4.1 — read replica support

**Background Jobs:**
- Inngest ^3.54.0 — cloud background jobs provider (`packages/lib/jobs/client/inngest.ts`)
- BullMQ ^5.71.1 — Redis-backed queue jobs provider (`packages/lib/jobs/client/bullmq.ts`)
- ioredis ^5.10.1 — Redis client for BullMQ
- Bull Board ^6.20.6 — job monitoring dashboard UI

**UI / Styling:**
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

**Internationalization:**
- LinguiJS ^5.6.0 — i18n framework with `.po` files (`packages/lib/translations/`)
- Crowdin — cloud translation management (`crowdin.yml`)

**PDF / Document Processing:**
- @cantoo/pdf-lib ^2.5.3 — PDF manipulation (fork of pdf-lib)
- pdfjs-dist 5.4.296 — PDF rendering in the browser
- @napi-rs/canvas ^0.1.83 — native canvas for server-side PDF rendering
- skia-canvas ^3.0.8 — alternative canvas library
- sharp 0.34.5 — image processing
- @libpdf/core ^0.4.0 — PDF cryptographic signing primitives
- papaparse ^5.5.3 — CSV parsing
- csv-parse ^6.1.0 — CSV parsing

**AI:**
- AI SDK ^5.0.104 (`ai` package from Vercel) — AI integration framework
- @ai-sdk/google-vertex 3.0.81 — Google Vertex AI provider (Gemini)
- Gotenberg — document conversion (DOCX to PDF) via HTTP API (`NEXT_PRIVATE_DOCUMENT_CONVERSION_URL`)

## Key Dependencies

**Critical:**
- `@prisma/client` ^6.19.0 / `prisma` ^6.19.0 — Database access, migrations, schema management
- `@trpc/*` 11.8.1 — End-to-end type-safe API procedures
- `react-router` ^7.12.0 — Frontend routing and server-side rendering framework
- `next` 16.2.6 — Documentation site and openpage API application

**Infrastructure:**
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

**Environment:**
- `.env.example` — Template for all configuration (235 lines, comprehensive)
- `.env` / `.env.local` — Actual environment (gitignored)
- `dotenv-cli` ^11.0.0 — Loads `.env` files for npm scripts via `npm run with:env -- ...`
- Turbo `globalEnv` array in `turbo.json` — Declares ~80 env vars available at build time

**Key Config Files:**
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

**Build Configuration:**
- `tsconfig.json` at root with `tsconfig.eslint.json`
- Per-package `tsconfig.json` files with shared `@documenso/tsconfig` base
- `turbo.json` defines build pipeline with `dependsOn`, `outputs`, and caching rules

**Overrides:**
- `lodash` pinned to 4.18.1
- `pdfjs-dist` pinned to 5.4.296
- `typescript` pinned to 5.6.2 across all packages
- `zod` aliased to consistent version via npm overrides

## Platform Requirements

**Development:**
- Node.js >=22.0.0, npm >=11.11.0
- Docker Desktop or compatible (for PostgreSQL, Redis, MinIO, Inbucket, Gotenberg)
- macOS, Linux, or Windows (cross-platform via Docker)

**Production:**
- Docker (official image built from `docker/Dockerfile`)
- Node.js 22 runtime (Alpine-based Docker images)
- PostgreSQL 15 database
- Redis 8 (optional, for BullMQ jobs provider)
- S3-compatible storage (optional, for file uploads)
- Deployment targets: Docker Compose, Render, Railway, or any container platform

---

*Stack analysis: 2026-06-19*
