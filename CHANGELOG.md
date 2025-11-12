# Changelog

All notable changes to the NFE.io SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0-beta.1] - 2024-11-12

### 🎉 Major Release - Complete Rewrite

Version 3.0 is a complete rewrite of the NFE.io SDK with modern TypeScript, zero runtime dependencies, and a clean async/await API.

### Added

#### Core Features
- **TypeScript Native** - Full type safety with TypeScript 5.3+
- **Zero Dependencies** - Uses Node.js native fetch API (requires Node 18+)
- **Modern Async/Await** - Clean promise-based API throughout
- **Auto Retry** - Built-in exponential backoff retry logic
- **ESM & CommonJS** - Dual package support for both module systems

#### Resources
- `NfeClient` - Main client class with environment configuration
- `ServiceInvoicesResource` - Complete service invoice management
  - `create()` - Create invoices with async 202 handling
  - `list()` - List invoices with pagination
  - `retrieve()` - Get specific invoice
  - `cancel()` - Cancel issued invoices
  - `sendEmail()` - Send invoice by email
  - `downloadPdf()` - Download PDF files
  - `downloadXml()` - Download XML files
  - `createAndWait()` - **NEW** Auto-polling for async processing
- `CompaniesResource` - Company management
  - `create()`, `list()`, `retrieve()`, `update()`
  - `uploadCertificate()` - Upload digital certificates with FormData
- `LegalPeopleResource` - Legal entities management
  - `create()`, `list()`, `retrieve()`, `update()`, `delete()`
  - `findByTaxNumber()` - **NEW** Find by CNPJ
  - `createBatch()` - **NEW** Batch create multiple entities
- `NaturalPeopleResource` - Natural persons management
  - `create()`, `list()`, `retrieve()`, `update()`, `delete()`
  - `findByTaxNumber()` - **NEW** Find by CPF
  - `createBatch()` - **NEW** Batch create multiple persons
- `WebhooksResource` - Webhook configuration
  - `create()`, `list()`, `retrieve()`, `update()`, `delete()`
  - `validateSignature()` - **NEW** Webhook signature validation

#### Error Handling
- `NfeError` - Base error class
- `AuthenticationError` - API key authentication failures
- `ValidationError` - Request validation errors with detailed field information
- `NotFoundError` - Resource not found (404)
- `RateLimitError` - Rate limiting with retry-after information
- `ServerError` - Server-side errors (5xx)
- `ConnectionError` - Network connectivity issues
- `TimeoutError` - Request timeout errors
- `ErrorFactory` - Intelligent error creation from HTTP responses

#### Testing
- 80+ unit tests with 88% coverage
- Comprehensive error handling tests (32 tests)
- Resource CRUD operation tests (55 tests)
- Client configuration tests (13 tests)
- Mock factories for all resource types

#### Documentation
- Complete JSDoc documentation for all public APIs
- Comprehensive README with examples
- Migration guide (MIGRATION.md) from v2 to v3
- Contributing guidelines (CONTRIBUTING.md)
- Type definitions for all APIs

#### Developer Experience
- Full TypeScript IntelliSense support
- Detailed error messages with context
- Request/response type safety
- Configurable retry behavior
- Environment-based configuration (production/sandbox)
- Custom base URL support

### Changed

#### Breaking Changes
- **Package name** changed from `nfe-io` to `@nfe-io/sdk`
- **Node.js requirement** increased from 12+ to 18+
- **API initialization** now uses class constructor instead of factory function
  ```javascript
  // v2
  var nfe = require('nfe-io')('api-key');
  
  // v3
  import { NfeClient } from '@nfe-io/sdk';
  const nfe = new NfeClient({ apiKey: 'api-key' });
  ```
- **No callback support** - Only async/await and promises
- **Error types** are now classes instead of error codes
- **TypeScript required** for type checking (runtime still works with JavaScript)
- **Resource methods** signature changes for consistency

### Removed

- **Callback API** - Removed in favor of async/await
- **when.js dependency** - Replaced with native promises
- **Runtime dependencies** - Now zero dependencies
- **Node.js < 18 support** - Requires Node 18+ for native fetch

### Fixed

- Retry logic now correctly handles 4xx errors (no retry)
- Proper TypeScript types for all API responses
- Better error messages with context and request details
- Fixed race conditions in async invoice processing

### Security

- Updated to latest TypeScript (5.3+)
- Zero runtime dependencies = reduced attack surface
- No vulnerable dependencies

## [2.0.0] - Previous Version

See git history for v2.x changes.

---

## Migration Notes

### From v2 to v3

See [MIGRATION.md](./MIGRATION.md) for detailed migration instructions.

**Quick checklist:**
1. ✅ Upgrade to Node.js 18+
2. ✅ Change package name: `npm install @nfe-io/sdk`
3. ✅ Update imports/requires
4. ✅ Convert callbacks to async/await
5. ✅ Update error handling to use error classes
6. ✅ Test your code thoroughly

---

## Support

- 📧 Email: suporte@nfe.io
- 📖 Documentation: https://nfe.io/docs/
- 🐛 Issues: https://github.com/nfe/client-nodejs/issues

[Unreleased]: https://github.com/nfe/client-nodejs/compare/v3.0.0-beta.1...HEAD
[3.0.0-beta.1]: https://github.com/nfe/client-nodejs/releases/tag/v3.0.0-beta.1
