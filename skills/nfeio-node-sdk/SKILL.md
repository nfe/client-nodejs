---
name: nfeio-node-sdk
description: "NFE.io Node.js SDK integration expert (package: nfe-io). MUST trigger when: code imports 'nfe-io' or references NfeClient; user mentions NFE.io, NFS-e, NF-e, CT-e, CF-e, CFe-SAT, nota fiscal, nota fiscal eletronica, Brazilian invoice, fiscal document, electronic invoice Brazil, CNPJ lookup, CPF lookup, service invoice, product invoice, transportation invoice, consumer invoice, tax calculation Brazilian taxes, SEFAZ, NFE API, emissao de nota, consulta CNPJ, consulta CPF, consulta CEP; user works with Brazilian electronic fiscal documents, tax documents, or Brazilian tax compliance; any file contains 'nfe-io' in package.json or import statements; user mentions polling for invoice status, invoice async processing, or certificate management for Brazilian fiscal documents. Covers all 16 SDK resources, async invoice processing with polling, discriminated union responses, error hierarchy, certificate management, webhook signature validation, address lookup (CEP), legal entity and natural person lookups, tax calculation engine, and pagination patterns. Use this skill even if the user doesn't explicitly name the SDK -- if they're building anything related to Brazilian fiscal document automation in Node.js/TypeScript, this skill applies."
---

# NFE.io Node.js SDK Integration Guide

This skill enables you to write correct, production-ready code using the NFE.io SDK for Brazilian electronic fiscal documents. The SDK covers NFS-e (service invoices), NF-e (product invoices), CT-e (transportation), CFe-SAT (consumer), CNPJ/CPF lookups, tax calculation, and more.

## Package & Import

The npm package name is **`nfe-io`**. (Until 2026-09-02 the JSDoc examples imported from `@nfe-io/sdk`, a package that does not exist; corrected at the source.)

```typescript
// ESM (recommended)
import { NfeClient } from 'nfe-io';

// CommonJS
const { NfeClient } = require('nfe-io');

// Default export (factory function)
import nfeFactory from 'nfe-io';
const nfe = nfeFactory({ apiKey: 'your-key' });
```

Requirements: Node.js 22+ (uses native `fetch`). Zero runtime dependencies.

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

**Two complementary API keys** — not alternatives. Each answers **403** in the other's territory:

- **`apiKey`** (main) → FISCAL hosts: `api.nfe.io`, `api.nfse.io`. Covers every emission
  resource plus `certificates`, `municipalTaxes`, `stateTaxes`, `taxCodes` and
  `taxCalculation`.
- **`dataApiKey`** → LOOKUP hosts: `nfe.api.nfe.io`, `legalentity`, `naturalperson`,
  `address`. Covers `addresses`, `legalEntityLookup`, `naturalPersonLookup`,
  `productInvoiceQuery` and `consumerInvoiceQuery`.

