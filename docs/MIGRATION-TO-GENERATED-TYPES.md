# Migration Guide: Handwritten Types → Generated Types

This guide shows how to migrate from handwritten TypeScript interfaces to OpenAPI-generated types in the NFE.io SDK.

## Overview

**Why migrate?**
- ✅ **Type Safety**: Types automatically match API spec
- ✅ **Maintainability**: Single source of truth (OpenAPI spec)
- ✅ **Automation**: CI validates specs and regenerates types
- ✅ **Documentation**: OpenAPI spec serves as API documentation

**What changed in v3?**
- Handwritten interfaces in `src/core/types.ts` → Generated types in `src/generated/`
- Manual type definitions → Automatic generation from `openapi/spec/*.yaml`

---

## Before & After Examples

### Example 1: Importing Types

#### ❌ Before (v2 - Handwritten)

```typescript
// src/core/resources/service-invoices.ts
import { ServiceInvoice, ServiceInvoiceData } from '../types';

export class ServiceInvoicesResource {
  async create(companyId: string, data: ServiceInvoiceData): Promise<ServiceInvoice> {
    // ...
  }
}
```

#### ✅ After (v3 - Generated)

```typescript
// src/core/resources/service-invoices.ts
import type { 
  ServiceInvoice, 
  ServiceInvoiceData 
} from '../types.js'; // Re-exports from generated/

export class ServiceInvoicesResource {
  async create(companyId: string, data: ServiceInvoiceData): Promise<ServiceInvoice> {
    // ...
  }
}
```

**Key changes:**
- Import from `../types.js` (which re-exports from `generated/`)
- Use `import type` for type-only imports
- Types now match OpenAPI spec exactly

---

### Example 2: Field Name Changes

#### ❌ Before (Handwritten)

```typescript
interface ServiceInvoice {
  id: string;
  status: 'issued' | 'processing' | 'failed' | 'cancelled';
  number: string;
  companyId: string;
  // ...
}

// Usage:
const invoice = await nfe.serviceInvoices.retrieve(companyId, invoiceId);
if (invoice.status === 'issued') {
  console.log(`Invoice ${invoice.number} issued`);
}
```

#### ✅ After (Generated from OpenAPI)

```typescript
interface ServiceInvoice {
  id: string;
  flowStatus: 'Issued' | 'WaitingSend' | 'IssueFailed' | 'CancelFailed' | 'Cancelled';
  rpsNumber: number;
  environment: 'Production' | 'Homologation';
  // Note: companyId not in API response (use from request context)
  // ...
}

// Usage:
const invoice = await nfe.serviceInvoices.retrieve(companyId, invoiceId);
if (invoice.flowStatus === 'Issued') {
  console.log(`Invoice ${invoice.rpsNumber} issued`);
}
```

**Key changes:**
- `status` → `flowStatus`
- `'issued'` → `'Issued'` (PascalCase enum values)
- `number: string` → `rpsNumber: number`
- `companyId` removed (not in API response)

---

### Example 3: Company Types

#### ❌ Before (Handwritten)

```typescript
interface Company {
  id: string;
  name: string;
  email: string;
  federalTaxNumber: string;
  taxRegime: number;
  address: Address;
}

interface Address {
  street: string;
  number: string;
  city: string;
  state: string;
  postalCode: string;
}
```

#### ✅ After (Generated)

```typescript
interface Company {
  id: string;
  name: string;
  tradeName?: string; // New field
  email: string;
  federalTaxNumber: number; // Changed from string
  taxRegime: 'SimplesNacional' | 'SimplesNacionalExcesso' | 'RegimeNormal'; // Enum
  address: {
    country: string;
    postalCode: string;
    street: string;
    number: string;
    district: string; // New required field
    city: {
      code: string;
      name: string;
    };
    state: string;
  };
}
```

**Key changes:**
- `taxRegime: number` → `taxRegime: 'SimplesNacional' | ...` (typed enum)
- `federalTaxNumber: string` → `federalTaxNumber: number`
- `address.city` is now an object with `code` and `name`
- Added `tradeName` (optional) and `address.district` (required)

---

### Example 4: Updating Resource Methods

#### ❌ Before (Handwritten types)

