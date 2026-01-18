# Capability: Async Invoice Processing

**Capability ID**: `async-invoice-processing`  
**Parent Change**: `implement-service-invoices`  
**Type**: Core Feature  
**Priority**: Critical  
**Dependencies**: `service-invoice-operations`

---

## Overview

This capability handles the asynchronous processing pattern used by NFE.io for invoice creation. When an invoice is created, the API may return a 202 (Accepted) response with a Location header, indicating the invoice is being processed asynchronously. This capability provides both manual polling support and an automatic `createAndWait()` helper.

## Context

NFE.io's invoice creation follows this flow:
1. POST /serviceinvoices → 202 Accepted + Location header
2. Invoice enters processing states: WaitingCalculateTaxes → WaitingDefineRpsNumber → WaitingSend → WaitingReturn
3. Eventually reaches terminal state: Issued (success) or IssueFailed (failure)
4. Client must poll GET /serviceinvoices/{id} to check status

## ADDED Requirements

### Requirement: ASYNC-001 - Detect Async Response
**Priority**: Critical  
**Component**: ServiceInvoicesResource.create()

The create method MUST correctly identify when the API returns a 202 response and parse the Location header for the invoice ID.

#### Scenario: Parse 202 response with Location header
```typescript
// API returns 202 with Location: /v1/companies/{company_id}/serviceinvoices/{invoice_id}
const result = await nfe.serviceInvoices.create('company-id', invoiceData);

assert('location' in result);
assert(result.status === 'pending');
assert(result.location === '/v1/companies/company-id/serviceinvoices/abc-123');
assert(result.invoiceId === 'abc-123'); // Extracted from location
```

#### Scenario: Extract invoice ID from Location header
```typescript
const result = await nfe.serviceInvoices.create('company-id', invoiceData);

if ('location' in result) {
  const invoiceId = result.invoiceId; // Should be extracted automatically
  const invoice = await nfe.serviceInvoices.retrieve('company-id', invoiceId);
}
```

---

### Requirement: ASYNC-002 - Manual Polling Support
**Priority**: High  
**Component**: ServiceInvoicesResource.retrieve()

The SDK MUST allow developers to manually poll an invoice's status by repeatedly calling retrieve() until a terminal state is reached.

#### Scenario: Manual polling until Issued
```typescript
const createResult = await nfe.serviceInvoices.create('company-id', invoiceData);

if ('location' in createResult) {
  let invoice: ServiceInvoice;
  let attempts = 0;
  const maxAttempts = 60; // 60 seconds max
  
  do {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    invoice = await nfe.serviceInvoices.retrieve('company-id', createResult.invoiceId);
    attempts++;
  } while (
    !['Issued', 'IssueFailed', 'Cancelled'].includes(invoice.flowStatus) &&
    attempts < maxAttempts
  );
  
  if (invoice.flowStatus === 'Issued') {
    console.log('Invoice issued:', invoice.id);
  } else {
    console.error('Issue failed:', invoice.flowMessage);
  }
}
```

#### Scenario: Track processing states
```typescript
const createResult = await nfe.serviceInvoices.create('company-id', invoiceData);
const states: string[] = [];

if ('location' in createResult) {
  let invoice: ServiceInvoice;
  
  do {
    await new Promise(resolve => setTimeout(resolve, 2000));
    invoice = await nfe.serviceInvoices.retrieve('company-id', createResult.invoiceId);
    states.push(invoice.flowStatus);
  } while (!['Issued', 'IssueFailed'].includes(invoice.flowStatus));
  
  // States progression: WaitingCalculateTaxes → WaitingSend → Issued
  assert(states.includes('WaitingSend'));
  assert(states[states.length - 1] === 'Issued');
}
```

---

### Requirement: ASYNC-003 - Automatic Polling with createAndWait()
**Priority**: Critical  
**Component**: ServiceInvoicesResource.createAndWait()

The SDK MUST provide a convenience method that creates an invoice and automatically polls until completion.

#### Scenario: Create and wait for immediate success (201)
```typescript
const invoice = await nfe.serviceInvoices.createAndWait('company-id', invoiceData);

// If API returns 201, createAndWait returns immediately
assert(invoice.flowStatus === 'Issued');
assert(invoice.id !== undefined);
```

#### Scenario: Create and wait for async success (202 → Issued)
```typescript
const invoice = await nfe.serviceInvoices.createAndWait('company-id', invoiceData, {
  timeout: 120000, // 2 minutes
  initialDelay: 1000, // Start with 1 second
  maxDelay: 10000, // Max 10 seconds between polls
  backoffFactor: 1.5 // Exponential backoff
});

// Polls automatically until Issued
assert(invoice.flowStatus === 'Issued');
assert(invoice.number !== undefined); // Has invoice number
```

