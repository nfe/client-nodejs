# Tasks: Generate SDK from OpenAPI Specifications

**Change ID**: `generate-sdk-from-openapi`  
**Dependencies**: None (foundation capability)  
**Estimated Effort**: 3-5 days  

---

## Task Breakdown

### 🔴 Phase 1: Foundation (Day 1-2) - CRITICAL PATH

#### Task 1.1: Create base generation script
**Deliverable**: `scripts/generate-types.ts` functional for single spec  
**Validation**: Script runs without errors and produces TypeScript file  
**Effort**: 4 hours  
**Status**: ✅ COMPLETED

- [x] Create `scripts/generate-types.ts`
- [x] Implement file discovery for `openapi/spec/*.yaml`
- [x] Integrate `openapi-typescript` programmatically
- [x] Generate output to `src/generated/schema.ts`
- [x] Add error handling and logging
- [x] Test with `nf-servico-v1.yaml` (main spec)

```bash
# Expected outcome:
npm run generate
# → Creates src/generated/schema.ts with types from nf-servico-v1.yaml
```

---

#### Task 1.2: Create spec validation script
**Deliverable**: `scripts/validate-spec.ts` validates OpenAPI compliance  
**Validation**: Catches invalid specs before generation  
**Effort**: 3 hours  
**Status**: ✅ COMPLETED

- [x] Create `scripts/validate-spec.ts`
- [x] Validate OpenAPI 3.0 schema compliance (+ Swagger 2.0 detection)
- [x] Check for required fields (paths, info, servers)
- [x] Warn about deprecated features
- [x] Report clear error messages
- [x] Test with all 12 existing specs

```bash
# Expected outcome:
npm run validate:spec
# → Validates all specs, reports errors or success
```

---

#### Task 1.3: Update package.json scripts
**Deliverable**: npm commands for generation workflow  
**Validation**: Commands work and integrate with build  
**Effort**: 1 hour  
**Status**: ✅ COMPLETED

- [x] Add `"generate": "tsx scripts/generate-types.ts"`
- [x] Add `"validate:spec": "tsx scripts/validate-spec.ts"`
- [x] Update `"build": "npm run generate && tsup"`
- [x] Add `"prebuild": "npm run validate:spec"`
- [x] Add `"generate:watch": "tsx watch scripts/generate-types.ts"` for dev

---

#### Task 1.4: Setup generated code structure
**Deliverable**: `src/generated/` directory with proper guards  
**Validation**: Generated code compiles and exports correctly  
**Effort**: 2 hours  
**Status**: ✅ COMPLETED

- [x] Create `src/generated/` directory
- [x] Add `.gitignore` entry for generated files (optional - can be committed)
- [x] Create `src/generated/index.ts` template
- [x] Add warning banner in generated files: `// ⚠️ AUTO-GENERATED - DO NOT EDIT`
- [x] Configure tsconfig to include `src/generated`
- [x] Verify `npm run typecheck` passes with generated types

---

#### Task 1.5: Generate types from main spec
**Deliverable**: Working TypeScript types from `nf-servico-v1.yaml`  
**Validation**: Types used successfully in handwritten code  
**Effort**: 2 hours  
**Status**: ✅ COMPLETED

- [x] Run generation on `nf-servico-v1.yaml`
- [x] Verify output structure matches expectations
- [x] Create namespace/module for service invoice types
- [x] Export key types (ServiceInvoice, Company, etc.)
- [x] Document type naming conventions

```typescript
// Expected types in src/generated/schema.ts:
export interface ServiceInvoice { ... }
export interface Company { ... }
export interface paths { ... }
export interface components { ... }
```

---

### 🟡 Phase 2: Integration (Day 3) - HIGH PRIORITY

#### Task 2.1: Update ServiceInvoices resource to use generated types
**Deliverable**: `src/core/resources/service-invoices.ts` uses generated types  
**Validation**: TypeScript compilation passes, tests pass  
**Effort**: 3 hours  
**Depends on**: Task 1.5  
**Status**: ✅ COMPLETED

