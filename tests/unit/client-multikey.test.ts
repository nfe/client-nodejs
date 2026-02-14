/**
 * Unit tests for multi-API key functionality
 * Tests lazy getter validation and API key fallback chain
 *
 * API key architecture:
 * - apiKey: for fiscal document operations (NFS-e, Companies, etc.)
 * - dataApiKey: for all data/query services (Addresses, CT-e, CNPJ, CPF)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NfeClient } from '../../src/core/client.js';
import { ConfigurationError } from '../../src/core/errors/index.js';

describe('NfeClient Multi-API Key Support', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear all NFE environment variables before each test
    delete process.env.NFE_API_KEY;
    delete process.env.NFE_DATA_API_KEY;
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('lazy getter validation', () => {
    it('should throw ConfigurationError when accessing serviceInvoices without apiKey', () => {
      const client = new NfeClient({});

      expect(() => client.serviceInvoices).toThrow(ConfigurationError);
      expect(() => client.serviceInvoices).toThrow(/API key required/);
    });

    it('should throw ConfigurationError when accessing companies without apiKey', () => {
      const client = new NfeClient({});

      expect(() => client.companies).toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError when accessing legalPeople without apiKey', () => {
      const client = new NfeClient({});

      expect(() => client.legalPeople).toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError when accessing naturalPeople without apiKey', () => {
      const client = new NfeClient({});

      expect(() => client.naturalPeople).toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError when accessing webhooks without apiKey', () => {
      const client = new NfeClient({});

      expect(() => client.webhooks).toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError when accessing addresses without any apiKey', () => {
      const client = new NfeClient({});

      expect(() => client.addresses).toThrow(ConfigurationError);
      expect(() => client.addresses).toThrow(/dataApiKey|apiKey/);
    });

    it('should allow creating client without any apiKey', () => {
      // Creating client should not throw
      const client = new NfeClient({});
      expect(client).toBeInstanceOf(NfeClient);
    });
  });

  describe('API key fallback chain for main API', () => {
    it('should use apiKey from config', () => {
      const client = new NfeClient({ apiKey: 'test-config-key' });

      // Accessing resource should not throw
      expect(() => client.serviceInvoices).not.toThrow();
    });

    it('should fall back to NFE_API_KEY environment variable', () => {
      process.env.NFE_API_KEY = 'test-env-key';
      const client = new NfeClient({});

      expect(() => client.serviceInvoices).not.toThrow();
    });

    it('should prefer config apiKey over environment variable', () => {
      process.env.NFE_API_KEY = 'env-key';
      const client = new NfeClient({ apiKey: 'config-key' });

      // This test verifies the client uses config key (implementation detail)
      expect(() => client.serviceInvoices).not.toThrow();
      const config = client.getConfig();
      expect(config.apiKey).toBe('config-key');
    });
  });

  describe('API key fallback chain for data services (Addresses)', () => {
    it('should use dataApiKey from config', () => {
      const client = new NfeClient({ dataApiKey: 'data-key' });

      expect(() => client.addresses).not.toThrow();
    });

    it('should fall back to apiKey from config', () => {
      const client = new NfeClient({ apiKey: 'main-key' });

      // Should use main apiKey for addresses when dataApiKey not specified
      expect(() => client.addresses).not.toThrow();
    });

    it('should fall back to NFE_DATA_API_KEY environment variable', () => {
      process.env.NFE_DATA_API_KEY = 'env-data-key';
      const client = new NfeClient({});

      expect(() => client.addresses).not.toThrow();
    });

    it('should fall back to NFE_API_KEY environment variable', () => {
      process.env.NFE_API_KEY = 'env-main-key';
      const client = new NfeClient({});

      expect(() => client.addresses).not.toThrow();
    });

    it('should prefer dataApiKey over apiKey', () => {
      const client = new NfeClient({
        apiKey: 'main-key',
        dataApiKey: 'data-key',
      });

      expect(() => client.addresses).not.toThrow();
      const config = client.getConfig();
      expect(config.dataApiKey).toBe('data-key');
    });

    it('should prefer config keys over environment variables', () => {
      process.env.NFE_DATA_API_KEY = 'env-data-key';
      process.env.NFE_API_KEY = 'env-main-key';

      const client = new NfeClient({ dataApiKey: 'config-data-key' });

      expect(() => client.addresses).not.toThrow();
      const config = client.getConfig();
      expect(config.dataApiKey).toBe('config-data-key');
    });
  });

  describe('API key fallback chain for data services (CT-e)', () => {
    it('should use dataApiKey from config', () => {
      const client = new NfeClient({ dataApiKey: 'data-key' });

      expect(() => client.transportationInvoices).not.toThrow();
    });

    it('should fall back to apiKey from config', () => {
      const client = new NfeClient({ apiKey: 'main-key' });

      // Should use main apiKey for CTE when dataApiKey not specified
      expect(() => client.transportationInvoices).not.toThrow();
    });

    it('should fall back to NFE_DATA_API_KEY environment variable', () => {
      process.env.NFE_DATA_API_KEY = 'env-data-key';
      const client = new NfeClient({});

      expect(() => client.transportationInvoices).not.toThrow();
    });

    it('should fall back to NFE_API_KEY environment variable', () => {
      process.env.NFE_API_KEY = 'env-main-key';
      const client = new NfeClient({});

      expect(() => client.transportationInvoices).not.toThrow();
    });

    it('should prefer dataApiKey over apiKey', () => {
      const client = new NfeClient({
        apiKey: 'main-key',
        dataApiKey: 'data-key',
      });

      expect(() => client.transportationInvoices).not.toThrow();
      const config = client.getConfig();
      expect(config.dataApiKey).toBe('data-key');
    });

    it('should prefer config keys over environment variables', () => {
      process.env.NFE_DATA_API_KEY = 'env-data-key';
      process.env.NFE_API_KEY = 'env-main-key';

      const client = new NfeClient({ dataApiKey: 'config-data-key' });

      expect(() => client.transportationInvoices).not.toThrow();
      const config = client.getConfig();
      expect(config.dataApiKey).toBe('config-data-key');
    });

    it('should throw ConfigurationError when accessing transportationInvoices without any apiKey', () => {
      const client = new NfeClient({});

      expect(() => client.transportationInvoices).toThrow(ConfigurationError);
      expect(() => client.transportationInvoices).toThrow(/dataApiKey|apiKey/);
    });
  });

  describe('both data services resolve same key', () => {
    it('should use the same dataApiKey for both addresses and transportationInvoices', () => {
      const client = new NfeClient({ dataApiKey: 'shared-data-key' });

      // Both should work with the same key
      expect(() => client.addresses).not.toThrow();
      expect(() => client.transportationInvoices).not.toThrow();

      // Verify config has the shared key
      const config = client.getConfig();
      expect(config.dataApiKey).toBe('shared-data-key');
    });

    it('should use NFE_DATA_API_KEY env var for both addresses and transportationInvoices', () => {
      process.env.NFE_DATA_API_KEY = 'env-shared-key';
      const client = new NfeClient({});

      expect(() => client.addresses).not.toThrow();
      expect(() => client.transportationInvoices).not.toThrow();
    });
  });

  describe('isolated resource usage', () => {
    it('should allow using only data services with dataApiKey (no apiKey)', () => {
      const client = new NfeClient({ dataApiKey: 'data-only-key' });

      // Data services should work
      expect(() => client.addresses).not.toThrow();
      expect(() => client.transportationInvoices).not.toThrow();

      // Fiscal resources should throw
      expect(() => client.serviceInvoices).toThrow(ConfigurationError);
      expect(() => client.companies).toThrow(ConfigurationError);
    });

    it('should allow using only main resources with apiKey (no dataApiKey)', () => {
      const client = new NfeClient({ apiKey: 'main-only-key' });

      // Main resources should work
      expect(() => client.serviceInvoices).not.toThrow();
      expect(() => client.companies).not.toThrow();

      // Data services should also work (falls back to apiKey)
      expect(() => client.addresses).not.toThrow();
      expect(() => client.transportationInvoices).not.toThrow();
    });

    it('should support separate API keys for data and main resources', () => {
      const client = new NfeClient({
        apiKey: 'main-api-key',
        dataApiKey: 'separate-data-key',
      });

      // All resources should work
      expect(() => client.serviceInvoices).not.toThrow();
      expect(() => client.companies).not.toThrow();
      expect(() => client.addresses).not.toThrow();
      expect(() => client.transportationInvoices).not.toThrow();

      // Verify config has both keys
      const config = client.getConfig();
      expect(config.apiKey).toBe('main-api-key');
      expect(config.dataApiKey).toBe('separate-data-key');
    });
  });

  describe('resource caching', () => {
    it('should cache resource instances', () => {
      const client = new NfeClient({ apiKey: 'test-key' });

      const serviceInvoices1 = client.serviceInvoices;
      const serviceInvoices2 = client.serviceInvoices;

      expect(serviceInvoices1).toBe(serviceInvoices2);
    });

    it('should cache addresses resource', () => {
      const client = new NfeClient({ dataApiKey: 'test-key' });

      const addresses1 = client.addresses;
      const addresses2 = client.addresses;

      expect(addresses1).toBe(addresses2);
    });

    it('should cache transportationInvoices resource', () => {
      const client = new NfeClient({ dataApiKey: 'test-key' });

      const transportationInvoices1 = client.transportationInvoices;
      const transportationInvoices2 = client.transportationInvoices;

      expect(transportationInvoices1).toBe(transportationInvoices2);
    });

    it('should clear cache on updateConfig', () => {
      const client = new NfeClient({ apiKey: 'initial-key' });

      const serviceInvoices1 = client.serviceInvoices;

      client.updateConfig({ apiKey: 'new-key' });

      const serviceInvoices2 = client.serviceInvoices;

      // Resource should be a new instance
      expect(serviceInvoices1).not.toBe(serviceInvoices2);
    });

    it('should clear data service cache on updateConfig with dataApiKey', () => {
      const client = new NfeClient({ dataApiKey: 'initial-key' });

      const transportationInvoices1 = client.transportationInvoices;

      client.updateConfig({ dataApiKey: 'new-key' });

      const transportationInvoices2 = client.transportationInvoices;

      // Resource should be a new instance
      expect(transportationInvoices1).not.toBe(transportationInvoices2);
    });
  });

  describe('error messages', () => {
    it('should have descriptive error for missing main API key', () => {
      const client = new NfeClient({});

      expect(() => client.serviceInvoices).toThrow(
        'API key required for this resource. Set "apiKey" in config or NFE_API_KEY environment variable.'
      );
    });

    it('should have descriptive error for missing data API key (addresses)', () => {
      const client = new NfeClient({});

      expect(() => client.addresses).toThrow(
        /dataApiKey|apiKey/
      );
    });

    it('should have descriptive error for missing data API key (transportationInvoices)', () => {
      const client = new NfeClient({});

      expect(() => client.transportationInvoices).toThrow(
        /dataApiKey|apiKey/
      );
    });

    it('should not recognize old NFE_ADDRESS_API_KEY environment variable', () => {
      (process.env as Record<string, string>).NFE_ADDRESS_API_KEY = 'old-key';
      const client = new NfeClient({});

      // Should throw because NFE_ADDRESS_API_KEY is no longer recognized
      expect(() => client.addresses).toThrow(ConfigurationError);
    });

    it('should not recognize old NFE_CTE_API_KEY environment variable', () => {
      (process.env as Record<string, string>).NFE_CTE_API_KEY = 'old-key';
      const client = new NfeClient({});

      // Should throw because NFE_CTE_API_KEY is no longer recognized
      expect(() => client.transportationInvoices).toThrow(ConfigurationError);
    });
  });
});