#### Scenario: Timeout during polling
```typescript
await expect(
  nfe.serviceInvoices.createAndWait('company-id', invoiceData, {
    timeout: 5000 // Only 5 seconds
  })
).rejects.toThrow(TimeoutError);

// Error message indicates polling timeout
```

#### Scenario: Invoice processing fails (IssueFailed)
```typescript
await expect(
  nfe.serviceInvoices.createAndWait('company-id', invalidInvoiceData)
).rejects.toThrow(InvoiceProcessingError);

// Error contains flowMessage from API
// error.flowStatus === 'IssueFailed'
// error.flowMessage === 'CNPJ do tomador inválido' (or similar)
```

---

### Requirement: ASYNC-004 - Polling Configuration
**Priority**: High  
**Component**: PollingOptions type, createAndWait()

The polling mechanism MUST be configurable with sensible defaults.

#### Scenario: Use default polling configuration
```typescript
// Uses defaults if no options provided
const invoice = await nfe.serviceInvoices.createAndWait('company-id', invoiceData);

// Default configuration:
// - timeout: 120000 (2 minutes)
// - initialDelay: 1000 (1 second)
// - maxDelay: 10000 (10 seconds)
// - backoffFactor: 1.5 (exponential)
```

#### Scenario: Custom polling configuration
```typescript
const invoice = await nfe.serviceInvoices.createAndWait('company-id', invoiceData, {
  timeout: 300000, // 5 minutes for complex invoice
  initialDelay: 2000, // Wait 2 seconds before first poll
  maxDelay: 30000, // Up to 30 seconds between polls
  backoffFactor: 2.0, // More aggressive backoff
  onPoll: (attempt, status) => {
    console.log(`Attempt ${attempt}: ${status}`);
  }
});
```

#### Scenario: Polling callback for progress tracking
```typescript
const attempts: number[] = [];
const statuses: string[] = [];

const invoice = await nfe.serviceInvoices.createAndWait('company-id', invoiceData, {
  onPoll: (attempt, flowStatus) => {
    attempts.push(attempt);
    statuses.push(flowStatus);
  }
});

// Callback invoked on each poll
assert(attempts.length > 0);
assert(statuses[statuses.length - 1] === 'Issued');
```

---

### Requirement: ASYNC-005 - Terminal States Detection
**Priority**: Critical  
**Component**: Polling utility, createAndWait()

The polling mechanism MUST correctly identify terminal states and stop polling.

#### Scenario: Stop on success state (Issued)
```typescript
const invoice = await nfe.serviceInvoices.createAndWait('company-id', invoiceData);

assert(invoice.flowStatus === 'Issued');
// Polling stopped automatically
```

#### Scenario: Stop on failure state (IssueFailed)
```typescript
try {
  await nfe.serviceInvoices.createAndWait('company-id', invalidData);
} catch (error) {
  assert(error instanceof InvoiceProcessingError);
  assert(error.flowStatus === 'IssueFailed');
  // Polling stopped on failure state
}
```

#### Scenario: Stop on cancellation state (CancelFailed)
```typescript
try {
  await nfe.serviceInvoices.createAndWait('company-id', invoiceData);
} catch (error) {
  // If invoice enters CancelFailed during creation (rare edge case)
  assert(error instanceof InvoiceProcessingError);
  assert(['IssueFailed', 'CancelFailed'].includes(error.flowStatus));
}
```

#### Scenario: Continue polling on intermediate states
```typescript
const states: string[] = [];

await nfe.serviceInvoices.createAndWait('company-id', invoiceData, {
  onPoll: (_, status) => states.push(status)
});

// These states should NOT stop polling:
const intermediateStates = [
  'WaitingCalculateTaxes',
  'WaitingDefineRpsNumber',
  'WaitingSend',
  'WaitingReturn',
  'WaitingDownload'
];

// At least one intermediate state should appear
assert(states.some(s => intermediateStates.includes(s)));

// Final state is terminal
const finalState = states[states.length - 1];
assert(['Issued', 'IssueFailed', 'Cancelled', 'CancelFailed'].includes(finalState));
```

---

### Requirement: ASYNC-006 - Exponential Backoff
**Priority**: High  
**Component**: Polling utility

Polling MUST implement exponential backoff to reduce API load while waiting for long-running operations.

