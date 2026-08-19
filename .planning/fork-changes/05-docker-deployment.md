---
topic: Docker/Deployment
commits:
  - f2d0653a1
  - bc6bc0078
  - 01034f421
  - fda127caf
  - fbd179b13
  - 5feee301d
  - cefe186fb
  - f2fba1148
  - 32b368a8f
objective: Docker deployment improvements for source-based builds and Coolify/Dokploy
files_changed:
  - docker/production/compose.build.yml
  - README.md
  - package.json
  - .planning/debug/docker-prisma-client-error.md
---

# Docker/Deployment

**Analysis Date:** 2026-08-14

## Summary

This document covers nine commits that introduce and refine a new source-based Docker deployment workflow using `compose.build.yml` for Coolify/Dokploy deployment platforms. The changes enable automatic TLS certificate generation and properly configure the build context for source-based (non-pre-built-image) deployments.

---

## Commit-by-Commit Analysis

### Commit `f2d0653a1` — feat: add compose.build.yml for source-based Docker deployment

**Objective:** Create a new Compose file for source-based Docker deployment that builds Documenso from the repository source rather than pulling a pre-built image.

**Files Changed:**
- `docker/production/compose.build.yml` (new file, 83 lines)

**What Changed:**
This commit introduces `compose.build.yml` as an alternative to the existing `docker-compose.yml` pattern. Key characteristics:

- **Service:** `documenso` built from local source via `context: ..` and `dockerfile: docker/Dockerfile`
- **Database:** Uses `postgres:15` image with named volume `database`
- **Environment:** Passes ~50+ environment variables covering encryption keys, SMTP, upload/storage, signing, telemetry, and feature flags
- **Health checks:** Database uses `pg_isready`, Documenso service uses `wget` against the webapp
- **Volume mounts:** Maps local `/opt/documenso/cert.p12` for signing certificate

**Structure of `compose.build.yml`:**
```yaml
name: documenso-production
services:
  database:
    image: postgres:15
    environment: [POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB]
    volumes: [database:/var/lib/postgresql/data]
  documenso:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    depends_on: [database condition: service_healthy]
volumes: [database]
```

---

### Commit `bc6bc0078` — feat: configure compose.build.yml for Coolify/Dokploy deployment with auto cert gen

**Objective:** Adapt the compose file for Coolify/Dokploy platforms which use platform-specific environment variable names (e.g., `SERVICE_USER_POSTGRES`, `SERVICE_BASE64_AUTHSECRET`) and add automatic self-signed TLS certificate generation at container startup.

**Files Changed:**
- `docker/production/compose.build.yml` (61 insertions, 57 deletions)

**What Changed:**

**1. Database Service Updates:**
- Upgraded from `postgres:15` to `postgres:17`
- Changed environment variable names to match Coolify/Dokploy conventions:
  - `POSTGRES_USER` → `SERVICE_USER_POSTGRES`
  - `POSTGRES_PASSWORD` → `SERVICE_PASSWORD_POSTGRES`
  - `POSTGRES_DB` now has default: `${POSTGRES_DB:-documenso-db}`
- Volume reference changed from `database` to `documenso_postgresql_data`
- Health check improved: `interval: 5s`, `timeout: 20s`, `retries: 10`

**2. Documenso Service Environment Changes:**
- Hardcoded URLs for a specific deployment (`documentos.escolaativa.com.br`)
- Changed to Coolify/Dokploy secret format: `${SERVICE_BASE64_AUTHSECRET}`, `${SERVICE_BASE64_ENCRYPTIONKEY}`, etc.
- Database URL constructed dynamically: `postgresql://${SERVICE_USER_POSTGRES}:${SERVICE_PASSWORD_POSTGRES}@database/${POSTGRES_DB:-documenso-db}?schema=public`
- Added S3 upload transport configuration
- Added signing transport `local` with path `/app/certs/cert.p12`

