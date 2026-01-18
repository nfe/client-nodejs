# Service Invoices Implementation - Change Summary

**Change ID**: `implement-service-invoices`  
**Status**: ✅ Approved - Ready for Implementation  
**Created**: 2026-01-15  
**Approved**: 2026-01-16

---

## 📋 Quick Summary

This change implements the complete Service Invoices (Nota Fiscal de Serviço - NFSE) resource for NFE.io SDK v3, covering all CRUD operations, asynchronous invoice processing with polling, email notifications, and binary document downloads (PDF/XML).

**Estimated Effort**: 3-4 days  
**Priority**: 🔴 Critical (Core SDK functionality)

---

## 📁 What's Included

### Core Documents
- ✅ **[proposal.md](./proposal.md)** - Complete problem statement, solution, risks, and success criteria
- ✅ **[tasks.md](./tasks.md)** - Detailed task breakdown with 6 phases, 13 tasks, dependencies, and validation gates
- ✅ **[design.md](./design.md)** - Architectural decisions, component interactions, and technical approach

### Capability Specs (3 total)
- ✅ **[service-invoice-operations](./specs/service-invoice-operations/spec.md)** - CRUD operations (8 requirements, 24 scenarios)
- ✅ **[async-invoice-processing](./specs/async-invoice-processing/spec.md)** - Polling and async patterns (8 requirements, 16 scenarios)
- ✅ **[invoice-downloads](./specs/invoice-downloads/spec.md)** - PDF/XML downloads (8 requirements, 21 scenarios)

---

## 🎯 Key Capabilities

### 1. Service Invoice Operations
**Methods**: `create()`, `list()`, `retrieve()`, `cancel()`, `sendEmail()`  
**Features**:
- Type-safe CRUD with discriminated union for 201/202 responses
- Pagination and date filtering for list operations
- Comprehensive error handling (401, 400, 404, 408, 500)
- Company-scoped operations

### 2. Async Invoice Processing
**Method**: `createAndWait()`  
**Features**:
- Automatic polling with exponential backoff
- Configurable timeouts and intervals
- Terminal state detection (Issued, IssueFailed, Cancelled, etc.)
- Reusable polling utility in `src/core/utils/polling.ts`

### 3. Invoice Downloads
**Methods**: `downloadPdf()`, `downloadXml()`  
**Features**:
- Binary data handling with Fetch API
- Returns Node.js Buffer objects
- Support for single and batch downloads
- Retry guidance for 404 (document not ready)

---

## 📊 Requirements Summary

| Capability | Requirements | Scenarios | Priority |
|------------|--------------|-----------|----------|
| Service Invoice Operations | 8 | 24 | Critical |
| Async Invoice Processing | 8 | 16 | Critical |
| Invoice Downloads | 8 | 21 | High |
| **Total** | **24** | **61** | - |

---

## 🛠 Implementation Approach

### Phase 1: Foundation (Day 1)
- Validate OpenAPI spec and generate types
- Define core TypeScript types
- Create reusable polling utility

### Phase 2: Core Implementation (Day 2)
- Implement CRUD operations
- Add createAndWait() with polling
- Implement email operations

### Phase 3: Document Downloads (Day 2-3)
- PDF download with binary handling
- XML download with binary handling

### Phase 4: Testing (Day 3)
- Unit tests (>80% coverage)
- Integration tests with MSW
- Error scenario testing

### Phase 5: Documentation (Day 4)
- Complete examples
- Update API.md and README.md
- JSDoc on all public methods

### Phase 6: Validation & Release (Day 4)
- Full validation suite
- Update CHANGELOG
- Prepare for PR

---

## ✅ Success Criteria

- [ ] All 7 API endpoints implemented
- [ ] TypeScript strict mode with no `any` in public APIs
- [ ] Unit test coverage > 80%
- [ ] Integration tests passing
- [ ] All error scenarios tested
- [ ] JSDoc complete on all public methods
- [ ] Examples working
- [ ] `npm run typecheck && npm run lint && npm test` passing

