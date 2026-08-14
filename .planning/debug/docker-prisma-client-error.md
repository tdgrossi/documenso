---
status: root_cause_found
trigger: "after the recent rebase from the original repo in this form, the docker compose doesnt build anymore on my deployment"
symptoms:
  expected: "Docker compose build should succeed"
  actual: "Docker compose build fails during Prisma schema loading"
  error: |
    #39 4.504 Prisma schema loaded from packages/prisma/schema.prisma
    #39 13.77  Error reading package.json: The version of the package @prisma/client could not be determined - make sure it is installed as a dependency and not a devDependency
    #39 13.77  Error reading package.json
  timeline: "Started after recent rebase from original repo"
  reproduction: "docker compose build (or docker compose up --build)"
created: 2026-08-14
updated: 2026-08-14
---

## Current Focus

**Hypothesis:** `@prisma/client` is in `devDependencies` in root `package.json`, but `npm ci` in the Dockerfile only installs production dependencies, causing Prisma to fail to find the package version during `prisma generate`.

**next_action:** verify fix approach

---

## Evidence

- timestamp: 2026-08-14
  source: packages/prisma/package.json
  finding: |
    @documenso/prisma correctly has "@prisma/client": "^6.19.0" in its dependencies (line 24)

- timestamp: 2026-08-14
  source: package.json (root)
  finding: |
    @prisma/client is listed in devDependencies (line 55: "@prisma/client": "^6.19.0")
    This is the problem: Prisma reads the root package.json to determine @prisma/client version

- timestamp: 2026-08-14
  source: docker/Dockerfile
  finding: |
    Line 81: `RUN npm ci` - installs ONLY production dependencies (no devDependencies)
    Line 90: `RUN turbo run build --filter=@documenso/remix...` - builds the app
    Line 133: `RUN npx prisma generate` - generates Prisma client
    The error occurs during the turbo build when Prisma tries to read @prisma/client version

- timestamp: 2026-08-14
  error_reproduced: |
    Prisma schema loaded from packages/prisma/schema.prisma
    Error reading package.json: The version of the package @prisma/client could not be determined - make sure it is installed as a dependency and not a devDependency
    Error reading package.json

---

## Eliminated

<!-- Eliminated hypotheses -->

---

## Root Cause

The root cause is that `@prisma/client` is listed in `devDependencies` in the root `package.json` (line 55). During the Docker build, `npm ci` (Dockerfile line 81) only installs production dependencies. When Prisma runs `prisma generate` during the turbo build step (Dockerfile line 90), it reads the root `package.json` to determine the `@prisma/client` version, but finds it only in `devDependencies` — which are not installed. This causes the error: "The version of the package @prisma/client could not be determined."

---

## Fix

Move `@prisma/client` from `devDependencies` to `dependencies` in the root `package.json`.

This is safe because:
1. `@documenso/prisma` already has `@prisma/client` in its own `dependencies` - the deduplication is handled by npm
2. The package is needed at runtime for the Prisma client to work
3. It was incorrectly placed in devDependencies (it should be a production dependency)

**File to change:** `package.json` (root)
- Remove from `devDependencies`: `"@prisma/client": "^6.19.0"`
- Add to `dependencies`: `"@prisma/client": "^6.19.0"`

---

---

## Verification

<!-- To be filled -->

---

## Files Changed

<!-- To be filled -->
