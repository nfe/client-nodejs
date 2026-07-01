/**
 * Integration tests for AddressesResource
 *
 * These tests require a valid API key and make real API calls against the live
 * address.api.nfe.io/v2 host (postal-code lookup only).
 *
 * To run these tests:
 *   1. Set NFE_DATA_API_KEY or NFE_API_KEY environment variable
 *   2. Run: RUN_INTEGRATION_TESTS=true npm run test:integration
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { NfeClient } from '../../src/core/client.js';
import { shouldRunIntegrationTests, INTEGRATION_TEST_CONFIG } from './setup.js';

const shouldRun = shouldRunIntegrationTests();

describe.skipIf(!shouldRun)('AddressesResource Integration', () => {
  let client: NfeClient;

  beforeAll(() => {
    client = new NfeClient({
      apiKey: process.env.NFE_API_KEY,
      dataApiKey: process.env.NFE_DATA_API_KEY || process.env.INTEGRATION_TEST_API_KEY,
      environment: INTEGRATION_TEST_CONFIG.environment,
    });
  });

  describe('lookupByPostalCode', () => {
    it('looks up a valid São Paulo postal code (Avenida Paulista)', async () => {
      const address = await client.addresses.lookupByPostalCode('01310100');

      expect(address).toBeDefined();
      // API returns the CEP formatted with a hyphen
      expect(address.postalCode).toBe('01310-100');
      expect(address.state).toBe('SP');
      expect(address.city.name).toContain('São Paulo');
      expect(address.street).toBeTruthy();
    });

    it('looks up a valid Rio de Janeiro postal code (with hyphen input)', async () => {
      const address = await client.addresses.lookupByPostalCode('20040-020');

      expect(address).toBeDefined();
      expect(address.postalCode).toBe('20040-020');
      expect(address.state).toBe('RJ');
    });

    it('rejects a non-existent postal code', async () => {
      await expect(client.addresses.lookupByPostalCode('00000000')).rejects.toThrow();
    });
  });

  describe('response shape', () => {
    it('returns a single Address with the expected fields (no envelope, no array)', async () => {
      const address = await client.addresses.lookupByPostalCode('01310100');

      expect(address).toHaveProperty('postalCode');
      expect(address).toHaveProperty('state');
      expect(address).toHaveProperty('city');
      expect(address.city).toHaveProperty('code');
      expect(address.city).toHaveProperty('name');
      // Must NOT be the old wrong shapes
      expect(address).not.toHaveProperty('address');
      expect(address).not.toHaveProperty('addresses');
    });
  });
});

/**
 * Multi-API key configuration against the live API.
 */
describe.skipIf(!shouldRun)('Multi-API Key Integration', () => {
  it('creates a client with only dataApiKey and can access addresses', () => {
    const client = new NfeClient({
      dataApiKey: process.env.NFE_DATA_API_KEY || process.env.NFE_API_KEY,
    });
    expect(() => client.addresses).not.toThrow();
  });

  it('makes an address API call with a separate dataApiKey', async () => {
    const client = new NfeClient({
      dataApiKey: process.env.NFE_DATA_API_KEY || process.env.NFE_API_KEY,
    });
    const address = await client.addresses.lookupByPostalCode('01310100');
    expect(address.state).toBe('SP');
  });
});