**3. Automatic TLS Certificate Generation (entrypoint):**
The most significant change is the addition of an `entrypoint` shell script that:
- Generates a self-signed RSA private key using OpenSSL
- Creates a X509 certificate with organization details from environment variables
- Exports to P12 format for Documenso signing
- Stores passphrase securely in a temp file (prevents exposure in process list)
- Handles permission setting for non-root execution (Coolify)

**Certificate Environment Variables:**
| Variable | Default | Purpose |
|----------|---------|---------|
| `CERT_VALID_DAYS` | 365 | Certificate validity period |
| `CERT_INFO_COUNTRY_NAME` | DO | Certificate country |
| `CERT_INFO_STATE_OR_PROVINCE` | Santiago | Certificate state |
| `CERT_INFO_LOCALITY_NAME` | Santiago | Certificate locality |
| `CERT_INFO_ORGANIZATION_NAME` | Example INC | Certificate organization |
| `CERT_INFO_ORGANIZATIONAL_UNIT` | IT Department | Certificate OU |
| `CERT_INFO_EMAIL` | example@gmail.com | Certificate email |

---

### Commit `01034f421` — fix: correct build context path to repo root

**Files Changed:**
- `docker/production/compose.build.yml` (1 line)

**What Changed:**
```diff
-      context: ..
+      context: ../../
```

**Reason:** When `compose.build.yml` is located at `docker/production/compose.build.yml`, the context `..` resolves to `docker/`. The correct context should be the repository root, which is two directories up (`../../`).

---

### Commit `fda127caf` — fix: match volume name to service reference

**Files Changed:**
- `docker/production/compose.build.yml` (1 line)

**What Changed:**
```diff
-  database:
+  documenso_postgresql_data:
```

**Reason:** The database service references volume `documenso_postgresql_data` in its `volumes` list, but the `volumes:` section at the bottom declared it as `database`. This caused a mismatch — the named volume was not properly declared.

---

### Commit `fbd179b13` — fix: restore missing documenso_postgresql_data volume declaration

**Files Changed:**
- `docker/production/compose.build.yml` (2 insertions, 1 deletion)

**What Changed:**
Moved `volumes:` section to the top of the file and properly declared the `documenso_postgresql_data` volume:

```yaml
volumes:
    documenso_postgresql_data:

services:
  database:
    ...
```

**Reason:** After commit `fda127caf` (which renamed the volume reference), the actual volume declaration was missing. This commit restores it.

---

### Commit `5feee301d` — fix: clean up compose.build.yml — remove ports/volumes, fix trailing whitespace

**Files Changed:**
- `docker/production/compose.build.yml` (2 insertions, 9 deletions)

**What Changed:**
1. Removed `ports` mapping (`${PORT:-3000}:${PORT:-3000}`) — Coolify/Dokploy manage port mapping internally
2. Removed host volume mount (`/opt/documenso/cert.p12:/opt/documenso/cert.p12:ro`) — certificates are now generated inside the container
3. Fixed trailing whitespace in `environment:` line

**Reason:** For Coolify/Dokploy deployments, port mapping and host volume mounts should not be specified in the compose file — the platform handles these automatically.

---

### Commit `cefe186fb` — chore: update docker compose build config

**Files Changed:**
- `docker/production/compose.build.yml` (1 deletion)

**What Changed:**
Removed `no-cache: true` from the build section:

```diff
    build:
      context: ../../
      dockerfile: docker/Dockerfile
-      no-cache: true
```

**Reason:** The `no-cache: true` option was forcing rebuilds every time. This was added in commit `f2fba1148` (see below) but later removed to allow Docker layer caching.

---

### Commit `f2fba1148` — chore: update README and docker compose build config

**Files Changed:**
- `README.md` (2 insertions)
- `docker/production/compose.build.yml` (1 insertion)

**What Changed:**
1. Added `no-cache: true` to the build section (later removed by commit `cefe186fb`)
2. Added default credentials to README.md:
   ```
   Email: example@documenso.com Password: password
   ```

---

### Commit `32b368a8f` — fix: move @prisma/client to dependencies for Docker build

