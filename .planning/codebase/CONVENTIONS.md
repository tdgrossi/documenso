# Coding Conventions

**Analysis Date:** 2026-06-19

## Naming Patterns

**Files:**
- Directory names: `lowercase-with-dashes` (e.g. `auth-wizard`, `envelope-router`)
- Component files: `kebab-case.tsx` (e.g. `button.tsx`, `data-table.tsx`)
- Route files follow the `remix-flat-routes` convention with `+` separators (e.g. `_authenticated+\t.$teamUrl+\documents._index.tsx`)
- Test files: `*.test.ts` (unit), `*.spec.ts` (E2E)

**Functions:**
- Arrow functions exclusively via `export const fnName = async () => {}` — never `function` declarations
- Verb-based names: `createDocument`, `findDocuments`, `updateDocument`, `deleteDocument`
- `on` prefix for event handlers: `onSubmit`, `onClick`, `onFormSubmit`, `onFieldCopy`
- Destructured object parameters for functions with multiple arguments

```typescript
// ✅ Correct pattern
export const findDocuments = async ({
  userId,
  teamId,
  status = ExtendedDocumentStatus.ALL,
  page = 1,
  perPage = 10,
}: FindDocumentsOptions) => {
  // ...
};

// ❌ Never use function declarations
function findDocuments() {}
```

**Variables:**
- `camelCase` for all variables and functions
- Auxiliary verbs for booleans: `isLoading`, `hasError`, `canEdit`, `shouldRender`, `isDisabled`
- `UPPER_SNAKE_CASE` for true constants: `DEFAULT_DOCUMENT_DATE_FORMAT`, `MAX_FILE_SIZE`
- Descriptive over abbreviated: `recipientAuthenticationOptions` not `recipAuthOpts`

**Types:**
- `PascalCase` for all type definitions
- Prefer `type` over `interface`
- Prefix Zod schemas with `Z`: `ZCreateDocumentOptionsSchema`
- Prefix inferred types with `T`: `TCreateDocumentOptions = z.infer<typeof ZCreateDocumentOptionsSchema>`
- Export types alongside their implementation in paired `.types.ts` files:

```typescript
// create-envelope.types.ts
export const ZCreateEnvelopeRequestSchema = z.object({ ... });
export type TCreateEnvelopeRequest = z.infer<typeof ZCreateEnvelopeRequestSchema>;
```

## Code Style

**Formatting:**
- **Biome v2.4.8** (`biome.json`) — format on save via `biome format --write .`
- Indent: 2 spaces
- Line width: 120 characters
- Line endings: LF
- Single quotes for strings
- Semicolons: always
- Trailing commas: always (all contexts)
- Arrow parentheses: always
- JSX quote style: double quotes

**Linting:**
- **Biome** with recommended rules enabled
- `biome check .` for linting, `biome check --write .` for auto-fix
- Key non-default rules:
  - `noMisusedPromises`: `error` (nursery)
  - `noFloatingPromises`: `warn` (nursery)
  - `useSortedClasses`: `warn` with safe fix (Tailwind class sorting)
  - `useExhaustiveDependencies`: `off` (explicitly disabled for React hooks)
  - `noUnusedImports`: `warn` with safe fix
  - `noUnusedVariables`: `warn`
  - `noExplicitAny`: `warn`
  - `noNonNullAssertion`: `warn`
  - `useBlockStatements`: `error` (blocks required even for single-line if)
  - `useConst`: `error` (TS override)
  - `noVar`: `error` (TS override)
  - `useSpread`: `error` (nursery, TS override)
  - `noArrayIndexKey`: `off`
  - `noSvgWithoutTitle`: `off`
  - `noLabelWithoutControl`: `off`

**Lint-staged:**
- `lint-staged` runs `npm run lint:staged` on `*.{ts,tsx,cts,mts,js,jsx,cjs,mjs,json,css}` files pre-commit
- `commitlint` enforces conventional commit format via `@commitlint/config-conventional`

## Import Organization

**Order (with blank lines between groups):**
1. React imports (e.g. `import { useCallback } from 'react'`)
2. Third-party library imports (alphabetically — `@hookform`, `@lingui`, `@prisma/client`, `ts-pattern`)
3. Internal package imports (from `@documenso/*`)
4. Relative imports (e.g. `../team/get-team`, `./types`)
5. Type-only imports use `import type` syntax

```typescript
// React
import { useCallback, useEffect, useMemo } from 'react';

// Third-party
import { zodResolver } from '@hookform/resolvers/zod';
import { Trans } from '@lingui/react/macro';
import { match } from 'ts-pattern';

// Internal packages
import { AppError } from '@documenso/lib/errors/app-error';
import { Button } from '@documenso/ui/primitives/button';

// Relative
import { getTeamById } from '../team/get-team';
import type { FindResultResponse } from './types';
```

**Path Aliases:**
- `~` maps to `apps/remix/app/` for route file imports (e.g. `import { Header } from '~/components/general/app-header'`)
- Direct `@documenso/*` workspace references for internal package imports

## Error Handling

**Strategy:** Use `AppError` class (`packages/lib/errors/app-error.ts`) for all application errors.

