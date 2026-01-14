# Design: Implement Companies Resource

**Change ID**: `implement-companies-resource`  
**Status**: Draft  

---

## Overview

This document describes the design for completing the Companies resource implementation in the NFE.io SDK v3. The Companies resource is fundamental to the SDK as it provides the foundation for all company-scoped operations (service invoices, people management, etc.).

---

## Architecture

### Current State

```
src/core/resources/companies.ts (239 lines)
├── Basic CRUD operations (create, list, retrieve, update, remove)
├── Certificate management (uploadCertificate, getCertificateStatus)
└── Simple helpers (findByTaxNumber, getCompaniesWithCertificates, createBatch)

tests/integration/companies.integration.test.ts (209 lines)
├── Integration tests for basic CRUD
└── Integration tests for certificate operations

tests/unit/companies.test.ts
└── Basic unit tests (needs expansion)
```

### Target State

```
src/core/resources/companies.ts (~400 lines)
├── Core CRUD Operations (enhanced)
│   ├── create() - with validation and retry
│   ├── list() - with proper pagination
│   ├── listAll() - auto-pagination helper
│   ├── listIterator() - async iteration support
│   ├── retrieve() - with error handling
│   ├── update() - with partial updates
│   └── remove() - with cascade warnings
│
├── Certificate Management (complete)
│   ├── uploadCertificate() - with validation and retry
│   ├── getCertificateStatus() - enhanced metadata
│   ├── validateCertificate() - pre-upload validation
│   ├── replaceCertificate() - rotation helper
│   └── checkCertificateExpiration() - warning helper
│
└── Search & Filters (enhanced)
    ├── findByTaxNumber() - exact match
    ├── findByName() - pattern matching
    ├── getCompaniesWithActiveCertificates()
    ├── getCompaniesWithExpiredCertificates()
    └── getCompaniesWithExpiringSoonCertificates()

src/core/utils/certificate-validator.ts (new, ~100 lines)
├── Certificate parsing
├── Format validation (.pfx, .p12)
└── Metadata extraction

tests/ (comprehensive coverage)
├── unit/companies.test.ts (~500 lines)
├── unit/certificate-validator.test.ts (~200 lines)
└── integration/companies.integration.test.ts (~400 lines)
```

---

## Component Design

### 1. CompaniesResource Class

Main resource class that provides the public API:

```typescript
export class CompaniesResource {
  constructor(private readonly http: HttpClient) {}

  // Core CRUD
  async create(data: CreateCompanyData): Promise<Company>
  async list(options?: PaginationOptions): Promise<ListResponse<Company>>
  async listAll(): Promise<Company[]>
  async *listIterator(): AsyncIterableIterator<Company>
  async retrieve(companyId: string): Promise<Company>
  async update(companyId: string, data: Partial<Company>): Promise<Company>
  async remove(companyId: string): Promise<DeletionResponse>

  // Certificate Management
  async uploadCertificate(companyId: string, cert: CertificateData): Promise<UploadResponse>
  async getCertificateStatus(companyId: string): Promise<CertificateStatus>
  async validateCertificate(file: Buffer, password: string): Promise<ValidationResult>
  async replaceCertificate(companyId: string, cert: CertificateReplacement): Promise<UploadResponse>
  async checkCertificateExpiration(companyId: string, threshold?: number): Promise<ExpirationWarning | null>

  // Search & Filters
  async findByTaxNumber(taxNumber: number): Promise<Company | null>
  async findByName(namePattern: string): Promise<Company[]>
  async getCompaniesWithActiveCertificates(): Promise<Company[]>
  async getCompaniesWithExpiredCertificates(): Promise<Company[]>
  async getCompaniesWithExpiringSoonCertificates(daysThreshold?: number): Promise<Company[]>
}
```

### 2. Type Definitions

All types imported from generated OpenAPI types:

```typescript
// From src/generated/index.ts
import type { Company, CompanyData } from '../generated/index.js';

// SDK-specific types in src/core/types.ts
export type CreateCompanyData = Omit<Company, 'id' | 'createdOn' | 'modifiedOn'>;

export interface PaginationOptions {
  pageCount?: number;
  pageIndex?: number;
  // Or cursor-based if API supports
  cursor?: string;
}

export interface ListResponse<T> {
  data: T[];
  totalCount?: number;
  hasMore?: boolean;
  nextCursor?: string;
}

export interface CertificateData {
  file: Buffer | Blob;
  password: string;
  filename?: string;
  onProgress?: (percent: number) => void;
}

export interface CertificateStatus {
  hasCertificate: boolean;
  isValid: boolean;
  expiresOn?: string;
  daysUntilExpiration?: number;
  isExpiringSoon?: boolean; // < 30 days
  subject?: string;
  issuer?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  metadata?: {
    subject: string;
    issuer: string;
    expiresOn: string;
    validFrom: string;
  };
}

export interface CertificateReplacement {
  oldPassword?: string; // Optional verification
  newFile: Buffer | Blob;
  newPassword: string;
  newFilename?: string;
}

export interface ExpirationWarning {
  companyId: string;
  expiresOn: string;
  daysRemaining: number;
  message: string;
}
```

