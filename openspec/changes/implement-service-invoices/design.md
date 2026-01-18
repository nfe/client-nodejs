# Design: Implement Service Invoices Resource

**Change ID**: `implement-service-invoices`  
**Status**: Draft  
**Created**: 2026-01-15

---

## Overview

This document outlines the architectural approach for implementing the Service Invoices resource in the NFE.io SDK v3. The implementation must handle complex Brazilian tax invoice operations including CRUD, asynchronous processing with polling, email notifications, and binary document downloads.

---

## Architectural Context

### System Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                       NFE.io API                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  POST /companies/{id}/serviceinvoices               │   │
│  │    → 201 (immediate) or 202 (async)                 │   │
│  │  GET /companies/{id}/serviceinvoices                │   │
│  │  GET /companies/{id}/serviceinvoices/{id}           │   │
│  │  DELETE /companies/{id}/serviceinvoices/{id}        │   │
│  │  PUT /companies/{id}/serviceinvoices/{id}/sendemail │   │
│  │  GET /companies/{id}/serviceinvoices/{id}/pdf       │   │
│  │  GET /companies/{id}/serviceinvoices/{id}/xml       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTPS + Basic Auth
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                    NFE.io SDK v3                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NfeClient                                           │  │
│  │    └─ serviceInvoices: ServiceInvoicesResource      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ServiceInvoicesResource                             │  │
│  │    • create(companyId, data)                         │  │
│  │    • createAndWait(companyId, data, options)         │  │
│  │    • list(companyId, options)                        │  │
│  │    • retrieve(companyId, invoiceId)                  │  │
│  │    • cancel(companyId, invoiceId)                    │  │
│  │    • sendEmail(companyId, invoiceId)                 │  │
│  │    • downloadPdf(companyId, invoiceId?)              │  │
│  │    • downloadXml(companyId, invoiceId?)              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  HttpClient (Fetch API)                              │  │
│  │    • get(), post(), put(), delete()                  │  │
│  │    • Authentication, retry, rate limiting            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Polling Utility                                     │  │
│  │    • poll(fn, isComplete, options)                   │  │
│  │    • Exponential backoff                             │  │
│  │    • Timeout enforcement                             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Error System                                        │  │
│  │    • NfeError                                        │  │
│  │    • AuthenticationError, ValidationError            │  │
│  │    • NotFoundError, TimeoutError                     │  │
│  │    • InvoiceProcessingError                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    User Application                          │
│  • Invoice creation and management                          │
│  • Integration with accounting systems                      │
│  • Compliance with Brazilian tax regulations                │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### Decision 1: Dual Response Pattern for create()

**Problem**: The API returns either 201 (immediate success) or 202 (async processing) for invoice creation.

**Options Considered**:
1. **Always return ServiceInvoice** - Wait internally for async processing
2. **Return discriminated union** - ServiceInvoice | AsyncResponse
3. **Separate methods** - create() for sync, createAsync() for handling 202

**Chosen**: Option 2 - Discriminated union

**Rationale**:
- Preserves API semantics (201 vs 202)
- TypeScript discriminated unions provide type-safe handling
- Allows advanced users to implement custom polling
- Aligns with v2 behavior where callback receives different shapes

**Implementation**:
```typescript
type CreateInvoiceResult = ServiceInvoice | AsyncResponse;

interface AsyncResponse {
  status: 'pending';
  location: string;  // URL for polling
  invoiceId: string; // Extracted from location
}

// User code
const result = await nfe.serviceInvoices.create('company-id', data);

if ('location' in result) {
  // Type guard: TypeScript knows this is AsyncResponse
  const invoice = await nfe.serviceInvoices.retrieve('company-id', result.invoiceId);
} else {
  // Type guard: TypeScript knows this is ServiceInvoice
  console.log('Immediate success:', result.id);
}
```

**Trade-offs**:
- ✅ Pro: Type-safe handling of both scenarios
- ✅ Pro: Flexible - users can choose manual or automatic polling
- ❌ Con: More complex than always-wait approach
- ❌ Con: Users must handle two code paths

---

### Decision 2: Provide createAndWait() Convenience Method

**Problem**: Most users want simple "create and wait" behavior, not manual polling.

**Options Considered**:
1. **Only create()** - Users implement polling themselves
2. **Only createAndWait()** - Hide async complexity completely
3. **Both methods** - create() for advanced use, createAndWait() for simplicity

**Chosen**: Option 3 - Provide both methods