**Patterns:**
- Throw `AppError` with a specific error code:

```typescript
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';

if (!template) {
  throw new AppError(AppErrorCode.NOT_FOUND, {
    message: `Template with ID ${templateId} not found`,
  });
}
```

- Frontend error parsing:

```typescript
import { AppError } from '@documenso/lib/errors/app-error';

try {
  await updateOrganisation({ organisationId, data });
} catch (err) {
  const error = AppError.parseError(err);

  toast({
    title: t`An error occurred`,
    description: error.message,
    variant: 'destructive',
  });
}
```

- TRPC error transformation:

```typescript
try {
  return await createDocument({ userId, data });
} catch (err) {
  return AppError.toRestAPIError(err);
}
```

- `AppErrorCode` enum includes codes: `ALREADY_EXISTS`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `LIMIT_EXCEEDED`, `TOO_MANY_REQUESTS`, `ENVELOPE_*`, `CSC_*`, and more.
- Error code mapping to HTTP + tRPC error codes in `genericErrorCodeToTrpcErrorCodeMap`

## Logging

**Framework:** `pino` (with `pino-pretty` for dev)

**Patterns:**
- Structured logging via tRPC context `ctx.logger`:

```typescript
.mutation(async ({ input, ctx }) => {
  ctx.logger.info({
    input: { templateId },
  });
  // ...
});
```

- Logger is passed as dependency to server-only functions:

```typescript
type Options = {
  logger?: Logger;
};
```

- Use `NEXT_PRIVATE_LOGGER_FILE_PATH` env var for E2E test log capture

## Comments

**When to Comment:**
- JSDoc for exported functions describing purpose, parameter intent, and return values
- Inline comments for non-obvious business logic, performance optimizations, or security-sensitive code
- Section header comments to separate logical sections: `// ─── Expected Output Tests ───────────────────────────────────────────────────`
- No comments for trivial self-documenting code

**JSDoc/TSDoc:**
- `/** ... */` blocks for public API functions and complex logic
- `@deprecated` tag for deprecated exports
- `@example` tag for usage examples in complex seed/test fixtures

## Function Design

**Size:** No strict limit but extract helper functions for reuse (e.g. `recipientExists` helper in `find-documents.ts`)

**Parameters:**
- Always use destructured object parameter pattern for 2+ parameters
- Destructure on dedicated lines:
```typescript
const { user } = ctx;
const { templateId } = input;
```
- Provide defaults in destructuring: `{ status = ExtendedDocumentStatus.ALL, page = 1 }`

**Return Values:**
- Explicit return types on function signatures: `Promise<Document>`
- Always `return` at end of functions (blank line before return)

## Module Design

**Exports:**
- Named exports for all components and functions
- Never use `export default`
- Barrel files (`index.ts`) used per directory

**Component file structure (top to bottom):**
1. Exported component (main export)
2. Subcomponents
3. Helper functions
4. Static content / constants
5. Types

## React & Components

**Component Definition:**
```typescript
export const AddSignersFormPartial = ({
  documentFlow,
  recipients,
  fields,
  onSubmit,
}: AddSignersFormProps) => {
  // ...
};
```

- Never use classes
- Never use `'use client'` directive
- `React.forwardRef` for primitives like `Button`

**Hooks & State:**
```typescript
const { _ } = useLingui();
const { toast } = useToast();
const form = useForm<TFormSchema>({ resolver: zodResolver(ZFormSchema) });
const [isLoading, setIsLoading] = useState(false);
const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
```

**UI Components:**
- **Shadcn UI / Radix** primitives in `packages/ui/primitives/` (Button, Dialog, Select, etc.)
- **Tailwind CSS** for styling with `cn()` utility for class merging
- **class-variance-authority (cva)** for component variant definitions
- **Lucide icons** with longhand names (`HomeIcon` vs `Home`)
- **`<Form>` / `<FormItem>`** elements with `fieldset` having `:disabled` attribute when loading
- Conditional rendering: `{isLoading && <Loader />}` or ternary for either/or

**Event Handlers:**
- `useCallback` for memoized handlers with dependencies
- Simple inline handlers for trivial cases: `<Button onClick={() => setOpen(false)}>`

**Translations:**
- `<Trans>string</Trans>` from `@lingui/react/macro` for JSX
- `` t`string` `` macro for TypeScript

## Async/Await Patterns

```typescript
// ✅ Use async/await, Promise.all for parallel
const [document, recipients] = await Promise.all([
  getDocumentById({ documentId }),
  getRecipientsForDocument({ documentId }),
]);

// ✅ void for fire-and-forget
void handleAutoSave();

// ✅ KeyboardEvent: event?.preventDefault()
```

## Pattern Matching

Use `match` from `ts-pattern` for complex conditionals:

```typescript
import { match } from 'ts-pattern';

const result = match(status)
  .with(ExtendedDocumentStatus.DRAFT, () => ({ status: 'draft' }))
  .with(ExtendedDocumentStatus.PENDING, () => ({ status: 'pending' }))
  .exhaustive();
```

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

---

*Convention analysis: 2026-06-19*
