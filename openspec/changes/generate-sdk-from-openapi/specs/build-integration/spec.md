# Spec: Build Pipeline Integration

**Capability**: `build-integration`  
**Related Change**: `generate-sdk-from-openapi`  

---

## ADDED Requirements

### Requirement: Integrate generation into build process

Type generation SHALL be part of the standard build workflow.

**Priority**: Critical  
**Scope**: Build System

#### Scenario: Build command includes generation

**Given** developer runs `npm run build`  
**When** build process starts  
**Then** OpenAPI spec validation runs first  
**And** if validation passes, type generation runs  
**And** if generation succeeds, TypeScript compilation runs  
**And** if compilation succeeds, bundling with tsup runs  
**And** final output is created in `dist/` directory

#### Scenario: Build fails if specs are invalid

**Given** an OpenAPI spec is invalid  
**When** developer runs `npm run build`  
**Then** validation step fails with error message  
**And** generation step is skipped  
**And** build process exits with code 1  
**And** no files are created in `dist/`

#### Scenario: Build fails if generated types don't compile

**Given** generated types from OpenAPI contain TypeScript errors  
**When** build process reaches TypeScript compilation  
**Then** compilation fails with error message  
**And** error indicates which generated file has issues  
**And** error suggests checking the OpenAPI spec  
**And** build process exits with code 1

---

### Requirement: Provide separate generation command for development

Developers SHALL be able to regenerate types without full build.

**Priority**: High  
**Scope**: Developer Experience

#### Scenario: Developer regenerates types manually

**Given** developer modifies `openapi/spec/nf-servico-v1.yaml`  
**When** developer runs `npm run generate`  
**Then** only type generation runs (no build or bundling)  
**And** generated types are updated in `src/generated/`  
**And** command completes in under 3 seconds  
**And** TypeScript editor picks up new types immediately

#### Scenario: Watch mode for iterative development

**Given** developer is working on OpenAPI spec changes  
**When** developer runs `npm run generate:watch`  
**Then** watch process starts and monitors `openapi/spec/**/*.yaml`  
**And** any change to specs triggers automatic regeneration  
**And** console shows real-time feedback on regeneration status  
**And** process continues until manually stopped

---

### Requirement: Integrate with CI/CD pipeline

Generation SHALL be part of CI/CD workflow with caching for efficiency.

**Priority**: High  
**Scope**: Continuous Integration

#### Scenario: CI pipeline includes generation steps

**Given** GitHub Actions workflow file exists at `.github/workflows/ci.yml`  
**When** CI pipeline runs on pull request  
**Then** pipeline executes in order:
1. Checkout code
2. Setup Node.js with npm cache
3. Install dependencies (`npm ci`)
4. Validate OpenAPI specs (`npm run validate:spec`)
5. Generate types (`npm run generate`)
6. Type check (`npm run typecheck`)
7. Lint (`npm run lint`)
8. Test (`npm run test`)
9. Build (`npm run build`)

**And** pipeline fails at first error  
**And** pipeline artifact includes generated types for debugging

#### Scenario: CI caches generated types when specs unchanged

**Given** OpenAPI specs have not changed since last CI run  
**And** CI cache contains previously generated types  
**When** CI pipeline runs  
**Then** generation step detects no changes  
**And** generation is skipped  
**And** cached types are used  
**And** build time is reduced by ~30%

#### Scenario: CI detects uncommitted generated files

**Given** developer modified spec but didn't commit generated types  
**When** CI runs generation  
**Then** generation produces different types than in repository  
**And** CI fails with error:
```
❌ Error: Generated types are out of sync
   
   OpenAPI specs changed but generated types not updated.
   Run locally: npm run generate
   Then commit: git add src/generated/ && git commit
```

---

### Requirement: Support prepublish validation

Package publishing SHALL validate generated types are current.

**Priority**: High  
**Scope**: Release Process

#### Scenario: Prepublish checks run before npm publish

**Given** `package.json` has `"prepublishOnly": "npm run build && npm test -- --run"`  
**When** developer runs `npm publish`  
**Then** prepublish hook runs build (which includes generation)  
**And** tests run to verify types match runtime behavior  
**And** if any check fails, publish is aborted  
**And** error message explains what failed

---

### Requirement: Provide clean command to remove generated files

Developers SHALL be able to clean generated files for troubleshooting.

**Priority**: Medium  
**Scope**: Developer Tools

#### Scenario: Clean command removes all generated artifacts

**Given** generated types exist in `src/generated/`  
**And** build artifacts exist in `dist/`  
**When** developer runs `npm run clean`  
**Then** all files in `src/generated/` are removed  
**And** all files in `dist/` are removed  
**And** `.gitkeep` or similar sentinel files are preserved  
**And** success message confirms cleanup

#### Scenario: Regenerate from clean state

**Given** developer runs `npm run clean`  
**When** developer runs `npm run build`  
**Then** generation recreates all files from scratch  
**And** build completes successfully  
**And** resulting types are identical to before clean

---

## MODIFIED Requirements

### Modified: Build script execution order

**Change Type**: Enhancement  
**Previous Behavior**: Build ran TypeScript compilation directly  
**New Behavior**: Build runs validation → generation → compilation → bundling

#### Scenario: Updated build pipeline sequence

**Given** package.json scripts are updated  
**When** developer runs `npm run build`  
**Then** execution order is:
```bash
npm run validate:spec  # prebuild hook
npm run generate       # part of build
tsc --noEmit           # type checking (prebuild)
tsup                   # bundling (build)
```

---

## REMOVED Requirements

_No existing requirements removed by this capability._

---

## Cross-References

- **Depends on**: `code-generation` - Integrates generation into build
- **Depends on**: `spec-validation` - Validates before generation
- **Enables**: Reliable releases with type-safe generated code
- **Related**: Future automatic release process with generated changelogs