#### Scenario: Delays increase exponentially
```typescript
const delays: number[] = [];
const startTimes: number[] = [];

await nfe.serviceInvoices.createAndWait('company-id', invoiceData, {
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2.0,
  onPoll: (attempt) => {
    startTimes.push(Date.now());
  }
});

// Calculate actual delays between polls
for (let i = 1; i < startTimes.length; i++) {
  delays.push(startTimes[i] - startTimes[i - 1]);
}

// Delays should increase: ~1000ms, ~2000ms, ~4000ms, ~8000ms, max out at 10000ms
if (delays.length > 1) {
  assert(delays[1] > delays[0]); // Second delay > first delay
}
if (delays.length > 2) {
  assert(delays[2] > delays[1]); // Third delay > second delay
}
```

#### Scenario: Delay caps at maxDelay
```typescript
const delays: number[] = [];
const startTimes: number[] = [Date.now()];

await nfe.serviceInvoices.createAndWait('company-id', invoiceData, {
  initialDelay: 1000,
  maxDelay: 5000, // Cap at 5 seconds
  backoffFactor: 3.0, // Aggressive backoff
  onPoll: () => {
    startTimes.push(Date.now());
  }
});

for (let i = 1; i < startTimes.length; i++) {
  delays.push(startTimes[i] - startTimes[i - 1]);
}

// No delay should exceed maxDelay (with some tolerance for timing jitter)
delays.forEach(delay => {
  assert(delay <= 5500); // 500ms tolerance
});
```

---

### Requirement: ASYNC-007 - Error Context
**Priority**: High  
**Component**: InvoiceProcessingError

Errors from async processing MUST include context about the failure (flow status, message, invoice ID).

#### Scenario: Error includes flowStatus and flowMessage
```typescript
try {
  await nfe.serviceInvoices.createAndWait('company-id', invalidData);
} catch (error) {
  assert(error instanceof InvoiceProcessingError);
  assert(error.flowStatus === 'IssueFailed');
  assert(error.flowMessage !== undefined);
  assert(error.flowMessage.length > 0); // Contains reason for failure
  assert(error.invoiceId !== undefined); // Can retrieve the failed invoice
}
```

#### Scenario: Error allows retrieval of failed invoice
```typescript
try {
  await nfe.serviceInvoices.createAndWait('company-id', invalidData);
} catch (error) {
  if (error instanceof InvoiceProcessingError) {
    // Can retrieve the failed invoice for inspection
    const invoice = await nfe.serviceInvoices.retrieve('company-id', error.invoiceId);
    assert(invoice.flowStatus === 'IssueFailed');
    assert(invoice.flowMessage === error.flowMessage);
  }
}
```

---

### Requirement: ASYNC-008 - Polling Utility Reusability
**Priority**: Medium  
**Component**: src/core/utils/polling.ts

The polling logic MUST be implemented as a reusable utility that can be used for other async operations beyond invoice creation.

#### Scenario: Generic polling utility
```typescript
import { poll } from '../utils/polling.js';

// Can be used for any async operation
const result = await poll({
  fn: async () => {
    const invoice = await nfe.serviceInvoices.retrieve('company-id', 'invoice-id');
    return invoice;
  },
  isComplete: (invoice) => ['Issued', 'IssueFailed'].includes(invoice.flowStatus),
  timeout: 120000,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 1.5
});
```

#### Scenario: Polling utility handles errors
```typescript
await expect(
  poll({
    fn: async () => {
      throw new Error('Network error');
    },
    isComplete: () => false,
    timeout: 5000
  })
).rejects.toThrow('Network error');
```

---

## MODIFIED Requirements

None - this is a new capability.

---

## REMOVED Requirements

None - this is a new capability.

---

## Dependencies

- **service-invoice-operations**: Requires create() and retrieve() methods
- **Error System**: Requires InvoiceProcessingError and TimeoutError
- **Types**: Requires AsyncResponse, PollingOptions types

---

## Testing Requirements

### Unit Tests
- Test async response detection (202 vs 201)
- Test Location header parsing
- Test polling with various terminal states
- Test exponential backoff timing
- Test timeout handling
- Test error propagation
- Test onPoll callback invocation
- Coverage > 90% (critical path)

### Integration Tests
- Test complete async flow (202 → polling → Issued)
- Test async failure flow (202 → polling → IssueFailed)
- Test timeout scenario
- Test with MSW to simulate state transitions

---

## Documentation Requirements

- Document async processing pattern in API.md
- Document polling configuration options
- Provide example of manual polling
- Provide example of createAndWait()
- Document terminal states
- Document error handling for async failures

---

## Non-Functional Requirements

- **Performance**: Polling should not make excessive API calls (respect backoff)
- **Reliability**: Timeout must be enforced to prevent infinite loops
- **Developer Experience**: createAndWait() should be the default recommended approach
- **Observability**: onPoll callback allows progress tracking
