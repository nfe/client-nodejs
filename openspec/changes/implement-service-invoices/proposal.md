# Proposal: Implement Service Invoices Resource

**Change ID**: `implement-service-invoices`  
**Status**: ✅ Approved  
**Created**: 2026-01-15  
**Approved**: 2026-01-16  
**Author**: AI Assistant

---

## Problem Statement

The NFE.io SDK v3 requires complete implementation of the Service Invoices (Nota Fiscal de Serviço - NFSE) resource, which is the core functionality of the NFE.io API. While a partial implementation exists in `src/core/resources/service-invoices.ts`, it needs to be completed, thoroughly tested, and fully documented.

Service invoices represent the primary business capability of NFE.io - allowing companies to issue, manage, and distribute electronic service invoices in compliance with Brazilian tax regulations. The resource must handle:

1. **Standard CRUD operations** (create, list, retrieve, cancel)
2. **Asynchronous processing patterns** (202 responses with location-based polling)
3. **Email notifications** to invoice recipients
4. **Document downloads** (PDF and XML formats)
5. **Complex validation** of Brazilian tax data
6. **Polling helpers** for async invoice creation completion

## Current State

### Existing Implementation
- **Location**: `src/core/resources/service-invoices.ts` (322 lines)
- **Status**: Partially implemented
- **Coverage**: Basic CRUD methods exist, but incomplete error handling, validation, and polling utilities

### v2 Implementation Reference
- **Location**: `lib/resources/ServiceInvoices.js` (51 lines)
- **Pattern**: BaseResource.extend() with REST method declarations
- **Methods**: create, list, retrieve, cancel, sendemail, downloadPdf, downloadXml

### OpenAPI Specification
- **Location**: `openapi/spec/nf-servico-v1.yaml`
- **Endpoints**:
  - `POST /v1/companies/{company_id}/serviceinvoices` - Create invoice
  - `GET /v1/companies/{company_id}/serviceinvoices` - List invoices
  - `GET /v1/companies/{company_id}/serviceinvoices/{id}` - Get invoice
  - `DELETE /v1/companies/{company_id}/serviceinvoices/{id}` - Cancel invoice
  - `PUT /v1/companies/{company_id}/serviceinvoices/{id}/sendemail` - Send email
  - `GET /v1/companies/{company_id}/serviceinvoices/{id}/pdf` - Download PDF
  - `GET /v1/companies/{company_id}/serviceinvoices/{id}/xml` - Download XML

### Test Coverage
- **Integration tests**: `tests/integration/service-invoices.integration.test.ts` exists
- **Unit tests**: Missing or incomplete
- **Current coverage**: Unknown, but likely < 50%

## Proposed Solution

Complete the Service Invoices resource implementation with three distinct capabilities:

### Capability 1: Service Invoice Operations
**Scope**: Core CRUD operations and email functionality  
**Spec Location**: `specs/service-invoice-operations/spec.md`

Implement complete CRUD operations with:
- Full TypeScript types from OpenAPI schema
- Comprehensive error handling (validation, authentication, processing errors)
- Input validation using Zod schemas
- Pagination support for list operations
- Filtering by date ranges (issued, created)
- Company-scoped operations

### Capability 2: Async Invoice Processing
**Scope**: Handling 202 responses and polling mechanisms  
**Spec Location**: `specs/async-invoice-processing/spec.md`

Implement asynchronous invoice creation pattern:
- Detect 202 (Accepted) responses from create operations
- Parse Location header for polling URL
- Provide `createAndWait()` helper for automatic polling
- Configurable polling intervals and timeouts
- Flow status tracking (WaitingCalculateTaxes, WaitingSend, Issued, etc.)
- Proper error handling for failed async operations

### Capability 3: Invoice Downloads
**Scope**: PDF and XML document downloads  
**Spec Location**: `specs/invoice-downloads/spec.md`

Implement document download operations:
- Download PDF representation of invoice
- Download XML representation of invoice
- Handle binary streams using Fetch API
- Return Buffer objects for Node.js compatibility
- Proper Accept headers for content negotiation
- Error handling for 404 (document not ready) scenarios

## Success Criteria

1. **Completeness**: All 7 endpoints from OpenAPI spec implemented
2. **Type Safety**: Full TypeScript types with no `any` in public APIs
3. **Testing**: 
   - Unit test coverage > 80%
   - Integration tests for all operations
   - Tests for error scenarios (401, 400, 404, 408, 500)
   - Tests for async processing (202 → polling → completion)
4. **Documentation**:
   - JSDoc comments on all public methods
   - Examples in `examples/` directory
   - README section on service invoices
5. **Validation**: 
   - `npm run typecheck` passes
   - `npm run lint` passes
   - `npm run test` passes with coverage target met
6. **Backward Compatibility**: Method signatures align with v2 where possible

## Dependencies

