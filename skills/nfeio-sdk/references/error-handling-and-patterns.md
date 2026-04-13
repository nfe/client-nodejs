# Error Handling & Cross-Cutting Patterns

Detailed reference for error classes, retry logic, polling, and certificate validation.

## Error Class Hierarchy

All errors extend the base `NfeError` class:

```
NfeError (base)
  HTTP errors (from API responses):
    AuthenticationError    (401)
    ValidationError        (400, 422)
    NotFoundError          (404)
    ConflictError          (409)
    RateLimitError         (429)
    ServerError            (500, 502, 503, 504)
  Network errors:
    ConnectionError        (DNS, network failures)
    TimeoutError           (AbortController timeout)
  SDK errors:
    ConfigurationError     (invalid SDK config)
    PollingTimeoutError    (polling exceeded timeout)
    InvoiceProcessingError (invoice reached failed state)
```

### NfeError (Base Class)

```typescript
class NfeError extends Error {
  readonly type: string;        // Error class name (e.g., 'ValidationError')
  readonly code?: number;       // HTTP status code
  readonly status?: number;     // Alias for code
  readonly details?: unknown;   // API error details (often has message, errors array)
  readonly raw?: unknown;       // Raw response body

  get statusCode(): number | undefined;  // Getter alias for code
  toJSON(): object;                       // Serializable representation
}
```

### Error Properties by Type

| Error | Status | When | Key Details |
|-------|--------|------|-------------|
| `AuthenticationError` | 401 | Invalid/missing API key | Check `apiKey` config |
| `ValidationError` | 400/422 | Bad request data | `details` has field-level errors |
| `NotFoundError` | 404 | Resource doesn't exist | Check ID/access key |
| `ConflictError` | 409 | Duplicate resource | Existing resource info in `details` |
| `RateLimitError` | 429 | Too many requests | Auto-retried by HTTP client |
| `ServerError` | 5xx | Server failures | Auto-retried by HTTP client |
| `ConnectionError` | - | Network/DNS failure | Auto-retried by HTTP client |
| `TimeoutError` | - | Request exceeded timeout | Increase `timeout` config |
| `ConfigurationError` | - | Bad SDK config | Missing apiKey, bad env, etc. |
| `PollingTimeoutError` | - | Polling exceeded timeout | Increase polling `timeout` option |
| `InvoiceProcessingError` | - | Invoice failed processing | `details.flowStatus`, `details.flowMessage` |

## Type Guard Functions

Use type guards for runtime checking without `instanceof`:

```typescript
import {
  isNfeError,
  isAuthenticationError,
  isValidationError,
  isNotFoundError,
  isConnectionError,
  isTimeoutError,
  isPollingTimeoutError,
} from 'nfe-io';

try {
  await nfe.serviceInvoices.create(companyId, data);
} catch (error) {
  if (isValidationError(error)) {
    // error is typed as ValidationError
    console.error('Fields:', error.details);
  } else if (isNfeError(error)) {
    // error is typed as NfeError (any SDK error)
    console.error(`[${error.type}] ${error.message}`);
  }
}
```

## ErrorFactory

Create errors programmatically (useful for testing or custom middleware):

```typescript
import { ErrorFactory } from 'nfe-io';

// From HTTP response
const error = ErrorFactory.fromHttpResponse(404, { message: 'Not found' });
// Returns NotFoundError instance

// From network error
const error = ErrorFactory.fromNetworkError(new TypeError('fetch failed'));
// Returns ConnectionError instance

// From missing API key
const error = ErrorFactory.fromMissingApiKey();
// Returns ConfigurationError instance
```

## Legacy Aliases (v2 Compatibility)

```typescript
import { BadRequestError, APIError, InternalServerError } from 'nfe-io';

// BadRequestError === ValidationError
// APIError === NfeError
// InternalServerError === ServerError
```

---

## Retry Configuration

The HTTP client automatically retries on transient failures.

### Default Configuration

```typescript
{
  maxRetries: 3,
  baseDelay: 1000,         // 1 second
  maxDelay: 30000,         // 30 seconds
  backoffMultiplier: 2,    // Exponential backoff
}
```

### Retry Behavior

| Condition | Retried? |
|-----------|----------|
| 5xx server errors | Yes |
| 429 rate limit | Yes |
| Network errors | Yes |
| Request timeout | Yes |
| 4xx client errors (except 429) | No |
| `AuthenticationError` (401) | No |
| `ValidationError` (400) | No |
| `NotFoundError` (404) | No |

### Backoff Formula

```
delay = min(baseDelay * (multiplier ^ attempt) + jitter, maxDelay)
```

Jitter is ~10% random variation to prevent thundering herd.