**Files Changed:**
- `package.json` (moved `@prisma/client` from `devDependencies` to `dependencies`)
- `.planning/debug/docker-prisma-client-error.md` (new file, debug documentation)

**What Changed:**
```diff
- "@prisma/client": "^6.19.0",  # was in devDependencies (line ~55)
+ "@prisma/client": "^6.19.0",  # now in dependencies (line ~94)
```

**Root Cause Identified:**
- Docker build uses `npm ci` which only installs production dependencies (not devDependencies)
- Prisma's `prisma generate` reads the root `package.json` to determine the `@prisma/client` version
- Since `@prisma/client` was in `devDependencies`, it wasn't installed during Docker build
- This caused: `Error reading package.json: The version of the package @prisma/client could not be determined`

**Status:** This commit exists on a different branch and has NOT been applied to the current branch.

---

## Final State of `docker/production/compose.build.yml`

```yaml
name: documenso-production
volumes:
    documenso_postgresql_data:

services:
  database:
    image: 'postgres:17'
    environment:
      - 'POSTGRES_USER=${SERVICE_USER_POSTGRES}'
      - 'POSTGRES_PASSWORD=${SERVICE_PASSWORD_POSTGRES}'
      - 'POSTGRES_DB=${POSTGRES_DB:-documenso-db}'
    volumes:
      - 'documenso_postgresql_data:/var/lib/postgresql/data'
    healthcheck:
      test: [CMD-SHELL, 'pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}']
      interval: 5s
      timeout: 20s
      retries: 10

  documenso:
    build:
      context: ../../
      dockerfile: docker/Dockerfile
    depends_on:
      database:
        condition: service_healthy
    environment:
      - 'SERVICE_URL_DOCUMENSO_3000=https://documentos.escolaativa.com.br'
      - 'NEXTAUTH_URL=https://documentos.escolaativa.com.br'
      # ... (certificate generation and signing config)
      - 'NEXT_PRIVATE_DATABASE_URL=postgresql://${SERVICE_USER_POSTGRES}:${SERVICE_PASSWORD_POSTGRES}@database/${POSTGRES_DB:-documenso-db}?schema=public'
    healthcheck:
      test: [CMD-SHELL, "wget -q -O - http://documenso:3000/ | grep -q 'Sign in to your account'"]
      interval: 2s
      timeout: 10s
      retries: 20
    entrypoint: [/bin/sh, -c, "<certificate generation script>"]
```

---

## Coolify/Dokploy Environment Variables

### Required Variables

| Variable | Description |
|----------|-------------|
| `SERVICE_USER_POSTGRES` | PostgreSQL username |
| `SERVICE_PASSWORD_POSTGRES` | PostgreSQL password |
| `SERVICE_BASE64_AUTHSECRET` | Base64-encoded NextAuth secret |
| `SERVICE_BASE64_ENCRYPTIONKEY` | Base64-encoded primary encryption key |
| `SERVICE_BASE64_SECONDARYENCRYPTIONKEY` | Base64-encoded secondary encryption key |
| `SERVICE_PASSWORD_DOCUMENSO` | Signing certificate passphrase |
| `NEXT_PRIVATE_RESEND_API_KEY` | Resend API key for email |
| `NEXT_PRIVATE_SMTP_*` | SMTP configuration |
| `NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID` | S3 access key |
| `NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY` | S3 secret key |

### Optional Variables (with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `documenso-db` | Database name |
| `CERT_VALID_DAYS` | 365 | Certificate validity |
| `CERT_INFO_COUNTRY_NAME` | DO | Certificate country |
| `CERT_INFO_STATE_OR_PROVINCE` | Santiago | Certificate state |
| `CERT_INFO_LOCALITY_NAME` | Santiago | Certificate locality |
| `CERT_INFO_ORGANIZATION_NAME` | Example INC | Certificate org |
| `CERT_INFO_ORGANIZATIONAL_UNIT` | IT Department | Certificate OU |
| `CERT_INFO_EMAIL` | example@gmail.com | Certificate email |
| `DISABLE_LOGIN` | false | Disable user signup |

---

