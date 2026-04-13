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
  pageIndex?: number;      // 0-based page (default: 0)
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

### cancel(companyId, invoiceId): Promise<ServiceInvoiceData>

Cancel an issued invoice. May return async (some municipalities process cancellation asynchronously).

### sendEmail(companyId, invoiceId): Promise<SendEmailResponse>

Send invoice to borrower's email. Returns `{ sent: boolean, message?: string }`.

### downloadPdf(companyId, invoiceId?): Promise<Buffer>

Download DANFE PDF. If `invoiceId` is omitted, downloads a ZIP of all invoices for the company.

### downloadXml(companyId, invoiceId?): Promise<Buffer>

Download RPS XML. Same ZIP behavior when `invoiceId` is omitted.

### getStatus(companyId, invoiceId): Promise<StatusResponse>

Returns `{ flowStatus: FlowStatus, invoice: ServiceInvoiceData, isComplete: boolean, isFailed: boolean }`.

### createBatch(companyId, invoices, options?): Promise<Array<...>>

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

Access via `nfe.webhooks`. Company-scoped.

```typescript
interface Webhook {
  id?: string;
  url: string;
  events: WebhookEvent[];
  active?: boolean;
  secret?: string;
  createdOn?: string;
  modifiedOn?: string;
}

type WebhookEvent =
  | 'invoice.created'
  | 'invoice.issued'
  | 'invoice.cancelled'
  | 'invoice.failed';
```

| Method | Signature |
|--------|-----------|
| `list` | `(companyId): Promise<ListResponse<Webhook>>` |
| `create` | `(companyId, data): Promise<Webhook>` |
| `retrieve` | `(companyId, webhookId): Promise<Webhook>` |
| `update` | `(companyId, webhookId, data): Promise<Webhook>` |
| `delete` | `(companyId, webhookId): Promise<void>` |
| `validateSignature` | `(payload, signature, secret): boolean` |
| `test` | `(companyId, webhookId): Promise<{ success: boolean }>` |
| `getAvailableEvents` | `(): WebhookEvent[]` |

### Webhook Signature Validation

In your webhook handler, validate the `X-Hub-Signature` header:

```typescript
app.post('/webhooks/nfe', (req, res) => {
  const signature = req.headers['x-hub-signature'] as string;
  const rawBody = req.body; // raw string, not parsed JSON
  
  const isValid = nfe.webhooks.validateSignature(rawBody, signature, webhookSecret);
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = JSON.parse(rawBody);
  // Handle event...
  res.status(200).send('OK');
});
```

Uses HMAC-SHA1 for signature verification.
