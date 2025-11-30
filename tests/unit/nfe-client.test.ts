import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NfeClient } from '../../src/core/client.js';
import { ConfigurationError } from '../../src/core/errors/index.js';

describe('NfeClient', () => {
  const validConfig = {
    apiKey: 'test-api-key',
    environment: 'development' as const,
  };

  describe('constructor', () => {
    it('should create client with valid configuration', () => {
      const client = new NfeClient(validConfig);

      expect(client).toBeInstanceOf(NfeClient);
      expect(client.serviceInvoices).toBeDefined();
      expect(client.companies).toBeDefined();
      expect(client.legalPeople).toBeDefined();
      expect(client.naturalPeople).toBeDefined();
      expect(client.webhooks).toBeDefined();
    });

    it('should throw ConfigurationError when environment is invalid', () => {
      expect(() =>
        new NfeClient({ apiKey: 'test', environment: 'invalid' } as any)
      ).toThrow(ConfigurationError);
    });

    it('should accept production environment', () => {
      const client = new NfeClient({
        apiKey: 'test-key',
        environment: 'production',
      });

      expect(client).toBeInstanceOf(NfeClient);
    });

    it('should accept development environment', () => {
      const client = new NfeClient({
        apiKey: 'test-key',
        environment: 'development',
      });

      expect(client).toBeInstanceOf(NfeClient);
    });

    it('should accept custom timeout', () => {
      const client = new NfeClient({
        ...validConfig,
        timeout: 30000,
      });

      expect(client).toBeInstanceOf(NfeClient);
    });

    it('should accept custom retry configuration', () => {
      const client = new NfeClient({
        ...validConfig,
        retryConfig: {
          maxRetries: 5,
          baseDelay: 500,
          maxDelay: 10000,
        },
      });

      expect(client).toBeInstanceOf(NfeClient);
    });
  });

  describe('resource instantiation', () => {
    let client: NfeClient;

    beforeEach(() => {
      client = new NfeClient(validConfig);
    });

    it('should have serviceInvoices resource', () => {
      expect(client.serviceInvoices).toBeDefined();
      expect(client.serviceInvoices.create).toBeInstanceOf(Function);
      expect(client.serviceInvoices.list).toBeInstanceOf(Function);
      expect(client.serviceInvoices.retrieve).toBeInstanceOf(Function);
      expect(client.serviceInvoices.cancel).toBeInstanceOf(Function);
    });

    it('should have companies resource', () => {
      expect(client.companies).toBeDefined();
      expect(client.companies.create).toBeInstanceOf(Function);
      expect(client.companies.list).toBeInstanceOf(Function);
      expect(client.companies.retrieve).toBeInstanceOf(Function);
      expect(client.companies.update).toBeInstanceOf(Function);
    });

    it('should have legalPeople resource', () => {
      expect(client.legalPeople).toBeDefined();
      expect(client.legalPeople.create).toBeInstanceOf(Function);
      expect(client.legalPeople.list).toBeInstanceOf(Function);
      expect(client.legalPeople.retrieve).toBeInstanceOf(Function);
      expect(client.legalPeople.update).toBeInstanceOf(Function);
      expect(client.legalPeople.delete).toBeInstanceOf(Function);
    });

    it('should have naturalPeople resource', () => {
      expect(client.naturalPeople).toBeDefined();
      expect(client.naturalPeople.create).toBeInstanceOf(Function);
      expect(client.naturalPeople.list).toBeInstanceOf(Function);
      expect(client.naturalPeople.retrieve).toBeInstanceOf(Function);
      expect(client.naturalPeople.update).toBeInstanceOf(Function);
      expect(client.naturalPeople.delete).toBeInstanceOf(Function);
    });

    it('should have webhooks resource', () => {
      expect(client.webhooks).toBeDefined();
      expect(client.webhooks.create).toBeInstanceOf(Function);
      expect(client.webhooks.list).toBeInstanceOf(Function);
      expect(client.webhooks.retrieve).toBeInstanceOf(Function);
      expect(client.webhooks.update).toBeInstanceOf(Function);
      expect(client.webhooks.delete).toBeInstanceOf(Function);
    });
  });

  describe('configuration validation', () => {
    it('should use default environment (production) when not specified', () => {
      const client = new NfeClient({ apiKey: 'test-api-key' });
      expect(client).toBeInstanceOf(NfeClient);
    });

    it('should accept custom base URL', () => {
      const client = new NfeClient({
        apiKey: 'test-api-key',
        environment: 'development',
        baseUrl: 'https://custom-api.example.com',
      });
      expect(client).toBeInstanceOf(NfeClient);
    });
  });
});
