/**
 * Example: Using NFE.io SDK with IntelliSense (JSDoc Documentation)
 *
 * This example demonstrates how the comprehensive JSDoc documentation
 * provides excellent IDE autocomplete and inline documentation.
 *
 * Try this in VS Code to see:
 * - Hover over any method to see documentation
 * - Type `nfe.` to see all available resources
 * - Type `nfe.serviceInvoices.` to see all invoice methods
 * - Parameter hints when calling methods
 */

import {
  NfeClient,
  createClientFromEnv,
  isEnvironmentSupported,
  validateApiKeyFormat,
  AuthenticationError,
  ValidationError
} from 'nfe-io';

// Example 1: Environment validation with full documentation
const envCheck = isEnvironmentSupported();
console.log('Environment check:', envCheck);
// Hover over isEnvironmentSupported to see:
// - What it does
// - Return type with property descriptions
// - Usage examples

// Example 2: Create client with inline documentation
// Type "new NfeClient({" and see parameter documentation
const nfe = new NfeClient({
  apiKey: 'demo-api-key',
  environment: 'production', // Hover to see: 'production' | 'development'
  timeout: 30000, // Hover to see: "Request timeout in milliseconds"
  retryConfig: {
    maxRetries: 3, // Hover to see: "Maximum retry attempts"
    baseDelay: 1000,
    maxDelay: 30000
  }
});

// Example 3: Resource methods with full documentation
async function demonstrateJSDoc() {
  // Type "nfe." and see all resources with descriptions
  const companyId = 'example-company-id';

  // Type "nfe.serviceInvoices." to see all methods with descriptions
  // Hover over "create" to see full documentation with examples
  await nfe.serviceInvoices.create(companyId, {
    borrower: {
      type: 'LegalEntity' as const,
      name: 'Client Name',
      email: 'client@example.com',
      federalTaxNumber: 12345678000190,
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
    servicesAmount: 1000.00,
    description: 'Service description'
  });

  // Hover over "createAndWait" to see:
  // - Full method documentation
  // - Parameter descriptions
  // - Return type
  // - Usage examples
  console.log('Invoice created successfully');

  // Example 4: Utility methods with documentation
  // Hover over "healthCheck" to see usage examples
  const health = await nfe.healthCheck();
  console.log('Health check:', health.status);

  // Hover over "getClientInfo" to see what information is returned
  const info = nfe.getClientInfo();
  console.log('SDK version:', info.version);

  // Example 5: Error handling with documented error types
  try {
    await nfe.serviceInvoices.create(companyId, {} as any);
  } catch (error) {
    // Hover over error classes to see when they're thrown
    if (error instanceof AuthenticationError) {
      console.error('Invalid API key');
    } else if (error instanceof ValidationError) {
      console.error('Validation failed:', error.details);
    }
  }

  // Example 6: Helper functions with documentation
  // Hover to see full docs with examples
  const apiKeyValidation = validateApiKeyFormat('test-key');
  if (!apiKeyValidation.valid) {
    console.error('Issues:', apiKeyValidation.issues);
  }

  // Hover to see environment variable requirements
  const envClient = createClientFromEnv('production');

  // Example 7: Resource-specific operations with docs
  // All webhook methods have comprehensive documentation
  const webhook = await nfe.webhooks.create(companyId, {
    url: 'https://example.com/webhook',
    events: ['invoice.issued', 'invoice.cancelled'],
    secret: 'webhook-secret'
  });

  // Hover over "validateSignature" to see HMAC validation docs
  const isValid = nfe.webhooks.validateSignature(
    '{"event": "invoice.issued"}',
    'signature-from-header',
    'webhook-secret'
  );

  // Example 8: Company operations with certificate upload
  const certBuffer = Buffer.from('certificate-data');

  // Hover over "uploadCertificate" to see FormData handling docs
  const certResult = await nfe.companies.uploadCertificate(companyId, {
    file: certBuffer,
    password: 'certificate-password',
    filename: 'certificate.pfx'
  });
  console.log('Certificate uploaded:', certResult.uploaded);

  // Example 9: Legal/Natural people with tax number lookup
  // Hover to see CNPJ lookup documentation
  const legalPerson = await nfe.legalPeople.findByTaxNumber(
    companyId,
    '12345678000190'
  );

  // Hover to see CPF lookup documentation
  const naturalPerson = await nfe.naturalPeople.findByTaxNumber(
    companyId,
    '12345678901'
  );
}

// Example 10: Configuration management
// All config methods have JSDoc with examples
nfe.setTimeout(60000); // Hover to see v2 compatibility note
nfe.setApiKey('new-key'); // Hover to see equivalent updateConfig usage

const currentConfig = nfe.getConfig(); // Hover to see readonly note
console.log('Current environment:', currentConfig.environment);

/**
 * IntelliSense Benefits:
 *
 * 1. **Method Discovery**: Type `nfe.` to see all resources
 * 2. **Parameter Hints**: See parameter types and descriptions as you type
 * 3. **Return Types**: Know what you'll get back from methods
 * 4. **Examples**: Inline code examples for complex operations
 * 5. **Error Documentation**: Know which errors can be thrown
 * 6. **Type Safety**: TypeScript integration with JSDoc
 * 7. **Quick Reference**: No need to leave IDE to check API docs
 * 8. **Best Practices**: Learn recommended patterns from examples
 *
 * Try It:
 * - Open this file in VS Code
 * - Hover over any method or type
 * - Use Ctrl+Space for autocomplete
 * - Press F12 to go to definition
 * - Use Ctrl+Shift+Space for parameter hints
 */

export { demonstrateJSDoc };
