# Proposal: Generate SDK from OpenAPI Specifications

**Change ID**: `generate-sdk-from-openapi`  
**Status**: Approved  
**Created**: 2026-01-10  
**Approved**: 2026-01-10  
**Author**: AI Assistant

---

## Problem Statement

The NFE.io SDK v3 modernization requires automatic code generation from OpenAPI specifications to maintain type safety and reduce manual maintenance. Currently:

1. **No code generation infrastructure**: Despite having 12 OpenAPI spec files in `openapi/spec/`, there are no scripts to generate TypeScript types or runtime code from them
2. **Manual resource implementation**: All resources in `src/core/resources/` are handwritten, leading to:
   - Type mismatches with actual API
   - High maintenance burden when API changes
   - No single source of truth for API contracts
3. **Incomplete type coverage**: Only 5 resources manually implemented (Companies, ServiceInvoices, LegalPeople, NaturalPeople, Webhooks) while OpenAPI specs describe many more endpoints
4. **Missing validation tooling**: No automated way to ensure SDK implementation matches OpenAPI specs

The project already has `openapi-typescript` as a dependency but lacks the scripts and architecture to leverage it effectively.

---

## Goals

### Primary Goals
1. **Automated type generation**: Generate TypeScript types from all OpenAPI specs in `openapi/spec/`
2. **Manual generation workflow**: Provide CLI commands for developers to regenerate types on-demand
3. **Automatic generation workflow**: Integrate generation into the build pipeline for CI/CD
4. **Validation tooling**: Ensure generated code matches OpenAPI specs and is consumable by handwritten DX layer

### Secondary Goals
1. **Multi-spec support**: Handle the 12 different OpenAPI spec files (nf-servico-v1.yaml, nf-produto-v2.yaml, etc.)
2. **Incremental adoption**: Allow gradual migration from handwritten to generated types
3. **Developer documentation**: Clear guide on how to add new resources or update existing ones

### Non-Goals
1. **Full runtime client generation**: Generated code provides types only; handwritten DX layer in `src/core/` wraps them
2. **Breaking existing v2 API**: Generation is for v3 only; v2 code in `lib/` remains untouched
3. **API spec creation**: Assumes OpenAPI specs already exist and are maintained by the API team

---

## Proposed Solution

### High-Level Approach

Implement a **hybrid architecture**: 
- **Generated layer** (`src/generated/`): Auto-generated TypeScript types and schemas from OpenAPI specs
- **Handwritten DX layer** (`src/core/`): Developer-friendly resource classes that use generated types

### Architecture Components

```
openapi/spec/              # Source of truth - 12 OpenAPI YAML files
    ├── nf-servico-v1.yaml
    ├── nf-produto-v2.yaml
    ├── nf-consumidor-v2.yaml
    └── ...

scripts/
    ├── generate-types.ts       # Main generation orchestrator
    ├── download-openapi.ts     # Download specs from API (if available)
    ├── validate-spec.ts        # Validate OpenAPI specs
    └── merge-specs.ts          # Merge multiple specs into unified types

src/generated/              # ⚠️ AUTO-GENERATED - DO NOT EDIT
    ├── schema.ts           # All API types from all specs
    ├── nf-servico.ts       # Types for service invoices
    ├── nf-produto.ts       # Types for product invoices
    ├── companies.ts        # Types for companies
    └── index.ts            # Re-exports all types

src/core/resources/         # ✏️ HANDWRITTEN - Uses generated types
    ├── service-invoices.ts # Imports from src/generated/nf-servico
    ├── companies.ts        # Imports from src/generated/companies
    └── ...
```

### Key Scripts

#### 1. `scripts/generate-types.ts`
Orchestrates the entire generation process:
- Discovers all YAML files in `openapi/spec/`
- Runs `openapi-typescript` for each spec
- Generates combined type index
- Validates output compiles

#### 2. `scripts/validate-spec.ts`
Validates OpenAPI specs before generation:
- Schema validation (OpenAPI 3.0 compliance)
- Required fields check
- Warns about breaking changes

#### 3. `scripts/download-openapi.ts`
Optional: Downloads latest specs from API if available:
- Checks if public spec endpoints exist
- Falls back to local files if not available

### npm Scripts Integration

```json
{
  "scripts": {
    "generate": "tsx scripts/generate-types.ts",
    "generate:watch": "tsx watch scripts/generate-types.ts",
    "validate:spec": "tsx scripts/validate-spec.ts",
    "download:spec": "tsx scripts/download-openapi.ts",
    "build": "npm run generate && tsup",
    "prebuild": "npm run validate:spec"
  }
}
```

### Developer Workflows

#### Manual Generation (Developer)
```bash
# 1. Update OpenAPI spec file
vim openapi/spec/nf-servico-v1.yaml

# 2. Regenerate types
npm run generate

# 3. Verify types compile
npm run typecheck

# 4. Update handwritten resource if needed
vim src/core/resources/service-invoices.ts
```

#### Automatic Generation (CI/CD)
```bash
# In GitHub Actions or similar
npm run validate:spec  # Fails if specs invalid
npm run generate       # Generates fresh types
npm run build          # Builds with generated types
npm run test           # Tests ensure types match runtime
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Create generation scripts infrastructure
- Generate types from existing `nf-servico-v1.yaml` (main spec)
- Validate generated types compile
- Update one resource (ServiceInvoices) to use generated types

### Phase 2: Full Coverage (Week 2)
- Generate types from all 12 OpenAPI specs
- Create unified type index
- Migration guide for developers
- CI/CD integration

### Phase 3: Validation & Polish (Week 3)
- Automated spec validation
- Runtime validation with Zod (optional)
- Documentation and examples
- Developer tooling improvements

---

## Success Criteria

1. ✅ Running `npm run generate` produces valid TypeScript in `src/generated/`
2. ✅ All 12 OpenAPI specs generate types without errors
3. ✅ `npm run typecheck` passes with generated types
4. ✅ At least one handwritten resource uses generated types
5. ✅ CI/CD pipeline includes generation step
6. ✅ Documentation explains manual and automatic workflows
7. ✅ No breaking changes to existing v3 API surface

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| OpenAPI specs may be incomplete or outdated | Medium | Validate specs first; document gaps; create manual types as fallback |
| Generated types may not match handwritten DX patterns | Medium | Use adapter pattern; generated types are internal only |
| Multiple specs may have conflicting types | High | Namespace types by spec; provide merge strategy |
| Breaking changes in API specs | Medium | Lock spec versions; validate before regenerating |

---

## Open Questions

1. **Spec versioning**: Should we pin specific versions of OpenAPI specs or always use latest?
2. **Type conflicts**: How to handle when multiple specs define the same entity differently?
3. **Deprecation strategy**: How to mark deprecated endpoints in generated code?
4. **Runtime validation**: Should we generate Zod schemas alongside TypeScript types?

---

## Dependencies

- External: `openapi-typescript` (already in devDependencies)
- Internal: None - foundation capability
- Blocks: All future resource implementations should use generated types

---

## Related Changes

- **Future**: Could enable OpenAPI-first development where specs drive implementation
- **Future**: Runtime validation with Zod schemas generated from OpenAPI
- **Future**: Auto-generated API documentation from OpenAPI specs