**Rationale**:
- Most users benefit from automatic polling (DX priority)
- Advanced users may need custom polling logic (flexibility)
- Clear naming indicates behavior (create vs createAndWait)
- Aligns with best practices in other SDKs (Stripe, AWS)

**Implementation**:
```typescript
class ServiceInvoicesResource {
  async create(companyId: string, data: ServiceInvoiceData): Promise<ServiceInvoice | AsyncResponse> {
    // Returns raw API response
  }
  
  async createAndWait(
    companyId: string,
    data: ServiceInvoiceData,
    options?: PollingOptions
  ): Promise<ServiceInvoice> {
    const result = await this.create(companyId, data);
    
    if ('location' in result) {
      // Poll until completion
      return this.pollUntilComplete(companyId, result.invoiceId, options);
    }
    
    return result; // Already complete
  }
}
```

**Trade-offs**:
- ✅ Pro: Excellent DX for common case
- ✅ Pro: Flexibility for advanced cases
- ✅ Pro: Clear method naming
- ❌ Con: Two methods to maintain and test
- ❌ Con: Slightly larger API surface

---

### Decision 3: Reusable Polling Utility

**Problem**: Polling logic is needed for invoice creation, but may be useful elsewhere.

**Options Considered**:
1. **Inline polling** - Implement directly in createAndWait()
2. **Private method** - pollUntilComplete() in ServiceInvoicesResource
3. **Shared utility** - Generic poll() function in src/core/utils/

**Chosen**: Option 3 - Shared utility

**Rationale**:
- Other resources may need polling (certificate processing, batch operations)
- Better testability (isolated unit tests)
- Follows DRY principle
- Easier to maintain and enhance

**Implementation**:
```typescript
// src/core/utils/polling.ts
export async function poll<T>(options: {
  fn: () => Promise<T>;
  isComplete: (result: T) => boolean;
  timeout: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  onPoll?: (attempt: number, result: T) => void;
}): Promise<T> {
  const startTime = Date.now();
  let delay = options.initialDelay;
  let attempt = 0;
  
  while (true) {
    attempt++;
    const result = await options.fn();
    
    if (options.onPoll) {
      options.onPoll(attempt, result);
    }
    
    if (options.isComplete(result)) {
      return result;
    }
    
    if (Date.now() - startTime + delay > options.timeout) {
      throw new TimeoutError('Polling timeout exceeded');
    }
    
    await sleep(delay);
    delay = Math.min(delay * options.backoffFactor, options.maxDelay);
  }
}

// Usage in ServiceInvoicesResource
private async pollUntilComplete(
  companyId: string,
  invoiceId: string,
  options?: PollingOptions
): Promise<ServiceInvoice> {
  return poll({
    fn: () => this.retrieve(companyId, invoiceId),
    isComplete: (invoice) => ['Issued', 'IssueFailed', 'Cancelled', 'CancelFailed'].includes(invoice.flowStatus),
    timeout: options?.timeout ?? 120000,
    initialDelay: options?.initialDelay ?? 1000,
    maxDelay: options?.maxDelay ?? 10000,
    backoffFactor: options?.backoffFactor ?? 1.5,
    onPoll: options?.onPoll
  });
}
```

**Trade-offs**:
- ✅ Pro: Reusable across resources
- ✅ Pro: Easier to test
- ✅ Pro: Configurable and extensible
- ❌ Con: Additional abstraction layer
- ❌ Con: Generic types more complex

---

### Decision 4: Binary Downloads Return Buffer

**Problem**: PDF and XML downloads are binary data. How should they be returned?

**Options Considered**:
1. **Return Buffer** - Node.js Buffer object
2. **Return ArrayBuffer** - Web-standard ArrayBuffer
3. **Return string** - Base64-encoded string
4. **Return Stream** - Readable stream for large files

**Chosen**: Option 1 - Return Buffer

**Rationale**:
- Node.js Buffer is the de facto standard for binary data in Node
- Easy to write to file: `fs.writeFile(path, buffer)`
- Better developer ergonomics than ArrayBuffer or base64
- Streaming adds complexity for minimal benefit (invoices rarely > 10MB)
- Can convert Buffer to ArrayBuffer if needed: `buffer.buffer.slice()`

