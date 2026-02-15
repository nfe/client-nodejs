# NFE.io SDK v3 - API Reference

Complete API reference for the NFE.io Node.js SDK v3.

## Table of Contents

- [Installation](#installation)
- [Client](#client)
  - [Constructor](#constructor)
  - [Configuration](#configuration)
  - [Utility Methods](#utility-methods)
- [Resources](#resources)
  - [Service Invoices](#service-invoices)
  - [Companies](#companies)
  - [Legal People](#legal-people)
  - [Natural People](#natural-people)
  - [Webhooks](#webhooks)
  - [Transportation Invoices (CT-e)](#transportation-invoices-ct-e)
  - [Inbound Product Invoices (NF-e Distribuição)](#inbound-product-invoices-nf-e-distribuição)
  - [Product Invoice Query (Consulta NF-e)](#product-invoice-query-consulta-nf-e)
  - [Consumer Invoice Query (Consulta CFe-SAT)](#consumer-invoice-query-consulta-cfe-sat)
  - [Legal Entity Lookup (Consulta CNPJ)](#legal-entity-lookup-consulta-cnpj)
  - [Natural Person Lookup (Consulta CPF)](#natural-person-lookup-consulta-cpf)
  - [Tax Calculation (Cálculo de Impostos)](#tax-calculation-cálculo-de-impostos)
  - [Tax Codes (Códigos Auxiliares)](#tax-codes-códigos-auxiliares)
- [Types](#types)
- [Error Handling](#error-handling)
- [Advanced Usage](#advanced-usage)

## Installation

```bash
npm install nfe-io
```

## Client

### Constructor

```typescript
new NfeClient(config: NfeConfig): NfeClient
```

Creates a new NFE.io API client instance.

**Parameters:**

- `config` - Client configuration object

**Configuration Options:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `apiKey` | `string` | Yes* | `process.env.NFE_API_KEY` | NFE.io API key |
| `environment` | `'production' \| 'development'` | No | `'production'` | API environment (both use same endpoint: `https://api.nfe.io/v1`) |
| `baseUrl` | `string` | No | Auto-detected | Custom API base URL |
| `timeout` | `number` | No | `30000` | Request timeout in ms |
| `retryConfig` | `RetryConfig` | No | See below | Retry configuration |

\* API key is required but can be provided via `NFE_API_KEY` environment variable.

**Retry Configuration:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxRetries` | `number` | `3` | Maximum retry attempts |
| `baseDelay` | `number` | `1000` | Initial delay in ms |
| `maxDelay` | `number` | `30000` | Maximum delay in ms |
| `retryableStatuses` | `number[]` | `[408, 429, 500, 502, 503]` | HTTP status codes to retry |

**Examples:**

```typescript
// Basic usage
const nfe = new NfeClient({
  apiKey: 'your-api-key',
  environment: 'production'
});

// With environment variable
// Set NFE_API_KEY=your-api-key
const nfe = new NfeClient({
  environment: 'production'
});

// Custom configuration
const nfe = new NfeClient({
  apiKey: 'your-api-key',
  timeout: 60000,
  retryConfig: {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 60000
  }
});
```

### Configuration

#### `updateConfig(newConfig: Partial<NfeConfig>): void`

Update client configuration dynamically.

```typescript
nfe.updateConfig({
  environment: 'development',
  timeout: 60000
});
```

#### `setTimeout(timeout: number): void`

Set request timeout in milliseconds. (v2 compatibility)

```typescript
nfe.setTimeout(60000); // 60 seconds
```

#### `setApiKey(apiKey: string): void`

Set or update API key. (v2 compatibility)

```typescript
nfe.setApiKey('new-api-key');
```

#### `getConfig(): Readonly<RequiredNfeConfig>`

Get current client configuration.

```typescript
const config = nfe.getConfig();
console.log('Environment:', config.environment);
```

### Utility Methods

#### `pollUntilComplete<T>(locationUrl: string, options?: PollOptions): Promise<T>`

Poll a resource URL until it completes processing.

**Parameters:**

- `locationUrl` - URL or path to poll
- `options` - Polling configuration
  - `maxAttempts` (default: `30`) - Maximum polling attempts
  - `intervalMs` (default: `2000`) - Delay between attempts in ms

**Returns:** Promise resolving to the completed resource

**Example:**

```typescript
const result = await nfe.serviceInvoices.create(companyId, data);

if (result.status === 'pending') {
  const invoice = await nfe.pollUntilComplete(result.location, {
    maxAttempts: 60,
    intervalMs: 3000
  });
}
```

#### `healthCheck(): Promise<{ status: 'ok' | 'error', details?: any }>`

Check API connectivity and authentication.

```typescript
const health = await nfe.healthCheck();

if (health.status === 'ok') {
  console.log('API connection successful');
} else {
  console.error('API error:', health.details);
}
```

#### `getClientInfo(): ClientInfo`

Get client diagnostic information.

```typescript
const info = nfe.getClientInfo();
console.log('SDK Version:', info.version);
console.log('Node Version:', info.nodeVersion);
console.log('Environment:', info.environment);
```

## Resources

All resources follow a consistent pattern with standard CRUD operations plus resource-specific methods.

### Service Invoices

**Resource:** `nfe.serviceInvoices`

Complete service invoice (NFS-e) operations including creation, retrieval, email delivery, document downloads, and cancellation. Supports both synchronous and asynchronous invoice processing with automatic polling capabilities.

---

#### Core Operations

##### `create(companyId: string, data: ServiceInvoiceData): Promise<ServiceInvoiceCreateResult>`

Create a new service invoice. Returns either a completed invoice (201) or async processing result (202).

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | `string` | Company ID issuing the invoice |
| `data` | `ServiceInvoiceData` | Invoice data (see structure below) |

**Returns:** `Promise<ServiceInvoiceCreateResult>` - Discriminated union:
- **201 Created (Synchronous)**: Returns complete `ServiceInvoice` with `id`, `number`, `status`
- **202 Accepted (Asynchronous)**: Returns `{ flowStatus, flowMessage?, location? }` for polling

**Invoice Data Structure:**

```typescript
interface ServiceInvoiceData {
  // Required fields
  borrower: {
    federalTaxNumber: number;        // CPF (11 digits) or CNPJ (14 digits)
    name: string;
    email?: string;
    address?: {
      country: string;                // 'BRA'
      postalCode: string;             // CEP: '01310-100'
      street: string;
      number: string;
      additionalInformation?: string;
      district: string;
      city: {
        code: string;                  // IBGE code: '3550308'
        name: string;
      };
      state: string;                   // UF: 'SP'
    };
  };
  cityServiceCode: string;             // Municipal service code
  description: string;                 // Service description
  servicesAmount: number;              // Amount in BRL (e.g., 1500.00)

  // Optional fields
  rpsSerialNumber?: string;            // RPS series
  rpsNumber?: number;                  // RPS number
  issuedOn?: string;                   // ISO date: '2024-01-15'
  deductions?: number;                 // Deductions amount
  discountUnconditioned?: number;      // Unconditional discount
  discountConditioned?: number;        // Conditional discount
  taxes?: {
    retainIss?: boolean;
    iss?: number;
    pis?: number;
    cofins?: number;
    inss?: number;
    ir?: number;
    csll?: number;
  };
}
```

**Examples:**

```typescript
// Example 1: Basic invoice creation (may be sync or async)
const result = await nfe.serviceInvoices.create('company-id', {
  borrower: {
    federalTaxNumber: 12345678901,
    name: 'João da Silva',
    email: 'joao@example.com',
  },
  cityServiceCode: '10677',
  description: 'Consulting services',
  servicesAmount: 1500.00,
});

// Check if synchronous (201) or asynchronous (202)
if ('id' in result) {
  // Synchronous - invoice issued immediately
  console.log('Invoice issued:', result.number);
  console.log('Status:', result.status);
} else {
  // Asynchronous - needs polling
  console.log('Processing:', result.flowStatus);
  console.log('Poll URL:', result.location);
  
  // Use pollUntilComplete or createAndWait instead
  const invoice = await nfe.pollUntilComplete(result.location, {
    intervalMs: 2000,
    timeoutMs: 60000,
  });
  console.log('Invoice issued:', invoice.number);
}

// Example 2: Invoice with full details
const invoice = await nfe.serviceInvoices.create('company-id', {
  borrower: {
    federalTaxNumber: 12345678000190,
    name: 'Acme Corporation',
    email: 'finance@acme.com',
    address: {
      country: 'BRA',
      postalCode: '01310-100',
      street: 'Av. Paulista',
      number: '1578',
      district: 'Bela Vista',
      city: {
        code: '3550308',
        name: 'São Paulo',
      },
      state: 'SP',
    },
  },
  cityServiceCode: '01234',
  description: 'Software development services',
  servicesAmount: 5000.00,
  rpsSerialNumber: 'A',
  rpsNumber: 123,
  deductions: 100.00,
  taxes: {
    retainIss: false,
    iss: 5.0, // 5%
  },
});
```

**Error Handling:**

- `ValidationError` (400): Invalid invoice data
- `AuthenticationError` (401): Invalid API key
- `NotFoundError` (404): Company not found
- `InternalError` (500): Server error

```typescript
try {
  const result = await nfe.serviceInvoices.create(companyId, data);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid data:', error.message);
  } else if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  }
}
```

---

##### `createAndWait(companyId: string, data: ServiceInvoiceData, options?: WaitOptions): Promise<ServiceInvoice>`

**⭐ Recommended**: Create invoice with automatic polling for async processing. Simplifies async workflow.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | `string` | Company ID |
| `data` | `ServiceInvoiceData` | Invoice data |
| `options` | `WaitOptions` | Polling configuration (optional) |

**Wait Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pollingInterval` | `number` | `2000` | Delay between status checks (ms) |
| `maxWaitTime` | `number` | `60000` | Maximum wait time (ms) |

**Returns:** `Promise<ServiceInvoice>` - Completed invoice with `id`, `number`, `status: 'Issued'`

**Examples:**

```typescript
// Example 1: Simple usage (recommended)
const invoice = await nfe.serviceInvoices.createAndWait('company-id', {
  borrower: {
    federalTaxNumber: 12345678901,
    name: 'João da Silva',
    email: 'joao@example.com',
  },
  cityServiceCode: '10677',
  description: 'Consulting services',
  servicesAmount: 1500.00,
});

console.log('Invoice issued:', invoice.number);
console.log('Status:', invoice.status); // 'Issued'

// Example 2: Custom polling configuration
const invoice = await nfe.serviceInvoices.createAndWait('company-id', data, {
  pollingInterval: 3000,  // Check every 3 seconds
  maxWaitTime: 120000,    // Wait up to 2 minutes
});

// Example 3: With error handling
try {
  const invoice = await nfe.serviceInvoices.createAndWait('company-id', data, {
    maxWaitTime: 60000,
  });
  
  console.log('✅ Invoice issued successfully');
  console.log(`   Number: ${invoice.number}`);
  console.log(`   Amount: R$ ${invoice.servicesAmount}`);
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('⏱️  Invoice processing timeout - may complete later');
  } else if (error.message.includes('failed')) {
    console.error('❌ Invoice processing failed:', error.message);
  }
}
```

**When to use:**
- ✅ You want immediate invoice results without manual polling
- ✅ You can wait 5-30 seconds for processing
- ✅ Simple workflows where async complexity isn't needed

**When NOT to use:**
- ❌ Background job processing (use `create()` + queue)
- ❌ Batch operations (use `createBatch()`)
- ❌ Need to track processing separately

---

##### `list(companyId: string, options?: ListOptions): Promise<ServiceInvoice[]>`

List service invoices for a company with pagination and filtering.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | `string` | Company ID |
| `options` | `ListOptions` | Filtering and pagination (optional) |

**List Options:**

| Option | Type | Description |
|--------|------|-------------|
| `pageCount` | `number` | Items per page (default: 25) |
| `pageIndex` | `number` | Page number, 0-indexed (default: 0) |
| `searchPeriod` | `object` | Date range filter |
| `searchPeriod.startDate` | `string` | Start date: 'YYYY-MM-DD' |
| `searchPeriod.endDate` | `string` | End date: 'YYYY-MM-DD' |

**Returns:** `Promise<ServiceInvoice[]>` - Array of invoices

**Examples:**

```typescript
// Example 1: List all (first page)
const invoices = await nfe.serviceInvoices.list('company-id');
console.log(`Found ${invoices.length} invoices`);

// Example 2: Pagination
const page2 = await nfe.serviceInvoices.list('company-id', {
  pageCount: 50,   // 50 per page
  pageIndex: 1,    // Second page (0-indexed)
});

// Example 3: Date filtering
const lastMonth = await nfe.serviceInvoices.list('company-id', {
  searchPeriod: {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
  pageCount: 100,
});

// Example 4: Process all invoices
let pageIndex = 0;
let allInvoices = [];

while (true) {
  const page = await nfe.serviceInvoices.list('company-id', {
    pageCount: 100,
    pageIndex,
  });
  
  allInvoices.push(...page);
  
  if (page.length < 100) break; // Last page
  pageIndex++;
}

console.log(`Total invoices: ${allInvoices.length}`);

// Example 5: Find specific invoices
const recentHighValue = await nfe.serviceInvoices.list('company-id', {
  searchPeriod: {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
});

const filtered = recentHighValue.filter(inv => inv.servicesAmount > 5000);
console.log(`High-value invoices: ${filtered.length}`);
```

---

##### `retrieve(companyId: string, invoiceId: string): Promise<ServiceInvoice>`

Get a specific service invoice by ID with complete details.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | `string` | Company ID |
| `invoiceId` | `string` | Invoice ID |

**Returns:** `Promise<ServiceInvoice>` - Complete invoice object

**Examples:**

```typescript
// Example 1: Basic retrieval
const invoice = await nfe.serviceInvoices.retrieve('company-id', 'invoice-id');

console.log('Invoice:', invoice.number);
console.log('Amount:', invoice.servicesAmount);
console.log('Status:', invoice.status);
console.log('Issued:', invoice.issuedOn);

// Example 2: Check invoice details
const invoice = await nfe.serviceInvoices.retrieve('company-id', 'invoice-id');

console.log('Borrower:', invoice.borrower.name);
console.log('Service:', invoice.description);
console.log('Tax Amount:', invoice.taxes?.iss || 0);

// Example 3: Verify invoice exists before operation
async function sendInvoiceIfExists(companyId, invoiceId) {
  try {
    const invoice = await nfe.serviceInvoices.retrieve(companyId, invoiceId);
    
    if (invoice.status === 'Issued') {
      await nfe.serviceInvoices.sendEmail(companyId, invoiceId, {
        emails: [invoice.borrower.email],
      });
      console.log('Email sent successfully');
    } else {
      console.log('Invoice not ready:', invoice.status);
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.error('Invoice not found');
    }
  }
}
```

**Error Handling:**

- `NotFoundError` (404): Invoice or company not found
- `AuthenticationError` (401): Invalid API key

---

##### `getStatus(companyId: string, invoiceId: string): Promise<InvoiceStatus>`

Check invoice processing status (useful for async invoices).

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | `string` | Company ID |
| `invoiceId` | `string` | Invoice ID |

**Returns:** `Promise<InvoiceStatus>` with:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | Current status (see status values below) |
| `isComplete` | `boolean` | `true` if processing finished (success or failure) |
| `isFailed` | `boolean` | `true` if processing failed |

**Status Values:**

| Status | isComplete | isFailed | Description |
|--------|-----------|----------|-------------|
| `Issued` | `true` | `false` | ✅ Invoice issued successfully |
| `IssueFailed` | `true` | `true` | ❌ Issuance failed |
| `Cancelled` | `true` | `false` | 🚫 Invoice cancelled |
| `CancellationFailed` | `true` | `true` | ❌ Cancellation failed |
| `WaitingSend` | `false` | `false` | ⏳ Pending |
| `WaitingSendAuthorize` | `false` | `false` | ⏳ Awaiting authorization |
| `Processing` | `false` | `false` | ⏳ Processing |

**Examples:**

```typescript
// Example 1: Simple status check
const status = await nfe.serviceInvoices.getStatus('company-id', 'invoice-id');

console.log('Status:', status.status);
console.log('Complete:', status.isComplete ? 'Yes' : 'No');
console.log('Failed:', status.isFailed ? 'Yes' : 'No');

// Example 2: Manual polling loop
async function waitForInvoice(companyId, invoiceId, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await nfe.serviceInvoices.getStatus(companyId, invoiceId);
    
    if (status.isComplete) {
      if (status.isFailed) {
        throw new Error(`Invoice processing failed: ${status.status}`);
      }
      
      console.log('Invoice complete:', status.status);
      return await nfe.serviceInvoices.retrieve(companyId, invoiceId);
    }
    
    console.log(`Attempt ${i + 1}: ${status.status}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Polling timeout');
}

// Example 3: Status-based logic
const status = await nfe.serviceInvoices.getStatus('company-id', 'invoice-id');

if (status.status === 'Issued') {
  console.log('✅ Ready to send email');
  await nfe.serviceInvoices.sendEmail(/* ... */);
} else if (status.isFailed) {
  console.error('❌ Failed:', status.status);
} else {
  console.log('⏳ Still processing:', status.status);
}
```

---

##### `cancel(companyId: string, invoiceId: string): Promise<ServiceInvoice>`

Cancel an issued service invoice.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | `string` | Company ID |
| `invoiceId` | `string` | Invoice ID to cancel |

**Returns:** `Promise<ServiceInvoice>` - Cancelled invoice with `status: 'Cancelled'`

**Examples:**

```typescript
// Example 1: Simple cancellation
const cancelled = await nfe.serviceInvoices.cancel('company-id', 'invoice-id');
console.log('Status:', cancelled.status); // 'Cancelled'

// Example 2: Conditional cancellation
const invoice = await nfe.serviceInvoices.retrieve('company-id', 'invoice-id');

if (invoice.status === 'Issued') {
  const cancelled = await nfe.serviceInvoices.cancel('company-id', 'invoice-id');
  console.log('✅ Invoice cancelled');
} else {
  console.log('⚠️  Invoice cannot be cancelled:', invoice.status);
}

// Example 3: Batch cancellation with error handling
const invoiceIds = ['id-1', 'id-2', 'id-3'];

for (const invoiceId of invoiceIds) {
  try {
    await nfe.serviceInvoices.cancel('company-id', invoiceId);
    console.log(`✅ Cancelled: ${invoiceId}`);
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.log(`⚠️  Not found: ${invoiceId}`);
    } else {
      console.error(`❌ Error cancelling ${invoiceId}:`, error.message);
    }
  }
}
```

**Error Handling:**

- `NotFoundError` (404): Invoice not found
- `ValidationError` (400): Invoice cannot be cancelled (already cancelled, etc.)

---

#### Email & Downloads

##### `sendEmail(companyId: string, invoiceId: string, options: SendEmailOptions): Promise<void>`

Send invoice via email to specified recipients.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | `string` | Company ID |
| `invoiceId` | `string` | Invoice ID |
| `options` | `SendEmailOptions` | Email configuration |

**Email Options:**

| Field | Type | Description |
|-------|------|-------------|
| `emails` | `string[]` | Recipient email addresses |

**Examples:**

```typescript
// Example 1: Send to single recipient
await nfe.serviceInvoices.sendEmail('company-id', 'invoice-id', {
  emails: ['client@example.com'],
});

console.log('✅ Email sent');

// Example 2: Send to multiple recipients
await nfe.serviceInvoices.sendEmail('company-id', 'invoice-id', {
  emails: [
    'client@example.com',
    'finance@example.com',
    'accounting@example.com',
  ],
});

// Example 3: Send after invoice creation
const invoice = await nfe.serviceInvoices.createAndWait('company-id', data);

await nfe.serviceInvoices.sendEmail('company-id', invoice.id, {
  emails: [invoice.borrower.email],
});

console.log(`Email sent to ${invoice.borrower.email}`);

// Example 4: Bulk email sending
const invoices = await nfe.serviceInvoices.list('company-id');

for (const invoice of invoices) {
  if (invoice.status === 'Issued' && invoice.borrower.email) {
    try {
      await nfe.serviceInvoices.sendEmail('company-id', invoice.id, {
        emails: [invoice.borrower.email],
      });
      console.log(`✅ Sent: ${invoice.number}`);
    } catch (error) {
      console.error(`❌ Failed ${invoice.number}:`, error.message);
    }
  }
}
```

---

##### `downloadPdf(companyId: string, invoiceId?: string): Promise<Buffer>`

Download invoice PDF. If `invoiceId` is omitted, downloads all invoices as ZIP.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | `string` | Company ID |
| `invoiceId` | `string` | Invoice ID (optional - omit for bulk ZIP) |

**Returns:** `Promise<Buffer>` - PDF file as Buffer (or ZIP for bulk)

**Examples:**

```typescript
import { writeFileSync } from 'fs';

// Example 1: Download single invoice PDF
const pdfBuffer = await nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id');

// Validate PDF signature
if (pdfBuffer.toString('utf8', 0, 4) === '%PDF') {
  console.log('✅ Valid PDF');
}

// Save to file
writeFileSync('invoice.pdf', pdfBuffer);
console.log('Saved invoice.pdf');

// Example 2: Download all invoices as ZIP
const zipBuffer = await nfe.serviceInvoices.downloadPdf('company-id');

writeFileSync(`invoices_${Date.now()}.zip`, zipBuffer);
console.log('Saved ZIP with all invoices');

// Example 3: Download and send via HTTP response (Express)
app.get('/invoice/:id/pdf', async (req, res) => {
  try {
    const pdfBuffer = await nfe.serviceInvoices.downloadPdf(
      req.user.companyId,
      req.params.id
    );
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${req.params.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(404).json({ error: 'Invoice not found' });
  }
});

// Example 4: Download after creation
const invoice = await nfe.serviceInvoices.createAndWait('company-id', data);

const pdf = await nfe.serviceInvoices.downloadPdf('company-id', invoice.id);
writeFileSync(`invoice_${invoice.number}.pdf`, pdf);
console.log(`Downloaded invoice ${invoice.number}`);
```

**Error Handling:**

- `NotFoundError` (404): Invoice not ready or not found

---

##### `downloadXml(companyId: string, invoiceId?: string): Promise<Buffer>`

Download invoice XML. If `invoiceId` is omitted, downloads all invoices as ZIP.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | `string` | Company ID |
| `invoiceId` | `string` | Invoice ID (optional - omit for bulk ZIP) |

**Returns:** `Promise<Buffer>` - XML file as Buffer (or ZIP for bulk)

**Examples:**

```typescript
import { writeFileSync } from 'fs';

// Example 1: Download single invoice XML
const xmlBuffer = await nfe.serviceInvoices.downloadXml('company-id', 'invoice-id');

// Convert Buffer to string
const xmlString = xmlBuffer.toString('utf8');
console.log('XML preview:', xmlString.substring(0, 100));

// Validate XML signature
if (xmlString.startsWith('<?xml')) {
  console.log('✅ Valid XML');
}

// Save to file
writeFileSync('invoice.xml', xmlBuffer);

// Example 2: Download all invoices as ZIP
const zipBuffer = await nfe.serviceInvoices.downloadXml('company-id');
writeFileSync(`invoices_xml_${Date.now()}.zip`, zipBuffer);

// Example 3: Parse XML for integration
import { parseString } from 'xml2js';

const xmlBuffer = await nfe.serviceInvoices.downloadXml('company-id', 'invoice-id');
const xmlString = xmlBuffer.toString('utf8');

parseString(xmlString, (err, result) => {
  if (err) throw err;
  console.log('Parsed XML:', result);
  // Process structured data
});

// Example 4: Bulk download and extract
const zipBuffer = await nfe.serviceInvoices.downloadXml('company-id');
writeFileSync('invoices.zip', zipBuffer);

// Extract ZIP using library like 'adm-zip'
// const AdmZip = require('adm-zip');
// const zip = new AdmZip(zipBuffer);
// zip.extractAllTo('./invoices/', true);
```

---

#### Advanced Operations

##### `createBatch(companyId: string, invoicesData: ServiceInvoiceData[], options?: BatchOptions): Promise<ServiceInvoice[]>`

Create multiple invoices concurrently with concurrency control.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | `string` | Company ID |
| `invoicesData` | `ServiceInvoiceData[]` | Array of invoice data |
| `options` | `BatchOptions` | Batch configuration (optional) |

**Batch Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `waitForComplete` | `boolean` | `true` | Wait for all invoices to complete processing |
| `maxConcurrent` | `number` | `5` | Maximum concurrent requests |
| `pollingInterval` | `number` | `2000` | Polling interval in ms (if waitForComplete=true) |
| `maxWaitTime` | `number` | `60000` | Max wait time per invoice in ms |

**Returns:** `Promise<ServiceInvoice[]>` - Array of created invoices

**Examples:**

```typescript
// Example 1: Basic batch creation
const invoicesData = [
  {
    borrower: { federalTaxNumber: 111, name: 'Client 1', email: 'client1@example.com' },
    cityServiceCode: '10677',
    description: 'Service 1',
    servicesAmount: 1000,
  },
  {
    borrower: { federalTaxNumber: 222, name: 'Client 2', email: 'client2@example.com' },
    cityServiceCode: '10677',
    description: 'Service 2',
    servicesAmount: 2000,
  },
  {
    borrower: { federalTaxNumber: 333, name: 'Client 3', email: 'client3@example.com' },
    cityServiceCode: '10677',
    description: 'Service 3',
    servicesAmount: 3000,
  },
];

const invoices = await nfe.serviceInvoices.createBatch('company-id', invoicesData);

console.log(`Created ${invoices.length} invoices`);
invoices.forEach(inv => console.log(`- ${inv.number}: R$ ${inv.servicesAmount}`));

// Example 2: Custom concurrency
const invoices = await nfe.serviceInvoices.createBatch('company-id', invoicesData, {
  maxConcurrent: 3,      // Process 3 at a time
  waitForComplete: true, // Wait for all to finish
});

// Example 3: Batch without waiting (fire and forget)
const results = await nfe.serviceInvoices.createBatch('company-id', invoicesData, {
  waitForComplete: false, // Don't wait for async processing
  maxConcurrent: 10,
});

// Results may contain async processing info (location, flowStatus)
results.forEach(result => {
  if ('id' in result) {
    console.log(`Issued: ${result.id}`);
  } else {
    console.log(`Processing: ${result.location}`);
  }
});

// Example 4: Read from CSV and batch create
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

const csv = readFileSync('invoices.csv', 'utf8');
const records = parse(csv, { columns: true });

const invoicesData = records.map(row => ({
  borrower: {
    federalTaxNumber: parseInt(row.cpf),
    name: row.name,
    email: row.email,
  },
  cityServiceCode: row.serviceCode,
  description: row.description,
  servicesAmount: parseFloat(row.amount),
}));

console.log(`Creating ${invoicesData.length} invoices from CSV...`);

const invoices = await nfe.serviceInvoices.createBatch('company-id', invoicesData, {
  maxConcurrent: 5,
  waitForComplete: true,
});

console.log(`✅ Created ${invoices.length} invoices`);

// Example 5: Error handling in batch
try {
  const invoices = await nfe.serviceInvoices.createBatch('company-id', invoicesData);
  console.log('All succeeded');
} catch (error) {
  console.error('Batch creation failed:', error.message);
  // Note: Some invoices may have been created successfully
  // Check partial results if needed
}
```

**Performance Notes:**

- Default concurrency (5) is safe for most APIs
- Increase `maxConcurrent` carefully to avoid rate limiting
- Large batches (>100 invoices) should be split into chunks
- Use `waitForComplete: false` for background processing

---

#### Type Reference

**ServiceInvoice:**

```typescript
interface ServiceInvoice {
  id: string;
  number?: string;
  status: 'Issued' | 'Cancelled' | 'Processing' | 'IssueFailed';
  flowStatus?: string;
  flowMessage?: string;
  borrower: {
    federalTaxNumber: number;
    name: string;
    email?: string;
    address?: Address;
  };
  cityServiceCode: string;
  description: string;
  servicesAmount: number;
  deductions?: number;
  discountUnconditioned?: number;
  discountConditioned?: number;
  issuedOn?: string;
  rpsSerialNumber?: string;
  rpsNumber?: number;
  taxes?: {
    retainIss?: boolean;
    iss?: number;
    pis?: number;
    cofins?: number;
    inss?: number;
    ir?: number;
    csll?: number;
  };
}
```

---

### Companies

**Resource:** `nfe.companies`

Company management operations including CRUD, certificate management, and search capabilities.

#### Core CRUD Operations

##### `create(data: Omit<Company, 'id' | 'createdOn' | 'modifiedOn'>): Promise<Company>`

Create a new company with automatic CNPJ/CPF validation.

```typescript
const company = await nfe.companies.create({
  federalTaxNumber: 12345678000190, // CNPJ (14 digits) or CPF (11 digits)
  name: 'My Company',
  email: 'company@example.com',
  address: {
    country: 'BRA',
    postalCode: '01310-100',
    street: 'Av. Paulista',
    number: '1000',
    city: {
      code: '3550308',
      name: 'São Paulo'
    },
    state: 'SP'
  }
});
```

##### `list(options?: PaginationOptions): Promise<ListResponse<Company>>`

List companies with pagination.

```typescript
const companies = await nfe.companies.list({
  pageCount: 20,
  pageIndex: 0
});
```

##### `listAll(): Promise<Company[]>`

Get all companies (auto-pagination).

```typescript
// Automatically fetches all pages
const allCompanies = await nfe.companies.listAll();
console.log(`Total: ${allCompanies.length} companies`);
```

##### `listIterator(): AsyncIterableIterator<Company>`

Memory-efficient streaming of companies.

```typescript
// Process companies one at a time
for await (const company of nfe.companies.listIterator()) {
  console.log(company.name);
  // Process company...
}
```

##### `retrieve(companyId: string): Promise<Company>`

Get a specific company by ID.

```typescript
const company = await nfe.companies.retrieve('company-id');
console.log(company.name);
```

##### `update(companyId: string, data: Partial<Company>): Promise<Company>`

Update company information with validation.

```typescript
const updated = await nfe.companies.update('company-id', {
  name: 'New Company Name',
  email: 'newemail@example.com'
});
```

##### `remove(companyId: string): Promise<{ deleted: boolean; id: string }>`

Delete a company (named `remove` to avoid JS keyword conflict).

```typescript
const result = await nfe.companies.remove('company-id');
console.log(`Deleted: ${result.deleted}`);
```

#### Certificate Management

##### `validateCertificate(file: Buffer, password: string): Promise<CertificateValidationResult>`

Pre-validate a certificate before upload.

```typescript
import { readFile } from 'fs/promises';

const certBuffer = await readFile('./certificate.pfx');
const validation = await nfe.companies.validateCertificate(certBuffer, 'password');

if (validation.valid) {
  console.log('Valid until:', validation.metadata?.validTo);
} else {
  console.error('Invalid:', validation.error);
}
```

##### `uploadCertificate(companyId: string, data: CertificateData): Promise<{ uploaded: boolean; message?: string }>`

Upload digital certificate with automatic validation.

```typescript
import { readFile } from 'fs/promises';

const certBuffer = await readFile('./certificate.pfx');

const result = await nfe.companies.uploadCertificate('company-id', {
  file: certBuffer,
  password: 'certificate-password',
  filename: 'certificate.pfx' // Optional
});

console.log(result.message);
```

##### `getCertificateStatus(companyId: string): Promise<CertificateStatus>`

Get certificate status with expiration calculation.

```typescript
const status = await nfe.companies.getCertificateStatus('company-id');

console.log('Has certificate:', status.hasCertificate);
console.log('Expires on:', status.expiresOn);
console.log('Days until expiration:', status.daysUntilExpiration);

if (status.isExpiringSoon) {
  console.warn('⚠️  Certificate expiring soon!');
}
```

##### `replaceCertificate(companyId: string, data: CertificateData): Promise<{ uploaded: boolean; message?: string }>`

Replace existing certificate (alias for upload).

```typescript
const result = await nfe.companies.replaceCertificate('company-id', {
  file: newCertBuffer,
  password: 'new-password',
  filename: 'new-certificate.pfx'
});
```

##### `checkCertificateExpiration(companyId: string, thresholdDays?: number): Promise<ExpirationWarning | null>`

Check if certificate is expiring soon.

```typescript
// Check with 30-day threshold (default)
const warning = await nfe.companies.checkCertificateExpiration('company-id', 30);

if (warning) {
  console.warn(`Certificate expiring in ${warning.daysRemaining} days`);
  console.log('Expires on:', warning.expiresOn);
}
```

#### Search & Helper Methods

##### `findByTaxNumber(taxNumber: number): Promise<Company | null>`

Find company by federal tax number (CNPJ or CPF).

```typescript
// Search by CNPJ (14 digits)
const company = await nfe.companies.findByTaxNumber(12345678000190);

// Or by CPF (11 digits)
const company = await nfe.companies.findByTaxNumber(12345678901);

if (company) {
  console.log('Found:', company.name);
} else {
  console.log('Company not found');
}
```

##### `findByName(name: string): Promise<Company[]>`

Find companies by name (case-insensitive partial match).

```typescript
// Find all companies with "Acme" in the name
const companies = await nfe.companies.findByName('Acme');

companies.forEach(company => {
  console.log(`Match: ${company.name}`);
});
```

##### `getCompaniesWithCertificates(): Promise<Company[]>`

Get all companies that have valid certificates.

```typescript
const companiesWithCerts = await nfe.companies.getCompaniesWithCertificates();

console.log(`${companiesWithCerts.length} companies with valid certificates`);
```

##### `getCompaniesWithExpiringCertificates(thresholdDays?: number): Promise<Company[]>`

Get companies with expiring certificates.

```typescript
// Find companies with certificates expiring within 30 days
const expiring = await nfe.companies.getCompaniesWithExpiringCertificates(30);

expiring.forEach(company => {
  console.warn(`⚠️  ${company.name} certificate expiring soon`);
});
```

#### Certificate Validator Utility

The `CertificateValidator` utility can also be used independently:

```typescript
import { CertificateValidator } from 'nfe-io';

// Check if format is supported
if (CertificateValidator.isSupportedFormat('cert.pfx')) {
  console.log('✓ Supported format');
}

// Calculate days until expiration
const expirationDate = new Date('2026-12-31');
const days = CertificateValidator.getDaysUntilExpiration(expirationDate);
console.log(`Days remaining: ${days}`);

// Check if expiring soon
if (CertificateValidator.isExpiringSoon(expirationDate, 30)) {
  console.warn('Certificate expiring within 30 days!');
}
```

### Legal People

**Resource:** `nfe.legalPeople`

Legal person (PJ/CNPJ) operations, scoped by company.

#### `create(companyId: string, data: Partial<LegalPerson>): Promise<LegalPerson>`

Create a legal person.

```typescript
const legalPerson = await nfe.legalPeople.create('company-id', {
  federalTaxNumber: '12345678000190',
  name: 'Legal Person Company',
  email: 'legal@example.com'
});
```

#### `list(companyId: string, options?: PaginationOptions): Promise<ListResponse<LegalPerson>>`

List legal people for a company.

```typescript
const people = await nfe.legalPeople.list('company-id');
```

#### `retrieve(companyId: string, legalPersonId: string): Promise<LegalPerson>`

Get a specific legal person.

```typescript
const person = await nfe.legalPeople.retrieve('company-id', 'person-id');
```

#### `update(companyId: string, legalPersonId: string, data: Partial<LegalPerson>): Promise<LegalPerson>`

Update legal person information.

```typescript
const updated = await nfe.legalPeople.update('company-id', 'person-id', {
  name: 'Updated Name'
});
```

#### `delete(companyId: string, legalPersonId: string): Promise<void>`

Delete a legal person.

```typescript
await nfe.legalPeople.delete('company-id', 'person-id');
```

#### `findByTaxNumber(companyId: string, cnpj: string): Promise<LegalPerson | null>`

Find legal person by CNPJ.

```typescript
const person = await nfe.legalPeople.findByTaxNumber('company-id', '12345678000190');
```

### Natural People

**Resource:** `nfe.naturalPeople`

Natural person (PF/CPF) operations, scoped by company.

#### `create(companyId: string, data: Partial<NaturalPerson>): Promise<NaturalPerson>`

Create a natural person.

```typescript
const person = await nfe.naturalPeople.create('company-id', {
  federalTaxNumber: '12345678901',
  name: 'John Doe',
  email: 'john@example.com'
});
```

#### `list(companyId: string, options?: PaginationOptions): Promise<ListResponse<NaturalPerson>>`

List natural people for a company.

```typescript
const people = await nfe.naturalPeople.list('company-id');
```

#### `retrieve(companyId: string, personId: string): Promise<NaturalPerson>`

Get a specific natural person.

```typescript
const person = await nfe.naturalPeople.retrieve('company-id', 'person-id');
```

#### `update(companyId: string, personId: string, data: Partial<NaturalPerson>): Promise<NaturalPerson>`

Update natural person information.

```typescript
const updated = await nfe.naturalPeople.update('company-id', 'person-id', {
  name: 'Jane Doe'
});
```

#### `delete(companyId: string, personId: string): Promise<void>`

Delete a natural person.

```typescript
await nfe.naturalPeople.delete('company-id', 'person-id');
```

#### `findByTaxNumber(companyId: string, cpf: string): Promise<NaturalPerson | null>`

Find natural person by CPF.

```typescript
const person = await nfe.naturalPeople.findByTaxNumber('company-id', '12345678901');
```

### Webhooks

**Resource:** `nfe.webhooks`

Webhook configuration and management.

#### `create(data: Partial<Webhook>): Promise<Webhook>`

Create a webhook.

```typescript
const webhook = await nfe.webhooks.create({
  url: 'https://example.com/webhook',
  events: ['invoice.issued', 'invoice.cancelled'],
  secret: 'webhook-secret'
});
```

#### `list(options?: PaginationOptions): Promise<ListResponse<Webhook>>`

List all webhooks.

```typescript
const webhooks = await nfe.webhooks.list();
```

#### `retrieve(webhookId: string): Promise<Webhook>`

Get a specific webhook.

```typescript
const webhook = await nfe.webhooks.retrieve('webhook-id');
```

#### `update(webhookId: string, data: Partial<Webhook>): Promise<Webhook>`

Update webhook configuration.

```typescript
const updated = await nfe.webhooks.update('webhook-id', {
  events: ['invoice.issued', 'invoice.cancelled', 'invoice.error']
});
```

#### `delete(webhookId: string): Promise<void>`

Delete a webhook.

```typescript
await nfe.webhooks.delete('webhook-id');
```

#### `validateSignature(payload: string, signature: string, secret: string): boolean`

Validate webhook signature (HMAC SHA-256).

```typescript
// In your webhook endpoint
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-nfe-signature'];
  const payload = JSON.stringify(req.body);
  
  const isValid = nfe.webhooks.validateSignature(
    payload,
    signature,
    'your-webhook-secret'
  );
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook...
});
```

#### `test(webhookId: string): Promise<void>`

Test webhook delivery.

```typescript
await nfe.webhooks.test('webhook-id');
```

#### `getAvailableEvents(): Promise<WebhookEvent[]>`

Get list of available webhook event types.

```typescript
const events = await nfe.webhooks.getAvailableEvents();
// ['invoice.issued', 'invoice.cancelled', ...]
```

---

### Transportation Invoices (CT-e)

**Resource:** `nfe.transportationInvoices`

Manage CT-e (Conhecimento de Transporte Eletrônico) documents via SEFAZ Distribuição DFe.

> **Note:** This resource uses a separate API host (`api.nfse.io`). You can configure a specific API key with `dataApiKey`, or the SDK will use `apiKey` as fallback.

**Prerequisites:**
- Company must be registered with a valid A1 digital certificate
- Webhook must be configured to receive CT-e notifications

#### `enable(companyId: string, options?: EnableTransportationInvoiceOptions): Promise<TransportationInvoiceInboundSettings>`

Enable automatic CT-e search for a company.

```typescript
// Enable with default settings
const settings = await nfe.transportationInvoices.enable('company-id');

// Enable starting from a specific NSU
const settings = await nfe.transportationInvoices.enable('company-id', {
  startFromNsu: 12345
});

// Enable starting from a specific date
const settings = await nfe.transportationInvoices.enable('company-id', {
  startFromDate: '2024-01-01T00:00:00Z'
});
```

**Options:**

| Property | Type | Description |
|----------|------|-------------|
| `startFromNsu` | `number` | Start searching from this NSU number |
| `startFromDate` | `string` | Start searching from this date (ISO 8601) |

#### `disable(companyId: string): Promise<TransportationInvoiceInboundSettings>`

Disable automatic CT-e search for a company.

```typescript
const settings = await nfe.transportationInvoices.disable('company-id');
console.log('Status:', settings.status); // 'Disabled'
```

#### `getSettings(companyId: string): Promise<TransportationInvoiceInboundSettings>`

Get current automatic CT-e search settings.

```typescript
const settings = await nfe.transportationInvoices.getSettings('company-id');
console.log('Status:', settings.status);
console.log('Start NSU:', settings.startFromNsu);
console.log('Created:', settings.createdOn);
```

**Response:**

| Property | Type | Description |
|----------|------|-------------|
| `status` | `string` | Current status ('Active', 'Disabled', etc.) |
| `startFromNsu` | `number` | Starting NSU number |
| `startFromDate` | `string` | Starting date (if configured) |
| `createdOn` | `string` | Creation timestamp |
| `modifiedOn` | `string` | Last modification timestamp |

#### `retrieve(companyId: string, accessKey: string): Promise<TransportationInvoiceMetadata>`

Retrieve CT-e metadata by its 44-digit access key.

```typescript
const cte = await nfe.transportationInvoices.retrieve(
  'company-id',
  '35240112345678000190570010000001231234567890'
);
console.log('Sender:', cte.nameSender);
console.log('CNPJ:', cte.federalTaxNumberSender);
console.log('Amount:', cte.totalInvoiceAmount);
console.log('Issued:', cte.issuedOn);
```

**Response:**

| Property | Type | Description |
|----------|------|-------------|
| `accessKey` | `string` | 44-digit access key |
| `type` | `string` | Document type |
| `status` | `string` | Document status |
| `nameSender` | `string` | Sender company name |
| `federalTaxNumberSender` | `string` | Sender CNPJ |
| `totalInvoiceAmount` | `number` | Total invoice amount |
| `issuedOn` | `string` | Issue date |
| `receivedOn` | `string` | Receipt date |

#### `downloadXml(companyId: string, accessKey: string): Promise<string>`

Download CT-e XML content.

```typescript
const xml = await nfe.transportationInvoices.downloadXml(
  'company-id',
  '35240112345678000190570010000001231234567890'
);
fs.writeFileSync('cte.xml', xml);
```

#### `getEvent(companyId: string, accessKey: string, eventKey: string): Promise<TransportationInvoiceMetadata>`

Retrieve CT-e event metadata.

```typescript
const event = await nfe.transportationInvoices.getEvent(
  'company-id',
  '35240112345678000190570010000001231234567890',
  'event-key-123'
);
console.log('Event type:', event.type);
console.log('Event status:', event.status);
```

#### `downloadEventXml(companyId: string, accessKey: string, eventKey: string): Promise<string>`

Download CT-e event XML content.

```typescript
const eventXml = await nfe.transportationInvoices.downloadEventXml(
  'company-id',
  '35240112345678000190570010000001231234567890',
  'event-key-123'
);
fs.writeFileSync('cte-event.xml', eventXml);
```

---

### Inbound Product Invoices (NF-e Distribuição)

**Resource:** `nfe.inboundProductInvoices`

Query NF-e (Nota Fiscal Eletrônica de Produto) documents received via SEFAZ Distribuição NF-e.

> **Note:** This resource uses a separate API host (`api.nfse.io`). You can configure a specific API key with `dataApiKey`, or the SDK will use `apiKey` as fallback.

**Prerequisites:**
- Company must be registered with a valid A1 digital certificate
- Webhook must be configured to receive NF-e notifications

#### `enableAutoFetch(companyId: string, options: EnableInboundOptions): Promise<InboundSettings>`

Enable automatic NF-e inbound fetching for a company.

```typescript
// Enable with production environment and webhook v2
const settings = await nfe.inboundProductInvoices.enableAutoFetch('company-id', {
  environmentSEFAZ: 'Production',
  webhookVersion: '2',
});

// Enable starting from a specific NSU
const settings = await nfe.inboundProductInvoices.enableAutoFetch('company-id', {
  startFromNsu: '999999',
  environmentSEFAZ: 'Production',
});

// Enable with automatic manifesting
const settings = await nfe.inboundProductInvoices.enableAutoFetch('company-id', {
  environmentSEFAZ: 'Production',
  automaticManifesting: { minutesToWaitAwarenessOperation: '30' },
});
```

**Options:**

| Property | Type | Description |
|----------|------|-------------|
| `startFromNsu` | `string` | Start searching from this NSU number |
| `startFromDate` | `string` | Start searching from this date (ISO 8601) |
| `environmentSEFAZ` | `string \| null` | SEFAZ environment ('Production', etc.) |
| `automaticManifesting` | `AutomaticManifesting` | Auto-manifest configuration |
| `webhookVersion` | `string` | Webhook version ('1' or '2') |

#### `disableAutoFetch(companyId: string): Promise<InboundSettings>`

Disable automatic NF-e inbound fetching for a company.

```typescript
const settings = await nfe.inboundProductInvoices.disableAutoFetch('company-id');
console.log('Status:', settings.status); // 'Inactive'
```

#### `getSettings(companyId: string): Promise<InboundSettings>`

Get current automatic NF-e inbound settings.

```typescript
const settings = await nfe.inboundProductInvoices.getSettings('company-id');
console.log('Status:', settings.status);
console.log('Environment:', settings.environmentSEFAZ);
console.log('Webhook version:', settings.webhookVersion);
console.log('Start NSU:', settings.startFromNsu);
```

**Response (`InboundSettings`):**

| Property | Type | Description |
|----------|------|-------------|
| `status` | `string` | Current status ('Active', 'Inactive', etc.) |
| `startFromNsu` | `string` | Starting NSU number |
| `startFromDate` | `string` | Starting date (if configured) |
| `environmentSEFAZ` | `string \| null` | SEFAZ environment |
| `automaticManifesting` | `AutomaticManifesting` | Auto-manifest configuration |
| `webhookVersion` | `string` | Webhook version |
| `companyId` | `string` | Company ID |
| `createdOn` | `string` | Creation timestamp |
| `modifiedOn` | `string` | Last modification timestamp |

#### `getDetails(companyId: string, accessKey: string): Promise<InboundInvoiceMetadata>`

Retrieve NF-e metadata by 44-digit access key (webhook v1 format).

```typescript
const nfeDoc = await nfe.inboundProductInvoices.getDetails(
  'company-id',
  '35240112345678000190550010000001231234567890'
);
console.log('Issuer:', nfeDoc.issuer?.name);
console.log('Amount:', nfeDoc.totalInvoiceAmount);
console.log('Issued:', nfeDoc.issuedOn);
```

#### `getProductInvoiceDetails(companyId: string, accessKey: string): Promise<InboundProductInvoiceMetadata>`

Retrieve NF-e metadata by 44-digit access key (webhook v2 format, recommended).

```typescript
const nfeDoc = await nfe.inboundProductInvoices.getProductInvoiceDetails(
  'company-id',
  '35240112345678000190550010000001231234567890'
);
console.log('Issuer:', nfeDoc.issuer?.name);
console.log('Amount:', nfeDoc.totalInvoiceAmount);
console.log('Product invoices:', nfeDoc.productInvoices?.length);
```

**Response (`InboundInvoiceMetadata` / `InboundProductInvoiceMetadata`):**

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Document ID |
| `accessKey` | `string` | 44-digit access key |
| `nsu` | `string` | NSU number |
| `nfeNumber` | `string` | NF-e number |
| `issuer` | `InboundIssuer` | Issuer information |
| `buyer` | `InboundBuyer` | Buyer information |
| `totalInvoiceAmount` | `string` | Total amount |
| `issuedOn` | `string` | Issue date |
| `description` | `string` | Description |
| `links` | `InboundLinks` | XML/PDF download links |
| `productInvoices` | `InboundProductInvoice[]` | Product invoices (v2 only) |

#### `getEventDetails(companyId: string, accessKey: string, eventKey: string): Promise<InboundInvoiceMetadata>`

Retrieve NF-e event metadata (webhook v1 format).

```typescript
const event = await nfe.inboundProductInvoices.getEventDetails(
  'company-id',
  '35240112345678000190550010000001231234567890',
  'event-key-123'
);
```

#### `getProductInvoiceEventDetails(companyId: string, accessKey: string, eventKey: string): Promise<InboundProductInvoiceMetadata>`

Retrieve NF-e event metadata (webhook v2 format).

```typescript
const event = await nfe.inboundProductInvoices.getProductInvoiceEventDetails(
  'company-id',
  '35240112345678000190550010000001231234567890',
  'event-key-123'
);
```

#### `getXml(companyId: string, accessKey: string): Promise<string>`

Download NF-e XML content.

```typescript
const xml = await nfe.inboundProductInvoices.getXml(
  'company-id',
  '35240112345678000190550010000001231234567890'
);
fs.writeFileSync('nfe.xml', xml);
```

#### `getEventXml(companyId: string, accessKey: string, eventKey: string): Promise<string>`

Download NF-e event XML content.

```typescript
const eventXml = await nfe.inboundProductInvoices.getEventXml(
  'company-id',
  '35240112345678000190550010000001231234567890',
  'event-key-123'
);
fs.writeFileSync('nfe-event.xml', eventXml);
```

#### `getPdf(companyId: string, accessKey: string): Promise<string>`

Download NF-e PDF (DANFE).

```typescript
const pdf = await nfe.inboundProductInvoices.getPdf(
  'company-id',
  '35240112345678000190550010000001231234567890'
);
```

#### `getJson(companyId: string, accessKey: string): Promise<InboundInvoiceMetadata>`

Get NF-e data in JSON format.

```typescript
const json = await nfe.inboundProductInvoices.getJson(
  'company-id',
  '35240112345678000190550010000001231234567890'
);
```

#### `manifest(companyId: string, accessKey: string, tpEvent?: ManifestEventType): Promise<string>`

Send a manifest event for an NF-e. Defaults to `210210` (Ciência da Operação).

```typescript
// Ciência da Operação (default)
await nfe.inboundProductInvoices.manifest(
  'company-id',
  '35240112345678000190550010000001231234567890'
);

// Confirmação da Operação
await nfe.inboundProductInvoices.manifest(
  'company-id',
  '35240112345678000190550010000001231234567890',
  210220
);

// Operação não Realizada
await nfe.inboundProductInvoices.manifest(
  'company-id',
  '35240112345678000190550010000001231234567890',
  210240
);
```

**Manifest Event Types:**

| Code | Event |
|------|-------|
| `210210` | Ciência da Operação (awareness, default) |
| `210220` | Confirmação da Operação (confirmation) |
| `210240` | Operação não Realizada (operation not performed) |

#### `reprocessWebhook(companyId: string, accessKeyOrNsu: string): Promise<InboundProductInvoiceMetadata>`

Reprocess a webhook notification by access key or NSU.

```typescript
// By access key
await nfe.inboundProductInvoices.reprocessWebhook(
  'company-id',
  '35240112345678000190550010000001231234567890'
);

// By NSU
await nfe.inboundProductInvoices.reprocessWebhook(
  'company-id',
  '12345'
);
```

---

### Product Invoice Query (Consulta NF-e)

**Resource:** `nfe.productInvoiceQuery`

Query NF-e (Nota Fiscal Eletrônica) product invoices directly on SEFAZ by access key. This is a read-only resource that does not require company scope.

> **Note:** This resource uses a separate API host (`nfe.api.nfe.io`). You can configure a specific API key with `dataApiKey`, or the SDK will use `apiKey` as fallback.

#### `retrieve(accessKey: string): Promise<ProductInvoiceDetails>`

Retrieve full product invoice details from SEFAZ by access key.

```typescript
const invoice = await nfe.productInvoiceQuery.retrieve(
  '35240112345678000190550010000001231234567890'
);
console.log(invoice.currentStatus); // 'authorized'
console.log(invoice.issuer?.name);
console.log(invoice.totals?.icms?.invoiceAmount);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessKey` | `string` | Yes | 44-digit numeric access key (Chave de Acesso) |

**Returns:** `ProductInvoiceDetails` — Full invoice details including issuer, buyer, items, totals, transport, and payment.

**Throws:**
- `ValidationError` if access key format is invalid
- `NotFoundError` if no invoice matches the access key (HTTP 404)
- `AuthenticationError` if API key is invalid (HTTP 401)

#### `downloadPdf(accessKey: string): Promise<Buffer>`

Download the DANFE PDF for a product invoice.

```typescript
const pdfBuffer = await nfe.productInvoiceQuery.downloadPdf(
  '35240112345678000190550010000001231234567890'
);
fs.writeFileSync('danfe.pdf', pdfBuffer);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessKey` | `string` | Yes | 44-digit numeric access key |

**Returns:** `Buffer` containing the PDF binary content.

#### `downloadXml(accessKey: string): Promise<Buffer>`

Download the raw NF-e XML for a product invoice.

```typescript
const xmlBuffer = await nfe.productInvoiceQuery.downloadXml(
  '35240112345678000190550010000001231234567890'
);
fs.writeFileSync('nfe.xml', xmlBuffer);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessKey` | `string` | Yes | 44-digit numeric access key |

**Returns:** `Buffer` containing the XML binary content.

#### `listEvents(accessKey: string): Promise<ProductInvoiceEventsResponse>`

List fiscal events (cancellations, corrections, manifestations) for a product invoice.

```typescript
const result = await nfe.productInvoiceQuery.listEvents(
  '35240112345678000190550010000001231234567890'
);
for (const event of result.events ?? []) {
  console.log(event.description, event.authorizedOn);
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessKey` | `string` | Yes | 44-digit numeric access key |

**Returns:** `ProductInvoiceEventsResponse` with an array of fiscal events and query timestamp.

---

### Consumer Invoice Query (Consulta CFe-SAT)

**Resource:** `nfe.consumerInvoiceQuery`

Query CFe-SAT (Cupom Fiscal Eletrônico) consumer invoices by access key. This is a read-only resource that does not require company scope.

> **Note:** This resource uses a separate API host (`nfe.api.nfe.io`). You can configure a specific API key with `dataApiKey`, or the SDK will use `apiKey` as fallback.

#### `retrieve(accessKey: string): Promise<TaxCoupon>`

Retrieve full CFe-SAT coupon details by access key.

```typescript
const coupon = await nfe.consumerInvoiceQuery.retrieve(
  '35240112345678000190590000000012341234567890'
);
console.log(coupon.currentStatus); // 'Authorized'
console.log(coupon.issuer?.name);
console.log(coupon.totals?.couponAmount);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessKey` | `string` | Yes | 44-digit numeric access key (Chave de Acesso) |

**Returns:** `TaxCoupon` — Full coupon details including issuer, buyer, items, totals, and payment.

**Throws:**
- `ValidationError` if access key format is invalid
- `NotFoundError` if no coupon matches the access key (HTTP 404)
- `AuthenticationError` if API key is invalid (HTTP 401)

#### `downloadXml(accessKey: string): Promise<Buffer>`

Download the raw CFe XML for a consumer invoice.

```typescript
const xmlBuffer = await nfe.consumerInvoiceQuery.downloadXml(
  '35240112345678000190590000000012341234567890'
);
fs.writeFileSync('cfe.xml', xmlBuffer);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessKey` | `string` | Yes | 44-digit numeric access key |

**Returns:** `Buffer` containing the XML binary content.

---

### Legal Entity Lookup (Consulta CNPJ)

**Resource:** `nfe.legalEntityLookup`

Query Brazilian company (CNPJ) data from Receita Federal and state tax registries (SEFAZ). This is a read-only resource that does not require company scope.

> **Note:** This resource uses a separate API host (`legalentity.api.nfe.io`). You can configure a specific API key with `dataApiKey`, or the SDK will use `apiKey` as fallback.

#### `getBasicInfo(federalTaxNumber: string, options?: LegalEntityBasicInfoOptions): Promise<LegalEntityBasicInfoResponse>`

Lookup basic company information by CNPJ from Receita Federal. Returns legal name, trade name, address, phone numbers, economic activities (CNAE), legal nature, partners, and registration status.

```typescript
const result = await nfe.legalEntityLookup.getBasicInfo('12.345.678/0001-90');
console.log(result.legalEntity?.name);       // 'EMPRESA LTDA'
console.log(result.legalEntity?.status);      // 'Active'
console.log(result.legalEntity?.address?.city?.name);

// With options
const result = await nfe.legalEntityLookup.getBasicInfo('12345678000190', {
  updateAddress: false,
  updateCityCode: true,
});
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `federalTaxNumber` | `string` | Yes | CNPJ, with or without punctuation (e.g., `"12345678000190"` or `"12.345.678/0001-90"`) |
| `options` | `LegalEntityBasicInfoOptions` | No | Lookup options |

**Options:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `updateAddress` | `boolean` | `true` | Update address from postal service data |
| `updateCityCode` | `boolean` | `false` | Update only the city IBGE code when `updateAddress` is `false` |

**Returns:** `LegalEntityBasicInfoResponse` — Company basic information including address, phones, activities, partners.

**Throws:**
- `ValidationError` if CNPJ format is invalid (not 14 digits after stripping punctuation)
- `NotFoundError` if no company found for the given CNPJ (HTTP 404)
- `AuthenticationError` if API key is invalid (HTTP 401)

#### `getStateTaxInfo(state: string, federalTaxNumber: string): Promise<LegalEntityStateTaxResponse>`

Lookup state tax registration (Inscrição Estadual) by CNPJ and state. Returns tax regime, legal nature, and state tax registration details including fiscal document indicators (NFe, NFSe, CTe, NFCe).

```typescript
const result = await nfe.legalEntityLookup.getStateTaxInfo('SP', '12345678000190');
console.log(result.legalEntity?.taxRegime);  // 'SimplesNacional'

for (const tax of result.legalEntity?.stateTaxes ?? []) {
  console.log(`IE: ${tax.taxNumber} — Status: ${tax.status}`);
  console.log(`  NFe: ${tax.nfe?.status}, NFSe: ${tax.nfse?.status}`);
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | `string` | Yes | Brazilian state code (e.g., `"SP"`, `"RJ"`, `"MG"`). Case-insensitive. |
| `federalTaxNumber` | `string` | Yes | CNPJ, with or without punctuation |

**Returns:** `LegalEntityStateTaxResponse` — State tax registration information.

**Throws:**
- `ValidationError` if state code is invalid or CNPJ format is invalid
- `AuthenticationError` if API key is invalid (HTTP 401)

#### `getStateTaxForInvoice(state: string, federalTaxNumber: string): Promise<LegalEntityStateTaxForInvoiceResponse>`

Evaluate state tax registration for invoice issuance. Returns extended status information (including `UnabledTemp`, `UnabledNotConfirmed`) useful for determining whether product invoices (NF-e) can be issued.

```typescript
const result = await nfe.legalEntityLookup.getStateTaxForInvoice('MG', '12345678000190');
for (const tax of result.legalEntity?.stateTaxes ?? []) {
  if (tax.status === 'Abled') {
    console.log(`Can issue invoices with IE: ${tax.taxNumber}`);
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | `string` | Yes | Brazilian state code. Case-insensitive. |
| `federalTaxNumber` | `string` | Yes | CNPJ, with or without punctuation |

**Returns:** `LegalEntityStateTaxForInvoiceResponse` — State tax data with extended status for invoice evaluation.

**Throws:**
- `ValidationError` if state code is invalid or CNPJ format is invalid
- `AuthenticationError` if API key is invalid (HTTP 401)

#### `getSuggestedStateTaxForInvoice(state: string, federalTaxNumber: string): Promise<LegalEntityStateTaxForInvoiceResponse>`

Get the best (suggested) state tax registration for invoice issuance. When multiple registrations are enabled in a state, NFE.io applies evaluation criteria to recommend the optimal IE.

```typescript
const result = await nfe.legalEntityLookup.getSuggestedStateTaxForInvoice('SP', '12345678000190');
const bestIE = result.legalEntity?.stateTaxes?.[0];
if (bestIE) {
  console.log(`Recommended IE: ${bestIE.taxNumber} (${bestIE.status})`);
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | `string` | Yes | Brazilian state code. Case-insensitive. |
| `federalTaxNumber` | `string` | Yes | CNPJ, with or without punctuation |

**Returns:** `LegalEntityStateTaxForInvoiceResponse` — Suggested state tax data prioritized by NFE.io criteria.

**Throws:**
- `ValidationError` if state code is invalid or CNPJ format is invalid
- `AuthenticationError` if API key is invalid (HTTP 401)

#### Types

```typescript
type BrazilianState =
  | 'AC' | 'AL' | 'AM' | 'AP' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO'
  | 'MA' | 'MG' | 'MS' | 'MT' | 'PA' | 'PB' | 'PE' | 'PI' | 'PR'
  | 'RJ' | 'RN' | 'RO' | 'RR' | 'RS' | 'SC' | 'SE' | 'SP' | 'TO'
  | 'EX' | 'NA';

interface LegalEntityBasicInfoOptions {
  updateAddress?: boolean;
  updateCityCode?: boolean;
}

interface LegalEntityBasicInfoResponse {
  legalEntity?: LegalEntityBasicInfo;
}

interface LegalEntityBasicInfo {
  tradeName?: string;
  name?: string;
  federalTaxNumber?: number;
  size?: 'Unknown' | 'ME' | 'EPP' | 'DEMAIS';
  openedOn?: string;
  address?: LegalEntityAddress;
  phones?: LegalEntityPhone[];
  status?: 'Unknown' | 'Active' | 'Suspended' | 'Cancelled' | 'Unabled' | 'Null';
  email?: string;
  shareCapital?: number;
  economicActivities?: LegalEntityEconomicActivity[];
  legalNature?: LegalEntityNature;
  partners?: LegalEntityPartner[];
  unit?: 'Headoffice' | 'Subsidiary';
  // ... and more fields
}

interface LegalEntityStateTaxResponse {
  legalEntity?: LegalEntityStateTaxInfo;
}

interface LegalEntityStateTaxForInvoiceResponse {
  legalEntity?: LegalEntityStateTaxForInvoiceInfo;
}

interface LegalEntityStateTax {
  status?: 'Abled' | 'Unabled' | 'Cancelled' | 'Unknown';
  taxNumber?: string;
  code?: BrazilianState;
  nfe?: LegalEntityFiscalDocumentInfo;
  nfse?: LegalEntityFiscalDocumentInfo;
  cte?: LegalEntityFiscalDocumentInfo;
  nfce?: LegalEntityFiscalDocumentInfo;
  // ... and more fields
}

interface LegalEntityStateTaxForInvoice {
  status?: 'Abled' | 'Unabled' | 'Cancelled' | 'UnabledTemp' | 'UnabledNotConfirmed'
    | 'Unknown' | 'UnknownTemp' | 'UnknownNotConfirmed';
  taxNumber?: string;
  // ... same structure as LegalEntityStateTax with extended status
}
```

> See [src/core/types.ts](../src/core/types.ts) for the complete type definitions.

---

### Natural Person Lookup (Consulta CPF)

**Resource:** `nfe.naturalPersonLookup`
**API Host:** `naturalperson.api.nfe.io`
**Authentication:** Uses `dataApiKey` (falls back to `apiKey`)

Lookup CPF cadastral status (situação cadastral) at the Brazilian Federal Revenue Service (Receita Federal).

#### `getStatus(federalTaxNumber: string, birthDate: string | Date): Promise<NaturalPersonStatusResponse>`

Query the cadastral status of a CPF, returning the person's name, CPF, birth date, status, and query timestamp.

```typescript
// With string date
const result = await nfe.naturalPersonLookup.getStatus('123.456.789-01', '1990-01-15');
console.log(result.name);    // 'JOÃO DA SILVA'
console.log(result.status);  // 'Regular'

// With Date object
const result = await nfe.naturalPersonLookup.getStatus('12345678901', new Date(1990, 0, 15));
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `federalTaxNumber` | `string` | Yes | CPF number, with or without punctuation (e.g., `"12345678901"` or `"123.456.789-01"`) |
| `birthDate` | `string \| Date` | Yes | Date of birth in `YYYY-MM-DD` format or a `Date` object |

**Returns:** `NaturalPersonStatusResponse` — CPF cadastral status data.

**Throws:**
- `ValidationError` if CPF format is invalid (not 11 digits) or birth date format is invalid
- `NotFoundError` if CPF is not found or birth date does not match (HTTP 404)
- `AuthenticationError` if API key is invalid (HTTP 401)

#### Types

```typescript
type NaturalPersonStatus =
  | 'Regular'
  | 'Suspensa'
  | 'Cancelada'
  | 'Titular Falecido'
  | 'Pendente de Regularização'
  | 'Nula'
  | (string & {});

interface NaturalPersonStatusResponse {
  name?: string;
  federalTaxNumber: string;
  birthOn?: string;
  status?: NaturalPersonStatus;
  createdOn?: string;
}
```

> See [src/core/types.ts](../src/core/types.ts) for the complete type definitions.

---

### Tax Calculation (Cálculo de Impostos)

**Resource:** `nfe.taxCalculation`
**API Host:** `api.nfse.io`
**Authentication:** Uses `dataApiKey` (falls back to `apiKey`)

Compute all applicable Brazilian taxes (ICMS, ICMS-ST, PIS, COFINS, IPI, II) for product operations using the Tax Calculation Engine (Motor de Cálculo de Tributos).

#### `calculate(tenantId: string, request: CalculateRequest): Promise<CalculateResponse>`

Submit an operation with issuer, recipient, operation type, and product items to compute per-item tax breakdowns.

```typescript
const result = await nfe.taxCalculation.calculate('tenant-id', {
  operationType: 'Outgoing',
  issuer: { state: 'SP', taxRegime: 'RealProfit' },
  recipient: { state: 'RJ' },
  items: [{
    id: 'item-1',
    operationCode: 121,
    origin: 'National',
    ncm: '61091000',
    quantity: 10,
    unitAmount: 100.00
  }]
});

for (const item of result.items ?? []) {
  console.log(`Item ${item.id}: CFOP ${item.cfop}`);
  console.log(`  ICMS CST: ${item.icms?.cst}, value: ${item.icms?.vICMS}`);
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenantId` | `string` | Yes | Subscription/account ID that scopes the tax rules |
| `request` | `CalculateRequest` | Yes | Tax calculation request payload |

**Returns:** `CalculateResponse` — Per-item tax breakdowns including CFOP, ICMS, PIS, COFINS, IPI, II.

**Throws:**
- `ValidationError` if `tenantId` is empty
- `ValidationError` if required fields are missing (issuer, recipient, operationType, items)
- `AuthenticationError` if API key is invalid (HTTP 401)
- `BadRequestError` if the API rejects the payload (HTTP 400)

#### Types

```typescript
type TaxOperationType = 'Outgoing' | 'Incoming';

type TaxOrigin =
  | 'National' | 'ForeignDirectImport' | 'ForeignInternalMarket'
  | 'NationalWith40To70Import' | 'NationalPpb' | 'NationalWithLess40Import'
  | 'ForeignDirectImportWithoutNationalSimilar'
  | 'ForeignInternalMarketWithoutNationalSimilar'
  | 'NationalWithGreater70Import';

type TaxCalcTaxRegime =
  | 'NationalSimple' | 'RealProfit' | 'PresumedProfit'
  | 'NationalSimpleSublimitExceeded' | 'IndividualMicroEnterprise' | 'Exempt';

interface CalculateRequest {
  collectionId?: string;
  issuer: CalculateRequestIssuer;       // required: state, taxRegime
  recipient: CalculateRequestRecipient; // required: state
  operationType: TaxOperationType;
  items: CalculateItemRequest[];        // required: id, operationCode, origin, quantity, unitAmount
  isProductRegistration?: boolean;
}

interface CalculateResponse {
  items?: CalculateItemResponse[];  // per-item: cfop, icms, pis, cofins, ipi, ii, icmsUfDest
}
```

> See [src/core/types.ts](../src/core/types.ts) for the complete type definitions including all tax component interfaces (TaxIcms, TaxPis, TaxCofins, TaxIpi, TaxIi, TaxIcmsUfDest).

---

### Tax Codes (Códigos Auxiliares)

**Resource:** `nfe.taxCodes`
**API Host:** `api.nfse.io`
**Authentication:** Uses `dataApiKey` (falls back to `apiKey`)

Paginated listings of auxiliary tax code reference tables needed as inputs for the Tax Calculation Engine.

#### `listOperationCodes(options?: TaxCodeListOptions): Promise<TaxCodePaginatedResponse>`

List operation codes (natureza de operação) — e.g., 121 = "Venda de mercadoria".

```typescript
const result = await nfe.taxCodes.listOperationCodes({ pageIndex: 1, pageCount: 20 });
console.log(`Total: ${result.totalCount}, Page ${result.currentPage} of ${result.totalPages}`);
for (const code of result.items ?? []) {
  console.log(`${code.code} - ${code.description}`);
}
```

#### `listAcquisitionPurposes(options?: TaxCodeListOptions): Promise<TaxCodePaginatedResponse>`

List acquisition purposes (finalidade de aquisição).

#### `listIssuerTaxProfiles(options?: TaxCodeListOptions): Promise<TaxCodePaginatedResponse>`

List issuer tax profiles (perfil fiscal do emissor).

#### `listRecipientTaxProfiles(options?: TaxCodeListOptions): Promise<TaxCodePaginatedResponse>`

List recipient tax profiles (perfil fiscal do destinatário).

**All methods accept:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `options.pageIndex` | `number` | No | Page index, 1-based (default: 1) |
| `options.pageCount` | `number` | No | Items per page (default: 50) |

**Returns:** `TaxCodePaginatedResponse` — Paginated list of tax codes.

#### Types

```typescript
interface TaxCode {
  code?: string;
  description?: string;
}

interface TaxCodePaginatedResponse {
  items?: TaxCode[];
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
}

interface TaxCodeListOptions {
  pageIndex?: number;
  pageCount?: number;
}
```

> See [src/core/types.ts](../src/core/types.ts) for the complete type definitions.

---

## Types

### Core Types

```typescript
interface NfeConfig {
  apiKey?: string;
  dataApiKey?: string;     // API key for data/query services (Addresses, CT-e, CNPJ, CPF)
  environment?: 'production' | 'development';
  baseUrl?: string;
  timeout?: number;
  retryConfig?: RetryConfig;
}

interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryableStatuses?: number[];
}

interface PaginationOptions {
  pageCount?: number;
  pageIndex?: number;
}

interface PollOptions {
  maxAttempts?: number;
  intervalMs?: number;
}

interface ListResponse<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageCount: number;
}
```

### Entity Types

```typescript
interface Company {
  id: string;
  name: string;
  federalTaxNumber: string;
  email: string;
  address: Address;
  // ... other fields
}

interface ServiceInvoice {
  id: string;
  number?: string;
  status: ServiceInvoiceStatus;
  borrower: ServiceInvoiceBorrower;
  cityServiceCode: string;
  servicesAmount: number;
  // ... other fields
}

interface LegalPerson {
  id: string;
  name: string;
  federalTaxNumber: string; // CNPJ
  email?: string;
  // ... other fields
}

interface NaturalPerson {
  id: string;
  name: string;
  federalTaxNumber: string; // CPF
  email?: string;
  // ... other fields
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  // ... other fields
}

interface Address {
  country: string;
  postalCode: string;
  street: string;
  number: string;
  additionalInformation?: string;
  district?: string;
  city: City;
  state: string;
}

interface City {
  code: string;
  name: string;
}

type ServiceInvoiceStatus = 
  | 'pending' 
  | 'issued' 
  | 'cancelled' 
  | 'error';
```

## Error Handling

The SDK uses a comprehensive error hierarchy:

```typescript
import { 
  NfeError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  ServerError,
  ConnectionError,
  TimeoutError,
  PollingTimeoutError,
  isNfeError,
  isAuthenticationError
} from 'nfe-io';
```

### Error Types

| Error Class | HTTP Status | Description |
|-------------|-------------|-------------|
| `AuthenticationError` | 401 | Invalid API key |
| `ValidationError` | 400, 422 | Request validation failed |
| `NotFoundError` | 404 | Resource not found |
| `ConflictError` | 409 | Resource conflict |
| `RateLimitError` | 429 | Rate limit exceeded |
| `ServerError` | 500, 502, 503 | Server error |
| `ConnectionError` | - | Network/connection failure |
| `TimeoutError` | 408 | Request timeout |
| `PollingTimeoutError` | - | Polling exceeded max attempts |

### Error Handling Example

```typescript
import { 
  AuthenticationError, 
  ValidationError, 
  NotFoundError,
  isNfeError 
} from 'nfe-io';

try {
  const invoice = await nfe.serviceInvoices.create(companyId, data);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof ValidationError) {
    console.error('Validation errors:', error.details);
  } else if (error instanceof NotFoundError) {
    console.error('Company not found');
  } else if (isNfeError(error)) {
    console.error('NFE.io error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Error Properties

All NFE.io errors extend `NfeError` and include:

```typescript
class NfeError extends Error {
  type: ErrorType;
  statusCode?: number;
  details?: any;
  requestId?: string;
}
```

## Advanced Usage

### Custom Retry Logic

```typescript
const nfe = new NfeClient({
  apiKey: 'your-api-key',
  retryConfig: {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 60000,
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  }
});
```

### Async Invoice Processing

NFE.io uses async processing for invoices (202 responses). The SDK provides two approaches:

**Manual Polling:**

```typescript
const result = await nfe.serviceInvoices.create(companyId, data);

if (result.status === 'pending') {
  const invoice = await nfe.pollUntilComplete(result.location, {
    maxAttempts: 60,
    intervalMs: 3000
  });
  console.log('Invoice issued:', invoice.number);
} else {
  console.log('Invoice issued immediately:', result.number);
}
```

**Automatic Polling (Recommended):**

```typescript
const invoice = await nfe.serviceInvoices.createAndWait(companyId, data, {
  maxAttempts: 30,
  interval: 2000
});

console.log('Invoice issued:', invoice.number);
```

### Environment Detection

```typescript
import { isEnvironmentSupported, getRuntimeInfo } from 'nfe-io';

// Check environment compatibility
const support = isEnvironmentSupported();
if (!support.supported) {
  console.error('Environment issues:', support.issues);
}

// Get runtime information
const info = getRuntimeInfo();
console.log('SDK Version:', info.sdkVersion);
console.log('Node Version:', info.nodeVersion);
console.log('Platform:', info.platform);
```

### Quick Start Helpers

```typescript
import { createClientFromEnv, validateApiKeyFormat } from 'nfe-io';

// Create client from environment variable
// Requires NFE_API_KEY environment variable
const nfe = createClientFromEnv('production');

// Validate API key format
const validation = validateApiKeyFormat('my-api-key');
if (!validation.valid) {
  console.error('API key issues:', validation.issues);
}
```

### TypeScript Support

The SDK is fully typed with TypeScript:

```typescript
import type {
  NfeConfig,
  ServiceInvoice,
  ServiceInvoiceData,
  Company,
  LegalPerson,
  NaturalPerson,
  Webhook,
  ListResponse,
  PaginationOptions,
  InboundInvoiceMetadata,
  InboundProductInvoiceMetadata,
  InboundSettings,
  EnableInboundOptions,
  ManifestEventType
} from 'nfe-io';

const config: NfeConfig = {
  apiKey: 'your-api-key',
  environment: 'production'
};

const invoice: ServiceInvoice = await nfe.serviceInvoices.retrieve(
  'company-id',
  'invoice-id'
);
```

## Extension Development

The SDK is designed to be extensible. See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidance on:

- Creating MCP (Model Context Protocol) integrations
- Building n8n workflow nodes
- Developing custom adapters
- Extending the HTTP client

### Example: Custom Resource Extension

```typescript
import { HttpClient } from 'nfe-io/core/http/client';

class CustomResource {
  constructor(private http: HttpClient) {}
  
  async customMethod(id: string): Promise<any> {
    return this.http.get(`/custom/${id}`);
  }
}

// Extend NfeClient
import { NfeClient } from 'nfe-io';

class ExtendedNfeClient extends NfeClient {
  public readonly custom: CustomResource;
  
  constructor(config: NfeConfig) {
    super(config);
    this.custom = new CustomResource(this.http);
  }
}
```

## Support

- **Documentation:** https://nfe.io/docs
- **Repository:** https://github.com/nfe/client-nodejs
- **Issues:** https://github.com/nfe/client-nodejs/issues

## License

MIT License - see [LICENSE](../LICENSE) for details