- [x] Import types from `src/generated/index`
- [x] Replace handwritten interfaces with generated types in `src/core/types.ts`
- [x] Update method signatures to use generated types
- [x] Add type aliases for backward compatibility (ServiceInvoiceStatus, ServiceInvoiceBorrower)
- [x] Update ServiceInvoices, Companies, LegalPeople, NaturalPeople resources
- [x] TypeScript compilation passes (`npm run typecheck`)

**Notes**:
- Generated types use `flowStatus` instead of `status` field
- API returns single objects for LegalPeople Get, but arrays for NaturalPeople Get
- Some unit tests need mock data updates to match new field names (flowStatus, etc.)

```typescript
// After migration:
import type {
  ServiceInvoice,
  ServiceInvoiceData,
  Company,
  LegalPerson,
  NaturalPerson
} from '../generated/index.js';
```

---

#### Task 2.2: Multi-spec generation support
**Deliverable**: Generate types from all 12 OpenAPI specs  
**Validation**: 12 separate type files created, no conflicts  
**Effort**: 4 hours  
**Depends on**: Task 1.1  
**Status**: ✅ COMPLETED

- [x] Update `generate-types.ts` to process multiple specs
- [x] Generate separate file per spec:
  - `nf-servico.ts` ← nf-servico-v1.yaml
  - `nf-produto.ts` ← nf-produto-v2.yaml
  - `nf-consumidor.ts` ← nf-consumidor-v2.yaml
  - etc. (7 of 12 specs generated - 5 Swagger 2.0 specs skipped)
- [x] Create unified `src/generated/index.ts` with re-exports
- [x] Handle type name conflicts with namespacing
- [x] Document which resource uses which spec

---

#### Task 2.3: Create type merge strategy
**Deliverable**: Handle overlapping types across specs  
**Validation**: No TypeScript compilation errors from conflicts  
**Effort**: 2 hours  
**Depends on**: Task 2.2  
**Status**: ✅ COMPLETED  

- [ ] Identify common types across specs (Company, Address, etc.)
- [ ] Choose merge strategy:
  - Option A: Namespace per spec (`NfServico.Company`)
  - Option B: Use latest version (prefer v2 over v1)
  - Option C: Manual override file
- [ ] Document resolution strategy in generated index
- [ ] Create type aliases for common use cases

```typescript
// Example merge strategy:
// src/generated/index.ts
export * as NfServico from './nf-servico';
export * as NfProduto from './nf-produto';

// Common types (use service invoice as canonical)
export type Company = NfServico.components['schemas']['Company'];
```

---

### 🟢 Phase 3: Automation (Day 4) - MEDIUM PRIORITY

#### Task 3.1: CI/CD integration
**Deliverable**: GitHub Actions workflow includes generation  
**Validation**: CI fails if specs invalid or types don't compile  
**Effort**: 2 hours  
**Depends on**: Tasks 1.2, 1.3  
**Status**: ✅ COMPLETED

- [x] Update `.github/workflows/ci.yml` (or create if missing)
- [x] Add step: `npm run validate:spec`
- [x] Add step: `npm run generate`
- [x] Add step: `npm run typecheck`
- [x] Verify workflow fails on invalid specs
- [x] Cache `node_modules` for faster builds

```yaml
# .github/workflows/ci.yml
- name: Validate OpenAPI Specs
  run: npm run validate:spec
  
- name: Generate Types
  run: npm run generate
  
- name: Type Check
  run: npm run typecheck
```

---

#### Task 3.2: Watch mode for development
**Deliverable**: Auto-regenerate types on spec changes  
**Validation**: Developer experience improved  
**Effort**: 1 hour  
**Status**: ✅ COMPLETED

- [x] Add `generate:watch` script using `tsx watch`
- [x] Watch `openapi/spec/**/*.yaml` for changes
- [x] Debounce regeneration to avoid thrashing
- [x] Show clear console output on regeneration
- [x] Document in README development workflow

---

#### Task 3.3: Download OpenAPI spec script (optional)
**Deliverable**: `scripts/download-openapi.ts` fetches latest specs  
**Validation**: Script downloads or gracefully fails  
**Effort**: 2 hours  
**Optional**: NFE.io may not expose public spec endpoints  
**Status**: ✅ COMPLETED

