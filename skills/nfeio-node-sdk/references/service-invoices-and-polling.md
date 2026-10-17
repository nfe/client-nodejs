# Service Invoices, Companies, People & Webhooks

Detailed reference for the main API resources hosted at `api.nfe.io/v1`.

## ServiceInvoicesResource

Access via `nfe.serviceInvoices`. All methods are company-scoped.

### create(companyId, data): Promise<CreateInvoiceResponse>

Returns a **discriminated union** — not a raw invoice:

```typescript
type CreateInvoiceResponse =
  | { status: 'immediate'; invoice: ServiceInvoiceData }
  | { status: 'async'; response: ServiceInvoiceAsyncResponse };

interface ServiceInvoiceAsyncResponse {
  code: 202;
  status: 'pending';
  location: string;
  invoiceId: string;  // Extracted from Location header
}
```

**CreateServiceInvoiceData** key fields:
```typescript
{
  cityServiceCode: string;        // Municipal service code
  description: string;            // Service description
  servicesAmount: number;         // Total service amount
  borrower: {
    federalTaxNumber: number;     // CNPJ (14 digits) or CPF (11 digits) as NUMBER
    name: string;
    email?: string;
    address?: {
      country: string;
      postalCode: string;
      street: string;
      number: string;
      additionalInformation?: string;
      district: string;
      city: { code: string; name: string };
      state: string;
    };
  };
  // Optional fields:
  deductions?: number;
  discountConditionedAmount?: number;
  discountUnconditionedAmount?: number;
  issRate?: number;
  issTaxAmount?: number;
  irAmountWithheld?: number;
  pisAmountWithheld?: number;
  cofinsAmountWithheld?: number;
  csllAmountWithheld?: number;
  inssAmountWithheld?: number;
  issAmountWithheld?: number;
}
```

### createAndWait(companyId, data, options?): Promise<ServiceInvoiceData>

Recommended method. Creates invoice and polls until terminal state.

```typescript
interface PollingOptions {
  timeout?: number;         // Total timeout in ms (default: 120000 = 2 min)
  initialDelay?: number;    // Delay before first poll (default: 1000)
  maxDelay?: number;        // Max delay between polls (default: 10000)
  backoffFactor?: number;   // Exponential backoff multiplier (default: 1.5)
  onPoll?: (attempt: number, flowStatus: FlowStatus) => void;
}
```

Throws `PollingTimeoutError` if timeout exceeded. Throws `InvoiceProcessingError` if invoice reaches `IssueFailed` or `CancelFailed`.

### list(companyId, options?): Promise<ServiceInvoiceListResponse>

```typescript
interface ListServiceInvoicesOptions {
  pageIndex?: number;      // 1-based page — first page is 1; the API rejects 0
  pageCount?: number;      // Items per page (default: 50)
  issuedBegin?: string;    // Filter by issue date start (yyyy-MM-dd)
  issuedEnd?: string;      // Filter by issue date end
  createdBegin?: string;   // Filter by creation date start
  createdEnd?: string;     // Filter by creation date end
  hasTotals?: boolean;     // Include totals in response
}
```

Returns `{ data: ServiceInvoiceData[], totalCount: number, page: PageInfo }`.

### retrieve(companyId, invoiceId): Promise<ServiceInvoiceData>

Get a single invoice by ID.

### cancel(companyId, invoiceId): Promise<CancelInvoiceResponse>

Cancels an issued invoice. Cancellation is normally asynchronous: the API replies `202 + Location`
and the invoice moves through `WaitingSendCancel` → `Cancelled`. The result is a discriminated
union, `{ status: 'immediate', invoice }` or `{ status: 'async', response }`. Use
`cancelAndWait()` to poll until it settles.

### sendEmail(companyId, invoiceId): Promise<SendEmailResponse>

Send invoice to borrower's email. Returns `{ sent: boolean, message?: string }`.

### downloadPdf(companyId, invoiceId): Promise<Buffer>

Downloads the invoice PDF. Only available once the invoice reaches a terminal state
(Issued/Cancelled); before that the API answers 404.

### downloadXml(companyId, invoiceId): Promise<Buffer>

Downloads the NFS-e XML.

There is no batch download: `invoiceId` is required since 6.0.0. The old branch without an id
called a route the server does not have.

