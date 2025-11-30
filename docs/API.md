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
- [Types](#types)
- [Error Handling](#error-handling)
- [Advanced Usage](#advanced-usage)

## Installation

```bash
npm install @nfe-io/sdk
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

Service invoice operations (NFS-e).

#### `create(companyId: string, data: ServiceInvoiceData): Promise<ServiceInvoice>`

Create a new service invoice.

**Parameters:**

- `companyId` - Company ID
- `data` - Invoice data

**Returns:** Created invoice (may have `status: 'pending'` for async processing)

**Example:**

```typescript
const invoice = await nfe.serviceInvoices.create('company-id', {
  borrower: {
    name: 'Client Name',
    email: 'client@example.com',
    federalTaxNumber: '12345678000190',
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
  },
  cityServiceCode: '01234',
  description: 'Service description',
  servicesAmount: 1000.00,
  rpsSerialNumber: 'ABC',
  rpsNumber: 123
});
```

#### `createAndWait(companyId: string, data: ServiceInvoiceData, pollOptions?: PollOptions): Promise<ServiceInvoice>`

Create invoice and automatically poll until processing completes.

**Parameters:**

- `companyId` - Company ID
- `data` - Invoice data
- `pollOptions` - Polling configuration (optional)

**Returns:** Completed invoice

**Example:**

```typescript
const invoice = await nfe.serviceInvoices.createAndWait('company-id', data, {
  maxAttempts: 30,
  interval: 2000
});

console.log('Invoice issued:', invoice.number);
```

#### `list(companyId: string, options?: PaginationOptions): Promise<ListResponse<ServiceInvoice>>`

List service invoices for a company.

**Parameters:**

- `companyId` - Company ID
- `options` - Pagination options (optional)
  - `pageCount` - Items per page
  - `pageIndex` - Page number (0-indexed)

**Example:**

```typescript
const result = await nfe.serviceInvoices.list('company-id', {
  pageCount: 50,
  pageIndex: 0
});

console.log('Total invoices:', result.totalCount);
console.log('Invoices:', result.items);
```

#### `retrieve(companyId: string, invoiceId: string): Promise<ServiceInvoice>`

Get a specific service invoice.

```typescript
const invoice = await nfe.serviceInvoices.retrieve('company-id', 'invoice-id');
```

#### `cancel(companyId: string, invoiceId: string): Promise<ServiceInvoice>`

Cancel a service invoice.

```typescript
const cancelled = await nfe.serviceInvoices.cancel('company-id', 'invoice-id');
```

#### `sendEmail(companyId: string, invoiceId: string, emails: string[]): Promise<void>`

Send invoice by email.

```typescript
await nfe.serviceInvoices.sendEmail('company-id', 'invoice-id', [
  'client@example.com',
  'finance@example.com'
]);
```

#### `downloadPdf(companyId: string, invoiceId: string): Promise<Buffer>`

Download invoice PDF.

```typescript
const pdfBuffer = await nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id');
await fs.writeFile('invoice.pdf', pdfBuffer);
```

#### `downloadXml(companyId: string, invoiceId: string): Promise<string>`

Download invoice XML.

```typescript
const xml = await nfe.serviceInvoices.downloadXml('company-id', 'invoice-id');
await fs.writeFile('invoice.xml', xml);
```

### Companies

**Resource:** `nfe.companies`

Company management operations.

#### `create(data: Partial<Company>): Promise<Company>`

Create a new company.

```typescript
const company = await nfe.companies.create({
  federalTaxNumber: '12345678000190',
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

#### `list(options?: PaginationOptions): Promise<ListResponse<Company>>`

List all companies.

```typescript
const companies = await nfe.companies.list({
  pageCount: 20,
  pageIndex: 0
});
```

#### `retrieve(companyId: string): Promise<Company>`

Get a specific company.

```typescript
const company = await nfe.companies.retrieve('company-id');
```

#### `update(companyId: string, data: Partial<Company>): Promise<Company>`

Update company information.

```typescript
const updated = await nfe.companies.update('company-id', {
  name: 'New Company Name',
  email: 'newemail@example.com'
});
```

#### `delete(companyId: string): Promise<void>`

Delete a company.

```typescript
await nfe.companies.delete('company-id');
```

#### `uploadCertificate(companyId: string, certificate: Buffer, password: string): Promise<Company>`

Upload digital certificate (PFX/P12).

```typescript
import fs from 'fs/promises';

const certBuffer = await fs.readFile('./certificate.pfx');
const company = await nfe.companies.uploadCertificate(
  'company-id',
  certBuffer,
  'certificate-password'
);
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

## Types

### Core Types

```typescript
interface NfeConfig {
  apiKey?: string;
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
} from '@nfe-io/sdk';
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
} from '@nfe-io/sdk';

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
import { isEnvironmentSupported, getRuntimeInfo } from '@nfe-io/sdk';

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
import { createClientFromEnv, validateApiKeyFormat } from '@nfe-io/sdk';

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
  PaginationOptions
} from '@nfe-io/sdk';

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
import { HttpClient } from '@nfe-io/sdk/core/http/client';

class CustomResource {
  constructor(private http: HttpClient) {}
  
  async customMethod(id: string): Promise<any> {
    return this.http.get(`/custom/${id}`);
  }
}

// Extend NfeClient
import { NfeClient } from '@nfe-io/sdk';

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
