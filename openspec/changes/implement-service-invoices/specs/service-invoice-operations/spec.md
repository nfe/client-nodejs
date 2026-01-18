# Capability: Service Invoice Operations

**Capability ID**: `service-invoice-operations`  
**Parent Change**: `implement-service-invoices`  
**Type**: Core Feature  
**Priority**: Critical

---

## Overview

This capability encompasses the core CRUD operations for service invoices (Nota Fiscal de Serviço - NFSE), including creation, listing, retrieval, cancellation, and email notifications. These operations form the foundation of NFE.io's service invoice functionality.

## ADDED Requirements

### Requirement: CRUD-001 - Create Service Invoice
**Priority**: Critical  
**Component**: ServiceInvoicesResource.create()

The SDK MUST allow developers to create a new service invoice for a company by providing invoice data that complies with Brazilian tax regulations.

#### Scenario: Create invoice with immediate success (201)
```typescript
const nfe = new NfeClient({ apiKey: 'xxx' });
const invoice = await nfe.serviceInvoices.create('company-id', {
  cityServiceCode: '2690',
  description: 'Serviços de consultoria',
  servicesAmount: 1000.00,
  borrower: {
    type: 'LegalEntity',
    name: 'Cliente Exemplo LTDA',
    federalTaxNumber: 12345678000199,
    email: 'cliente@exemplo.com',
    address: {
      country: 'BRA',
      postalCode: '01310-100',
      street: 'Avenida Paulista',
      number: '1000',
      district: 'Bela Vista',
      city: { code: '3550308' },
      state: 'SP'
    }
  }
});

// Returns ServiceInvoice
assert(invoice.id !== undefined);
assert(invoice.flowStatus === 'Issued');
```

#### Scenario: Create invoice with async processing (202)
```typescript
const result = await nfe.serviceInvoices.create('company-id', invoiceData);

// Returns AsyncResponse
assert(result.status === 'pending');
assert(result.location !== undefined); // URL for polling
assert(result.invoiceId !== undefined);

// User can poll manually
const invoice = await nfe.serviceInvoices.retrieve('company-id', result.invoiceId);
```

#### Scenario: Validation error (400)
```typescript
await expect(
  nfe.serviceInvoices.create('company-id', { /* invalid data */ })
).rejects.toThrow(ValidationError);
// Error message contains field-specific validation failures
```

#### Scenario: Authentication error (401)
```typescript
const nfe = new NfeClient({ apiKey: 'invalid' });
await expect(
  nfe.serviceInvoices.create('company-id', invoiceData)
).rejects.toThrow(AuthenticationError);
```

---

### Requirement: CRUD-002 - List Service Invoices
**Priority**: Critical  
**Component**: ServiceInvoicesResource.list()

The SDK MUST allow developers to list service invoices for a company with pagination and date filtering.

#### Scenario: List all invoices with pagination
```typescript
const result = await nfe.serviceInvoices.list('company-id', {
  pageIndex: 0,
  pageCount: 50
});

assert(result.serviceInvoices.length <= 50);
assert(result.totalResults !== undefined);
assert(result.totalPages !== undefined);
assert(result.page === 0);
```

#### Scenario: Filter invoices by issued date range
```typescript
const result = await nfe.serviceInvoices.list('company-id', {
  issuedBegin: '2026-01-01',
  issuedEnd: '2026-01-31',
  pageCount: 100
});

// All returned invoices issued within January 2026
result.serviceInvoices.forEach(invoice => {
  const issuedDate = new Date(invoice.issuedOn);
  assert(issuedDate >= new Date('2026-01-01'));
  assert(issuedDate <= new Date('2026-01-31'));
});
```

#### Scenario: Filter invoices by creation date range
```typescript
const result = await nfe.serviceInvoices.list('company-id', {
  createdBegin: '2026-01-10',
  createdEnd: '2026-01-15'
});

// All returned invoices created within date range
result.serviceInvoices.forEach(invoice => {
  const createdDate = new Date(invoice.createdOn);
  assert(createdDate >= new Date('2026-01-10'));
  assert(createdDate <= new Date('2026-01-15'));
});
```

#### Scenario: Request totals in list response
```typescript
const result = await nfe.serviceInvoices.list('company-id', {
  hasTotals: true
});

assert(result.totals !== undefined);
assert(result.totals.totalAmount !== undefined);
```

