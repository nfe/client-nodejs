# Migration Guide: v2 → v3

This guide helps you migrate from NFE.io SDK v2.x to v3.0.

## 📋 Table of Contents

- [Overview](#overview)
- [Breaking Changes](#breaking-changes)
- [Step-by-Step Migration](#step-by-step-migration)
- [API Changes](#api-changes)
- [Code Examples](#code-examples)
- [FAQ](#faq)

## Overview

### What's New in v3?

✨ **Major Improvements:**
- **TypeScript Native** - Full type safety and IntelliSense support
- **Modern Async/Await** - No more callbacks, clean promise-based API
- **Zero Dependencies** - Uses Node.js native fetch API (Node 18+)
- **Better Error Handling** - Typed error classes with detailed information
- **Auto Retry** - Built-in exponential backoff retry logic
- **ESM & CommonJS** - Works with both module systems

⚠️ **Requirements:**
- **Node.js >= 18.0.0** (up from v12 in v2)
- **Breaking API changes** (see below)

### Migration Timeline

**Recommended approach:**
1. ✅ Update to Node.js 18+ if needed
2. ✅ Install v3 alongside v2 (different package names)
3. ✅ Migrate one resource at a time
4. ✅ Update tests
5. ✅ Remove v2 dependency

## Breaking Changes

### 1. Package Name Change

```diff
- npm install nfe-io
+ npm install @nfe-io/sdk
```

### 2. Import/Require Syntax

```javascript
// v2
var nfe = require('nfe-io')('your-api-key');

// v3 (ESM)
import { NfeClient } from '@nfe-io/sdk';
const nfe = new NfeClient({ apiKey: 'your-api-key' });

// v3 (CommonJS)
const { NfeClient } = require('@nfe-io/sdk');
const nfe = new NfeClient({ apiKey: 'your-api-key' });
```

### 3. Configuration

```javascript
// v2
var nfe = require('nfe-io')('api-key');
nfe.setTimeout(60000);

// v3
const nfe = new NfeClient({
  apiKey: 'api-key',
  timeout: 60000,
  environment: 'production', // or 'development'
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000
  }
});
```

### 4. Callbacks → Async/Await

```javascript
// v2 (callbacks)
nfe.serviceInvoices.create('company-id', data, function(err, invoice) {
  if (err) return console.error(err);
  console.log(invoice);
});

// v2 (promises)
nfe.serviceInvoices.create('company-id', data)
  .then(invoice => console.log(invoice))
  .catch(err => console.error(err));

// v3 (async/await - RECOMMENDED)
try {
  const invoice = await nfe.serviceInvoices.create('company-id', data);
  console.log(invoice);
} catch (error) {
  console.error(error);
}
```

### 5. Error Handling

```javascript
// v2
nfe.serviceInvoices.create('company-id', data, function(err, invoice) {
  if (err) {
    if (err.type === 'AuthenticationError') {
      // handle auth error
    }
  }
});

// v3
import { AuthenticationError, ValidationError } from '@nfe-io/sdk';

try {
  const invoice = await nfe.serviceInvoices.create('company-id', data);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof ValidationError) {
    console.error('Invalid data:', error.details);
  }
}
```

### 6. Response Format

```javascript
// v2 - Direct data return
const invoice = await nfe.serviceInvoices.retrieve('company-id', 'invoice-id');
console.log(invoice.number);

// v3 - Same! (no change)
const invoice = await nfe.serviceInvoices.retrieve('company-id', 'invoice-id');
console.log(invoice.number);
```

### 7. Method Name Changes

| v2 Method | v3 Method | Notes |
|-----------|-----------|-------|
| `create()` | `create()` | ✅ Same |
| `list()` | `list()` | ✅ Same |
| `retrieve()` | `retrieve()` | ✅ Same |
| `update()` | `update()` | ✅ Same |
| `delete()` | `delete()` | ✅ Same |
| `sendEmail()` | `sendEmail()` | ✅ Same |
| `downloadPdf()` | `downloadPdf()` | ✅ Same |
| `downloadXml()` | `downloadXml()` | ✅ Same |
| N/A | `createAndWait()` | 🆕 New! Auto-polling |

## Step-by-Step Migration

### Step 1: Install v3

```bash
# Install new package (v2 stays installed for now)
npm install @nfe-io/sdk

# Check Node.js version
node --version  # Should be >= 18.0.0
```

### Step 2: Update Imports

```diff
- var nfe = require('nfe-io')('api-key');
+ const { NfeClient } = require('@nfe-io/sdk');
+ const nfe = new NfeClient({ apiKey: 'api-key' });
```

Or with ES Modules:

```diff
+ import { NfeClient } from '@nfe-io/sdk';
+ const nfe = new NfeClient({ apiKey: 'api-key' });
```

### Step 3: Convert Callbacks to Async/Await

```diff
- nfe.serviceInvoices.create('company-id', data, function(err, invoice) {
-   if (err) return console.error(err);
-   console.log(invoice);
- });

+ async function createInvoice() {
+   try {
+     const invoice = await nfe.serviceInvoices.create('company-id', data);
+     console.log(invoice);
+   } catch (error) {
+     console.error(error);
+   }
+ }
+ createInvoice();
```

### Step 4: Update Error Handling

```diff
+ import { 
+   NfeError,
+   AuthenticationError, 
+   ValidationError,
+   NotFoundError 
+ } from '@nfe-io/sdk';

  try {
    const invoice = await nfe.serviceInvoices.create('company-id', data);
  } catch (error) {
-   if (error.type === 'AuthenticationError') {
+   if (error instanceof AuthenticationError) {
      console.error('Auth failed');
    }
-   if (error.type === 'ValidationError') {
+   if (error instanceof ValidationError) {
      console.error('Invalid data:', error.details);
    }
  }
```

### Step 5: Update TypeScript (if applicable)

```typescript
// Add types to your code
import { NfeClient, ServiceInvoice, Company } from '@nfe-io/sdk';

const nfe = new NfeClient({ apiKey: 'api-key' });

async function getInvoice(
  companyId: string, 
  invoiceId: string
): Promise<ServiceInvoice> {
  return await nfe.serviceInvoices.retrieve(companyId, invoiceId);
}
```

### Step 6: Remove v2

```bash
# After all code is migrated and tested
npm uninstall nfe-io
```

## API Changes

### Service Invoices

```javascript
// v2
nfe.serviceInvoices.create('company-id', invoiceData, callback);
nfe.serviceInvoices.list('company-id', callback);
nfe.serviceInvoices.retrieve('company-id', 'invoice-id', callback);
nfe.serviceInvoices.cancel('company-id', 'invoice-id', callback);
nfe.serviceInvoices.sendEmail('company-id', 'invoice-id', callback);
nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id', callback);
nfe.serviceInvoices.downloadXml('company-id', 'invoice-id', callback);

// v3
await nfe.serviceInvoices.create('company-id', invoiceData);
await nfe.serviceInvoices.list('company-id', { page: 1, pageSize: 50 });
await nfe.serviceInvoices.retrieve('company-id', 'invoice-id');
await nfe.serviceInvoices.cancel('company-id', 'invoice-id');
await nfe.serviceInvoices.sendEmail('company-id', 'invoice-id');
await nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id');
await nfe.serviceInvoices.downloadXml('company-id', 'invoice-id');

// 🆕 New in v3: Auto-polling for async processing
await nfe.serviceInvoices.createAndWait('company-id', invoiceData, {
  maxAttempts: 30,
  intervalMs: 2000
});
```

### Companies

```javascript
// v2
nfe.companies.create(companyData, callback);
nfe.companies.list(callback);
nfe.companies.retrieve('company-id', callback);
nfe.companies.update('company-id', updates, callback);
nfe.companies.uploadCertificate('company-id', fileData, password, callback);

// v3 - Basic CRUD (same pattern, now async)
await nfe.companies.create(companyData);
await nfe.companies.list({ pageCount: 20, pageIndex: 0 });
await nfe.companies.retrieve('company-id');
await nfe.companies.update('company-id', updates);
await nfe.companies.remove('company-id'); // Renamed from 'delete'

// v3 - Certificate Management (enhanced)
await nfe.companies.uploadCertificate('company-id', {
  file: fileBuffer,
  password: 'cert-password',
  filename: 'certificate.pfx' // Optional
});

// 🆕 New in v3: Certificate utilities
const validation = await nfe.companies.validateCertificate(certBuffer, 'password');
const status = await nfe.companies.getCertificateStatus('company-id');
const warning = await nfe.companies.checkCertificateExpiration('company-id', 30);

// 🆕 New in v3: Pagination helpers
const allCompanies = await nfe.companies.listAll(); // Auto-pagination
for await (const company of nfe.companies.listIterator()) {
  // Memory-efficient streaming
}

// 🆕 New in v3: Search methods
const company = await nfe.companies.findByTaxNumber(12345678000190);
const matches = await nfe.companies.findByName('Acme');
const withCerts = await nfe.companies.getCompaniesWithCertificates();
const expiring = await nfe.companies.getCompaniesWithExpiringCertificates(30);
```

**Key Changes:**
- ✅ `delete()` → `remove()` (avoids JavaScript keyword)
- ✅ `uploadCertificate()` now takes object with `{ file, password, filename? }`
- 🆕 Pre-upload certificate validation
- 🆕 Certificate expiration monitoring
- 🆕 Search by tax number or name
- 🆕 Auto-pagination with `listAll()` and `listIterator()`

### Legal People & Natural People

```javascript
// v2
nfe.legalPeople.create('company-id', personData, callback);
nfe.legalPeople.list('company-id', callback);
nfe.legalPeople.retrieve('company-id', 'person-id', callback);
nfe.legalPeople.update('company-id', 'person-id', updates, callback);
nfe.legalPeople.delete('company-id', 'person-id', callback);

// v3 (same pattern, just async)
await nfe.legalPeople.create('company-id', personData);
await nfe.legalPeople.list('company-id');
await nfe.legalPeople.retrieve('company-id', 'person-id');
await nfe.legalPeople.update('company-id', 'person-id', updates);
await nfe.legalPeople.delete('company-id', 'person-id');

// 🆕 New in v3: Helper methods
await nfe.legalPeople.findByTaxNumber('company-id', '12345678000190');
await nfe.naturalPeople.findByTaxNumber('company-id', '12345678901');
```

### Webhooks

```javascript
// v2
nfe.webhooks.create(webhookData, callback);
nfe.webhooks.list(callback);
nfe.webhooks.retrieve('webhook-id', callback);
nfe.webhooks.update('webhook-id', updates, callback);
nfe.webhooks.delete('webhook-id', callback);

// v3
await nfe.webhooks.create('company-id', webhookData);
await nfe.webhooks.list('company-id');
await nfe.webhooks.retrieve('company-id', 'webhook-id');
await nfe.webhooks.update('company-id', 'webhook-id', updates);
await nfe.webhooks.delete('company-id', 'webhook-id');

// 🆕 New in v3: Signature validation
const isValid = nfe.webhooks.validateSignature(payload, signature, secret);
```

## Code Examples

### Before & After: Complete Invoice Flow

**v2 Code:**

```javascript
var nfe = require('nfe-io')('api-key');

function issueInvoice(companyId, invoiceData, callback) {
  nfe.serviceInvoices.create(companyId, invoiceData, function(err, invoice) {
    if (err) return callback(err);
    
    if (invoice.code === 202) {
      // Poll manually
      var checkInterval = setInterval(function() {
        nfe.serviceInvoices.retrieve(companyId, invoice.id, function(err, result) {
          if (err) {
            clearInterval(checkInterval);
            return callback(err);
          }
          
          if (result.status === 'issued') {
            clearInterval(checkInterval);
            
            // Send email
            nfe.serviceInvoices.sendEmail(companyId, result.id, function(err) {
              if (err) return callback(err);
              callback(null, result);
            });
          }
        });
      }, 2000);
    } else {
      // Send email
      nfe.serviceInvoices.sendEmail(companyId, invoice.id, function(err) {
        if (err) return callback(err);
        callback(null, invoice);
      });
    }
  });
}

issueInvoice('company-id', invoiceData, function(err, invoice) {
  if (err) return console.error(err);
  console.log('Invoice issued:', invoice.number);
});
```

**v3 Code:**

```javascript
import { NfeClient } from '@nfe-io/sdk';

const nfe = new NfeClient({ apiKey: 'api-key' });

async function issueInvoice(companyId, invoiceData) {
  // Automatically handles polling and email
  const invoice = await nfe.serviceInvoices.createAndWait(
    companyId, 
    invoiceData,
    { maxAttempts: 30, intervalMs: 2000 }
  );
  
  await nfe.serviceInvoices.sendEmail(companyId, invoice.id);
  
  return invoice;
}

// Usage
try {
  const invoice = await issueInvoice('company-id', invoiceData);
  console.log('Invoice issued:', invoice.number);
} catch (error) {
  console.error('Failed to issue invoice:', error);
}
```

### Before & After: Error Handling

**v2 Code:**

```javascript
nfe.serviceInvoices.create('company-id', data, function(err, invoice) {
  if (err) {
    if (err.type === 'AuthenticationError') {
      console.error('Invalid API key');
    } else if (err.type === 'BadRequestError') {
      console.error('Invalid data:', err.message);
    } else {
      console.error('Unknown error:', err);
    }
    return;
  }
  
  console.log('Success:', invoice);
});
```

**v3 Code:**

```javascript
import { 
  AuthenticationError, 
  ValidationError,
  RateLimitError 
} from '@nfe-io/sdk';

try {
  const invoice = await nfe.serviceInvoices.create('company-id', data);
  console.log('Success:', invoice);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof ValidationError) {
    console.error('Invalid data:', error.details);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited, retry after:', error.retryAfter);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Before & After: Batch Operations

**v2 Code:**

```javascript
var async = require('async');

async.mapLimit(invoices, 5, function(invoiceData, callback) {
  nfe.serviceInvoices.create('company-id', invoiceData, callback);
}, function(err, results) {
  if (err) return console.error(err);
  console.log('Created:', results.length);
});
```

**v3 Code:**

```javascript
// No external dependencies needed!
async function batchCreate(companyId, invoices) {
  const results = await Promise.allSettled(
    invoices.map(data => 
      nfe.serviceInvoices.create(companyId, data)
    )
  );
  
  const succeeded = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');
  
  console.log(`✅ ${succeeded.length} succeeded`);
  console.log(`❌ ${failed.length} failed`);
  
  return { succeeded, failed };
}
```

### Certificate Management Migration

The certificate management in v3 has been significantly enhanced:

**v2 Approach:**
```javascript
// v2: Upload and hope it works
const fs = require('fs');
const certBuffer = fs.readFileSync('./certificate.pfx');

nfe.companies.uploadCertificate('company-id', certBuffer, 'password', (err, result) => {
  if (err) {
    console.error('Upload failed:', err);
    return;
  }
  console.log('Certificate uploaded');
});
```

**v3 Approach (with validation):**
```javascript
// v3: Validate before upload
import { readFile } from 'fs/promises';
import { CertificateValidator } from '@nfe-io/sdk';

const certBuffer = await readFile('./certificate.pfx');

// 1. Check file format
if (!CertificateValidator.isSupportedFormat('certificate.pfx')) {
  throw new Error('Only .pfx and .p12 files are supported');
}

// 2. Validate certificate
const validation = await nfe.companies.validateCertificate(certBuffer, 'password');
if (!validation.valid) {
  throw new Error(`Invalid certificate: ${validation.error}`);
}

console.log('Certificate expires:', validation.metadata?.validTo);

// 3. Upload (will also validate automatically)
const result = await nfe.companies.uploadCertificate('company-id', {
  file: certBuffer,
  password: 'password',
  filename: 'certificate.pfx'
});

console.log(result.message);
```

**v3 Monitoring:**
```javascript
// Set up monitoring for expiring certificates
async function checkCertificates() {
  const expiring = await nfe.companies.getCompaniesWithExpiringCertificates(30);
  
  for (const company of expiring) {
    const warning = await nfe.companies.checkCertificateExpiration(company.id, 30);
    
    if (warning) {
      console.warn(`⚠️  ${company.name}`);
      console.warn(`   Certificate expires in ${warning.daysRemaining} days`);
      console.warn(`   Expiration date: ${warning.expiresOn.toLocaleDateString()}`);
      
      // Send alert to admin
      await sendAdminAlert({
        company: company.name,
        daysRemaining: warning.daysRemaining
      });
    }
  }
}

// Run daily
setInterval(checkCertificates, 24 * 60 * 60 * 1000);
```

## FAQ

### Q: Can I use v2 and v3 together during migration?

**A:** Yes! They use different package names (`nfe-io` vs `@nfe-io/sdk`), so you can run them side-by-side.

```javascript
// v2
const nfeV2 = require('nfe-io')('api-key');

// v3
const { NfeClient } = require('@nfe-io/sdk');
const nfeV3 = new NfeClient({ apiKey: 'api-key' });
```

### Q: Do I need to change my API key?

**A:** No! Your existing API key works with both v2 and v3.

### Q: What if I'm still on Node.js 16?

**A:** You must upgrade to Node.js 18+ to use v3. Consider:
- Upgrading Node.js (recommended)
- Staying on v2 until you can upgrade
- Using Node Version Manager (nvm) to test v3

### Q: Are there any data format changes?

**A:** No! The API request/response formats are the same. Only the SDK interface changed.

### Q: What happens to my v2 code after migration?

**A:** Keep it until you've fully migrated and tested. Then remove the `nfe-io` package.

### Q: Is there a performance difference?

**A:** Yes! v3 is faster:
- No external dependencies = faster startup
- Native fetch API = better performance
- Built-in retry = better reliability

### Q: Can I use v3 with JavaScript (not TypeScript)?

**A:** Absolutely! TypeScript types are optional. v3 works great with plain JavaScript.

### Q: What about backwards compatibility?

**A:** v3 is **not** backwards compatible with v2. This is why we changed the package name. Follow this guide to migrate.

## Need Help?

- 📖 [Full Documentation](https://nfe.io/docs/)
- 🐛 [Report Issues](https://github.com/nfe/client-nodejs/issues)
- 📧 [Email Support](mailto:suporte@nfe.io)
- 💬 [Community](https://nfe.io/community)

---

**Happy migrating! 🚀**
