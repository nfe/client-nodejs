# Spec: OpenAPI Specification Validation

**Capability**: `spec-validation`  
**Related Change**: `generate-sdk-from-openapi`  

---

## ADDED Requirements

### Requirement: Validate OpenAPI specification compliance

The system SHALL validate OpenAPI 3.0 specification files before code generation.

**Priority**: Critical  
**Scope**: Quality Assurance

#### Scenario: Validation passes for compliant spec

**Given** OpenAPI spec file `nf-servico-v1.yaml` is valid OpenAPI 3.0  
**And** spec contains required fields: `openapi`, `info`, `paths`, `servers`  
**When** developer runs `npm run validate:spec`  
**Then** validation completes successfully  
**And** console shows "✓ nf-servico-v1.yaml is valid"  
**And** command exits with code 0

#### Scenario: Validation fails for non-compliant spec

**Given** OpenAPI spec file `broken-spec.yaml` exists  
**And** spec is missing required `info.version` field  
**When** developer runs `npm run validate:spec`  
**Then** validation fails with error message:
```
❌ Error: Invalid OpenAPI spec at openapi/spec/broken-spec.yaml
   Missing required field: info.version
```
**And** command exits with code 1  
**And** CI pipeline fails if running in CI environment

#### Scenario: Validation detects missing operationId

**Given** OpenAPI spec has a path operation without `operationId`  
**When** validation runs  
**Then** error message shows:
```
❌ Error: openapi/spec/nf-servico-v1.yaml
   Line 42: POST /companies/{id}/serviceinvoices missing 'operationId'
   
   Operation IDs are required for code generation.
   Add: operationId: ServiceInvoices_Create
```

---

### Requirement: Validate all specs in directory

The system SHALL validate all OpenAPI specs in the `openapi/spec/` directory.

**Priority**: High  
**Scope**: Comprehensive Validation

#### Scenario: Batch validation of multiple specs

**Given** 12 OpenAPI spec files exist in `openapi/spec/`  
**When** developer runs `npm run validate:spec`  
**Then** all 12 specs are validated  
**And** validation summary shows:
```
Validating OpenAPI specs...

✓ nf-servico-v1.yaml (valid)
✓ nf-produto-v2.yaml (valid)
✓ nf-consumidor-v2.yaml (valid)
✓ consulta-cnpj.yaml (valid)
✓ consulta-cte-v2.yaml (valid)
⚠ consulta-endereco.yaml (1 warning)
✓ consulta-nf-consumidor.yaml (valid)
✓ consulta-nf.yaml (valid)
✓ consulta-nfe-distribuicao-v1.yaml (valid)
✓ cpf-api.yaml (valid)
✓ calculo-impostos-v1.yaml (valid)
✓ nfeio.yaml (valid)

Results: 11 valid, 0 errors, 1 warning
```

**And** command exits with code 0 (warnings don't fail validation)

#### Scenario: Validation stops on first error in strict mode

**Given** `--strict` flag is provided  
**And** second spec file has validation error  
**When** validation runs  
**Then** validation stops after first error  
**And** subsequent specs are not validated  
**And** error message indicates use of `--continue-on-error` flag

---

### Requirement: Provide clear error messages with context

Validation errors SHALL include file location and remediation guidance.

**Priority**: High  
**Scope**: Developer Experience

#### Scenario: Error message includes line number and context

**Given** spec has invalid schema reference at line 125  
**When** validation fails  
**Then** error message shows:
```
❌ Error: openapi/spec/nf-servico-v1.yaml:125
   Invalid schema reference: #/components/schemas/NonExistentType
   
   Referenced type 'NonExistentType' does not exist in components.schemas
   
   Did you mean one of these?
   - ServiceInvoice
   - ServiceInvoiceCreationObject
   - InvoiceStatus
```

#### Scenario: Warning for deprecated OpenAPI features

**Given** spec uses deprecated `type: file` for file uploads  
**When** validation runs  
**Then** warning message shows:
```
⚠  Warning: openapi/spec/companies.yaml:89
   Using deprecated 'type: file' for file uploads
   
   OpenAPI 3.0 recommends using:
   type: string
   format: binary
   
   This will not cause generation to fail but should be updated.
```

---

### Requirement: Integrate validation into CI/CD pipeline

Validation SHALL run automatically in CI/CD before generation and build.

**Priority**: High  
**Scope**: Continuous Integration

#### Scenario: CI fails on invalid spec

**Given** GitHub Actions workflow includes validation step  
**And** a spec file is invalid  
**When** CI pipeline runs  
**Then** validation step fails  
**And** subsequent steps (generate, build, test) are skipped  
**And** PR cannot be merged until specs are fixed

#### Scenario: Pre-build validation prevents broken releases

**Given** `package.json` has `"prebuild": "npm run validate:spec"`  
**When** developer runs `npm run build`  
**Then** validation runs before TypeScript compilation  
**And** build fails if any spec is invalid  
**And** error message directs to fix specs

---

## MODIFIED Requirements

_No existing requirements modified by this capability._

---

## REMOVED Requirements

_No existing requirements removed by this capability._

---

## Cross-References

- **Blocks**: `code-generation` - Must validate before generating code
- **Enables**: `build-integration` - Ensures only valid specs reach production
- **Related**: Future schema migration tools for OpenAPI version upgrades