**Implementation**:
```typescript
async downloadPdf(companyId: string, invoiceId?: string): Promise<Buffer> {
  const path = invoiceId
    ? `/companies/${companyId}/serviceinvoices/${invoiceId}/pdf`
    : `/companies/${companyId}/serviceinvoices/pdf`;
    
  const response = await this.http.get(path, {
    headers: { Accept: 'application/pdf' }
  });
  
  // Fetch API: Response.arrayBuffer() → Buffer
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

**Trade-offs**:
- ✅ Pro: Best DX for Node.js users
- ✅ Pro: Easy file I/O
- ✅ Pro: No streaming complexity
- ❌ Con: Loads entire file in memory
- ❌ Con: Not web-compatible (but SDK is Node-only)

---

### Decision 5: Error Hierarchy

**Problem**: Need typed errors for different failure scenarios.

**Existing System**:
```
NfeError (base)
  ├─ AuthenticationError (401)
  ├─ ValidationError (400)
  ├─ NotFoundError (404)
  ├─ TimeoutError (408)
  └─ [others]
```

**Addition Needed**: InvoiceProcessingError for async failures

**Rationale**:
- Async invoice creation can fail with IssueFailed status
- Need to distinguish from validation errors (400) or server errors (500)
- Should include flowStatus and flowMessage for debugging

**Implementation**:
```typescript
// src/core/errors/index.ts
export class InvoiceProcessingError extends NfeError {
  constructor(
    message: string,
    public readonly flowStatus: string,
    public readonly flowMessage: string,
    public readonly invoiceId: string
  ) {
    super(message, 422); // Unprocessable Entity semantic
    this.name = 'InvoiceProcessingError';
  }
}

// Usage in createAndWait()
if (invoice.flowStatus === 'IssueFailed') {
  throw new InvoiceProcessingError(
    `Invoice processing failed: ${invoice.flowMessage}`,
    invoice.flowStatus,
    invoice.flowMessage,
    invoice.id
  );
}
```

**Trade-offs**:
- ✅ Pro: Type-safe error handling
- ✅ Pro: Contains all relevant context
- ✅ Pro: Users can catch specific error type
- ❌ Con: Adds another error class

---

## Component Interactions

### Sequence: Create Invoice with Async Processing

```
User Code                ServiceInvoicesResource    HttpClient    NFE.io API    PollingUtility
    │                            │                      │              │              │
    │─createAndWait(id, data)──>│                      │              │              │
    │                            │                      │              │              │
    │                            │─create(id, data)────>│              │              │
    │                            │                      │              │              │
    │                            │                      │─POST────────>│              │
    │                            │                      │              │              │
    │                            │                      │<─202+Location│              │
    │                            │                      │              │              │
    │                            │<─AsyncResponse───────│              │              │
    │                            │                      │              │              │
    │                            │─poll()──────────────────────────────────────────>│
    │                            │                      │              │              │
    │                            │                      │              │              │<wait 1s>
    │                            │                      │              │              │
    │                            │<─retrieve(invoiceId)─────────────────────────────│
    │                            │                      │              │              │
    │                            │─retrieve(id, invId)─>│              │              │
    │                            │                      │              │              │
    │                            │                      │─GET─────────>│              │
    │                            │                      │              │              │
    │                            │                      │<─200+Invoice│              │
    │                            │                      │              │ {flowStatus: │
    │                            │                      │              │ WaitingSend} │
    │                            │                      │              │              │
    │                            │<─Invoice─────────────│              │              │
    │                            │                      │              │              │
    │                            │─isComplete?(invoice)────────────────────────────>│
    │                            │                      │              │              │
    │                            │<─false──────────────────────────────────────────-│
    │                            │                      │              │              │
    │                            │                      │              │              │<wait 1.5s>
    │                            │                      │              │              │
    │                            │<─retrieve(invoiceId)─────────────────────────────│
    │                            │                      │              │              │
    │                            │─retrieve(id, invId)─>│              │              │
    │                            │                      │              │              │
    │                            │                      │─GET─────────>│              │
    │                            │                      │              │              │
    │                            │                      │<─200+Invoice│              │
    │                            │                      │              │ {flowStatus: │
    │                            │                      │              │   Issued}    │
    │                            │                      │              │              │
    │                            │<─Invoice─────────────│              │              │
    │                            │                      │              │              │
    │                            │─isComplete?(invoice)────────────────────────────>│
    │                            │                      │              │              │
    │                            │<─true───────────────────────────────────────────-│
    │                            │                      │              │              │
    │<─ServiceInvoice───────────│                      │              │              │
    │                            │                      │              │              │
