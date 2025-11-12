/**
 * Test setup for NFE.io SDK v3
 * Configures vitest environment
 */

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

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.NFE_API_KEY = 'test-api-key';

export {};