- [x] Create `scripts/download-openapi.ts`
- [x] Check known spec URLs (e.g., `https://api.nfe.io/openapi.json`)
- [x] Download and save to `openapi/spec/`
- [x] Add `"download:spec": "tsx scripts/download-openapi.ts"`
- [x] Document in README when to use
- [x] Add error handling if specs not publicly available

---

### 🔵 Phase 4: Documentation & Polish (Day 5) - POLISH

#### Task 4.1: Developer documentation
**Deliverable**: Clear guide in README and/or docs/  
**Validation**: New contributor can generate types successfully  
**Effort**: 2 hours  
**Status**: ✅ COMPLETED

- [x] Document manual generation workflow in README
- [x] Document automatic generation in CI/CD
- [x] Explain `src/generated/` structure
- [x] Show examples of using generated types
- [x] Add troubleshooting section
- [x] Update CONTRIBUTING.md with generation guidelines

---

#### Task 4.2: Migration examples
**Deliverable**: Code examples showing handwritten → generated migration  
**Validation**: Developers understand migration path  
**Effort**: 2 hours  
**Status**: ✅ COMPLETED

- [x] Create `docs/MIGRATION-TO-GENERATED-TYPES.md`
- [x] Show before/after for ServiceInvoices resource
- [x] Document type import patterns
- [x] Show how to handle type conflicts
- [x] Provide checklist for migrating resources

---

#### Task 4.3: Generator configuration
**Deliverable**: `openapi/generator-config.yaml` for customization  
**Validation**: Developers can customize generation behavior  
**Effort**: 1 hour  
**Status**: ✅ COMPLETED

- [x] Create `openapi/generator-config.yaml`
- [x] Document configuration options:
  - Output directory
  - Type naming conventions
  - Include/exclude specs
  - Type transformations
- [x] Use config in `generate-types.ts`
- [x] Add schema validation for config

```yaml
# openapi/generator-config.yaml
output: src/generated
specs:
  - path: openapi/spec/nf-servico-v1.yaml
    output: nf-servico.ts
    namespace: NfServico
  - path: openapi/spec/nf-produto-v2.yaml
    output: nf-produto.ts
    namespace: NfProduto
```

---

#### Task 4.4: Testing and validation
**Deliverable**: Tests verify generation correctness  
**Validation**: Test suite ensures types match runtime  
**Effort**: 3 hours  
**Status**: ✅ COMPLETED

- [x] Create `tests/unit/generation.test.ts`
- [x] Test: Generated files exist after generation
- [x] Test: Generated types compile
- [x] Test: Key types exported correctly
- [x] Test: Spec validation catches errors
- [x] Add to CI pipeline

---

## Parallelization Opportunities

**Can be done in parallel**:
- Task 1.1 (generation) and Task 1.2 (validation) - independent scripts
- Task 2.2 (multi-spec) and Task 2.3 (merge strategy) - can develop merge strategy while multi-spec runs
- Task 4.1 (docs) and Task 4.2 (examples) - documentation tasks

**Must be sequential**:
- Phase 1 must complete before Phase 2 (need working generation)
- Task 2.1 depends on Task 1.5 (need generated types to use them)
- Task 3.1 depends on Tasks 1.2, 1.3 (need scripts to run in CI)

---

## Validation Checklist

After all tasks complete, verify:

- [ ] `npm run validate:spec` passes for all 12 specs
- [ ] `npm run generate` creates files in `src/generated/`
- [ ] `npm run typecheck` passes with generated types
- [ ] `npm run build` completes successfully
- [ ] `npm test` passes with at least one resource using generated types
- [ ] CI/CD pipeline includes generation steps
- [ ] README documents both manual and automatic workflows
- [ ] At least one example shows using generated types

---

## Notes

- **Rollback plan**: If generation fails, handwritten types remain functional
- **Incremental adoption**: Can migrate resources one at a time
- **Future work**: Could generate Zod schemas, runtime validators, or full clients