The SDK falls back from `dataApiKey` to `apiKey` when the former is absent — a convenience
for accounts holding one key with both scopes, **not** a sign that one replaces the other.

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
| `nfe.serviceInvoices` | NFS-e Service Invoices | api.nfe.io | Company | create, createAndWait, list, retrieve, retrieveByExternalId, cancel, cancelAndWait, sendEmail, downloadPdf/Xml |
| `nfe.serviceInvoicesRtc` | NFS-e RTC (Reforma Tributária) | api.nfe.io | Company | create, createAndWait, retrieve, downloadCancellationXml (leiaute IBS/CBS; RTC selecionado pelo payload) |
| `nfe.companies` | Companies | api.nfe.io | Global | CRUD, exists, uploadCertificate, findByTaxNumber, listAll, listIterator |
| `nfe.legalPeople` | Legal People (PJ) | api.nfe.io | Company | CRUD, createBatch, findByTaxNumber |
| `nfe.naturalPeople` | Natural People (PF) | api.nfe.io | Company | CRUD, createBatch, findByTaxNumber |
| `nfe.webhooks` | Webhooks | api.nfe.io (v2 p/ conta) | Company + Account | company CRUD, validateSignature; conta: listAccountWebhooks/create/retrieve/update/delete, deleteAllAccountWebhooks, pingAccountWebhook, fetchEventTypes |
| `nfe.notifications` | Notifications | api.nfe.io | Company | list, retrieve, delete, sendEmail |
| `nfe.addresses` | Address Lookup | address.api.nfe.io | Global | lookupByPostalCode (só CEP; busca/termo não existem na API real) |
| `nfe.productInvoices` | NF-e Product Invoices | api.nfse.io | Company | create, list (requer environment), retrieve, cancel, downloadPdf/Xml, sendCorrectionLetter |
| `nfe.productInvoicesRtc` | NF-e/NFC-e RTC | api.nfse.io | Company | create (webhook-driven; IBS/CBS/IS) |
| `nfe.consumerInvoices` | NFC-e Consumer Invoices | api.nfse.io | Company | create (webhook-driven), list (requer environment), retrieve, cancel, getItems, getEvents, downloadPdf/Xml/Rejection, disable |
| `nfe.stateTaxes` | State Tax (IE) | api.nfse.io | Company | CRUD, switchAuthorizer (pré-requisito p/ NF-e) |
| `nfe.municipalTaxes` | Municipal Tax (IM) | api.nfse.io | Company | CRUD (pré-requisito p/ NFS-e). ⚠️ `updatePrefecture` e `getSeries` estão **depreciados**: a plataforma não serve essas rotas |
| `nfe.certificates` | Certificates (por thumbprint) | api.nfse.io | Company | list, getByThumbprint, deleteByThumbprint (+ variantes v1) |
| `nfe.taxCalculation` | Tax Engine | api.nfse.io | Tenant | calculate (ICMS, PIS, COFINS, IPI, II) |
| `nfe.taxCodes` | Tax Code Reference | api.nfse.io | Global | listOperationCodes, listAcquisitionPurposes, listIssuer/RecipientTaxProfiles |
| `nfe.transportationInvoices` | CT-e Transport | api.nfse.io | Company | enable/disable, retrieve, downloadXml |
| `nfe.inboundProductInvoices` | Inbound NF-e | api.nfse.io | Company | enableAutoFetch, getDetails, downloadXml/Pdf, manifest |
| `nfe.productInvoiceQuery` | NF-e Query (SEFAZ) | nfe.api.nfe.io | Global | retrieve, downloadPdf/Xml, listEvents |
| `nfe.consumerInvoiceQuery` | CFe-SAT Query | nfe.api.nfe.io | Global | ⚠️ **depreciado** — a plataforma não serve `/v1/consumerinvoices/coupon`; ambos os métodos respondem 404 |
| `nfe.legalEntityLookup` | CNPJ Lookup | legalentity.api.nfe.io | Global | getBasicInfo, getStateTaxInfo, getStateTaxForInvoice |
| `nfe.naturalPersonLookup` | CPF Lookup | naturalperson.api.nfe.io | Global | getStatus |

**Company-scoped** resources require `companyId` as the first parameter in every method. **Global** resources operate without company context.

## Core Pattern: Company-Scoped Operations

Most resources are scoped to a company. The pattern is always `resource.method(companyId, ...)`:

```typescript
// List service invoices for a company
const invoices = await nfe.serviceInvoices.list('company-uuid', {
  pageIndex: 1, // pagination is 1-based (the API rejects 0)
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

The SDK uses **two different pagination styles**, and the response shape varies by resource:

**Offset-based** (service invoices, companies, people, webhooks) — **1-based**: the first page is `pageIndex: 1`; the API rejects `pageIndex: 0` with a validation error (confirmed live for companies and service invoices):
```typescript
// Service invoices return { serviceInvoices, totalResults, totalPages, page }
const page = await nfe.serviceInvoices.list(companyId, {
  pageIndex: 1,    // 1-based page number (first page = 1)
  pageCount: 50,   // Items per page
});
page.serviceInvoices; // ServiceInvoiceData[]
page.totalResults;    // number
page.totalPages;      // number

