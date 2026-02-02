/**
 * Unit tests for multi-API key functionality
 * Tests lazy getter validation and API key fallback chain
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NfeClient } from '../../src/core/client.js';
import { ConfigurationError } from '../../src/core/errors/index.js';

describe('NfeClient Multi-API Key Support', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear all NFE environment variables before each test
    delete process.env.NFE_API_KEY;
    delete process.env.NFE_ADDRESS_API_KEY;
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
      expect(() => client.addresses).toThrow(/addressApiKey|apiKey/);
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

  describe('API key fallback chain for Address API', () => {
    it('should use addressApiKey from config', () => {
      const client = new NfeClient({ addressApiKey: 'address-key' });

      expect(() => client.addresses).not.toThrow();
    });

    it('should fall back to apiKey from config', () => {
      const client = new NfeClient({ apiKey: 'main-key' });

      // Should use main apiKey for addresses when addressApiKey not specified
      expect(() => client.addresses).not.toThrow();
    });

    it('should fall back to NFE_ADDRESS_API_KEY environment variable', () => {
      process.env.NFE_ADDRESS_API_KEY = 'env-address-key';
      const client = new NfeClient({});

      expect(() => client.addresses).not.toThrow();
    });

    it('should fall back to NFE_API_KEY environment variable', () => {
      process.env.NFE_API_KEY = 'env-main-key';
      const client = new NfeClient({});

      expect(() => client.addresses).not.toThrow();
    });

    it('should prefer addressApiKey over apiKey', () => {
      const client = new NfeClient({
        apiKey: 'main-key',
        addressApiKey: 'address-key',
      });

      expect(() => client.addresses).not.toThrow();
      const config = client.getConfig();
      expect(config.addressApiKey).toBe('address-key');
    });

    it('should prefer config keys over environment variables', () => {
      process.env.NFE_ADDRESS_API_KEY = 'env-address-key';
      process.env.NFE_API_KEY = 'env-main-key';

      const client = new NfeClient({ addressApiKey: 'config-address-key' });

      expect(() => client.addresses).not.toThrow();
      const config = client.getConfig();
      expect(config.addressApiKey).toBe('config-address-key');
    });
  });

  describe('isolated resource usage', () => {
    it('should allow using only addresses with addressApiKey (no apiKey)', () => {
      const client = new NfeClient({ addressApiKey: 'address-only-key' });

      // Addresses should work
      expect(() => client.addresses).not.toThrow();

      // Other resources should throw
      expect(() => client.serviceInvoices).toThrow(ConfigurationError);
      expect(() => client.companies).toThrow(ConfigurationError);
    });

    it('should allow using only main resources with apiKey (no addressApiKey)', () => {
      const client = new NfeClient({ apiKey: 'main-only-key' });

      // Main resources should work
      expect(() => client.serviceInvoices).not.toThrow();
      expect(() => client.companies).not.toThrow();

      // Addresses should also work (falls back to apiKey)
      expect(() => client.addresses).not.toThrow();
    });

    it('should support separate API keys for different resources', () => {
      const client = new NfeClient({
        apiKey: 'main-api-key',
        addressApiKey: 'separate-address-key',
      });

      // All resources should work
      expect(() => client.serviceInvoices).not.toThrow();
      expect(() => client.companies).not.toThrow();
      expect(() => client.addresses).not.toThrow();

      // Verify config has both keys
      const config = client.getConfig();
      expect(config.apiKey).toBe('main-api-key');
      expect(config.addressApiKey).toBe('separate-address-key');
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
      const client = new NfeClient({ addressApiKey: 'test-key' });

      const addresses1 = client.addresses;
      const addresses2 = client.addresses;

      expect(addresses1).toBe(addresses2);
    });

    it('should clear cache on updateConfig', () => {
      const client = new NfeClient({ apiKey: 'initial-key' });

      const serviceInvoices1 = client.serviceInvoices;

      client.updateConfig({ apiKey: 'new-key' });

      const serviceInvoices2 = client.serviceInvoices;

      // Resource should be a new instance
      expect(serviceInvoices1).not.toBe(serviceInvoices2);
    });
  });

  describe('error messages', () => {
    it('should have descriptive error for missing main API key', () => {
      const client = new NfeClient({});

      expect(() => client.serviceInvoices).toThrow(
        'API key required for this resource. Set "apiKey" in config or NFE_API_KEY environment variable.'
      );
    });

    it('should have descriptive error for missing address API key', () => {
      const client = new NfeClient({});

      expect(() => client.addresses).toThrow(
        /addressApiKey|apiKey/
      );
    });
  });
});
