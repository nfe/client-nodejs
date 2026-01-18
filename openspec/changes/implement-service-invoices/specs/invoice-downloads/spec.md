# Capability: Invoice Downloads

**Capability ID**: `invoice-downloads`  
**Parent Change**: `implement-service-invoices`  
**Type**: Core Feature  
**Priority**: High  
**Dependencies**: `service-invoice-operations`

---

## Overview

This capability enables downloading service invoices in PDF and XML formats. Once an invoice reaches the "Issued" state, it becomes available for download. These downloads are essential for legal compliance, as Brazilian tax regulations require both electronic (XML) and printed (PDF) representations of fiscal documents.

## Context

- **PDF**: Visual representation suitable for printing and customer distribution
- **XML**: Official fiscal document format required for tax authority compliance
- Both formats may not be immediately available after issuance (404 possible)
- Downloads return binary data that must be handled as Buffers in Node.js
- Large invoices (with many line items) can produce multi-MB files

## ADDED Requirements

### Requirement: DOWNLOAD-001 - Download PDF by Invoice ID
**Priority**: High  
**Component**: ServiceInvoicesResource.downloadPdf()

The SDK MUST allow developers to download the PDF representation of a specific issued service invoice.

#### Scenario: Download PDF for issued invoice
```typescript
const pdfBuffer = await nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id');

assert(pdfBuffer instanceof Buffer);
assert(pdfBuffer.length > 0);
assert(pdfBuffer[0] === 0x25); // PDF magic number '%'
assert(pdfBuffer[1] === 0x50); // 'P'
assert(pdfBuffer[2] === 0x44); // 'D'
assert(pdfBuffer[3] === 0x46); // 'F'
```

#### Scenario: Save PDF to file
```typescript
import { writeFile } from 'fs/promises';

const pdf = await nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id');
await writeFile('./invoice-123.pdf', pdf);

// File is valid PDF
const stats = await stat('./invoice-123.pdf');
assert(stats.size > 0);
```

#### Scenario: PDF not ready yet (404)
```typescript
// Invoice just issued, PDF still generating
await expect(
  nfe.serviceInvoices.downloadPdf('company-id', 'new-invoice-id')
).rejects.toThrow(NotFoundError);

// Retry after delay
await new Promise(resolve => setTimeout(resolve, 5000));
const pdf = await nfe.serviceInvoices.downloadPdf('company-id', 'new-invoice-id');
assert(pdf instanceof Buffer);
```

#### Scenario: Download non-existent invoice (404)
```typescript
await expect(
  nfe.serviceInvoices.downloadPdf('company-id', 'non-existent-id')
).rejects.toThrow(NotFoundError);
```

---

### Requirement: DOWNLOAD-002 - Download XML by Invoice ID
**Priority**: High  
**Component**: ServiceInvoicesResource.downloadXml()

The SDK MUST allow developers to download the XML representation of a specific issued service invoice for tax compliance.

#### Scenario: Download XML for issued invoice
```typescript
const xmlBuffer = await nfe.serviceInvoices.downloadXml('company-id', 'invoice-id');

assert(xmlBuffer instanceof Buffer);
assert(xmlBuffer.length > 0);

const xmlString = xmlBuffer.toString('utf8');
assert(xmlString.startsWith('<?xml'));
assert(xmlString.includes('<CompNfse')); // NFSe XML root element (varies by city)
```

#### Scenario: Parse downloaded XML
```typescript
import { parseString } from 'xml2js';

const xml = await nfe.serviceInvoices.downloadXml('company-id', 'invoice-id');
const xmlString = xml.toString('utf8');

const parsed = await new Promise((resolve, reject) => {
  parseString(xmlString, (err, result) => {
    if (err) reject(err);
    else resolve(result);
  });
});

assert(parsed !== undefined);
// Contains invoice data in structured XML format
```

#### Scenario: Save XML to file
```typescript
const xml = await nfe.serviceInvoices.downloadXml('company-id', 'invoice-id');
await writeFile('./invoice-123.xml', xml);

// File is valid XML
const content = await readFile('./invoice-123.xml', 'utf8');
assert(content.includes('<?xml'));
```

#### Scenario: XML not ready yet (404)
```typescript
await expect(
  nfe.serviceInvoices.downloadXml('company-id', 'new-invoice-id')
).rejects.toThrow(NotFoundError);
```