#### Scenario: Empty list result
```typescript
const result = await nfe.serviceInvoices.list('company-id', {
  issuedBegin: '2030-01-01', // Future date
  issuedEnd: '2030-01-31'
});

assert(result.serviceInvoices.length === 0);
assert(result.totalResults === 0);
```

---

### Requirement: CRUD-003 - Retrieve Service Invoice
**Priority**: Critical  
**Component**: ServiceInvoicesResource.retrieve()

The SDK MUST allow developers to retrieve a specific service invoice by its ID to check its current state and details.

#### Scenario: Retrieve existing invoice
```typescript
const invoice = await nfe.serviceInvoices.retrieve('company-id', 'invoice-id');

assert(invoice.id === 'invoice-id');
assert(invoice.flowStatus !== undefined);
assert(invoice.provider !== undefined);
assert(invoice.borrower !== undefined);
```

#### Scenario: Invoice not found (404)
```typescript
await expect(
  nfe.serviceInvoices.retrieve('company-id', 'non-existent-id')
).rejects.toThrow(NotFoundError);
```

#### Scenario: Check flow status of invoice
```typescript
const invoice = await nfe.serviceInvoices.retrieve('company-id', 'invoice-id');

if (invoice.flowStatus === 'Issued') {
  console.log('Invoice successfully issued');
} else if (invoice.flowStatus === 'IssueFailed') {
  console.error('Issue failed:', invoice.flowMessage);
}
```

---

### Requirement: CRUD-004 - Cancel Service Invoice
**Priority**: High  
**Component**: ServiceInvoicesResource.cancel()

The SDK MUST allow developers to cancel an issued service invoice when needed (before certain time limits per city regulations).

#### Scenario: Cancel issued invoice
```typescript
const cancelled = await nfe.serviceInvoices.cancel('company-id', 'invoice-id');

assert(cancelled.flowStatus === 'Cancelled');
assert(cancelled.id === 'invoice-id');
```

#### Scenario: Cancel already cancelled invoice
```typescript
// First cancellation succeeds
await nfe.serviceInvoices.cancel('company-id', 'invoice-id');

// Second cancellation may return already cancelled status
const result = await nfe.serviceInvoices.cancel('company-id', 'invoice-id');
assert(result.flowStatus === 'Cancelled');
```

#### Scenario: Cancel non-existent invoice (404)
```typescript
await expect(
  nfe.serviceInvoices.cancel('company-id', 'non-existent-id')
).rejects.toThrow(NotFoundError);
```

#### Scenario: Cancel fails due to city regulations
```typescript
await expect(
  nfe.serviceInvoices.cancel('company-id', 'old-invoice-id')
).rejects.toThrow(InvoiceProcessingError); // CancelFailed status
```

---

### Requirement: EMAIL-001 - Send Invoice via Email
**Priority**: High  
**Component**: ServiceInvoicesResource.sendEmail()

The SDK MUST allow developers to send the issued invoice to the borrower (customer) via email.

#### Scenario: Send email successfully
```typescript
const result = await nfe.serviceInvoices.sendEmail('company-id', 'invoice-id');

assert(result.sent === true);
```

#### Scenario: Send email for non-issued invoice
```typescript
// Invoice not yet issued
await expect(
  nfe.serviceInvoices.sendEmail('company-id', 'pending-invoice-id')
).rejects.toThrow(ValidationError); // Can't email non-issued invoice
```

#### Scenario: Email send failure
```typescript
const result = await nfe.serviceInvoices.sendEmail('company-id', 'invoice-id');

if (!result.sent) {
  console.error('Email failed:', result.message);
}
```

---

### Requirement: ERROR-001 - Comprehensive Error Handling
**Priority**: Critical  
**Component**: ServiceInvoicesResource (all methods)

All methods MUST handle API errors consistently and provide typed error instances.

#### Scenario: Authentication error (401)
```typescript
const nfe = new NfeClient({ apiKey: 'invalid-key' });

try {
  await nfe.serviceInvoices.list('company-id');
} catch (error) {
  assert(error instanceof AuthenticationError);
  assert(error.statusCode === 401);
  assert(error.message.includes('API Key'));
}
```

#### Scenario: Validation error (400)
```typescript
try {
  await nfe.serviceInvoices.create('company-id', { /* incomplete data */ });
} catch (error) {
  assert(error instanceof ValidationError);
  assert(error.statusCode === 400);
  assert(error.details !== undefined); // Field-level validation errors
}
```