```

### Sequence: Download PDF with Retry

```
User Code                ServiceInvoicesResource    HttpClient    NFE.io API
    │                            │                      │              │
    │─downloadPdf(id, invId)────>│                      │              │
    │                            │                      │              │
    │                            │─get(path)───────────>│              │
    │                            │                      │              │
    │                            │                      │─GET─────────>│
    │                            │                      │              │
    │                            │                      │<─404────────-│
    │                            │                      │              │
    │                            │<─NotFoundError───────│              │
    │                            │                      │              │
    │<─throw NotFoundError───────│                      │              │
    │                            │                      │              │
    │<wait 5s>                   │                      │              │
    │                            │                      │              │
    │─downloadPdf(id, invId)────>│                      │              │
    │                            │                      │              │
    │                            │─get(path)───────────>│              │
    │                            │                      │              │
    │                            │                      │─GET─────────>│
    │                            │                      │              │
    │                            │                      │<─200+Binary──│
    │                            │                      │              │
    │                            │<─arrayBuffer()───────│              │
    │                            │                      │              │
    │<─Buffer────────────────────│                      │              │
```

---

## Data Flow

### Type Definitions

```typescript
// src/core/types.ts

// Core invoice type
export interface ServiceInvoice {
  id: string;
  environment: 'Development' | 'Production' | 'Staging';
  flowStatus: FlowStatus;
  flowMessage?: string;
  provider: Provider;
  borrower: Borrower;
  servicesAmount: number;
  number?: string;
  issuedOn?: string;
  createdOn: string;
  modifiedOn: string;
  // ... many more fields from OpenAPI
}

export type FlowStatus =
  | 'WaitingCalculateTaxes'
  | 'WaitingDefineRpsNumber'
  | 'WaitingSend'
  | 'WaitingReturn'
  | 'WaitingDownload'
  | 'Issued'
  | 'IssueFailed'
  | 'Cancelled'
  | 'CancelFailed'
  | 'PullFromCityHall';

// Input type for create
export interface ServiceInvoiceData {
  cityServiceCode: string;
  description: string;
  servicesAmount: number;
  borrower: BorrowerInput;
  // ... other fields
}

// Async response
export interface AsyncResponse {
  status: 'pending';
  location: string;
  invoiceId: string;
}

// List response
export interface ListResponse<T> {
  serviceInvoices: T[];
  totalResults: number;
  totalPages: number;
  page: number;
  totals?: {
    totalAmount: number;
    // ... other totals
  };
}

// Pagination options
export interface PaginationOptions {
  pageIndex?: number;
  pageCount?: number;
  issuedBegin?: string;
  issuedEnd?: string;
  createdBegin?: string;
  createdEnd?: string;
  hasTotals?: boolean;
}