### 3. Certificate Validator Utility

Separate module for certificate validation logic:

```typescript
// src/core/utils/certificate-validator.ts
import { readPkcs12 } from 'node:crypto'; // Node 18+

export interface CertificateMetadata {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
}

export class CertificateValidator {
  /**
   * Validate certificate file and extract metadata
   */
  static async validate(
    file: Buffer,
    password: string
  ): Promise<{ valid: boolean; metadata?: CertificateMetadata; error?: string }> {
    try {
      // Parse PKCS#12 certificate
      const pkcs12 = readPkcs12(file, password);
      
      // Extract certificate
      const cert = pkcs12.certificate;
      if (!cert) {
        return { valid: false, error: 'No certificate found in file' };
      }

      // Parse metadata
      const metadata: CertificateMetadata = {
        subject: cert.subject,
        issuer: cert.issuer,
        validFrom: new Date(cert.validFrom),
        validTo: new Date(cert.validTo),
        serialNumber: cert.serialNumber
      };

      // Check if expired
      const now = new Date();
      if (now > metadata.validTo) {
        return { valid: false, error: 'Certificate has expired', metadata };
      }

      if (now < metadata.validFrom) {
        return { valid: false, error: 'Certificate is not yet valid', metadata };
      }

      return { valid: true, metadata };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid certificate or password'
      };
    }
  }

  /**
   * Check if certificate format is supported
   */
  static isSupportedFormat(filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    return ext === 'pfx' || ext === 'p12';
  }

  /**
   * Calculate days until expiration
   */
  static getDaysUntilExpiration(expiresOn: Date): number {
    const now = new Date();
    const diff = expiresOn.getTime() - now.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
```

---

## Error Handling Strategy

### Error Hierarchy

```typescript
// Use existing error classes from src/errors/

// Validation errors
class ValidationError extends NfeError {
  constructor(message: string, field?: string) {
    super(message, { field });
  }
}

// Not found errors
class NotFoundError extends NfeError {
  constructor(resourceType: string, id: string) {
    super(`${resourceType} not found: ${id}`, { id });
  }
}

// Certificate errors
class CertificateError extends NfeError {
  constructor(message: string, cause?: Error) {
    super(message, { cause });
  }
}
```

### Error Handling Patterns

```typescript
// In companies.ts

async create(data: CreateCompanyData): Promise<Company> {
  try {
    // Pre-flight validation
    this.validateCompanyData(data);

    // API call
    const response = await this.http.post<Company>('/companies', data);
    return response.data;
  } catch (error) {
    // Transform HTTP errors to typed errors
    if (error instanceof HttpError) {
      if (error.status === 400) {
        throw new ValidationError(error.message, error.field);
      }
      if (error.status === 401) {
        throw new AuthenticationError('Invalid API key');
      }
      if (error.status === 409) {
        throw new ConflictError('Company already exists');
      }
    }
    throw error;
  }
}
```

---

## Pagination Strategy

### Manual Pagination

```typescript
async list(options: PaginationOptions = {}): Promise<ListResponse<Company>> {
  const { pageCount = 20, pageIndex = 0 } = options;
  
  const response = await this.http.get<ListResponse<Company>>('/companies', {
    pageCount,
    pageIndex
  });

  return response.data;
}
```

### Auto-Pagination Helper

```typescript
async listAll(): Promise<Company[]> {
  const companies: Company[] = [];
  let pageIndex = 0;
  let hasMore = true;

  while (hasMore) {
    const page = await this.list({ pageCount: 100, pageIndex });
    companies.push(...page.data);
    
    // Check if there are more pages
    hasMore = page.hasMore ?? (page.data.length === 100);
    pageIndex++;
  }

  return companies;
}
```

### Async Iterator Pattern

```typescript
async *listIterator(): AsyncIterableIterator<Company> {
  let pageIndex = 0;
  let hasMore = true;

  while (hasMore) {
    const page = await this.list({ pageCount: 100, pageIndex });
    
    for (const company of page.data) {
      yield company;
    }

    hasMore = page.hasMore ?? (page.data.length === 100);
    pageIndex++;
  }
}

// Usage:
for await (const company of nfe.companies.listIterator()) {
  console.log(company.name);
}
```

---

## Testing Strategy

### Unit Testing Approach

Use Vitest with mock HTTP client:

```typescript
// tests/unit/companies.test.ts
import { describe, it, expect, vi } from 'vitest';
import { CompaniesResource } from '../../src/core/resources/companies';
import { HttpClient } from '../../src/core/http/client';

describe('CompaniesResource', () => {
  it('should create a company', async () => {
    const mockHttp = {
      post: vi.fn().mockResolvedValue({
        data: { id: 'company-123', name: 'Test Co' }
      })
    } as any;

    const companies = new CompaniesResource(mockHttp);
    const result = await companies.create({ name: 'Test Co', ... });

    expect(result.id).toBe('company-123');
    expect(mockHttp.post).toHaveBeenCalledWith('/companies', expect.any(Object));
  });
});
```

