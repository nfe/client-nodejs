/**
 * Test setup for NFE.io SDK v3
 * Configures vitest environment and provides test utilities
 */

import type { Webhook, WebhookEvent } from '../src/core/types.js';

// Global test configuration
globalThis.fetch = globalThis.fetch || (() => {
  throw new Error('Fetch not available in test environment');
});

globalThis.AbortController = globalThis.AbortController || class AbortController {
  signal = { aborted: false };
  abort() {
    this.signal.aborted = true;
  }
};

// Mock environment variables for tests (only if not already set)
process.env.NODE_ENV = 'test';
// Don't override NFE_API_KEY if it's already set (for integration tests)
if (!process.env.NFE_API_KEY || process.env.NFE_API_KEY === '') {
  process.env.NFE_API_KEY = 'test-api-key';
}

// Test constants
export const TEST_API_KEY = 'test-api-key-12345';
export const TEST_COMPANY_ID = 'test-company-id';
export const TEST_INVOICE_ID = 'test-invoice-id';
export const TEST_WEBHOOK_ID = 'test-webhook-id';
export const TEST_PERSON_ID = 'test-person-id';

// Mock data helpers
export const createMockCompany = (overrides = {}) => ({
  id: TEST_COMPANY_ID,
  name: 'Test Company',
  tradeName: 'Test Company Ltd',
  federalTaxNumber: 12345678000190,
  email: 'test@example.com',
  taxRegime: 'SimplesNacional' as const,
  address: {
    country: 'BRA',
    postalCode: '01310-100',
    street: 'Av. Paulista',
    number: '1578',
    district: 'Bela Vista',
    city: { code: '3550308', name: 'São Paulo' },
    state: 'SP',
  },
  ...overrides,
});

export const createMockInvoice = (overrides = {}) => ({
  id: TEST_INVOICE_ID,
  environment: 'Production' as const,
  flowStatus: 'Issued' as const,
  flowMessage: undefined,
  description: 'Test service description',
  createdOn: '2024-01-01T00:00:00Z',
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
        name: 'São Paulo',
      },
      state: 'SP',
    },
  },
  cityServiceCode: '01234',
  servicesAmount: 1000.0,
  ...overrides,
});

export const createMockWebhook = (overrides: Partial<Webhook> = {}): Webhook => ({
  id: TEST_WEBHOOK_ID,
  url: 'https://example.com/webhook',
  events: ['invoice.issued', 'invoice.cancelled'] as WebhookEvent[],
  active: true,
  ...overrides,
});

export const createMockLegalPerson = (overrides = {}) => ({
  id: TEST_PERSON_ID,
  name: 'Legal Person Company',
  tradeName: 'Legal Person Ltd',
  federalTaxNumber: 12345678000190,
  email: 'legal@example.com',
  address: {
    country: 'BRA',
    postalCode: '01310-100',
    street: 'Av. Paulista',
    number: '2000',
    district: 'Bela Vista',
    city: { code: '3550308', name: 'São Paulo' },
    state: 'SP',
  },
  ...overrides,
});

export const createMockNaturalPerson = (overrides = {}) => ({
  id: TEST_PERSON_ID,
  name: 'John Doe',
  federalTaxNumber: 12345678901,
  email: 'john@example.com',
  address: {
    country: 'BRA',
    postalCode: '01310-100',
    street: 'Rua Augusta',
    number: '500',
    city: { code: '3550308', name: 'São Paulo' },
    state: 'SP',
  },
  ...overrides,
});