---

### Requirement: DOWNLOAD-003 - Batch PDF Download
**Priority**: Medium  
**Component**: ServiceInvoicesResource.downloadPdf() (alternate signature)

The SDK MUST allow developers to download a PDF containing multiple invoices (batch download).

#### Scenario: Download batch PDF by company
```typescript
// Note: Based on v2 code, downloadPdf without invoice ID downloads all invoices
const batchPdf = await nfe.serviceInvoices.downloadPdf('company-id');

assert(batchPdf instanceof Buffer);
assert(batchPdf.length > 0);
// Contains multiple invoices in single PDF
```

#### Scenario: Batch PDF with date filters
```typescript
// If API supports filtering (check OpenAPI spec)
const batchPdf = await nfe.serviceInvoices.downloadPdf('company-id', {
  issuedBegin: '2026-01-01',
  issuedEnd: '2026-01-31'
});

assert(batchPdf instanceof Buffer);
// Contains only invoices from January 2026
```

---

### Requirement: DOWNLOAD-004 - Binary Data Handling
**Priority**: Critical  
**Component**: HTTP client, downloadPdf(), downloadXml()

Download methods MUST correctly handle binary data using Fetch API and return Node.js Buffers.

#### Scenario: Use correct Accept headers
```typescript
// Implementation should set:
// - Accept: application/pdf for PDF downloads
// - Accept: application/xml or text/xml for XML downloads

const pdf = await nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id');
// HTTP client sent Accept: application/pdf

const xml = await nfe.serviceInvoices.downloadXml('company-id', 'invoice-id');
// HTTP client sent Accept: application/xml
```

#### Scenario: Handle large files without memory issues
```typescript
// Should work even for large invoices (multiple MB)
const largePdf = await nfe.serviceInvoices.downloadPdf('company-id', 'large-invoice-id');

assert(largePdf instanceof Buffer);
// Memory is managed efficiently - no streaming needed for reasonable sizes
```

#### Scenario: Binary data integrity preserved
```typescript
const pdf = await nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id');

// PDF magic number intact
assert(pdf[0] === 0x25); // '%'
assert(pdf[1] === 0x50); // 'P'
assert(pdf[2] === 0x44); // 'D'
assert(pdf[3] === 0x46); // 'F'

// No encoding corruption
const pdfString = pdf.toString('utf8');
assert(!pdfString.includes('�')); // No replacement characters
```

---

### Requirement: DOWNLOAD-005 - Error Handling
**Priority**: High  
**Component**: downloadPdf(), downloadXml()

Download methods MUST handle all API error scenarios gracefully.

#### Scenario: Document not found (404)
```typescript
try {
  await nfe.serviceInvoices.downloadPdf('company-id', 'non-existent-id');
} catch (error) {
  assert(error instanceof NotFoundError);
  assert(error.statusCode === 404);
  assert(error.message.includes('not found') || error.message.includes('download'));
}
```

#### Scenario: Authentication error (401)
```typescript
const nfe = new NfeClient({ apiKey: 'invalid' });

try {
  await nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id');
} catch (error) {
  assert(error instanceof AuthenticationError);
  assert(error.statusCode === 401);
}
```

#### Scenario: Timeout (408)
```typescript
try {
  await nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id');
} catch (error) {
  assert(error instanceof TimeoutError);
  assert(error.statusCode === 408);
}
```

#### Scenario: Server error (500)
```typescript
try {
  await nfe.serviceInvoices.downloadXml('company-id', 'invoice-id');
} catch (error) {
  assert(error instanceof NfeError);
  assert(error.statusCode === 500);
}
```

---

### Requirement: DOWNLOAD-006 - Retry Logic for 404
**Priority**: Medium  
**Component**: downloadPdf(), downloadXml() or helper utility

The SDK MUST provide guidance or utility for retrying downloads when documents are not yet ready (404).

#### Scenario: Retry helper for PDF generation
```typescript
import { retryUntilAvailable } from '../utils/retry.js';

// Helper function that retries 404s with exponential backoff
const pdf = await retryUntilAvailable(
  () => nfe.serviceInvoices.downloadPdf('company-id', 'new-invoice-id'),
  {
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 10000
  }
);

assert(pdf instanceof Buffer);
```