---

## 🔑 Key Design Decisions

1. **Dual Response Pattern**: `create()` returns `ServiceInvoice | AsyncResponse` (discriminated union)
2. **Convenience Method**: `createAndWait()` provides automatic polling for 99% use case
3. **Reusable Polling**: Generic `poll()` utility in `src/core/utils/polling.ts`
4. **Buffer Returns**: Downloads return Node.js Buffer objects for best DX
5. **New Error Type**: `InvoiceProcessingError` for async failures with context

---

## 📚 API Examples

### Create and Wait (Recommended)
```typescript
const invoice = await nfe.serviceInvoices.createAndWait('company-id', {
  cityServiceCode: '2690',
  description: 'Consulting services',
  servicesAmount: 1000.00,
  borrower: { /* ... */ }
});
console.log('Issued:', invoice.number);
```

### Manual Polling (Advanced)
```typescript
const result = await nfe.serviceInvoices.create('company-id', data);

if ('location' in result) {
  // Poll manually
  let invoice = await nfe.serviceInvoices.retrieve('company-id', result.invoiceId);
  while (!['Issued', 'IssueFailed'].includes(invoice.flowStatus)) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    invoice = await nfe.serviceInvoices.retrieve('company-id', result.invoiceId);
  }
}
```

### List with Filters
```typescript
const result = await nfe.serviceInvoices.list('company-id', {
  issuedBegin: '2026-01-01',
  issuedEnd: '2026-01-31',
  pageCount: 50
});
```

### Download PDF
```typescript
const pdf = await nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id');
await writeFile('./invoice.pdf', pdf);
```

---

## ⚠️ Known Risks

1. **Async Processing Complexity** - Mitigated with extensive tests and clear docs
2. **OpenAPI Schema Accuracy** - Will cross-reference with v2 and real API
3. **Brazilian Tax Complexity** - Using generated types + examples with real data
4. **Binary Download Handling** - Using proven Fetch API patterns

---

## 🔗 Dependencies

- ✅ HTTP client (`src/core/http/client.ts`) - Already exists
- ✅ Error system (`src/core/errors/`) - Already exists, will add InvoiceProcessingError
- ✅ Type definitions (`src/core/types.ts`) - Already exists, will expand
- ⚠️ Polling utility (`src/core/utils/polling.ts`) - **Will create**

---

## 🚫 Out of Scope

- External invoice endpoints
- Advanced filtering beyond dates
- Batch create operations
- Invoice modification (not supported by API)
- Tax calculation endpoints
- MCP/n8n integration (separate packages)

---

## 📝 Open Questions for Review

1. **Polling defaults**: Are 120s timeout, 1s initial delay, 10s max delay, 1.5x backoff optimal?
2. **Error recovery**: Should async failures (IssueFailed) allow retry or just throw?
3. **List pagination**: Manual only, or also provide auto-pagination iterator?
4. **Download methods**: Buffer only, or also support streaming to file?
5. **Type generation**: Run `npm run generate` before implementation?

---

## 🚀 Next Steps

1. ✅ **Stakeholder Review** - Completed
2. ✅ **Approval** - Approved 2026-01-16
3. ⏭️ **Implementation** - Begin following [tasks.md](./tasks.md) phase by phase
4. ⏭️ **Testing** - Achieve >80% coverage
5. ⏭️ **Documentation** - Complete all docs and examples
6. ⏭️ **PR** - Submit for code review

---

## 📞 Questions or Feedback?

- Review [proposal.md](./proposal.md) for complete context
- Check [design.md](./design.md) for architectural details
- See [tasks.md](./tasks.md) for implementation breakdown
- Examine spec files in `specs/*/spec.md` for requirement details

---

**Validation**: ✅ `openspec validate implement-service-invoices --strict` passed  
**Status**: ✅ Approved  
**Last Updated**: 2026-01-16
