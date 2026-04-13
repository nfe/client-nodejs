# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Official NFE.io SDK for Node.js -- TypeScript native client for Brazilian electronic fiscal document APIs (NFS-e, NF-e, CT-e, CF-e). Version 3.x is a complete rewrite from the legacy v2 JavaScript/callback codebase that still lives in `lib/`.

## Build & Development Commands

```bash
npm run validate:spec    # Validate OpenAPI YAML specs
npm run generate         # Generate TypeScript types from OpenAPI specs into src/generated/
npm run build            # Full pipeline: validate:spec -> generate -> clean -> typecheck -> tsup
npm run typecheck        # TypeScript strict check (tsc --noEmit)
npm run lint             # ESLint with auto-fix
npm run format           # Prettier formatting
```

## Test Commands

```bash
npm test                 # Run all tests (vitest, watch mode)
npm test -- --run        # Run all tests once (no watch)
npm run test:unit        # Unit tests only (tests/unit/)
npm run test:integration # Integration tests only (tests/integration/)
npm run test:coverage    # Tests with v8 coverage report
npm test -- tests/unit/specific-file.test.ts  # Run a single test file
```

Coverage thresholds: 80% for branches, functions, lines, and statements. Test setup is in `tests/setup.ts` with mock data generators and test constants.

## Architecture

### Dual Codebase (v2 + v3)

- **v3 (active)**: `src/` -- TypeScript, async/await, Fetch API, zero runtime dependencies
- **v2 (legacy)**: `lib/` -- JavaScript, `when` promises, `BaseResource.extend()` pattern

### v3 Source Structure

- `src/index.ts` -- Barrel export for all public API (`NfeClient`, types, errors)
- `src/core/client.ts` -- Main `NfeClient` class with lazy-initialized resource getters and polling utilities
- `src/core/types.ts` -- All TypeScript type definitions (config, resources, HTTP)
- `src/core/http/client.ts` -- Fetch-based HTTP client with retry, timeout, rate-limit handling
- `src/core/errors/` -- Error hierarchy: `NfeError` base, then `AuthenticationError`, `ValidationError`, `NotFoundError`, `RateLimitError`, `TimeoutError`, `ConnectionError`, etc.
- `src/core/resources/` -- 17 resource implementations (service-invoices, companies, webhooks, etc.)
- `src/generated/` -- **AUTO-GENERATED from OpenAPI specs. NEVER edit manually.**

### OpenAPI Pipeline

Specs live in `openapi/spec/*.yaml`. The generation script (`scripts/generate-types.ts`) produces typed interfaces in `src/generated/`. The build pipeline always validates and regenerates before compiling.

### Key Patterns

- **Company-scoped operations**: Most resource methods take `company_id` as first parameter
- **Async invoice processing**: `serviceInvoices.create()` may return 202 + Location header; use polling utilities (`pollUntilComplete`, `pollWithExponentialBackoff`) for completion
- **Discriminated union returns**: Create operations return typed results distinguishing immediate (201) vs async (202) responses
- **Lazy resource initialization**: Resources on `NfeClient` are instantiated on first property access
- **Multiple API endpoints**: Separate HTTP clients for different service APIs (main, CT-e, legal entity, natural person, etc.)

### Module Output

Dual format via tsup: ESM (`dist/index.js`) + CommonJS (`dist/index.cjs`) + type declarations (`dist/index.d.ts`). Target: Node.js 18+.

## Code Style

- TypeScript strict mode with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- Prettier: single quotes, trailing commas (ES5), 100 char width, semicolons
- ESLint: no `any` types (warning), unused vars allowed with `_` prefix
- No runtime dependencies -- everything uses Node.js built-ins (Fetch, AbortController, Buffer)

## Important Rules

- **Never edit files in `src/generated/`** -- they are overwritten by the generation pipeline
- Run `npm run generate` after modifying any OpenAPI spec in `openapi/spec/`
- Typecheck and tests must pass before commits (`npm run typecheck && npm test -- --run`)
- The CHANGELOG is written in Portuguese