#### Scenario: Manual retry pattern documented
```typescript
// Document this pattern in API docs
async function downloadWithRetry(downloadFn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await downloadFn();
    } catch (error) {
      if (error instanceof NotFoundError && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
}

const pdf = await downloadWithRetry(
  () => nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id')
);
```

---

### Requirement: DOWNLOAD-007 - Type Safety
**Priority**: High  
**Component**: downloadPdf(), downloadXml()

Download methods MUST have strict TypeScript types.

#### Scenario: Return type is Buffer
```typescript
// Single invoice download
const pdf: Buffer = await nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id');
const xml: Buffer = await nfe.serviceInvoices.downloadXml('company-id', 'invoice-id');

// Batch download (if supported)
const batchPdf: Buffer = await nfe.serviceInvoices.downloadPdf('company-id');
```

#### Scenario: Parameters are typed
```typescript
// TypeScript error for wrong types
nfe.serviceInvoices.downloadPdf(
  123, // Error: Expected string
  456  // Error: Expected string
);
```

---

### Requirement: DOWNLOAD-008 - Documentation
**Priority**: High  
**Component**: JSDoc, examples, API.md

Download methods MUST be fully documented with usage examples.

#### Scenario: JSDoc includes examples
```typescript
/**
 * Download the PDF representation of a service invoice
 * 
 * @param companyId - The ID of the company
 * @param invoiceId - The ID of the invoice to download (optional for batch download)
 * @returns Buffer containing the PDF file
 * @throws {NotFoundError} If the invoice doesn't exist or PDF is not yet available
 * @throws {AuthenticationError} If API key is invalid
 * @throws {TimeoutError} If the request times out
 * 
 * @example Download single invoice
 * ```typescript
 * const pdf = await nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id');
 * await writeFile('./invoice.pdf', pdf);
 * ```
 * 
 * @example Retry if not ready
 * ```typescript
 * let pdf;
 * for (let i = 0; i < 3; i++) {
 *   try {
 *     pdf = await nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id');
 *     break;
 *   } catch (err) {
 *     if (err instanceof NotFoundError && i < 2) {
 *       await new Promise(resolve => setTimeout(resolve, 5000));
 *     } else {
 *       throw err;
 *     }
 *   }
 * }
 * ```
 */
async downloadPdf(companyId: string, invoiceId?: string): Promise<Buffer>
```

---

## MODIFIED Requirements

None - this is a new capability.

---

## REMOVED Requirements

None - this is a new capability.

---

## Dependencies

- **HTTP Client**: Must support binary responses (arrayBuffer())
- **Error System**: Requires NotFoundError, AuthenticationError, TimeoutError
- **Node.js**: Requires Buffer support (built-in)

---

## Testing Requirements

### Unit Tests
- Test PDF download with mocked binary data
- Test XML download with mocked binary data
- Test 404 error handling
- Test other error scenarios (401, 408, 500)
- Test batch download (if supported)
- Test binary data integrity
- Coverage > 80%

### Integration Tests
- Test against MSW with actual PDF/XML sample data
- Test saving to file
- Test parsing downloaded XML
- Test retry logic for 404
- Verify PDF magic numbers

---

## Documentation Requirements

- Document download methods in API.md
- Provide example of downloading and saving files
- Document retry pattern for 404 errors
- Document memory considerations for large files
- Include examples in examples/service-invoice-complete.js

---

## Non-Functional Requirements

- **Performance**: Downloads should handle multi-MB files efficiently
- **Memory**: Use streaming if files commonly exceed 10MB (check API behavior)
- **Binary Integrity**: No encoding corruption of binary data
- **Compatibility**: Return Node.js Buffer for maximum compatibility
- **Error Clarity**: 404 errors should indicate whether invoice doesn't exist or file isn't ready yet

---

## Open Questions

1. **Batch download support**: Does the API actually support batch PDF downloads? Check OpenAPI spec and v2 behavior.
2. **File size limits**: What's the typical size of invoices? Do we need streaming for large files?
3. **Retry guidance**: Should we provide a built-in retry helper or just document the pattern?
4. **Format variations**: Do different cities return different XML schemas? Need to document?
5. **Caching**: Should downloads be cached to avoid redundant API calls?