### getStatus(companyId, invoiceId): Promise<{ status: FlowStatus; invoice: ServiceInvoiceData; isComplete: boolean; isFailed: boolean }>

`status` is the invoice's `flowStatus`. `isComplete` is true in a terminal state, and `isFailed`
for `IssueFailed`/`CancelFailed`.

### createBatch(companyId, invoices, options?): Promise<Array<CreateInvoiceResponse | ServiceInvoiceData>>

Batch creation with optional concurrency control:
```typescript
options?: {
  waitForCompletion?: boolean;  // Use createAndWait for each
  maxConcurrent?: number;       // Parallel limit
}
```

## FlowStatus Values

| Status | Terminal | Meaning |
|--------|----------|---------|
| `Issued` | Yes | Invoice successfully issued |
| `IssueFailed` | Yes | Issuance failed |
| `Cancelled` | Yes | Successfully cancelled |
| `CancelFailed` | Yes | Cancellation failed |
| `WaitingSend` | No | Queued to send to municipality |
| `WaitingReturn` | No | Waiting for municipality response |
| `WaitingDownload` | No | Waiting to download result |
| `WaitingCalculateTaxes` | No | Tax calculation in progress |
| `WaitingDefineRpsNumber` | No | Assigning RPS number |
| `WaitingSendCancel` | No | Cancellation queued |
| `PullFromCityHall` | No | Fetching from city hall |

---

## CompaniesResource

Access via `nfe.companies`. NOT company-scoped (operates at account level).

### create(data): Promise<Company>

```typescript
// Company entity key fields
interface Company {
  id: string;
  name: string;
  tradeName?: string;
  federalTaxNumber: number;   // CNPJ (14 digits) or CPF (11 digits) as NUMBER
  email: string;
  address?: Address;
  // Auto-populated:
  createdOn?: string;
  modifiedOn?: string;
}
```

Validates CNPJ (14-digit check digit algorithm) and CPF (11-digit check digit algorithm) before sending.

### list(options?): Promise<ListResponse<Company>>

Offset pagination: `{ pageIndex: number, pageCount: number }`.

### listAll(): Promise<Company[]>

Auto-paginates through all pages. Returns complete array.

### listIterator(): AsyncIterableIterator<Company>

Async iterator for memory-efficient pagination:
```typescript
for await (const company of nfe.companies.listIterator()) {
  console.log(company.name);
}
```

### retrieve(companyId): Promise<Company>

### update(companyId, data): Promise<Company>

### remove(companyId): Promise<{ deleted: boolean; id: string }>

Named `remove()` (not `delete()`) to avoid JS keyword conflict.

### Certificate Management

```typescript
// Validate certificate before upload
const result = await nfe.companies.validateCertificate(certBuffer, password);
// result: { valid: boolean, metadata?: CertificateMetadata }

// Upload certificate to company
await nfe.companies.uploadCertificate(companyId, certBuffer, password);

// Get certificate status
const status = await nfe.companies.getCertificateStatus(companyId);
// { hasCertificate: boolean, expiresOn?: string, status?: string }

// Replace existing certificate
await nfe.companies.replaceCertificate(companyId, certBuffer, password);

// Check expiration (returns days remaining)
const exp = await nfe.companies.checkCertificateExpiration(companyId);
// { daysRemaining: number, expiresOn?: string }
```

### Search Helpers

```typescript
// Find company by CNPJ/CPF (returns null if not found)
const company = await nfe.companies.findByTaxNumber(12345678000190);

// Search by name (returns array)
const matches = await nfe.companies.findByName('Example');

// Companies with valid certificates
const withCerts = await nfe.companies.getCompaniesWithCertificates();

// Companies with expiring certificates (within N days)
const expiring = await nfe.companies.getCompaniesWithExpiringCertificates(30);
```

---

## LegalPeopleResource

Access via `nfe.legalPeople`. Company-scoped (legal entities / PJ).

All methods: `method(companyId, ...)`

```typescript
interface LegalPerson {
  id?: string;
  federalTaxNumber: string;  // CNPJ as STRING (not number)
  name: string;
  email?: string;
  address?: Address;
}
```

