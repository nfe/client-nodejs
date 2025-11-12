# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🏗️ Architecture Changes
- **BREAKING**: MCP adapters moved to separate repository [@nfe-io/mcp-server](https://github.com/nfe/mcp-server)
- **BREAKING**: n8n nodes moved to separate repository [@nfe-io/n8n-nodes](https://github.com/nfe/n8n-nodes)
- SDK now focuses on core functionality only
- Designed for extensibility - see CONTRIBUTING.md

### 📚 Documentation
- Added CONTRIBUTING.md with extension development guidelines
- Updated AGENTS.md to reflect multi-repo architecture
- Created comprehensive README-v3.md

## [3.0.0-beta.1] - 2024-11-11

### 🎉 Major Rewrite - v3.0.0

Complete rewrite of the SDK from JavaScript to TypeScript with modern practices.

### ✨ Added
- **TypeScript native** with complete type definitions
- **Zero runtime dependencies** - uses Node.js 18+ native Fetch API
- **ESM + CommonJS** support via dual exports
- **Modern async/await API** replacing callbacks
- **Automatic retry** with exponential backoff
- **Smart polling** for async invoice processing with `createAndWait()`
- **Complete error hierarchy** with typed errors
- **Environment detection** with `isEnvironmentSupported()`

### 🏗️ Core Implementation
- `NfeClient` - Main client class with configuration
- `HttpClient` - Fetch-based HTTP client with retry logic
- Error system - `NfeError`, `AuthenticationError`, `ValidationError`, etc.
- Complete TypeScript types for all API entities

### 📦 Resources Implemented
- ✅ **Companies** - Full CRUD + certificate upload
- ✅ **ServiceInvoices** - Create, list, retrieve, cancel, email, download PDF/XML
- ⏳ **LegalPeople** - CRUD for legal entities (planned)
- ⏳ **NaturalPeople** - CRUD for natural persons (planned)
- ⏳ **Webhooks** - CRUD + signature validation (planned)

### 🔧 Configuration
- Support for `production` and `sandbox` environments
- Configurable timeouts
- Configurable retry behavior
- Environment variable support (`NFE_API_KEY`)

### 📖 Examples
- `examples/basic-usage-esm.js` - ESM usage example
- `examples/basic-usage-cjs.cjs` - CommonJS usage example

### 🧪 Testing
- Vitest setup for unit and integration tests
- Test structure created (implementation pending)

### 🚨 Breaking Changes from v2

#### API Changes
```diff
- const nfe = require('nfe-io')('api-key');
+ import { createNfeClient } from '@nfe-io/sdk';
+ const nfe = createNfeClient({ apiKey: 'api-key' });
```

#### Callbacks → Async/Await
```diff
- nfe.serviceInvoices.create('company-id', data, (err, invoice) => {
-   if (err) console.error(err);
-   console.log(invoice);
- });

+ try {
+   const invoice = await nfe.serviceInvoices.create('company-id', data);
+   console.log(invoice);
+ } catch (error) {
+   console.error(error);
+ }
```

#### Polling Made Easy
```diff
- // v2: Manual polling required
- nfe.serviceInvoices.create('company-id', data, (err, response) => {
-   if (response.code === 202) {
-     // Poll manually...
-   }
- });

+ // v3: Automatic polling
+ const invoice = await nfe.serviceInvoices.createAndWait(
+   'company-id',
+   data,
+   { maxAttempts: 10, interval: 2000 }
+ );
```

#### Error Handling
```diff
- if (err.type === 'AuthenticationError') { ... }

+ import { AuthenticationError } from '@nfe-io/sdk';
+ if (error instanceof AuthenticationError) { ... }
```

### 🔄 Migration Path

See [docs/MIGRATION.md](./docs/MIGRATION.md) for detailed migration guide from v2 to v3.

### 📋 Requirements
- **Node.js**: >= 18.0.0 (v2 required >= 12.0.0)
- **Dependencies**: Zero runtime dependencies (v2 had `when@3.1.0`)

---

## [2.0.0] - Previous Release

Legacy JavaScript SDK with callback-based API.

### Features
- Companies CRUD
- ServiceInvoices operations
- LegalPeople CRUD
- NaturalPeople CRUD
- Webhooks CRUD
- Promise + callback dual API via `when` library

### Known Issues
- Outdated dependencies (`when@3.1.0`)
- Callback-based API
- No TypeScript support
- No built-in retry mechanism
- Manual polling for async operations

---

## Migration Notes

### From v2.x to v3.x

**When to migrate:**
- You want TypeScript support
- You prefer async/await over callbacks
- You need modern Node.js features
- You want zero dependencies

**When to stay on v2:**
- You're on Node.js < 18
- You have large codebase using callbacks
- No immediate need for TypeScript

**Migration effort:** Medium
- API surface is similar
- Main change is callback → async/await
- Type definitions help catch issues
- Most data structures unchanged

---

[Unreleased]: https://github.com/nfe/client-nodejs/compare/v3.0.0-beta.1...HEAD
[3.0.0-beta.1]: https://github.com/nfe/client-nodejs/releases/tag/v3.0.0-beta.1
[2.0.0]: https://github.com/nfe/client-nodejs/releases/tag/v2.0.0