```typescript
// src/core/resources/service-invoices.ts
import { ServiceInvoice } from '../types';

export class ServiceInvoicesResource {
  private isComplete(invoice: ServiceInvoice): boolean {
    return invoice.status === 'issued';
  }
  
  private isFailed(invoice: ServiceInvoice): boolean {
    return invoice.status === 'failed';
  }
}
```

#### ✅ After (Generated types)

```typescript
// src/core/resources/service-invoices.ts
import type { ServiceInvoice } from '../types.js';

export class ServiceInvoicesResource {
  private isInvoiceComplete(invoice: ServiceInvoice): boolean {
    return invoice.flowStatus === 'Issued';
  }
  
  private isInvoiceFailed(invoice: ServiceInvoice): boolean {
    return invoice.flowStatus === 'IssueFailed' || 
           invoice.flowStatus === 'CancelFailed';
  }
}
```

**Key changes:**
- Check `flowStatus` instead of `status`
- Use PascalCase enum values: `'Issued'`, `'IssueFailed'`, `'CancelFailed'`
- Multiple failure states now supported

---

### Example 5: Test Mocks

#### ❌ Before (Old structure)

```typescript
// tests/setup.ts
export const createMockInvoice = () => ({
  id: 'test-invoice-id',
  status: 'issued',
  number: '12345',
  companyId: 'test-company-id',
  // ...
});
```

#### ✅ After (New structure)

```typescript
// tests/setup.ts
export const createMockInvoice = (overrides = {}) => ({
  id: 'test-invoice-id',
  environment: 'Production' as const,
  flowStatus: 'Issued' as const,
  rpsNumber: 12345, // number, not string
  // Note: companyId removed (not in API response)
  borrower: {
    type: 'LegalEntity' as const,
    name: 'Client Name',
    email: 'client@example.com',
    federalTaxNumber: 12345678000190, // number
    // ...
  },
  ...overrides,
});
```

**Key changes:**
- `status: 'issued'` → `flowStatus: 'Issued'` with `as const`
- `number: '12345'` → `rpsNumber: 12345` (number type)
- Added required fields: `environment`, `borrower`
- Removed `companyId`

---

## Migration Checklist

### 1. Update Type Imports

- [ ] Change imports from local interfaces to generated types
- [ ] Use `import type` for type-only imports
- [ ] Import from `../types.js` (or `src/core/types.ts` from project root)

```typescript
// ✅ Correct
import type { ServiceInvoice, Company } from '../types.js';

// ❌ Incorrect
import { ServiceInvoice, Company } from './local-types';
```

---

### 2. Update Field Names

- [ ] `status` → `flowStatus`
- [ ] `number` → `rpsNumber`
- [ ] Check for `companyId` (not in API responses)
- [ ] Verify nested object structures (e.g., `city` is now `{ code, name }`)

**Migration helper - Find and replace patterns:**

```bash
# Find status references
grep -r "\.status\b" src/

# Find number references  
grep -r "\.number\b" src/

# Find companyId in responses
grep -r "invoice\.companyId" src/
```

---

### 3. Update Enum Values

- [ ] Change lowercase → PascalCase
- [ ] Update all enum comparisons

**Common mappings:**

| Old Value (v2)      | New Value (v3)        |
|---------------------|-----------------------|
| `'issued'`          | `'Issued'`            |
| `'processing'`      | `'WaitingSend'`       |
| `'failed'`          | `'IssueFailed'`       |
| `'cancelled'`       | `'Cancelled'`         |

```typescript
// ✅ Correct
if (invoice.flowStatus === 'Issued') { ... }

// ❌ Incorrect  
if (invoice.status === 'issued') { ... }
```

---

### 4. Update Test Mocks

- [ ] Update `createMockInvoice()` to use new fields
- [ ] Update `createMockCompany()` to include new required fields
- [ ] Change enum values to PascalCase
- [ ] Update field types (strings → numbers where applicable)

```typescript
// Example mock update
const mockInvoice = createMockInvoice({
  flowStatus: 'Issued',      // not 'issued'
  rpsNumber: 12345,          // number, not string
  environment: 'Production', // new required field
});
```

---

### 5. Validate Migration

- [ ] Run `npm run typecheck` - should pass with 0 errors
- [ ] Run `npm test` - all tests should pass
- [ ] Check for TypeScript errors in IDE
- [ ] Review any `@ts-ignore` or `@ts-expect-error` comments