## Replication Steps for Fresh Clone

### Prerequisites
- Docker and Docker Compose installed
- Access to a Coolify or Dokploy instance (or similar platform)
- S3-compatible storage (or configure `NEXT_PUBLIC_UPLOAD_TRANSPORT=database`)

### Steps

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd documenso
   ```

2. **Copy environment template:**
   ```bash
   cp .env.example docker/production/.env
   ```

3. **Edit `docker/production/.env` with Coolify/Dokploy variables:**
   ```bash
   # PostgreSQL (matching platform's service variables)
   SERVICE_USER_POSTGRES=your_postgres_user
   SERVICE_PASSWORD_POSTGRES=your_postgres_password
   POSTGRES_DB=documenso-db

   # Auth & Encryption (base64 encoded in Coolify)
   SERVICE_BASE64_AUTHSECRET=<from-coolify-secrets>
   SERVICE_BASE64_ENCRYPTIONKEY=<from-coolify-secrets>
   SERVICE_BASE64_SECONDARYENCRYPTIONKEY=<from-coolify-secrets>

   # URLs
   SERVICE_URL_DOCUMENSO_3000=https://your-domain.com
   NEXTAUTH_URL=https://your-domain.com
   NEXT_PUBLIC_WEBAPP_URL=https://your-domain.com

   # Signing certificate
   SERVICE_PASSWORD_DOCUMENSO=<your-cert-passphrase>

   # SMTP (if using custom SMTP)
   NEXT_PRIVATE_SMTP_TRANSPORT=smtp
   NEXT_PRIVATE_SMTP_HOST=smtp.example.com
   # ... other SMTP vars

   # S3 Storage
   NEXT_PUBLIC_UPLOAD_TRANSPORT=s3
   NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID=<your-s3-key>
   NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY=<your-s3-secret>
   NEXT_PRIVATE_UPLOAD_BUCKET=documenso
   NEXT_PRIVATE_UPLOAD_REGION=us-east-1
   NEXT_PRIVATE_UPLOAD_FORCE_PATH_STYLE=true
   ```

4. **Update certificate defaults** (optional — edit in `compose.build.yml` or pass as env vars):
   ```bash
   CERT_INFO_COUNTRY_NAME=US
   CERT_INFO_STATE_OR_PROVINCE=California
   CERT_INFO_LOCALITY_NAME=San Francisco
   CERT_INFO_ORGANIZATION_NAME=Your Company
   CERT_INFO_ORGANIZATIONAL_UNIT=Engineering
   CERT_INFO_EMAIL=admin@your-domain.com
   ```

5. **Deploy using Docker Compose:**
   ```bash
   cd docker/production
   docker compose -f compose.build.yml build
   docker compose -f compose.build.yml up -d
   ```

6. **Or import into Coolify/Dokploy:**
   - Point to `docker/production/compose.build.yml` in your repository
   - Configure the environment variables in the platform UI
   - The build context should be set to repository root (`../../`)

---

## Known Issue — `@prisma/client` in devDependencies

**Status:** NOT FIXED in current branch

Commit `32b368a8f` identified and fixed the root cause of Docker build failures, but this commit is not present in the current branch. The issue is:

- `package.json` line 56: `"@prisma/client": "^6.19.0"` is in `devDependencies`
- Docker build uses `npm ci` which excludes devDependencies
- Prisma generate fails with: `The version of the package @prisma/client could not be determined`

**Fix to apply manually:**
Move `@prisma/client` from `devDependencies` to `dependencies` in root `package.json`.

---

## Related Files

| File | Purpose |
|------|---------|
| `docker/production/compose.build.yml` | Source-based Docker Compose for Coolify/Dokploy |
| `docker/Dockerfile` | Multi-stage build definition (referenced by compose) |
| `docker/development/compose.yml` | Local development environment |
| `package.json` | Root package with devDependencies issue |
| `.planning/debug/docker-prisma-client-error.md` | Debug investigation (commit 32b368a8f) |

---

*Docker/Deployment analysis: 2026-08-14*