// Companies, people and webhooks return the generic ListResponse<T>
const companies = await nfe.companies.list({ pageIndex: 1, pageCount: 50 });
companies.data;       // Company[]
companies.totalCount; // number | undefined
companies.page;       // { pageIndex, pageCount } — pageIndex is 1-based as of v5.2.0
```

> ⚠️ Version note: in `nfe-io` ≤ 5.1.x, `companies.list()` subtracted 1 from the response
> (`page.pageIndex` came back 0-based) and `listAll()`/`listIterator()` started at page 0 —
> which the API rejects, so auto-pagination (and `findByTaxNumber`/`findByName`/
> `getCompaniesWithCertificates`/`getCompaniesWithExpiringCertificates`) failed on the first
> call. Fixed in v5.2.0: 1-based on both request and response. The request was ALWAYS 1-based
> on the wire — never send `pageIndex: 0` regardless of SDK version.

**Cursor-based** (product invoices, state taxes):
```typescript
// Returns { productInvoices, hasMore }
const page = await nfe.productInvoices.list(companyId, {
  environment: 'Production',   // REQUIRED for product invoices
  limit: 25,
  startingAfter: 'last-invoice-id',  // Cursor for next page
});
page.productInvoices; // NfeProductInvoiceWithoutEvents[]
page.hasMore;         // boolean
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

// Validate before uploading (local pre-flight: format only)
const validation = await CertificateValidator.validate(certBuffer, 'password');
if (validation.valid) {
  // NOTE: the second argument is an OBJECT, not positional args.
  await nfe.companies.uploadCertificate(companyId, {
    file: certBuffer,
    password: 'password',
    filename: 'certificate.pfx',
  });
}

// Check certificate status
const status = await nfe.companies.getCertificateStatus(companyId);
console.log('Has certificate:', status.hasCertificate);
console.log('Expires:', status.expiresOn);        // from the API's `validUntil`
console.log('Active:', status.isValid);           // status === 'Active'
console.log('Raw items:', status.certificates);   // thumbprint, subject, providerType...

// A company with no certificate answers 200 with `certificates: []`, NOT 404.

// Find companies with expiring certificates — reads the `certificate` object the
// company listing already returns; no per-company request.
const expiring = await nfe.companies.getCompaniesWithExpiringCertificates(30); // 30 days
```

## Core Pattern: Webhooks

Webhooks are **account-scoped** (`/v2/webhooks`) — no `companyId`. The company-scoped
methods (`nfe.webhooks.create(companyId, ...)` etc.) are **deprecated**: the
`/v1/companies/{id}/webhooks` route 404s on the current API.

```typescript
// Create an account webhook. NFE.io PINGS the uri at creation time and requires
// a 2xx response — the endpoint must already be live. secret: 32–64 chars.
const webhook = await nfe.webhooks.createAccountWebhook({
  uri: 'https://your-app.com/webhooks/nfe',   // uri, NOT url
  contentType: 'json',
  secret: 'a-secret-with-32-to-64-characters-x',
  filters: ['service_invoice.issued_successfully', 'service_invoice.cancelled_successfully'],
});

// Other account methods: listAccountWebhooks(), retrieveAccountWebhook(id),
// updateAccountWebhook(id, data), deleteAccountWebhook(id), pingAccountWebhook(id),
// deleteAllAccountWebhooks() (⚠️ removes ALL), fetchEventTypes() (live list).