#### Scenario: Server error (500)
```typescript
try {
  await nfe.serviceInvoices.retrieve('company-id', 'invoice-id');
} catch (error) {
  assert(error instanceof NfeError);
  assert(error.statusCode === 500);
}
```

#### Scenario: Timeout error (408)
```typescript
try {
  await nfe.serviceInvoices.cancel('company-id', 'invoice-id');
} catch (error) {
  assert(error instanceof TimeoutError);
  assert(error.statusCode === 408);
  assert(error.message.includes('timeout'));
}
```

---

### Requirement: TYPE-001 - Type Safety
**Priority**: Critical  
**Component**: ServiceInvoicesResource, types.ts

All public methods MUST have strict TypeScript types with no `any` in public APIs.

#### Scenario: Method parameters are typed
```typescript
// TypeScript compilation error if wrong types
nfe.serviceInvoices.create(
  123, // Error: Expected string
  {} // Error: Missing required fields
);
```

#### Scenario: Return types are precise
```typescript
const invoice: ServiceInvoice = await nfe.serviceInvoices.retrieve('id', 'inv');
// invoice has all fields typed

const result: ListResponse<ServiceInvoice> = await nfe.serviceInvoices.list('id');
// result.serviceInvoices is ServiceInvoice[]
// result.totalResults is number
```

#### Scenario: Discriminated unions for async responses
```typescript
const result = await nfe.serviceInvoices.create('id', data);

if ('location' in result) {
  // TypeScript knows this is AsyncResponse
  const location: string = result.location;
} else {
  // TypeScript knows this is ServiceInvoice
  const flowStatus: string = result.flowStatus;
}
```

---

### Requirement: DOC-001 - JSDoc Documentation
**Priority**: High  
**Component**: ServiceInvoicesResource (all methods)

All public methods MUST have complete JSDoc comments with descriptions, parameters, return types, examples, and error documentation.

#### Scenario: Method has JSDoc with example
```typescript
/**
 * Create a new service invoice
 * 
 * @param companyId - The ID of the company issuing the invoice
 * @param data - Invoice data conforming to Brazilian tax regulations
 * @returns Either an issued ServiceInvoice (201) or AsyncResponse for polling (202)
 * @throws {ValidationError} If invoice data is invalid
 * @throws {AuthenticationError} If API key is invalid
 * @throws {NfeError} For other API errors
 * 
 * @example
 * ```typescript
 * const invoice = await nfe.serviceInvoices.create('company-id', {
 *   cityServiceCode: '2690',
 *   description: 'Consulting services',
 *   servicesAmount: 1000.00,
 *   borrower: { ... }
 * });
 * 
 * if ('location' in invoice) {
 *   // Async processing - poll for result
 *   const final = await nfe.serviceInvoices.retrieve('company-id', invoice.invoiceId);
 * }
 * ```
 */
async create(companyId: string, data: ServiceInvoiceData): Promise<ServiceInvoice | AsyncResponse>
```

---

## MODIFIED Requirements

None - this is a new capability.

---

## REMOVED Requirements

None - this is a new capability.

---

## Dependencies

- **HTTP Client**: Must exist and support GET, POST, PUT, DELETE
- **Error System**: Must have AuthenticationError, ValidationError, NotFoundError, TimeoutError, NfeError
- **Types**: Must have ServiceInvoice, ServiceInvoiceData, ListResponse, AsyncResponse defined

---

## Testing Requirements

### Unit Tests
- Test all CRUD methods with mocked HTTP client
- Test all error scenarios (401, 400, 404, 408, 500)
- Test pagination logic
- Test date filtering
- Test email sending
- Coverage > 80%

### Integration Tests
- Test against MSW-mocked API
- Test complete invoice lifecycle
- Test error recovery
- Test edge cases (empty lists, invalid dates, etc.)

---

## Documentation Requirements

- API.md section documenting all methods
- README.md quick start example
- examples/service-invoice-complete.js with all operations
- JSDoc comments on all public methods

---

## Non-Functional Requirements

- **Performance**: List operations should handle 1000+ results efficiently
- **Type Safety**: Zero `any` types in public APIs
- **Error Handling**: All API errors must be caught and typed
- **Backwards Compatibility**: Method signatures should align with v2 where practical
