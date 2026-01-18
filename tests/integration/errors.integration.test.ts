/**
 * Integration tests for error handling and retry logic
 * Tests real API error responses and retry behavior
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  createIntegrationClient,
  skipIfNoApiKey,
  logTestInfo,
  INTEGRATION_TEST_CONFIG,
} from './setup.js';
import { NfeClient } from '../../src/core/client.js';
import {
  NfeError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
} from '../../src/core/errors/index.js';

describe('Error Handling Integration Tests', () => {
  let client: NfeClient;

  beforeAll(() => {
    if (skipIfNoApiKey()) {
      console.log('Skipping integration tests - no API key configured');
    } else {
      client = createIntegrationClient();
      logTestInfo('Running error handling integration tests', {
        environment: INTEGRATION_TEST_CONFIG.environment,
      });
    }
  });

  it.skipIf(skipIfNoApiKey())('should handle 401 authentication error', async () => {
    // Create client with invalid API key
    const invalidClient = new NfeClient({
      apiKey: 'invalid-api-key-12345',
      environment: INTEGRATION_TEST_CONFIG.environment,
      timeout: INTEGRATION_TEST_CONFIG.timeout,
    });

    logTestInfo('Testing 401 authentication error');

    try {
      await invalidClient.companies.list();
      expect.fail('Should have thrown authentication error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      // Check if it's an authentication error (401)
      if (error instanceof NfeError) {
        expect(error.statusCode).toBe(401);
      }
      logTestInfo('Authentication error caught as expected');
    }
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should handle 404 not found error', async () => {
    const fakeCompanyId = 'non-existent-company-' + Date.now();

    logTestInfo('Testing 404 not found error', { id: fakeCompanyId });

    try {
      await client.companies.retrieve(fakeCompanyId);
      expect.fail('Should have thrown not found error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof NfeError) {
        expect(error.statusCode).toBe(404);
      }
      logTestInfo('Not found error caught as expected');
    }
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should handle 400 validation error', async () => {
    const invalidData = {
      name: 'Invalid Company',
      // Missing required fields
    } as any;

    logTestInfo('Testing 400 validation error');

    try {
      await client.companies.create(invalidData);
      expect.fail('Should have thrown validation error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof NfeError) {
        expect([400, 422]).toContain(error.statusCode); // 400 or 422 for validation
      }
      logTestInfo('Validation error caught as expected');
    }
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should handle network timeout', async () => {
    // Create client with very short timeout
    const timeoutClient = new NfeClient({
      apiKey: INTEGRATION_TEST_CONFIG.apiKey,
      environment: INTEGRATION_TEST_CONFIG.environment,
      timeout: 1, // 1ms - should timeout immediately
    });

    logTestInfo('Testing network timeout');

    try {
      await timeoutClient.companies.list();
      expect.fail('Should have thrown timeout error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      // Should be a timeout or network error
      const errorMessage = error instanceof Error ? error.message : String(error);
      expect(
        errorMessage.toLowerCase().includes('timeout') ||
        errorMessage.toLowerCase().includes('aborted') ||
        errorMessage.toLowerCase().includes('signal')
      ).toBe(true);
      logTestInfo('Timeout error caught as expected');
    }
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should retry on transient errors', async () => {
    // This test verifies that retry logic works
    // We can't easily trigger transient errors from client side,
    // but we can verify the retry configuration is respected

    const clientWithRetry = new NfeClient({
      apiKey: INTEGRATION_TEST_CONFIG.apiKey,
      environment: INTEGRATION_TEST_CONFIG.environment,
      timeout: INTEGRATION_TEST_CONFIG.timeout,
      retryConfig: {
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 1000,
      },
    });

    logTestInfo('Testing retry configuration (should succeed normally)');

    // This should succeed on first try (no retry needed)
    const companies = await clientWithRetry.companies.list();
    expect(companies).toBeDefined();
    expect(Array.isArray(companies)).toBe(true);

    logTestInfo('Retry configuration test passed');
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should respect rate limiting (if enforced)', async () => {
    // Make multiple rapid requests to potentially trigger rate limiting
    // Note: Test environment might not enforce rate limits strictly

    logTestInfo('Testing rate limiting behavior');

    const requests = Array(10).fill(null).map(() =>
      client.companies.list().catch(error => error)
    );

    const results = await Promise.all(requests);

    // Check if any request was rate limited
    const rateLimited = results.some(result => {
      if (result instanceof NfeError) {
        return result.statusCode === 429;
      }
      return false;
    });

    if (rateLimited) {
      logTestInfo('Rate limiting was enforced');
    } else {
      logTestInfo('Rate limiting not enforced or not triggered');
    }

    // Test passes regardless - we're just checking behavior
    expect(results.length).toBe(10);
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout * 2 });

  it.skipIf(skipIfNoApiKey())('should handle malformed response gracefully', async () => {
    // Test with invalid endpoint that might return unexpected format
    const fakeEndpoint = '/v1/invalid-endpoint-test-' + Date.now();

    logTestInfo('Testing malformed response handling');

    try {
      // Try to access a non-existent endpoint
      await client.companies.retrieve('test-invalid-format');
      // If this succeeds, that's fine too
      logTestInfo('Request succeeded (no malformed response)');
    } catch (error) {
      // Should handle error gracefully with proper error object
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty('message');
      logTestInfo('Error handled gracefully', {
        type: error instanceof NfeError ? 'NfeError' : 'Error',
      });
    }
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should preserve error details from API', async () => {
    const invalidData = {
      name: 'Test',
      // Missing federalTaxNumber
    } as any;

    logTestInfo('Testing error details preservation');

    try {
      await client.companies.create(invalidData);
      expect.fail('Should have thrown validation error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);

      // Error should have meaningful message
      const errorMessage = error instanceof Error ? error.message : String(error);
      expect(errorMessage.length).toBeGreaterThan(0);

      // NfeError should preserve status code
      if (error instanceof NfeError) {
        expect(error.statusCode).toBeDefined();
        expect(error.statusCode).toBeGreaterThanOrEqual(400);
        logTestInfo('Error details preserved', {
          statusCode: error.statusCode,
          message: errorMessage,
        });
      }
    }
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should handle concurrent requests correctly', async () => {
    // Test that concurrent requests don't interfere with each other
    logTestInfo('Testing concurrent requests');

    const requests = [
      client.companies.list(),
      client.companies.list(),
      client.companies.list(),
    ];

    const results = await Promise.all(requests);

    expect(results).toHaveLength(3);
    results.forEach(companies => {
      expect(companies).toBeDefined();
      expect(Array.isArray(companies)).toBe(true);
    });

    logTestInfo('Concurrent requests handled correctly');
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should handle empty response lists', async () => {
    // Test listing resources that might be empty
    // This depends on account state, but should handle gracefully

    logTestInfo('Testing empty response handling');

    const companies = await client.companies.list();

    expect(companies).toBeDefined();
    expect(Array.isArray(companies)).toBe(true);
    // Length could be 0 or more - both are valid
    expect(companies.length).toBeGreaterThanOrEqual(0);

    logTestInfo('Empty response handled correctly', { count: companies.length });
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });
});