- **Required**: HTTP client implementation (`src/core/http/client.ts`)
- **Required**: Error system (`src/core/errors/`)
- **Required**: Type definitions (`src/core/types.ts`)
- **Required**: Retry logic for polling (`src/runtime/retry.ts` - if not exists, create)
- **Optional**: Rate limiting for API calls

## Out of Scope

1. **External invoice operations** (`/v1/companies/{company_id}/serviceinvoices/external/{id}`)
2. **Advanced filtering** beyond date ranges and basic pagination
3. **Batch operations** (create multiple invoices at once)
4. **Invoice modification** (NFE.io API doesn't support PUT on invoices)
5. **Tax calculation endpoints** (separate API concern)
6. **MCP server integration** (lives in separate @nfe-io/mcp-server package)
7. **n8n nodes integration** (lives in separate @nfe-io/n8n-nodes package)

## Risks and Mitigations

### Risk 1: Async Processing Complexity
**Risk**: The 202 → polling → completion flow is complex and error-prone  
**Mitigation**: 
- Create dedicated polling utilities with extensive tests
- Provide both manual (create) and automatic (createAndWait) approaches
- Document retry/timeout behavior clearly
- Add circuit breaker for runaway polling

### Risk 2: OpenAPI Schema Accuracy
**Risk**: OpenAPI spec may not reflect actual API behavior  
**Mitigation**: 
- Cross-reference with v2 implementation behavior
- Test against real API (sandbox environment)
- Document any discrepancies discovered
- Update OpenAPI spec if needed

### Risk 3: Complex Brazilian Tax Types
**Risk**: Brazilian tax data structures are complex (CNAE codes, tax regimes, etc.)  
**Mitigation**: 
- Use generated types from OpenAPI as source of truth
- Add validation helper functions where needed
- Reference official documentation in JSDoc comments
- Provide examples with realistic Brazilian data

### Risk 4: Binary Download Handling
**Risk**: PDF/XML downloads require proper stream handling  
**Mitigation**: 
- Use Fetch API's arrayBuffer() method
- Return Buffer for Node.js compatibility
- Test with actual file downloads
- Document memory considerations for large files

## Implementation Notes

### Key Patterns to Follow

1. **Company-scoped resources**: All operations require `companyId` as first parameter
2. **Error handling**: Use typed errors from `src/core/errors/`
3. **Async/await**: All methods return Promises, no callbacks
4. **TypeScript strict mode**: No `any` types in public APIs
5. **JSDoc comments**: Required for all public methods with examples

### Testing Strategy

1. **Unit tests**: Test each method in isolation with mocked HTTP client
2. **Integration tests**: Test against MSW-mocked API endpoints
3. **Error tests**: Test all error scenarios (401, 400, 404, 408, 500)
4. **Async tests**: Test 202 → polling → completion flow
5. **Download tests**: Test binary data handling for PDF/XML

### Files to Create/Modify

**Create**:
- `specs/service-invoice-operations/spec.md`
- `specs/async-invoice-processing/spec.md`
- `specs/invoice-downloads/spec.md`
- `tests/unit/core/resources/service-invoices.test.ts`
- `examples/service-invoice-complete.js`

**Modify**:
- `src/core/resources/service-invoices.ts` (complete implementation)
- `src/core/types.ts` (add missing types)
- `tests/integration/service-invoices.integration.test.ts` (expand coverage)
- `README.md` (add service invoice section)
- `docs/API.md` (document all methods)

## Open Questions

1. **Polling configuration**: What are reasonable defaults for:
   - Initial polling delay? (Suggestion: 1 second)
   - Max polling delay? (Suggestion: 10 seconds)
   - Total timeout? (Suggestion: 120 seconds)
   - Exponential backoff factor? (Suggestion: 1.5x)

2. **Error recovery**: For async failures (IssueFailed, CancelFailed), should we:
   - Throw immediately?
   - Allow retry with fresh API call?
   - Expose flowMessage for user debugging? [x]

3. **List pagination**: Should we provide:
   - Manual pagination (current approach)?
   - Auto-pagination iterator?
   - Both options? [x]

4. **Download methods**: Should we support:
   - Returning raw Buffer (current)?
   - Streaming to file?
   - Both options? [x]

5. **Type generation**: Should we regenerate types from OpenAPI or use existing? 
   - Decision needed: Run `npm run generate` before implementation

## Next Steps

1. **Review and approve** this proposal
2. **Answer open questions** above
3. **Validate OpenAPI spec** accuracy against real API
4. **Create spec deltas** for each capability
5. **Draft tasks.md** with detailed work items
6. **Run validation**: `openspec validate implement-service-invoices --strict`
7. **Begin implementation** following tasks.md

---

## References

- [OpenAPI Spec - Service Invoices](../../spec/nf-servico-v1.yaml)
- [v2 Implementation](../../lib/resources/ServiceInvoices.js)
- [v3 Partial Implementation](../../src/core/resources/service-invoices.ts)
- [AGENTS.md - Implementation Guidelines](../../AGENTS.md)
- [NFE.io API Documentation](https://nfe.io/docs/)
