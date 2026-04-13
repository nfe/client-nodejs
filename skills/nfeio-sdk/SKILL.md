---
name: nfeio-sdk
description: "NFE.io Node.js SDK integration expert (package: nfe-io). MUST trigger when: code imports 'nfe-io' or references NfeClient; user mentions NFE.io, NFS-e, NF-e, CT-e, CF-e, CFe-SAT, nota fiscal, nota fiscal eletronica, Brazilian invoice, fiscal document, electronic invoice Brazil, CNPJ lookup, CPF lookup, service invoice, product invoice, transportation invoice, consumer invoice, tax calculation Brazilian taxes, SEFAZ, NFE API, emissao de nota, consulta CNPJ, consulta CPF, consulta CEP; user works with Brazilian electronic fiscal documents, tax documents, or Brazilian tax compliance; any file contains 'nfe-io' in package.json or import statements; user mentions polling for invoice status, invoice async processing, or certificate management for Brazilian fiscal documents. Covers all 16 SDK resources, async invoice processing with polling, discriminated union responses, error hierarchy, certificate management, webhook signature validation, address lookup (CEP), legal entity and natural person lookups, tax calculation engine, and pagination patterns. Use this skill even if the user doesn't explicitly name the SDK -- if they're building anything related to Brazilian fiscal document automation in Node.js/TypeScript, this skill applies."
---

# NFE.io Node.js SDK Integration Guide

This skill enables you to write correct, production-ready code using the NFE.io SDK for Brazilian electronic fiscal documents. The SDK covers NFS-e (service invoices), NF-e (product invoices), CT-e (transportation), CFe-SAT (consumer), CNPJ/CPF lookups, tax calculation, and more.

## Package & Import

The npm package name is **`nfe-io`** (not `@nfe-io/sdk` despite what JSDoc comments say).

```typescript
// ESM (recommended)
import { NfeClient } from 'nfe-io';

// CommonJS
const { NfeClient } = require('nfe-io');

// Default export (factory function)
import nfeFactory from 'nfe-io';
const nfe = nfeFactory({ apiKey: 'your-key' });
```

Requirements: Node.js 18+ (uses native `fetch`). Zero runtime dependencies.

## Quick Start

```typescript
import { NfeClient } from 'nfe-io';

const nfe = new NfeClient({
  apiKey: 'your-api-key',           // Required for most resources
  environment: 'production',         // 'production' | 'development'
  timeout: 30000,                    // Request timeout in ms (default: 30000)
  retryConfig: {                     // Optional retry configuration
    maxRetries: 3,                   // Default: 3
    baseDelay: 1000,                 // Default: 1000ms
    maxDelay: 30000,                 // Default: 30000ms
    backoffMultiplier: 2,            // Default: 2
  },
});
```

**Dual API keys**: Some data-service resources (addresses, CNPJ/CPF lookups, tax calculation) can use a separate `dataApiKey`. If not set, they fall back to `apiKey`.

```typescript
const nfe = new NfeClient({
  apiKey: process.env.NFE_API_KEY,
  dataApiKey: process.env.NFE_DATA_API_KEY, // Optional, falls back to apiKey
});
```

**From environment variable**:
```typescript
import { createClientFromEnv } from 'nfe-io';
// Reads NFE_API_KEY env var
const nfe = createClientFromEnv('production');
```

## Resource Map

All resources are lazy-initialized via property getters on `NfeClient`. No resource is instantiated until first access.

