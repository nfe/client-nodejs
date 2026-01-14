/**
 * Integration tests setup
 *
 * These tests run against the real NFE.io API (development or production)
 * Requires valid API credentials
 */

import { NfeClient } from '../../src/core/client.js';

// Environment configuration
export const INTEGRATION_TEST_CONFIG = {
  // Use development API by default for integration tests
  environment: (process.env.NFE_TEST_ENVIRONMENT as 'development' | 'production') || 'development',

  // API key from environment variable (filter out empty strings)
  apiKey: process.env.NFE_API_KEY?.trim() || process.env.NFE_TEST_API_KEY?.trim() || '',

  // Timeout for integration tests (longer than unit tests)
  timeout: 30000, // 30 seconds

  // Retry configuration for flaky network
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000,
  },
};

// Check if integration tests should run
export function shouldRunIntegrationTests(): boolean {
  const apiKey = INTEGRATION_TEST_CONFIG.apiKey;
  const hasApiKey = apiKey.length > 0 && apiKey !== 'undefined' && apiKey !== 'null';
  const isCI = process.env.CI === 'true';
  const forceRun = process.env.RUN_INTEGRATION_TESTS === 'true';

  // Run if:
  // - Valid API key is available AND
  // - Either forced OR not in CI (to avoid accidental API calls in CI without explicit opt-in)
  return hasApiKey && (forceRun || !isCI);
}// Skip test if integration tests shouldn't run
export function skipIfNoApiKey() {
  if (!shouldRunIntegrationTests()) {
    return 'skip';
  }
  return false;
}

// Create client for integration tests
export function createIntegrationClient(): NfeClient {
  if (!INTEGRATION_TEST_CONFIG.apiKey) {
    throw new Error(
      'NFE_API_KEY or NFE_TEST_API_KEY environment variable is required for integration tests.\n' +
      'Set RUN_INTEGRATION_TESTS=true to enable integration tests.'
    );
  }

  return new NfeClient({
    apiKey: INTEGRATION_TEST_CONFIG.apiKey,
    environment: INTEGRATION_TEST_CONFIG.environment,
    timeout: INTEGRATION_TEST_CONFIG.timeout,
    retryConfig: INTEGRATION_TEST_CONFIG.retryConfig,
  });
}

// Test data helpers for integration tests
export const TEST_COMPANY_DATA = {
  federalTaxNumber: 11222333000181, // Valid CNPJ with proper check digits
  name: 'Empresa Teste SDK v3',
  email: 'teste-sdk@example.com',
  taxRegime: 1 as const, // Simples Nacional
  address: {
    country: 'BRA',
    postalCode: '01310-100',
    street: 'Av. Paulista',
    number: '1578',
    district: 'Bela Vista',
    city: {
      code: '3550308', // São Paulo
      name: 'São Paulo',
    },
    state: 'SP',
  },
};

export const TEST_LEGAL_PERSON_DATA = {
  federalTaxNumber: 11444555000149, // Valid CNPJ with proper check digits
  name: 'Cliente Pessoa Jurídica Teste',
  email: 'cliente-pj@example.com',
  address: {
    country: 'BRA',
    postalCode: '01310-100',
    street: 'Av. Paulista',
    number: '1000',
    district: 'Bela Vista',
    city: {
      code: '3550308',
      name: 'São Paulo',
    },
    state: 'SP',
  },
};

export const TEST_NATURAL_PERSON_DATA = {
  federalTaxNumber: 12345678901, // Valid CPF format
  name: 'Cliente Pessoa Física Teste',
  email: 'cliente-pf@example.com',
  address: {
    country: 'BRA',
    postalCode: '01310-100',
    street: 'Rua Augusta',
    number: '500',
    city: {
      code: '3550308',
      name: 'São Paulo',
    },
    state: 'SP',
  },
};

// Cleanup helpers
export async function cleanupTestCompany(client: NfeClient, companyId: string) {
  try {
    await client.companies.remove(companyId);
  } catch (error) {
    // Ignore errors during cleanup
    console.warn(`Failed to cleanup company ${companyId}:`, error);
  }
}

export async function cleanupTestPerson(
  client: NfeClient,
  companyId: string,
  personType: 'legal' | 'natural',
  personId: string
) {
  try {
    if (personType === 'legal') {
      await client.legalPeople.delete(companyId, personId);
    } else {
      await client.naturalPeople.delete(companyId, personId);
    }
  } catch (error) {
    console.warn(`Failed to cleanup ${personType} person ${personId}:`, error);
  }
}

// Logging helper for integration tests
export function logTestInfo(message: string, data?: any) {
  if (process.env.DEBUG_INTEGRATION_TESTS === 'true') {
    console.log(`[Integration Test] ${message}`, data || '');
  }
}
