# NFE.io Node.js SDK - AI Coding Instructions

This repository contains the official NFE.io SDK for Node.js, currently in major transition from v2 (JavaScript/callbacks) to v3 (TypeScript/async-await). Understanding both the current architecture and modernization goals is critical for effective contributions.

## 🏗️ Current Architecture (v2.0.0)

### Core Pattern: BaseResource Extension
- **Main SDK**: `lib/nfe.js` - Factory pattern that instantiates all resources
- **Base Class**: `lib/BaseResource.js` - HTTP client with `when` promises (v3.1.0)  
- **Method Factory**: `lib/BaseResource.Method.js` - Converts specs into API methods
- **Resources**: `lib/resources/*.js` - Each extends BaseResource with REST method declarations

```javascript
// Pattern: Resource definitions are declarative specs
module.exports = BaseResource.extend({
  path: '/companies/{company_id}/serviceinvoices',
  create: restMethod({ method: 'POST', urlParams: ['company_id'] }),
  retrieve: restMethod({ method: 'GET', path: '/{id}', urlParams: ['company_id', 'id'] })
});
```

### Resource Organization  
- **ServiceInvoices** (`lib/resources/ServiceInvoices.js`) - Core business functionality (create, list, retrieve, cancel, sendemail, downloadPdf/Xml)
- **Companies** (`lib/resources/Companies.js`) - CRUD + uploadCertificate with FormData
- **LegalPeople/NaturalPeople** - CRUD scoped by company_id
- **Webhooks** - Basic CRUD for webhook management

### HTTP & Error Handling
- **Authentication**: Basic Auth with API key (`'Basic ' + new Buffer(key)`)
- **Async**: Promise-based via `when` library (not native promises)
- **Status Codes**: Special handling for 201/202 (async invoice processing), 401 (auth errors)
- **Error Hierarchy**: `lib/Error.js` with specific types (AuthenticationError, BadRequestError, etc.)

### Key Patterns to Preserve
1. **Company-scoped resources**: Most operations require `company_id` as first parameter
2. **Async invoice processing**: Create returns 202 + location header for polling
3. **Certificate upload**: Uses FormData for file uploads to `/companies/{id}/certificate`
4. **Callback + Promise dual API**: `nfe.serviceInvoices.create(companyId, data, callback)` or `.then()`

## 🎯 Modernization Plan (v3.0.0) 

### Critical Rules from AGENTS.md
- **NEVER edit `src/generated/`** - Auto-generated from OpenAPI specs
- **TypeScript 5.3+**, Node.js 18+, zero runtime dependencies
- **Fetch API** replaces http/https modules
- **OpenAPI-first**: Code generation drives type safety

### New Architecture (Target)
```
src/
├── generated/          # ⚠️ AUTO-GENERATED from OpenAPI
│   ├── schema.ts       # All API types
│   └── runtime.ts      # HTTP client
├── client/             # ✏️ HANDWRITTEN DX layer
│   ├── NfeClient.ts    # Main client class
│   └── resources/      # Typed wrappers around generated code
├── runtime/            # ✏️ HANDWRITTEN infrastructure  
│   ├── http-client.ts  # Fetch-based HTTP with retry/rate limiting
│   └── retry.ts        # Exponential backoff
└── errors/            # ✏️ HANDWRITTEN error types
```

### Development Workflow
```bash
npm run download-spec   # Get OpenAPI spec (may need manual creation)
npm run generate        # Generate types/runtime from spec  
npm run typecheck       # MUST pass before commit
npm run test            # MUST pass before commit
```

## 🔧 Working with This Codebase

### Testing Current v2 Code
- No test suite currently exists (empty `scripts.test` in package.json points to mocha)
- Use `samples/` directory for manual testing against API
- Key sample: `samples/serviceInvoice-issue.js` shows async pattern (202 response)

### Understanding API Patterns
1. **Service Invoice Flow**: Create → 202 + location → Poll until complete
2. **Authentication**: All requests use Basic Auth header with API key
3. **Scoping**: Most resources are company-scoped (require company_id)
4. **File Downloads**: PDF/XML downloads via specific endpoints with Accept headers

### OpenAPI Specs
- Location: `openapi/spec/` contains multiple YAML files
- **Main spec**: `nf-servico-v1.yaml` (6K+ lines) - Primary service invoice API
- **Issue**: May need manual OpenAPI spec creation if public spec unavailable

### Environment Configuration
- **Production**: `api.nfe.io/v1/`
- **Sandbox**: Check for test environment patterns in samples
- **Timeouts**: Configurable via `nfe.setTimeout()` (default: Node.js server timeout)

### Error Patterns to Maintain
```javascript
// v2 pattern - preserve in v3
try {
  const invoice = await nfe.serviceInvoices.create(companyId, data);
  if (invoice.code === 202) {
    // Handle async processing
    const location = invoice.location;
  }
} catch (err) {
  if (err.type === 'AuthenticationError') {
    // Handle auth error
  }
}
```

## 🚨 Critical Integration Points

### External Dependencies (Current)
- **when@3.1.0**: Promise library (replace with native promises in v3)
- **Node built-ins**: http, https, path, child_process for uname

### API Behavior Quirks
- **Buffer encoding**: API key encoded as `new Buffer(key)` (not base64)
- **FormData handling**: Certificate uploads require special FormData processing
- **URL construction**: Manual path joining with Windows workaround (`replace(/\\/g, '/')`)
- **Async responses**: 201/202 responses have different structures than 200

### Backwards Compatibility Requirements
- Maintain same method signatures where possible
- Preserve callback + promise dual API pattern
- Keep company_id scoping model
- Maintain same error types and properties

## 💡 AI Agent Guidelines

### When working on v2 maintenance:
- Follow existing `BaseResource.extend()` pattern
- Add new resources to `lib/resources/` and register in `lib/nfe.js` 
- Use `restMethod()` factory for standard CRUD operations
- Test manually with samples/ since no automated tests exist

### When working on v3 development:
- Always run generation pipeline before handwritten code
- Use generated types from `src/generated/schema.ts` 
- Implement DX improvements in `src/client/` layer
- Write tests alongside implementation (missing in v2)
- Follow TypeScript strict mode - no `any` types

### Cross-version considerations:
- Document breaking changes in CHANGELOG.md
- Provide migration examples for major pattern shifts
- Maintain functional compatibility even if syntax changes
- Consider gradual migration path for large codebases

The goal is seamless modernization that preserves the NFE.io API's powerful service invoice capabilities while providing modern TypeScript DX.