| Accessor | Resource | API Host | Scope | Key Operations |
|----------|----------|----------|-------|----------------|
| `nfe.serviceInvoices` | NFS-e Service Invoices | api.nfe.io | Company | create, createAndWait, list, retrieve, cancel, sendEmail, downloadPdf/Xml |
| `nfe.companies` | Companies | api.nfe.io | Global | CRUD, uploadCertificate, findByTaxNumber, listAll, listIterator |
| `nfe.legalPeople` | Legal People (PJ) | api.nfe.io | Company | CRUD, createBatch, findByTaxNumber |
| `nfe.naturalPeople` | Natural People (PF) | api.nfe.io | Company | CRUD, createBatch, findByTaxNumber |
| `nfe.webhooks` | Webhooks | api.nfe.io | Company | CRUD, validateSignature, test |
| `nfe.addresses` | Address Lookup | address.api.nfe.io | Global | lookupByPostalCode, search, lookupByTerm |
| `nfe.productInvoices` | NF-e Product Invoices | api.nfse.io | Company | create, list, retrieve, cancel, downloadPdf/Xml, sendCorrectionLetter |
| `nfe.stateTaxes` | State Tax (IE) | api.nfse.io | Company | CRUD (prerequisite for NF-e issuance) |
| `nfe.taxCalculation` | Tax Engine | api.nfse.io | Tenant | calculate (ICMS, PIS, COFINS, IPI, II) |
| `nfe.taxCodes` | Tax Code Reference | api.nfse.io | Global | listOperationCodes, listAcquisitionPurposes, listIssuer/RecipientTaxProfiles |
| `nfe.transportationInvoices` | CT-e Transport | api.nfse.io | Company | enable/disable, retrieve, downloadXml |
| `nfe.inboundProductInvoices` | Inbound NF-e | api.nfse.io | Company | enableAutoFetch, getDetails, downloadXml/Pdf, manifest |
| `nfe.productInvoiceQuery` | NF-e Query (SEFAZ) | nfe.api.nfe.io | Global | retrieve, downloadPdf/Xml, listEvents |
| `nfe.consumerInvoiceQuery` | CFe-SAT Query | nfe.api.nfe.io | Global | retrieve, downloadXml |
| `nfe.legalEntityLookup` | CNPJ Lookup | legalentity.api.nfe.io | Global | getBasicInfo, getStateTaxInfo, getStateTaxForInvoice |
| `nfe.naturalPersonLookup` | CPF Lookup | naturalperson.api.nfe.io | Global | getStatus |

**Company-scoped** resources require `companyId` as the first parameter in every method. **Global** resources operate without company context.

## Core Pattern: Company-Scoped Operations

Most resources are scoped to a company. The pattern is always `resource.method(companyId, ...)`:

```typescript
// List service invoices for a company
const invoices = await nfe.serviceInvoices.list('company-uuid', {
  pageIndex: 0,
  pageCount: 50,
});

// Create a legal person under a company
const person = await nfe.legalPeople.create('company-uuid', {
  federalTaxNumber: '11444555000149', // String for people resources
  name: 'Example Company Ltda',
  email: 'contact@example.com',
});
```

## Core Pattern: Async Invoice Processing (Critical)

Service invoice creation can return either an immediate result (201) or an async pending result (202), depending on the municipality. The SDK uses a **discriminated union** return type:

```typescript
// WRONG: assuming create() returns an invoice directly
const invoice = await nfe.serviceInvoices.create(companyId, data); // This is a union type!

// CORRECT: handling both cases explicitly
const result = await nfe.serviceInvoices.create(companyId, data);
if (result.status === 'immediate') {
  console.log('Invoice issued:', result.invoice.id);
} else if (result.status === 'async') {
  console.log('Processing...', result.response.invoiceId);
  // Need to poll for completion
}
```

**Recommended: Use `createAndWait()`** — handles polling automatically:

```typescript
const invoice = await nfe.serviceInvoices.createAndWait(companyId, {
  cityServiceCode: '2690',
  description: 'IT Consulting Services',
  servicesAmount: 1500.00,
  borrower: {
    federalTaxNumber: 11444555000149,
    name: 'Client Company',
    email: 'client@example.com',
  },
}, {
  timeout: 300000,       // 5 min (some municipalities are slow)
  initialDelay: 1000,    // 1s before first poll
  maxDelay: 10000,       // Max 10s between polls
  backoffFactor: 1.5,    // Exponential backoff
  onPoll: (attempt, flowStatus) => {
    console.log(`Poll #${attempt}: ${flowStatus}`);
  },
});

console.log('Invoice status:', invoice.flowStatus); // 'Issued' | 'IssueFailed'
```

**Terminal FlowStatus values**: `Issued`, `IssueFailed`, `Cancelled`, `CancelFailed`
**Non-terminal** (still processing): `WaitingSend`, `WaitingReturn`, `WaitingDownload`, `WaitingCalculateTaxes`, `WaitingDefineRpsNumber`, `WaitingSendCancel`, `PullFromCityHall`

## Core Pattern: Error Handling

The SDK provides a rich error hierarchy. Every error extends `NfeError`:

| Error Class | HTTP Status | When Thrown |
|------------|-------------|-------------|
| `AuthenticationError` | 401 | Invalid or missing API key |
| `ValidationError` | 400/422 | Invalid request data |
| `NotFoundError` | 404 | Resource doesn't exist |
| `ConflictError` | 409 | Duplicate or conflict |
| `RateLimitError` | 429 | Too many requests |
| `ServerError` | 5xx | Server-side failures |
| `ConnectionError` | — | Network/DNS failures |
| `TimeoutError` | — | Request timeout |
| `ConfigurationError` | — | Invalid SDK configuration |
| `PollingTimeoutError` | — | Polling exceeded timeout |
| `InvoiceProcessingError` | — | Invoice processing failed |

```typescript
import {
  NfeError, AuthenticationError, ValidationError,
  NotFoundError, RateLimitError, TimeoutError,
  PollingTimeoutError, isNfeError, isValidationError,
} from 'nfe-io';