### Custom Retry Config

```typescript
const nfe = new NfeClient({
  apiKey: 'xxx',
  retryConfig: {
    maxRetries: 5,           // More retries for unreliable networks
    baseDelay: 2000,         // Start slower
    maxDelay: 60000,         // Allow up to 1 minute between retries
    backoffMultiplier: 1.5,  // Gentler backoff
  },
});
```

---

## Polling Utility

The internal polling utility powers `createAndWait()` and `pollUntilComplete()`.

### Generic Poll Function

```typescript
import type { PollingOptions } from 'nfe-io';

interface PollingOptions<T> {
  fn: () => Promise<T>;                    // Function to call repeatedly
  isComplete: (result: T) => boolean;      // Completion checker
  timeout?: number;                        // Total timeout (default: 120000ms)
  initialDelay?: number;                   // First delay (default: 1000ms)
  maxDelay?: number;                       // Max between polls (default: 10000ms)
  backoffFactor?: number;                  // Exponential (default: 1.5)
  onPoll?: (attempt: number, result: T) => void;
  onError?: (error: Error, attempt: number) => boolean; // Return false to stop
}
```

### NfeClient.pollUntilComplete()

Direct access to polling on the client:

```typescript
const result = await nfe.pollUntilComplete<ServiceInvoiceData>(
  locationUrl,   // URL from 202 response Location header
  {
    maxAttempts: 30,     // Default: 30
    intervalMs: 2000,    // Default: 2000ms
  }
);
```

### Polling Best Practices

1. **Set adequate timeout**: Default 2 minutes is often insufficient. Use 5 minutes (`timeout: 300000`) for production.
2. **Use `onPoll` callback**: Log progress for debugging and monitoring.
3. **Handle `PollingTimeoutError`**: The invoice may still be processing. Store the ID and check later.
4. **Prefer `createAndWait()`**: Over manual create + poll. Handles edge cases (ID extraction, status checking).

---

## CertificateValidator

Standalone utility for validating A1 digital certificates (PFX/P12 format).

```typescript
import { CertificateValidator } from 'nfe-io';
import { readFileSync } from 'node:fs';

const certBuffer = readFileSync('certificate.pfx');

// Full validation
const result = await CertificateValidator.validate(certBuffer, 'password');
if (result.valid) {
  console.log('Subject:', result.metadata?.subject);
  console.log('Issuer:', result.metadata?.issuer);
  console.log('Valid from:', result.metadata?.validFrom);
  console.log('Valid to:', result.metadata?.validTo);
} else {
  console.error('Invalid:', result.error);
}
```

---

## Common Error Handling Patterns

### Full Error Handler

```typescript
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  TimeoutError,
  PollingTimeoutError,
  InvoiceProcessingError,
  NfeError,
} from 'nfe-io';

async function safeCreateInvoice(companyId: string, data: any) {
  try {
    return await nfe.serviceInvoices.createAndWait(companyId, data, {
      timeout: 300000,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      // API key is invalid or expired
      throw new Error('NFE.io authentication failed. Check your API key.');
    }
    if (error instanceof ValidationError) {
      // Request data is invalid
      const details = error.details as any;
      throw new Error(`Invalid invoice data: ${JSON.stringify(details)}`);
    }
    if (error instanceof NotFoundError) {
      // Company or resource not found
      throw new Error(`Company ${companyId} not found`);
    }
    if (error instanceof PollingTimeoutError) {
      // Invoice is still processing, not an error per se
      console.warn('Invoice still processing, will check again later');
      return null; // Handle async follow-up
    }
    if (error instanceof InvoiceProcessingError) {
      // Municipality rejected the invoice
      const details = error.details as any;
      throw new Error(`Invoice rejected: ${details?.flowMessage || error.message}`);
    }
    if (error instanceof RateLimitError) {
      // Shouldn't happen (auto-retried) but handle just in case
      throw new Error('Rate limited by NFE.io API');
    }
    if (error instanceof TimeoutError) {
      // Request timeout (not polling timeout)
      throw new Error('NFE.io API request timed out');
    }
    // Unknown error
    throw error;
  }
}
```

### Logging Errors

```typescript
catch (error) {
  if (error instanceof NfeError) {
    // Structured logging
    console.error(JSON.stringify(error.toJSON()));
    // Output: { type, message, code, details, raw }
  }
}
```

### Retry Manual Operations

For operations not automatically retried (like 400 errors after fixing data):

```typescript
async function retryWithFix(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof ValidationError && i < maxRetries - 1) {
        // Log and attempt to fix data before retry
        console.warn(`Validation error (attempt ${i + 1}):`, error.details);
        continue;
      }
      throw error;
    }
  }
}
```