// Validate incoming webhook signature (in your handler).
// IMPORTANT: pass req.body as a Buffer (use express.raw()) — NOT JSON.stringify(req.body).
// NFE.io signs the raw body bytes; re-serializing JSON will produce different bytes.
const isValid = nfe.webhooks.validateSignature(
  req.body,                                // Buffer with exact bytes (preferred)
  req.headers['x-hub-signature'],          // X-Hub-Signature header (sha1=<UPPER hex>)
  webhook.secret!,                         // Secret from webhook creation
);
// Algorithm: HMAC-SHA1 (not SHA-256). Comparison is case-insensitive.
// Useful delivery headers: x-hook-id (idempotency key), x-hook-attempts (retry counter).
```

Event types follow `service_invoice.*` / `product_invoice.*` / `consumer_invoice.*`
patterns (e.g. `service_invoice.issued_successfully`, `service_invoice.issued_error`,
`service_invoice.cancelled_successfully`). The legacy `invoice.*` literals do NOT exist
on the live API — fetch the real list with `await nfe.webhooks.fetchEventTypes()`.

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

12. **Routes declared in the spec that the platform does not serve** (measured 2026-09-02):
    `consumerInvoiceQuery.retrieve()/downloadXml()`, `municipalTaxes.getSeries()` and
    `municipalTaxes.updatePrefecture()`. They are `@deprecated`; on `404` the SDK raises a
    `NotFoundError` whose message says the route is not served, so you do not mistake it for
    "no such record". The request still goes out — if the route comes back, the `200` passes
    through untouched.

13. **Service invoice downloads require the invoice id.** `downloadPdf(companyId)` and
    `downloadXml(companyId)` used to accept an omitted id and promised a ZIP with every
    invoice. That route never existed. `invoiceId` is now required.

14. **Product invoice PDF**: `productInvoices.downloadPdf()` returns `NfeFileResource` (object with `uri`), not a `Buffer`. Use `productInvoiceQuery.downloadPdf(accessKey)` for a raw Buffer.

## Decision Tree: "I want to..."

| Goal | Resource & Method |
|------|-------------------|
| Issue a service invoice (NFS-e) | `nfe.serviceInvoices.createAndWait(companyId, data)` |
| Issue a product invoice (NF-e) | `nfe.productInvoices.create(companyId, data)` + webhook |
| Issue NF-e with specific state tax | `nfe.productInvoices.createWithStateTax(companyId, stateTaxId, data)` |
| Query existing NF-e by access key | `nfe.productInvoiceQuery.retrieve(accessKey)` |
| Query CFe-SAT coupon by access key | ⚠️ indisponível — a rota não é servida (`nfe.consumerInvoiceQuery.retrieve()` está depreciado) |
| Receive inbound NF-e automatically | `nfe.inboundProductInvoices.enableAutoFetch(companyId)` |
| Receive inbound CT-e automatically | `nfe.transportationInvoices.enable(companyId)` |
| Look up CNPJ (company info) | `nfe.legalEntityLookup.getBasicInfo(cnpj)` |
| Look up CPF (person status) | `nfe.naturalPersonLookup.getStatus(cpf, birthDate)` |
| Look up address by CEP | `nfe.addresses.lookupByPostalCode('01310-100')` |
| Calculate Brazilian taxes | `nfe.taxCalculation.calculate(tenantId, request)` |
| Manage companies & certificates | `nfe.companies.*` |
| Manage people (PJ) under company | `nfe.legalPeople.*` |
| Manage people (PF) under company | `nfe.naturalPeople.*` |
| Set up webhook notifications | `nfe.webhooks.createAccountWebhook({ uri, secret, filters })` |
| Manage state tax registrations (IE) | `nfe.stateTaxes.*` |
| Cancel a service invoice | `nfe.serviceInvoices.cancelAndWait(companyId, invoiceId)` (async; `cancel()` retorna união discriminada) |
| Cancel a product invoice | `nfe.productInvoices.cancel(companyId, invoiceId)` |
| Download DANFE PDF | `nfe.serviceInvoices.downloadPdf(companyId, id)` or `nfe.productInvoiceQuery.downloadPdf(accessKey)` |
| Send invoice by email | `nfe.serviceInvoices.sendEmail(companyId, invoiceId)` |
| Issue correction letter (CC-e) | `nfe.productInvoices.sendCorrectionLetter(companyId, id, data)` |

## Reference Files

Load these when you need detailed method signatures, full type definitions, or specific implementation guidance:

- **`references/service-invoices-and-polling.md`** — Read when working with NFS-e service invoices, companies, people (PJ/PF), webhooks, or polling. Contains complete method signatures, PollingOptions, CreateInvoiceResponse union, FlowStatus states, and certificate management details.

- **`references/product-invoices-and-taxes.md`** — Read when working with NF-e product invoices, state tax registrations (IE), tax calculation, tax codes, CT-e, or inbound NF-e distribution. Contains cursor pagination, NfeProductInvoiceIssueData structure, TaxCalculation request/response, and manifest events.

- **`references/data-services-and-lookups.md`** — Read when working with CNPJ/CPF lookups, address/CEP lookup, NF-e/CFe-SAT query by access key. Contains LegalEntityBasicInfo structure, BrazilianState codes, the `Address` shape (postal-code lookup only), and host mapping.

- **`references/rtc-nfce-and-account-resources.md`** — Read when working with RTC issuance (`serviceInvoicesRtc`/`productInvoicesRtc`), NFC-e (`consumerInvoices`, requires `environment`), municipal tax enrollments, certificates by thumbprint, notifications, or account-scoped webhooks. Contains the v5-new resource signatures plus `cancelAndWait`/`exists`/`switchAuthorizer`.

- **`references/error-handling-and-patterns.md`** — Read when implementing error handling, retry strategies, or debugging SDK issues. Contains complete error class hierarchy, type guards, ErrorFactory, RetryConfig, and CertificateValidator.
