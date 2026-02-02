/**
 * Integration tests for AddressesResource
 *
 * These tests require a valid API key and make real API calls.
 * Skip these tests in CI/CD unless API key is available.
 *
 * To run these tests:
 *   1. Set NFE_ADDRESS_API_KEY or NFE_API_KEY environment variable
 *   2. Run: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NfeClient } from '../../src/core/client.js';
import { NotFoundError } from '../../src/core/errors/index.js';
import type { AddressLookupResponse } from '../../src/core/types.js';
import { shouldRunIntegrationTests, INTEGRATION_TEST_CONFIG } from './setup.js';

// Use the shared integration test check
const shouldRun = shouldRunIntegrationTests();

describe.skipIf(!shouldRun)('AddressesResource Integration', () => {
  let client: NfeClient;

  beforeAll(() => {
    client = new NfeClient({
      apiKey: process.env.NFE_API_KEY,
      addressApiKey:
        process.env.NFE_ADDRESS_API_KEY ||
        process.env.INTEGRATION_TEST_API_KEY,
      environment: 'production',
    });
  });

  afterAll(() => {
    // Cleanup if needed
  });

  describe('lookupByPostalCode', () => {
    it('should lookup a valid São Paulo postal code', async () => {
      // CEP 01310-100 is Avenida Paulista, São Paulo
      const result = await client.addresses.lookupByPostalCode('01310100');

      expect(result).toBeDefined();
      expect(result.postalCode).toBe('01310100');
      expect(result.state).toBe('SP');
      expect(result.city?.name).toContain('São Paulo');
    });

    it('should lookup a valid Rio de Janeiro postal code', async () => {
      // CEP 20040-020 is Centro, Rio de Janeiro
      const result = await client.addresses.lookupByPostalCode('20040-020');

      expect(result).toBeDefined();
      expect(result.postalCode).toBe('20040020');
      expect(result.state).toBe('RJ');
    });

    it('should handle non-existent postal code gracefully', async () => {
      // CEP 00000-000 should not exist
      await expect(
        client.addresses.lookupByPostalCode('00000000')
      ).rejects.toThrow();
    });
  });

  describe('search', () => {
    it('should search addresses by state filter', async () => {
      const result = await client.addresses.search({
        filter: "state eq 'SP'",
      });

      expect(result).toBeDefined();
      // Response structure may vary
      if (result.addresses) {
        expect(Array.isArray(result.addresses)).toBe(true);
      }
    });

    it('should search addresses by city filter', async () => {
      const result = await client.addresses.search({
        filter: "city.name eq 'São Paulo'",
      });

      expect(result).toBeDefined();
    });
  });

  describe('lookupByTerm', () => {
    it('should lookup addresses by street name', async () => {
      const result = await client.addresses.lookupByTerm('Paulista');

      expect(result).toBeDefined();
      // Response structure may vary based on API
    });

    it('should handle search term with no results', async () => {
      // Search for something unlikely to exist
      const result = await client.addresses.lookupByTerm('ZZZZNONEXISTENTZZZ123');

      expect(result).toBeDefined();
      // May return empty results or throw
    });
  });

  describe('API response format', () => {
    it('should return address with expected structure', async () => {
      const result = await client.addresses.lookupByPostalCode('01310100');

      // Verify essential fields are present
      expect(result).toHaveProperty('postalCode');
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('city');

      // City should have code and name
      if (result.city) {
        expect(result.city).toHaveProperty('code');
        expect(result.city).toHaveProperty('name');
      }
    });
  });
});

/**
 * Tests for multi-API key configuration in integration
 */
describe.skipIf(!shouldRun)('Multi-API Key Integration', () => {
  it('should create client with only addressApiKey', () => {
    const client = new NfeClient({
      addressApiKey: process.env.NFE_ADDRESS_API_KEY || process.env.NFE_API_KEY,
    });

    // Should be able to access addresses
    expect(() => client.addresses).not.toThrow();
  });

  it('should make address API call with separate addressApiKey', async () => {
    const client = new NfeClient({
      addressApiKey: process.env.NFE_ADDRESS_API_KEY || process.env.NFE_API_KEY,
    });

    // This should work because we have addressApiKey
    const result = await client.addresses.lookupByPostalCode('01310100');
    expect(result).toBeDefined();
  });
});