### Integration Testing Approach

Use real API with test data cleanup:

```typescript
// tests/integration/companies.integration.test.ts
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { NfeClient } from '../../src/core/client';

describe('Companies Integration', () => {
  let client: NfeClient;
  const createdIds: string[] = [];

  beforeAll(() => {
    client = new NfeClient({ apiKey: process.env.NFE_API_KEY });
  });

  afterEach(async () => {
    // Cleanup test data
    for (const id of createdIds) {
      try {
        await client.companies.remove(id);
      } catch {}
    }
    createdIds.length = 0;
  });

  it('should create and retrieve a company', async () => {
    const company = await client.companies.create({ name: 'Test Co', ... });
    createdIds.push(company.id);

    const retrieved = await client.companies.retrieve(company.id);
    expect(retrieved.id).toBe(company.id);
  });
});
```

---

## Performance Considerations

### 1. Pagination Performance

- Default page size: 20 (balances requests vs memory)
- Max page size: 100 (API limit)
- Auto-pagination uses 100 for efficiency

### 2. Certificate Validation Performance

- Validation done client-side before upload (saves failed upload attempts)
- Certificate parsing may take 50-100ms (acceptable for infrequent operation)
- Cache certificate status for repeated checks (future optimization)

---

## Security Considerations

### 1. Certificate Handling

- Certificates contain private keys - never log full contents
- Passwords should not be logged or stored
- Use secure memory for password handling
- Clear sensitive buffers after use

### 2. Input Validation

- Validate CNPJ/CPF format before API call
- Sanitize company names to prevent injection
- Validate email formats
- Check file sizes before upload (prevent DoS)

### 3. Error Messages

- Don't expose sensitive information in error messages
- Generic messages for authentication failures
- Detailed validation errors only for development environment

---

## Migration Path from v2

### v2 API (callback-based):

```javascript
nfe.companies.create(companyData, function(err, company) {
  if (err) {
    console.error(err);
  } else {
    console.log(company);
  }
});
```

### v3 API (async/await):

```typescript
try {
  const company = await nfe.companies.create(companyData);
  console.log(company);
} catch (error) {
  console.error(error);
}
```

### Migration Notes:

1. All methods return Promises instead of accepting callbacks
2. Error handling via try/catch instead of error-first callbacks
3. Type safety via TypeScript interfaces
4. Method names remain the same (except `delete` → `remove`)

---

## Open Design Questions

### 1. Certificate Storage

**Question**: Should we provide local certificate caching/storage helpers?
**Options**:
- A: No, users manage storage themselves
- B: Provide optional encrypted storage utility
- C: Integrate with system keychain

**Recommendation**: Option A for v1, consider B/C for future versions

### 2. Rate Limiting Strategy

**Question**: Should we implement client-side rate limiting?
**Options**:
- A: No client-side limiting, rely on API 429 responses + retry
- B: Track request counts and proactively throttle
- C: Configurable rate limiter with token bucket algorithm

**Recommendation**: Option A initially, B if users report frequent 429s

### 3. Batch Operation Errors

**Question**: How to handle partial failures in batch operations?
**Options**:
- A: Always continue on error, return mixed results
- B: Stop on first error if continueOnError=false
- C: Provide rollback mechanism for partial success

**Recommendation**: Option B (current design), consider A with transaction support later

---

## Dependencies

### Internal Dependencies
- `src/core/http/client.ts` - HTTP client with retry
- `src/core/errors/` - Error hierarchy
- `src/core/types.ts` - Type definitions
- `src/generated/` - OpenAPI-generated types

### External Dependencies
- `node:crypto` - Certificate parsing (Node 18+)
- `form-data` - FormData for certificate upload (if browser FormData insufficient)

### No New External Dependencies Required
- All functionality achievable with existing dependencies
- Node 18+ provides native crypto APIs
- FormData may need polyfill for Node.js (already in dependencies)

---

## Success Metrics

### Code Quality
- [ ] Test coverage >90% for companies.ts
- [ ] Zero TypeScript errors
- [ ] Zero linting warnings
- [ ] No `any` types in public API

### Functionality
- [ ] All 19 tasks completed
- [ ] All CRUD operations working
- [ ] Certificate management complete
- [ ] Helper methods implemented

### Documentation
- [ ] Complete JSDoc for all public methods
- [ ] API.md updated
- [ ] Migration guide updated
- [ ] Examples validated against real API

### Performance
- [ ] list() operation < 500ms for 100 companies
- [ ] Certificate upload < 5s for typical certificate

---

## Future Enhancements (Out of Scope)

1. **Webhook Support**: Notifications for company events (created, updated, certificate expired)
2. **Company Analytics**: Dashboard data, usage statistics
3. **Certificate Auto-Renewal**: Automated certificate rotation before expiration
4. **Advanced Search**: Full-text search, complex filters, saved queries
5. **Audit Trail**: Track all company modifications with user attribution
6. **Multi-Company Operations**: Cross-company reports and analytics

These are explicitly out of scope for this change but documented for future consideration.
