# Project Context

## Purpose
This repository implements the official NFE.io Node.js SDK. It is currently undergoing a major modernization (v2 → v3): migrating from an older JavaScript/callbacks codebase to a TypeScript-first, OpenAPI-generated runtime with a small handwritten DX layer. The goals are:
- Provide a modern, typed, zero-runtime-dependency SDK for Node.js 18+.
- Preserve functional compatibility where practical with the existing v2 API surface.
- Improve developer experience (DX) with typed clients, better error types, retry & rate limiting, and comprehensive tests and docs.

## Tech Stack
- Primary language: `TypeScript` (>= 5.3)
- Runtime target: `Node.js` (>= 18)
- Test runner: `vitest`
- Bundler/build: `tsup`
- Lint/format: `ESLint` + `Prettier`
- OpenAPI tooling: `openapi-typescript` (generation scripts live under `scripts/`)
- Utilities: `zod` used for runtime validation where necessary

## Project Conventions

### Code Style
- Use `strict` TypeScript with no `any` in public APIs. Prefer `unknown` if necessary.
- Exports and public API must have JSDoc comments.
- Format with `prettier` and satisfy `eslint` rules before committing.
- Keep function and file names descriptive; avoid single-letter names.

### Architecture Patterns
- `src/generated/` is the machine-generated OpenAPI output — DO NOT EDIT. All handwritten code should live outside that folder.
- Handwritten layers:
	- `src/core/` or `src/client/`: main `NfeClient` and resource wrappers that provide a pleasant DX.
	- `src/runtime/` (or `src/http/`): Fetch-based HTTP client, retry, rate-limiter, and error factory.
	- `src/errors/`: typed error hierarchy (AuthenticationError, ValidationError, NfeError, etc.).
- Resource pattern: most endpoints are company-scoped (`company_id`) and follow the same method signatures as v2 where feasible.

### Testing Strategy
- Unit tests: `vitest` in `tests/unit` — test small modules and runtime helpers.
- Integration tests: `tests/integration` with MSW or local mocks to simulate API behavior (including 202 async flows).
- Coverage target: aim for > 80% for critical modules.
- Before merging: `npm run typecheck && npm run lint && npm test` must pass.

### Git Workflow
- Branching: use feature branches off `v3` (or the active mainline branch). Name branches `feat/`, `fix/`, `chore/`.
- Commits: follow the conventional commit style used in this repo (examples in `AGENTS.md` and the repo root). Example: `feat(service-invoices): add createAndWait`.
- Pull requests: include tests and update `CHANGELOG.md` when introducing breaking changes.

### Release & Versioning
- Releases are produced by the `build` pipeline: `npm run build` (which runs generation + bundling).
- Tags and changelog updates must accompany releases.

### Contribution & PRs
- Add/modify tests alongside implementation.
- Document breaking changes in `CHANGELOG.md` and call them out in the PR description.

## Domain Context
- This SDK targets the NFe.io API for issuing and managing electronic invoices (service invoices, NF-e, etc.).
- Key domain concepts:
	- Service invoices are usually scoped to a `company_id`.
	- Creating an invoice may return a 202/201 (async processing) with a `Location` header that must be polled.
	- Certificate uploads (company certificate) use a FormData multipart upload and require careful handling.

## Important Constraints
- `src/generated/` is auto-generated and must never be edited by hand.
- Runtime Node.js version must be >= 18 (native Fetch API assumed).
- Aim for zero runtime dependencies in the published package; allow devDependencies for tooling.
- Maintain backwards-compatible method signatures where possible — breaking changes must be documented.

## External Dependencies
- Upstream API: `https://api.nfe.io/v1` (production) and any sandbox endpoints used in tests.
- OpenAPI spec files located under `openapi/spec/` — used by generation scripts.
- For certificate uploads, `form-data` may be used in Node where native FormData is insufficient.

## Useful Files & Commands
- SDK sources: `src/` (handwritten) and `src/generated/` (auto-generated).
- Core scripts:
	- `npm run download-spec` — fetch or prepare OpenAPI spec
	- `npm run validate-spec` — validate the spec
	- `npm run generate` — run OpenAPI generation into `src/generated/`
	- `npm run build` — generate + bundle (`tsup`)
	- `npm run typecheck` — `tsc --noEmit`
	- `npm test` — run tests (vitest)
	- `npm run lint` — run ESLint

## Contacts / Maintainers
- Primary maintainers and owners should be listed in repo `README.md` and the project team documentation. For quick reference, check the `package.json` `author` and the repository settings on GitHub.

---

If you'd like, I can also:
- Add maintainers/contact details into this file.
- Expand any section (e.g., write exact ESLint config, CI steps, or a more detailed testing matrix).
