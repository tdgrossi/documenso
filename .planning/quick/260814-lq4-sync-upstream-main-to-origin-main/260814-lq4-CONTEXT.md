# Quick Task 260814-lq4: Sync upstream/main → origin/main - Context

**Gathered:** 2026-08-14
**Status:** Ready for planning

## Task Boundary
Sync upstream/main into origin/main via git merge

## Potential Conflicts Identified

### High-Risk Gray Areas

1. **`.planning/` directory deleted upstream** — Upstream has removed all `.planning/` artifacts (ARCHITECTURE.md, CONCERNS.md, CONVENTIONS.md, STACK.md, STRUCTURE.md, TESTING.md, config.json, ROADMAP.md, REQUIREMENTS.md, PROJECT.md, STATE.md, and all phase debug/plan files). Your fork has all of these. Upstream likely adopted a different planning workflow. **This is the primary conflict — a delete vs. modify conflict across ~30 files.**

2. **`package-lock.json`** — 19,842 net changed lines. Massive dependency update across all packages (apps/remix, apps/docs, packages/app-tests, packages/lib, packages/email, packages/trpc, packages/ui, etc.). Likely to auto-resolve but may conflict if you have local package.json overrides.

3. **`packages/lib/translations/` (all .po files)** — 9 language files updated (de, en, es, fr, it, ja, ko, nl, pl, pt-BR, zh). ~1550-1925 lines changed per file. Auto-merge should work but verify no custom translations are lost.

### Medium-Risk Gray Areas

4. **`apps/remix/app/routes/`** — Heavy route file changes (document-preferences-form, app-command-menu, unified-settings-*, envelope-editor-*, signing pages). If you made local customizations to any signing/completion pages (Phase 1-3 work), those could conflict with upstream route restructuring.

5. **`.env.example`** — 16-line change (removal of a comment marker). Likely trivial but check for any env var additions upstream may have added that you need.

### Low-Risk

6. **`packages/prisma/schema.prisma`** — Only 1 line changed. Minimal risk.
7. **`turbo.json`** — 9 lines changed. Check if local pipeline overrides conflict.
8. **Docker configs** — compose.yml files changed. Verify no local docker overrides.
9. **E2E test files** — Many test spec changes. Your local test customizations (e.g. field-border-ux.spec.ts) may conflict with upstream test file restructuring.

## Local Customizations to Protect

- Your fork's `.planning/` directory with milestone/phase context (Phase 1-3 work)
- Any Phase 1-3 implementation changes in signing pages, field rendering, completion page
- `err.txt` file (present locally, deleted upstream) — contains debug info

## Implementation Decisions
### Merge strategy
- Use merge (not rebase) to preserve fork commits
- Prioritize upstream changes for schema/migrations and upstream-only features
- Prioritize local changes for custom code that doesn't exist upstream

### Conflict resolution approach
- **`.planning/` conflict**: Accept upstream deletion (delete local `.planning/` files) — planning artifacts are personal to the fork
- **`package-lock.json`**: Accept upstream version — do not manually resolve; run `npm install` post-merge to regenerate if needed
- **Route files**: Manually inspect any conflicted signing/completion route files for Phase 1-3 changes before committing
- **Translation .po files**: Accept upstream (use `git checkout --theirs`) — translations are crowd-sourced upstream
- **E2E tests**: Accept upstream for restructured tests; re-apply any local test modifications manually if needed

### Pre-merge checklist
- [ ] Commit or stash any unpushed fork-specific work
- [ ] Note: `err.txt` exists locally — decide whether to keep before merge
- [ ] After merge: run `npm run lint` and `npm run build` to verify
