# NFE.io SDK for Node.js (v3)

[![npm version](https://img.shields.io/npm/v/@nfe-io/sdk.svg)](https://www.npmjs.com/package/@nfe-io/sdk)
[![Node.js Version](https://img.shields.io/node/v/@nfe-io/sdk.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Official NFE.io SDK for Node.js 18+** - Modern TypeScript SDK for issuing Brazilian service invoices (NFS-e).

> ✨ **Version 3.0** - Complete rewrite with TypeScript, zero runtime dependencies, and modern async/await API.

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Migration from v2](#-migration-from-v2)
- [Examples](#-examples)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- 🎯 **Modern TypeScript** - Full type safety with TypeScript 5.3+
- 🚀 **Zero Dependencies** - Uses native Node.js fetch API (Node 18+)
- ⚡ **Async/Await** - Clean promise-based API
- 🔄 **Auto Retry** - Built-in exponential backoff retry logic
- 📦 **ESM & CommonJS** - Works with both module systems
- 🧪 **Well Tested** - 80+ tests with 88% coverage
- 📖 **Full JSDoc** - Complete API documentation
- 🛡️ **Error Handling** - Typed error classes for better error handling

## 📦 Installation

**Requirements:**
- Node.js >= 18.0.0
- TypeScript >= 5.0 (if using TypeScript)

```bash
npm install @nfe-io/sdk
```

or

```bash
yarn add @nfe-io/sdk
```

or

```bash
pnpm add @nfe-io/sdk
```

## 🚀 Quick Start

### Basic Usage (ESM)

```typescript
import { NfeClient } from '@nfe-io/sdk';

// Initialize the client
const nfe = new NfeClient({
  apiKey: 'your-api-key',
  environment: 'production' // or 'development'
});

// Create a company
const company = await nfe.companies.create({
  federalTaxNumber: '12345678000190',
  name: 'My Company Ltd',
  email: 'company@example.com',
  taxRegime: 1, // Simples Nacional
  address: {
    country: 'BRA',
    postalCode: '01310-100',
    street: 'Av. Paulista',
    number: '1578',
    city: { code: '3550308', name: 'São Paulo' },
    state: 'SP'
  }
});

// Issue a service invoice
const invoice = await nfe.serviceInvoices.create(company.id, {
  cityServiceCode: '01234',
  description: 'Web development services',
  servicesAmount: 1000.00,
  borrower: {
    type: 'LegalEntity',
    federalTaxNumber: 12345678000190,
    name: 'Client Company',
    email: 'client@example.com',
    address: {
      country: 'BRA',
      postalCode: '01310-100',
      street: 'Av. Paulista',
      number: '1000',
      city: { code: '3550308', name: 'São Paulo' },
      state: 'SP'
    }
  }
});

console.log(`Invoice created: ${invoice.number}`);
```

### CommonJS Usage

```javascript
const { NfeClient } = require('@nfe-io/sdk');

const nfe = new NfeClient({
  apiKey: process.env.NFE_API_KEY,
  environment: 'production'
});

// Same API as ESM
```

## 📚 Documentation

### API Resources

The SDK provides the following resources:

#### 🧾 Service Invoices (`nfe.serviceInvoices`)

Manage NFS-e (Nota Fiscal de Serviço Eletrônica):

```typescript
// Create invoice (returns immediately or async 202)
const invoice = await nfe.serviceInvoices.create(companyId, invoiceData);

// Create and wait for completion (handles async processing)
const invoice = await nfe.serviceInvoices.createAndWait(companyId, invoiceData, {
  maxAttempts: 30,
  intervalMs: 2000
});

// List invoices with pagination
const result = await nfe.serviceInvoices.list(companyId, {
  page: 1,
  pageSize: 50
});

// Retrieve specific invoice
const invoice = await nfe.serviceInvoices.retrieve(companyId, invoiceId);

// Cancel invoice
const cancelledInvoice = await nfe.serviceInvoices.cancel(companyId, invoiceId);

// Send invoice by email
await nfe.serviceInvoices.sendEmail(companyId, invoiceId);

// Download PDF
const pdfBuffer = await nfe.serviceInvoices.downloadPdf(companyId, invoiceId);

// Download XML
const xmlData = await nfe.serviceInvoices.downloadXml(companyId, invoiceId);
```

#### 🏢 Companies (`nfe.companies`)

Manage companies in your account:

```typescript
// Create company
const company = await nfe.companies.create({
  federalTaxNumber: '12345678000190',
  name: 'Company Name',
  // ... other fields
});

// List all companies
const companies = await nfe.companies.list();

// Get specific company
const company = await nfe.companies.retrieve(companyId);

// Update company
const updated = await nfe.companies.update(companyId, {
  email: 'newemail@company.com'
});

// Upload digital certificate
await nfe.companies.uploadCertificate(companyId, {
  file: certificateBuffer,
  password: 'cert-password'
});
```

#### 👔 Legal People (`nfe.legalPeople`)

Manage legal entities (companies/businesses):

```typescript
// Create legal person
const person = await nfe.legalPeople.create(companyId, {
  federalTaxNumber: '12345678000190',
  name: 'Business Name',
  email: 'business@example.com',
  address: { /* ... */ }
});

// List all legal people
const people = await nfe.legalPeople.list(companyId);

// Find by tax number
const person = await nfe.legalPeople.findByTaxNumber(companyId, '12345678000190');
```

#### 👤 Natural People (`nfe.naturalPeople`)

Manage natural persons (individuals):

```typescript
// Create natural person
const person = await nfe.naturalPeople.create(companyId, {
  federalTaxNumber: 12345678901,
  name: 'John Doe',
  email: 'john@example.com',
  address: { /* ... */ }
});

// Find by CPF
const person = await nfe.naturalPeople.findByTaxNumber(companyId, '12345678901');
```

#### 🔗 Webhooks (`nfe.webhooks`)

Manage webhook configurations:

```typescript
// Create webhook
const webhook = await nfe.webhooks.create(companyId, {
  url: 'https://myapp.com/webhooks/nfe',
  events: ['invoice.issued', 'invoice.cancelled'],
  active: true
});

// List webhooks
const webhooks = await nfe.webhooks.list(companyId);

// Update webhook
await nfe.webhooks.update(companyId, webhookId, {
  events: ['invoice.issued']
});

// Validate webhook signature
const isValid = nfe.webhooks.validateSignature(
  payload,
  signature,
  secret
);
```

### Configuration Options

```typescript
const nfe = new NfeClient({
  // Required: Your NFE.io API key
  apiKey: 'your-api-key',
  
  // Optional: Environment (default: 'production')
  environment: 'production', // or 'sandbox'
  
  // Optional: Custom base URL (overrides environment)
  baseUrl: 'https://custom-api.nfe.io/v1',
  
  // Optional: Request timeout in milliseconds (default: 30000)
  timeout: 60000,
  
  // Optional: Retry configuration
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }
});
```

### Error Handling

The SDK provides typed error classes:

```typescript
import { 
  NfeError, 
  AuthenticationError, 
  ValidationError,
  NotFoundError,
  RateLimitError 
} from '@nfe-io/sdk';

try {
  const invoice = await nfe.serviceInvoices.create(companyId, data);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key:', error.message);
  } else if (error instanceof ValidationError) {
    console.error('Invalid data:', error.details);
  } else if (error instanceof NotFoundError) {
    console.error('Resource not found:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded, retry after:', error.retryAfter);
  } else if (error instanceof NfeError) {
    console.error('API error:', error.code, error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 🔄 Migration from v2

See [MIGRATION.md](./MIGRATION.md) for a complete migration guide.

**Key Changes:**

```javascript
// v2 (callbacks + promises)
var nfe = require('nfe-io')('api-key');
nfe.serviceInvoices.create('company-id', data, function(err, invoice) {
  if (err) return console.error(err);
  console.log(invoice);
});

// v3 (async/await + TypeScript)
import { NfeClient } from '@nfe-io/sdk';
const nfe = new NfeClient({ apiKey: 'api-key' });

try {
  const invoice = await nfe.serviceInvoices.create('company-id', data);
  console.log(invoice);
} catch (error) {
  console.error(error);
}
```

## 📝 Examples

### Complete Invoice Flow

```typescript
import { NfeClient } from '@nfe-io/sdk';

const nfe = new NfeClient({
  apiKey: process.env.NFE_API_KEY!,
  environment: 'production'
});

async function issueInvoice() {
  // 1. Get or create company
  const companies = await nfe.companies.list();
  const company = companies.data[0];
  
  // 2. Create invoice with automatic polling
  const invoice = await nfe.serviceInvoices.createAndWait(company.id, {
    cityServiceCode: '01234',
    description: 'Consultoria em TI',
    servicesAmount: 5000.00,
    borrower: {
      type: 'LegalEntity',
      federalTaxNumber: 12345678000190,
      name: 'Cliente Exemplo Ltda',
      email: 'contato@cliente.com.br',
      address: {
        country: 'BRA',
        postalCode: '01310-100',
        street: 'Av. Paulista',
        number: '1000',
        city: { code: '3550308', name: 'São Paulo' },
        state: 'SP'
      }
    }
  }, {
    maxAttempts: 30,
    intervalMs: 2000
  });
  
  console.log(`✅ Invoice issued: ${invoice.number}`);
  
  // 3. Send by email
  await nfe.serviceInvoices.sendEmail(company.id, invoice.id);
  console.log('📧 Email sent');
  
  // 4. Download PDF
  const pdf = await nfe.serviceInvoices.downloadPdf(company.id, invoice.id);
  await fs.promises.writeFile(`invoice-${invoice.number}.pdf`, pdf);
  console.log('💾 PDF saved');
}

issueInvoice().catch(console.error);
```

### Webhook Setup

```typescript
// Setup webhook to receive invoice events
const webhook = await nfe.webhooks.create(companyId, {
  url: 'https://myapp.com/api/webhooks/nfe',
  events: [
    'invoice.issued',
    'invoice.cancelled',
    'invoice.error'
  ],
  active: true
});

// In your webhook endpoint
app.post('/api/webhooks/nfe', (req, res) => {
  const signature = req.headers['x-nfe-signature'];
  const isValid = nfe.webhooks.validateSignature(
    req.body,
    signature,
    process.env.WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  const { event, data } = req.body;
  
  if (event === 'invoice.issued') {
    console.log('Invoice issued:', data.id);
  }
  
  res.status(200).send('OK');
});
```

### Batch Invoice Creation

```typescript
async function issueBatchInvoices(companyId: string, invoices: InvoiceData[]) {
  const results = await Promise.allSettled(
    invoices.map(data => 
      nfe.serviceInvoices.createAndWait(companyId, data)
    )
  );
  
  const succeeded = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');
  
  console.log(`✅ ${succeeded.length} invoices issued`);
  console.log(`❌ ${failed.length} invoices failed`);
  
  return { succeeded, failed };
}
```

## 🏗️ API Reference

Full API documentation is available at:
- [TypeDoc Documentation](https://nfe.github.io/client-nodejs/) *(coming soon)*
- [Official API Docs](https://nfe.io/docs/nota-fiscal-servico/integracao-nfs-e/)
- [REST API Reference](https://nfe.io/doc/rest-api/nfe-v1/)

## 🧪 Development & Testing

### Running Tests

```bash
# Run all tests (unit + integration)
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests (requires API key)
npm run test:integration

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

### Integration Tests

Integration tests validate against the **real NFE.io API**:

```bash
# Set your development/test API key
export NFE_API_KEY="your-development-api-key"
export NFE_TEST_ENVIRONMENT="development"
export RUN_INTEGRATION_TESTS="true"

# Run integration tests
npm run test:integration
```

See [tests/integration/README.md](./tests/integration/README.md) for detailed documentation.

**Note**: Integration tests make real API calls and may incur costs depending on your plan.

### Type Checking

```bash
npm run typecheck
```

### Building

```bash
npm run build
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Official Extensions

The SDK is designed to be extensible. Official extensions:

- **[@nfe-io/mcp-server](https://github.com/nfe/mcp-server)** - Model Context Protocol server for LLM integration
- **[@nfe-io/n8n-nodes](https://github.com/nfe/n8n-nodes)** - n8n workflow automation nodes

## 📄 License

MIT © [NFE.io](https://nfe.io)

## 🆘 Support

- 📧 Email: suporte@nfe.io
- 📖 Documentation: https://nfe.io/docs/
- 🐛 Issues: https://github.com/nfe/client-nodejs/issues

## 🗺️ Roadmap

- [ ] OpenAPI spec validation
- [ ] Rate limiting helpers
- [ ] Pagination helpers
- [ ] Request/response interceptors
- [ ] Custom retry strategies
- [ ] Browser support (via bundlers)

---

**Made with ❤️ by the NFE.io team**