| Method | Signature |
|--------|-----------|
| `list` | `(companyId): Promise<ListResponse<LegalPerson>>` |
| `create` | `(companyId, data): Promise<LegalPerson>` |
| `retrieve` | `(companyId, personId): Promise<LegalPerson>` |
| `update` | `(companyId, personId, data): Promise<LegalPerson>` |
| `delete` | `(companyId, personId): Promise<void>` |
| `createBatch` | `(companyId, items[]): Promise<LegalPerson[]>` |
| `findByTaxNumber` | `(companyId, taxNumber): Promise<LegalPerson \| undefined>` |

`findByTaxNumber` returns `undefined` (not throwing `NotFoundError`) when not found.

---

## NaturalPeopleResource

Access via `nfe.naturalPeople`. Company-scoped (natural persons / PF).

Same API as LegalPeopleResource but with `NaturalPerson` type (uses CPF instead of CNPJ).

```typescript
interface NaturalPerson {
  id?: string;
  federalTaxNumber: string;  // CPF as STRING
  name: string;
  email?: string;
  address?: Address;
}
```

---

## WebhooksResource

Access via `nfe.webhooks`.

> ⚠️ **The company-scoped methods are deprecated: the platform does not serve the route.**
> `list`, `create`, `retrieve`, `update`, `delete` and `test` call `/v1/companies/{id}/webhooks`,
> which answers 404 (deprecated since v5.1, confirmed on three accounts). Use the account-scoped
> methods (`createAccountWebhook`, `listAccountWebhooks`, `retrieveAccountWebhook`,
> `updateAccountWebhook`, `deleteAccountWebhook`, `deleteAllAccountWebhooks`,
> `pingAccountWebhook`), documented in `references/rtc-nfce-and-account-resources.md`. The
> `Webhook` and `WebhookEvent` types describe shapes the API rejects: use `AccountWebhook` and
> `WebhookEventType` (e.g. `'service_invoice.issued_successfully'`).

| Method | Signature |
|--------|-----------|
| `list` | `(companyId): Promise<ListResponse<Webhook>>`: deprecated, route not served |
| `create` | `(companyId, data): Promise<Webhook>`: deprecated, route not served |
| `retrieve` | `(companyId, webhookId): Promise<Webhook>`: deprecated, route not served |
| `update` | `(companyId, webhookId, data): Promise<Webhook>`: deprecated, route not served |
| `delete` | `(companyId, webhookId): Promise<void>`: deprecated, route not served |
| `test` | `(companyId, webhookId): Promise<{ success: boolean; message?: string }>`: deprecated, route not served |
| `validateSignature` | `(payload: Buffer \| string, signature: string \| string[] \| undefined, secret): boolean` |
| `getAvailableEvents` | `(): WebhookEvent[]`: deprecated, a fixed list that drifts; use `fetchEventTypes()` |

### Webhook Signature Validation

NFE.io signs every webhook delivery with `HMAC-SHA1(secret, raw_body_bytes)`, encoded as
**uppercase hex** with a `sha1=` prefix, and delivers it in the **`X-Hub-Signature`** header.

```typescript
import express from 'express';

// IMPORTANT: use express.raw() so req.body is a Buffer with the EXACT bytes
// NFE.io signed. JSON.stringify(req.body) will NOT match — property order and
// whitespace differ from what was signed.
app.post('/webhooks/nfe', express.raw({ type: '*/*' }), (req, res) => {
  const ok = nfe.webhooks.validateSignature(
    req.body,                              // Buffer with exact bytes
    req.headers['x-hub-signature'],        // header value (string | string[] | undefined)
    process.env.NFE_WEBHOOK_SECRET ?? '',
  );
  if (!ok) return res.status(401).end();

  const event = JSON.parse(req.body.toString('utf8'));
  // Handle event...
  res.status(204).end();
});
```

**Notes:**
- Algorithm: HMAC-SHA1 (not SHA-256). The wire format is `sha1=<40 hex chars>`.
- Case: NFE.io sends hex in UPPERCASE; `validateSignature` compares case-insensitively.
- Useful headers also delivered: `X-Hook-Id` (UUID per delivery — ideal for idempotency),
  `X-Hook-Attempts` (retry counter, starts at 0), `Content-MD5` (base64 MD5 of body).
- `validateSignature` never throws; it returns `false` for any malformed input.