try {
  const invoice = await nfe.serviceInvoices.createAndWait(companyId, data);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Check your API key');
  } else if (error instanceof ValidationError) {
    console.error('Invalid data:', error.details);
  } else if (error instanceof PollingTimeoutError) {
    console.error('Invoice still processing after timeout');
  } else if (isNfeError(error)) {
    console.error(`${error.type} [${error.statusCode}]: ${error.message}`);
    console.error('Details:', error.details);
  }
}
```

All error objects have: `message`, `type`, `code`/`status`/`statusCode`, `details`, `raw`, `toJSON()`.

## Core Pattern: Pagination

The SDK uses **two different pagination styles**:

**Offset-based** (service invoices, companies, people, webhooks):
```typescript
const page = await nfe.serviceInvoices.list(companyId, {
  pageIndex: 0,    // 0-based page number
  pageCount: 50,   // Items per page
});
// page.data: ServiceInvoiceData[]
// page.totalCount: number
```

**Cursor-based** (product invoices, state taxes):
```typescript
const page = await nfe.productInvoices.list(companyId, {
  environment: 'Production',   // REQUIRED for product invoices
  limit: 25,
  startingAfter: 'last-invoice-id',  // Cursor for next page
});
```

**Auto-pagination helpers** (companies only):
```typescript
const allCompanies = await nfe.companies.listAll();

// Or async iterator
for await (const company of nfe.companies.listIterator()) {
  console.log(company.name);
}
```

## Core Pattern: File Downloads

PDF and XML downloads return `Buffer` objects for most resources:

```typescript
import { writeFileSync } from 'node:fs';

// Service invoice downloads return Buffer
const pdf = await nfe.serviceInvoices.downloadPdf(companyId, invoiceId);
const xml = await nfe.serviceInvoices.downloadXml(companyId, invoiceId);
writeFileSync('invoice.pdf', pdf);
writeFileSync('invoice.xml', xml);

// Query resources also return Buffer
const danfe = await nfe.productInvoiceQuery.downloadPdf(accessKey);
```

**Exception**: `productInvoices.downloadPdf()` returns `NfeFileResource` (with a `uri` field), not a raw Buffer. Use the URI to fetch the file separately.

## Core Pattern: Certificates

Digital certificates (A1 PFX/P12) are required for NF-e issuance:

```typescript
import { readFileSync } from 'node:fs';
import { CertificateValidator } from 'nfe-io';

const certBuffer = readFileSync('certificate.pfx');

// Validate before uploading
const validation = await CertificateValidator.validate(certBuffer, 'password');
if (validation.valid) {
  await nfe.companies.uploadCertificate(companyId, certBuffer, 'password');
}

// Check certificate status
const status = await nfe.companies.getCertificateStatus(companyId);
console.log('Expires:', status.expiresOn);

// Find companies with expiring certificates
const expiring = await nfe.companies.getCompaniesWithExpiringCertificates(30); // 30 days
```

## Core Pattern: Webhooks

```typescript
// Create webhook
const webhook = await nfe.webhooks.create(companyId, {
  url: 'https://your-app.com/webhooks/nfe',
  events: ['invoice.created', 'invoice.issued', 'invoice.cancelled', 'invoice.failed'],
  active: true,
});