```bash
# Validation commands
npm run typecheck  # Must pass
npm run lint       # Must pass
npm test           # Must pass
npm run build      # Must pass
```

---

## Type Import Patterns

### Pattern 1: Direct Import from Generated

```typescript
// For internal SDK code
import type { ServiceInvoice } from '../../generated/nf-servico.js';
```

**Use when**: Working directly with generated types in SDK internals.

---

### Pattern 2: Import from types.ts (Recommended)

```typescript
// For resources and public API
import type { ServiceInvoice, Company } from '../types.js';
```

**Use when**: Building resources or public API. This provides a stable import path even if generation structure changes.

---

### Pattern 3: Re-export for Extensions

```typescript
// For SDK extensions (MCP, n8n, etc.)
import type { ServiceInvoice, Company } from '@nfe-io/sdk';
```

**Use when**: Building extensions that use the SDK as a dependency.

---

## Common Migration Issues

### Issue 1: "Property 'status' does not exist on type 'ServiceInvoice'"

**Cause**: Using old field name `status` instead of `flowStatus`.

**Solution**:
```typescript
// ❌ Before
if (invoice.status === 'issued') { ... }

// ✅ After  
if (invoice.flowStatus === 'Issued') { ... }
```

---

### Issue 2: "Type 'string' is not assignable to type 'number'"

**Cause**: Field type changed (e.g., `federalTaxNumber`, `rpsNumber`).

**Solution**:
```typescript
// ❌ Before
const company = { federalTaxNumber: '12345678000190' };

// ✅ After
const company = { federalTaxNumber: 12345678000190 };
```

---

### Issue 3: "Property 'district' is missing in type"

**Cause**: New required fields added to match API spec.

**Solution**:
```typescript
// ❌ Before
const address = {
  street: 'Av. Paulista',
  number: '1000',
  city: 'São Paulo',
  state: 'SP',
};

// ✅ After
const address = {
  street: 'Av. Paulista',
  number: '1000',
  district: 'Bela Vista', // New required field
  city: { code: '3550308', name: 'São Paulo' }, // Now an object
  state: 'SP',
};
```

---

### Issue 4: "Enum value mismatch"

**Cause**: Enum values changed from lowercase to PascalCase.

**Solution**:
```typescript
// ❌ Before
const status = 'processing';

// ✅ After  
const status = 'WaitingSend';
```

---

## Regenerating Types

If OpenAPI specs change:

```bash
# 1. Validate specs
npm run validate:spec

# 2. Regenerate types
npm run generate

# 3. Check for breaking changes
npm run typecheck

# 4. Update code if needed
# (TypeScript will show errors where types changed)

# 5. Run tests
npm test
```

---

## FAQ

### Q: Can I edit generated types manually?

**A: No.** Generated files have a `// ⚠️ AUTO-GENERATED - DO NOT EDIT` banner. Manual edits will be overwritten on next generation.

**Instead**: Edit the OpenAPI spec in `openapi/spec/` and regenerate.

---

### Q: What if I need custom types?

**A: Use type composition** in `src/core/types.ts`:

```typescript
// src/core/types.ts
import type { ServiceInvoice as GeneratedInvoice } from '../generated/index.js';

// Add custom fields while preserving generated structure
export interface ServiceInvoiceWithMetadata extends GeneratedInvoice {
  metadata: {
    createdAt: Date;
    updatedAt: Date;
  };
}
```

---

### Q: How do I know if types changed after regeneration?

**A: Run TypeScript compiler**:

```bash
npm run typecheck
```

TypeScript will report all type errors. Fix code to match new types.

---

### Q: Can I skip generation during development?

**A: Yes**, but not recommended:

```bash
# Skip prebuild validation (faster local builds)
npm run build -- --skip-prebuild

# But you should validate before committing:
npm run validate:spec
npm run generate
```

CI will always validate and regenerate to catch issues.

---

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [openapi-typescript docs](https://github.com/drwpow/openapi-typescript)
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Development workflow
- [tests/setup.ts](../tests/setup.ts) - Mock examples

---

**Need help?** Open an issue at https://github.com/nfe/client-nodejs/issues