// Polling options
export interface PollingOptions {
  timeout?: number; // Default: 120000 (2 minutes)
  initialDelay?: number; // Default: 1000 (1 second)
  maxDelay?: number; // Default: 10000 (10 seconds)
  backoffFactor?: number; // Default: 1.5
  onPoll?: (attempt: number, flowStatus: string) => void;
}
```

---

## Testing Strategy

### Unit Tests

**Target**: > 80% coverage for ServiceInvoicesResource

```typescript
// tests/unit/core/resources/service-invoices.test.ts
describe('ServiceInvoicesResource', () => {
  describe('create()', () => {
    it('returns ServiceInvoice on 201', async () => {
      const mockHttp = createMockHttpClient();
      mockHttp.post.mockResolvedValue({
        data: { id: '123', flowStatus: 'Issued' }
      });
      
      const resource = new ServiceInvoicesResource(mockHttp);
      const result = await resource.create('company-id', invoiceData);
      
      expect('location' in result).toBe(false);
      expect(result.id).toBe('123');
    });
    
    it('returns AsyncResponse on 202', async () => {
      const mockHttp = createMockHttpClient();
      mockHttp.post.mockResolvedValue({
        data: { location: '/companies/id/serviceinvoices/abc' }
      });
      
      const resource = new ServiceInvoicesResource(mockHttp);
      const result = await resource.create('company-id', invoiceData);
      
      expect('location' in result).toBe(true);
      expect(result.invoiceId).toBe('abc');
    });
  });
  
  describe('createAndWait()', () => {
    it('returns immediately on 201', async () => { /* ... */ });
    it('polls until Issued on 202', async () => { /* ... */ });
    it('throws TimeoutError on timeout', async () => { /* ... */ });
    it('throws InvoiceProcessingError on IssueFailed', async () => { /* ... */ });
  });
  
  // ... tests for list, retrieve, cancel, sendEmail, downloads
});
```

### Integration Tests

**Target**: Cover real-world scenarios with MSW

```typescript
// tests/integration/service-invoices.integration.test.ts
describe('ServiceInvoices Integration', () => {
  beforeAll(() => {
    setupServer(
      http.post('/v1/companies/:id/serviceinvoices', ({ params }) => {
        return HttpResponse.json(
          { location: `/v1/companies/${params.id}/serviceinvoices/new-123` },
          { status: 202 }
        );
      }),
      
      http.get('/v1/companies/:id/serviceinvoices/:invoiceId', ({ params }) => {
        // Simulate state progression
        const attempt = getAttempt(params.invoiceId);
        const status = attempt === 1 ? 'WaitingSend' : 'Issued';
        
        return HttpResponse.json({
          id: params.invoiceId,
          flowStatus: status
        });
      })
    );
  });
  
  it('creates invoice and waits for completion', async () => {
    const nfe = new NfeClient({ apiKey: 'test-key' });
    const invoice = await nfe.serviceInvoices.createAndWait('company-id', invoiceData);
    
    expect(invoice.flowStatus).toBe('Issued');
  });
  
  it('handles complete lifecycle', async () => {
    const nfe = new NfeClient({ apiKey: 'test-key' });
    
    // Create
    const invoice = await nfe.serviceInvoices.createAndWait('company-id', data);
    
    // Retrieve
    const retrieved = await nfe.serviceInvoices.retrieve('company-id', invoice.id);
    
    // Send email
    await nfe.serviceInvoices.sendEmail('company-id', invoice.id);
    
    // Download PDF
    const pdf = await nfe.serviceInvoices.downloadPdf('company-id', invoice.id);
    expect(pdf).toBeInstanceOf(Buffer);
    
    // Cancel
    await nfe.serviceInvoices.cancel('company-id', invoice.id);
  });
});
```

---

## Migration from v2

### v2 Pattern
```javascript
const nfe = require('nfe')(apiKey);

nfe.serviceInvoices.create('company-id', data, function(err, invoice) {
  if (err) {
    // Handle error
  } else if (invoice.flowStatus) {
    // 201: Immediate success
  } else if (invoice.location) {
    // 202: Async processing
  }
});
```

### v3 Pattern
```typescript
import { NfeClient } from 'nfe-io';

const nfe = new NfeClient({ apiKey });

// Recommended: Use createAndWait for simplicity
const invoice = await nfe.serviceInvoices.createAndWait('company-id', data);

// Advanced: Manual handling
const result = await nfe.serviceInvoices.create('company-id', data);
if ('location' in result) {
  // Handle async
}
```

---

## Security Considerations

1. **API Key Protection**: Always passed via Authorization header (HTTP client handles)
2. **Rate Limiting**: HTTP client implements rate limiting
3. **Retry Logic**: Exponential backoff prevents API abuse
4. **Timeout Enforcement**: Prevents runaway polling
5. **Binary Data**: No encoding transformation preserves integrity

---

## Performance Considerations

1. **Polling Overhead**: Exponential backoff reduces API calls
   - Average case: 3-5 polls over 5-10 seconds
   - Worst case: ~20 polls over 2 minutes
2. **Memory Usage**: Binary downloads load full file (typically < 5MB)
3. **Concurrent Requests**: HttpClient can handle multiple invoices in parallel
4. **Type Safety**: Minimal runtime overhead, compile-time only

---

## Open Questions & Future Work

### Questions Requiring Clarification
1. **Batch PDF downloads**: Does API actually support downloading all invoices as single PDF? Check v2 behavior.
2. **Polling defaults**: Are 120s timeout and 1.5x backoff optimal? May need tuning based on real usage.
3. **XML parsing**: Should we provide XML parsing utilities or let users handle?
4. **Filtering**: Does list() support additional filters beyond dates?

### Future Enhancements
1. **Streaming downloads**: For very large invoices (> 10MB)
2. **Webhook integration**: Alternative to polling for async completion
3. **Batch operations**: Create multiple invoices in single call
4. **Cancel with retry**: Auto-retry cancellation if API rate-limited
5. **PDF preview**: Return small preview image before full download

---

## References

- [OpenAPI Spec](../../openapi/spec/nf-servico-v1.yaml)
- [v2 Implementation](../../lib/resources/ServiceInvoices.js)
- [AGENTS.md](../../AGENTS.md)
- [Project Context](../../openspec/project.md)