// Validate incoming webhook signature (in your handler)
const isValid = nfe.webhooks.validateSignature(
  rawBody,           // Request body as string
  signature,         // X-Hub-Signature header value
  webhook.secret!,   // Secret from webhook creation
);
```

Available events: `invoice.created`, `invoice.issued`, `invoice.cancelled`, `invoice.failed`.

## Critical Pitfalls

1. **Import path**: Use `'nfe-io'` not `'@nfe-io/sdk'`. The JSDoc uses `@nfe-io/sdk` but the npm package is `nfe-io`.

2. **`federalTaxNumber` type varies**: For `companies.create()` it's a **number** (`12345678000190`). For `legalPeople`/`naturalPeople` and lookup resources it's a **string** (`'12345678000190'`).

3. **`serviceInvoices.create()` returns a union**: The return type is `{ status: 'immediate', invoice } | { status: 'async', response }`. Always use `createAndWait()` unless you need manual control.

4. **Product invoices have NO `createAndWait()`**: `productInvoices.create()` is always async (returns 202). Completion is notified via **webhooks only**. Do not try to poll.

5. **`productInvoices.list()` requires `environment`**: You must pass `environment: 'Production'` or `environment: 'Test'`. Omitting it throws `ValidationError`.

6. **Method is `companies.remove()`** not `companies.delete()` — avoids JS reserved keyword conflict.

7. **Data services need API key**: Resources on non-main hosts (addresses, lookups, tax calculation) use `dataApiKey` with `apiKey` as fallback. Ensure at least one is set.

8. **Different pagination**: Service invoices use offset (`pageIndex`/`pageCount`), product invoices use cursor (`startingAfter`/`endingBefore`/`limit`).

9. **Polling timeout**: Default is 2 minutes. Some municipalities take 3-5 minutes. Set `timeout: 300000` for production use.

10. **Access keys**: Must be exactly 44 numeric digits. Used for query resources and inbound documents.

11. **Correction letters**: `sendCorrectionLetter()` text must be 15-1000 characters, no accents or special characters.

12. **Product invoice PDF**: `productInvoices.downloadPdf()` returns `NfeFileResource` (object with `uri`), not a `Buffer`. Use `productInvoiceQuery.downloadPdf(accessKey)` for a raw Buffer.

## Decision Tree: "I want to..."

| Goal | Resource & Method |
|------|-------------------|
| Issue a service invoice (NFS-e) | `nfe.serviceInvoices.createAndWait(companyId, data)` |
| Issue a product invoice (NF-e) | `nfe.productInvoices.create(companyId, data)` + webhook |
| Issue NF-e with specific state tax | `nfe.productInvoices.createWithStateTax(companyId, stateTaxId, data)` |
| Query existing NF-e by access key | `nfe.productInvoiceQuery.retrieve(accessKey)` |
| Query CFe-SAT coupon by access key | `nfe.consumerInvoiceQuery.retrieve(accessKey)` |
| Receive inbound NF-e automatically | `nfe.inboundProductInvoices.enableAutoFetch(companyId)` |
| Receive inbound CT-e automatically | `nfe.transportationInvoices.enable(companyId)` |
| Look up CNPJ (company info) | `nfe.legalEntityLookup.getBasicInfo(cnpj)` |
| Look up CPF (person status) | `nfe.naturalPersonLookup.getStatus(cpf, birthDate)` |
| Look up address by CEP | `nfe.addresses.lookupByPostalCode('01310-100')` |
| Calculate Brazilian taxes | `nfe.taxCalculation.calculate(tenantId, request)` |
| Manage companies & certificates | `nfe.companies.*` |
| Manage people (PJ) under company | `nfe.legalPeople.*` |
| Manage people (PF) under company | `nfe.naturalPeople.*` |
| Set up webhook notifications | `nfe.webhooks.create(companyId, {...})` |
| Manage state tax registrations (IE) | `nfe.stateTaxes.*` |
| Cancel a service invoice | `nfe.serviceInvoices.cancel(companyId, invoiceId)` |
| Cancel a product invoice | `nfe.productInvoices.cancel(companyId, invoiceId)` |
| Download DANFE PDF | `nfe.serviceInvoices.downloadPdf(companyId, id)` or `nfe.productInvoiceQuery.downloadPdf(accessKey)` |
| Send invoice by email | `nfe.serviceInvoices.sendEmail(companyId, invoiceId)` |
| Issue correction letter (CC-e) | `nfe.productInvoices.sendCorrectionLetter(companyId, id, data)` |

## Reference Files

Load these when you need detailed method signatures, full type definitions, or specific implementation guidance:

- **`references/service-invoices-and-polling.md`** — Read when working with NFS-e service invoices, companies, people (PJ/PF), webhooks, or polling. Contains complete method signatures, PollingOptions, CreateInvoiceResponse union, FlowStatus states, and certificate management details.

- **`references/product-invoices-and-taxes.md`** — Read when working with NF-e product invoices, state tax registrations (IE), tax calculation, tax codes, CT-e, or inbound NF-e distribution. Contains cursor pagination, NfeProductInvoiceIssueData structure, TaxCalculation request/response, and manifest events.

- **`references/data-services-and-lookups.md`** — Read when working with CNPJ/CPF lookups, address/CEP lookup, NF-e/CFe-SAT query by access key. Contains LegalEntityBasicInfo structure, BrazilianState codes, AddressLookupResponse, and host mapping.

- **`references/error-handling-and-patterns.md`** — Read when implementing error handling, retry strategies, or debugging SDK issues. Contains complete error class hierarchy, type guards, ErrorFactory, RetryConfig, and CertificateValidator.
