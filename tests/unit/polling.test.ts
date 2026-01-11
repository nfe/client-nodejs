/**
 * Tests for NfeClient.pollUntilComplete() method
 * Critical business logic for async invoice processing
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NfeClient } from '../../src/core/client.js';
import type { HttpClient } from '../../src/core/http/client.js';
import type { HttpResponse, ServiceInvoice } from '../../src/core/types.js';
import { PollingTimeoutError } from '../../src/core/errors/index.js';
import { TEST_API_KEY, createMockInvoice } from '../setup.js';

describe('NfeClient.pollUntilComplete()', () => {
  let client: NfeClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    client = new NfeClient({ apiKey: TEST_API_KEY });
    // Access private http client for mocking
    mockHttpClient = (client as any).http;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('successful polling', () => {
    it('should return immediately if resource is already complete', async () => {
      const completedInvoice = createMockInvoice({ status: 'issued' });
      const mockResponse: HttpResponse<ServiceInvoice> = {
        data: completedInvoice,
        status: 200,
        headers: {},
      };

      const getSpy = vi.spyOn(mockHttpClient, 'get').mockResolvedValue(mockResponse);

      const result = await client.pollUntilComplete<ServiceInvoice>(
        '/companies/test-id/serviceinvoices/test-invoice-id'
      );

      expect(result).toEqual(completedInvoice);
      expect(getSpy).toHaveBeenCalledTimes(1);
    });

    it('should poll multiple times until resource completes', async () => {
      const pendingInvoice = createMockInvoice({ status: 'processing' });
      const completedInvoice = createMockInvoice({ status: 'issued' });

      const getSpy = vi.spyOn(mockHttpClient, 'get')
        .mockResolvedValueOnce({ data: pendingInvoice, status: 200, headers: {} })
        .mockResolvedValueOnce({ data: pendingInvoice, status: 200, headers: {} })
        .mockResolvedValueOnce({ data: completedInvoice, status: 200, headers: {} });

      const result = await client.pollUntilComplete<ServiceInvoice>(
        '/companies/test-id/serviceinvoices/test-invoice-id',
        { maxAttempts: 5, intervalMs: 10 }
      );

      expect(result).toEqual(completedInvoice);
      expect(getSpy).toHaveBeenCalledTimes(3);
    });

    it('should recognize "completed" status as complete', async () => {
      const completedInvoice = createMockInvoice({ status: 'completed' });
      const mockResponse: HttpResponse<ServiceInvoice> = {
        data: completedInvoice,
        status: 200,
        headers: {},
      };

      vi.spyOn(mockHttpClient, 'get').mockResolvedValue(mockResponse);

      const result = await client.pollUntilComplete<ServiceInvoice>(
        '/companies/test-id/serviceinvoices/test-invoice-id'
      );

      expect(result).toEqual(completedInvoice);
    });

    it('should recognize invoice with id and number (no explicit status) as complete', async () => {
      const completedInvoice = {
        ...createMockInvoice(),
        status: undefined as any,
        id: 'test-id',
        number: '12345'
      };
      const mockResponse: HttpResponse<any> = {
        data: completedInvoice,
        status: 200,
        headers: {},
      };

      vi.spyOn(mockHttpClient, 'get').mockResolvedValue(mockResponse);

      const result = await client.pollUntilComplete(
        '/companies/test-id/serviceinvoices/test-invoice-id'
      );

      expect(result.id).toBe('test-id');
      expect(result.number).toBe('12345');
    });
  });

  describe('URL path extraction', () => {
    it('should extract path from full URL', async () => {
      const completedInvoice = createMockInvoice({ status: 'issued' });
      const mockResponse: HttpResponse<ServiceInvoice> = {
        data: completedInvoice,
        status: 200,
        headers: {},
      };

      const getSpy = vi.spyOn(mockHttpClient, 'get').mockResolvedValue(mockResponse);

      await client.pollUntilComplete<ServiceInvoice>(
        'https://api.nfe.io/v1/companies/test-id/serviceinvoices/test-invoice-id'
      );

      expect(getSpy).toHaveBeenCalledWith(
        '/v1/companies/test-id/serviceinvoices/test-invoice-id'
      );
    });

    it('should extract path with query parameters from full URL', async () => {
      const completedInvoice = createMockInvoice({ status: 'issued' });
      const mockResponse: HttpResponse<ServiceInvoice> = {
        data: completedInvoice,
        status: 200,
        headers: {},
      };

      const getSpy = vi.spyOn(mockHttpClient, 'get').mockResolvedValue(mockResponse);

      await client.pollUntilComplete<ServiceInvoice>(
        'https://api.nfe.io/v1/companies/test-id/serviceinvoices/test-invoice-id?include=details'
      );

      expect(getSpy).toHaveBeenCalledWith(
        '/v1/companies/test-id/serviceinvoices/test-invoice-id?include=details'
      );
    });

    it('should handle relative path starting with /', async () => {
      const completedInvoice = createMockInvoice({ status: 'issued' });
      const mockResponse: HttpResponse<ServiceInvoice> = {
        data: completedInvoice,
        status: 200,
        headers: {},
      };

      const getSpy = vi.spyOn(mockHttpClient, 'get').mockResolvedValue(mockResponse);

      await client.pollUntilComplete<ServiceInvoice>(
        '/companies/test-id/serviceinvoices/test-invoice-id'
      );

      expect(getSpy).toHaveBeenCalledWith(
        '/companies/test-id/serviceinvoices/test-invoice-id'
      );
    });

    it('should add leading slash to path without one', async () => {
      const completedInvoice = createMockInvoice({ status: 'issued' });
      const mockResponse: HttpResponse<ServiceInvoice> = {
        data: completedInvoice,
        status: 200,
        headers: {},
      };

      const getSpy = vi.spyOn(mockHttpClient, 'get').mockResolvedValue(mockResponse);

      await client.pollUntilComplete<ServiceInvoice>(
        'companies/test-id/serviceinvoices/test-invoice-id'
      );

      expect(getSpy).toHaveBeenCalledWith(
        '/companies/test-id/serviceinvoices/test-invoice-id'
      );
    });
  });

  describe('timeout and error handling', () => {
    it('should throw PollingTimeoutError after maxAttempts', async () => {
      const pendingInvoice = createMockInvoice({ status: 'processing' });
      const mockResponse: HttpResponse<ServiceInvoice> = {
        data: pendingInvoice,
        status: 200,
        headers: {},
      };

      vi.spyOn(mockHttpClient, 'get').mockResolvedValue(mockResponse);

      await expect(
        client.pollUntilComplete<ServiceInvoice>(
          '/companies/test-id/serviceinvoices/test-invoice-id',
          { maxAttempts: 3, intervalMs: 10 }
        )
      ).rejects.toThrow(PollingTimeoutError);
    });

    it('should include polling details in timeout error', async () => {
      const pendingInvoice = createMockInvoice({ status: 'processing' });
      vi.spyOn(mockHttpClient, 'get').mockResolvedValue({
        data: pendingInvoice,
        status: 200,
        headers: {},
      });

      try {
        await client.pollUntilComplete<ServiceInvoice>(
          '/companies/test-id/serviceinvoices/test-invoice-id',
          { maxAttempts: 2, intervalMs: 50 }
        );
        expect.fail('Should have thrown PollingTimeoutError');
      } catch (error) {
        expect(error).toBeInstanceOf(PollingTimeoutError);
        expect((error as PollingTimeoutError).message).toContain('2 attempts');
      }
    });

    it('should throw error if resource processing failed', async () => {
      const failedInvoice = createMockInvoice({ status: 'failed' });
      const mockResponse: HttpResponse<ServiceInvoice> = {
        data: failedInvoice,
        status: 200,
        headers: {},
      };

      vi.spyOn(mockHttpClient, 'get').mockResolvedValue(mockResponse);

      await expect(
        client.pollUntilComplete<ServiceInvoice>(
          '/companies/test-id/serviceinvoices/test-invoice-id',
          { intervalMs: 10 }
        )
      ).rejects.toThrow(PollingTimeoutError);
    }, 10000);

    it('should throw error if resource has error status', async () => {
      const errorInvoice = createMockInvoice({ status: 'error' });
      const mockResponse: HttpResponse<ServiceInvoice> = {
        data: errorInvoice,
        status: 200,
        headers: {},
      };

      vi.spyOn(mockHttpClient, 'get').mockResolvedValue(mockResponse);

      await expect(
        client.pollUntilComplete<ServiceInvoice>(
          '/companies/test-id/serviceinvoices/test-invoice-id',
          { intervalMs: 10 }
        )
      ).rejects.toThrow(PollingTimeoutError);
    }, 10000);

    it('should throw error if response contains error property', async () => {
      const errorResponse = {
        error: 'Processing failed',
        message: 'Invalid data'
      };
      const mockResponse: HttpResponse<any> = {
        data: errorResponse,
        status: 200,
        headers: {},
      };

      vi.spyOn(mockHttpClient, 'get').mockResolvedValue(mockResponse);

      await expect(
        client.pollUntilComplete(
          '/companies/test-id/serviceinvoices/test-invoice-id',
          { intervalMs: 10 }
        )
      ).rejects.toThrow(PollingTimeoutError);
    }, 10000);

    it('should continue polling on temporary network errors', async () => {
      const pendingInvoice = createMockInvoice({ status: 'processing' });
      const completedInvoice = createMockInvoice({ status: 'issued' });

      const getSpy = vi.spyOn(mockHttpClient, 'get')
        .mockResolvedValueOnce({ data: pendingInvoice, status: 200, headers: {} })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: completedInvoice, status: 200, headers: {} });

      const result = await client.pollUntilComplete<ServiceInvoice>(
        '/companies/test-id/serviceinvoices/test-invoice-id',
        { maxAttempts: 5, intervalMs: 10 }
      );

      expect(result).toEqual(completedInvoice);
      expect(getSpy).toHaveBeenCalledTimes(3);
    });

    it('should throw error on last attempt if still failing', async () => {
      const getSpy = vi.spyOn(mockHttpClient, 'get')
        .mockRejectedValue(new Error('Persistent network error'));

      await expect(
        client.pollUntilComplete<ServiceInvoice>(
          '/companies/test-id/serviceinvoices/test-invoice-id',
          { maxAttempts: 3, intervalMs: 10 }
        )
      ).rejects.toThrow('Persistent network error');

      expect(getSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('polling options', () => {
    it('should use default options when not specified', async () => {
      const completedInvoice = createMockInvoice({ status: 'issued' });
      vi.spyOn(mockHttpClient, 'get').mockResolvedValue({
        data: completedInvoice,
        status: 200,
        headers: {},
      });

      const result = await client.pollUntilComplete<ServiceInvoice>(
        '/companies/test-id/serviceinvoices/test-invoice-id'
      );

      expect(result).toEqual(completedInvoice);
    });

    it('should respect custom maxAttempts', async () => {
      const pendingInvoice = createMockInvoice({ status: 'processing' });
      const getSpy = vi.spyOn(mockHttpClient, 'get').mockResolvedValue({
        data: pendingInvoice,
        status: 200,
        headers: {},
      });

      await expect(
        client.pollUntilComplete<ServiceInvoice>(
          '/companies/test-id/serviceinvoices/test-invoice-id',
          { maxAttempts: 5, intervalMs: 10 }
        )
      ).rejects.toThrow(PollingTimeoutError);

      expect(getSpy).toHaveBeenCalledTimes(5);
    });

    it('should wait specified intervalMs between polls', async () => {
      const pendingInvoice = createMockInvoice({ status: 'processing' });
      const completedInvoice = createMockInvoice({ status: 'issued' });

      vi.spyOn(mockHttpClient, 'get')
        .mockResolvedValueOnce({ data: pendingInvoice, status: 200, headers: {} })
        .mockResolvedValueOnce({ data: completedInvoice, status: 200, headers: {} });

      const startTime = Date.now();
      await client.pollUntilComplete<ServiceInvoice>(
        '/companies/test-id/serviceinvoices/test-invoice-id',
        { maxAttempts: 5, intervalMs: 50 }
      );
      const elapsedTime = Date.now() - startTime;

      // Should have waited at least 50ms between first and second poll
      expect(elapsedTime).toBeGreaterThanOrEqual(40); // Allow some tolerance
    });
  });

  describe('with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it.skip('should poll at correct intervals with fake timers', async () => {
      const pendingInvoice = createMockInvoice({ status: 'processing' });
      const completedInvoice = createMockInvoice({ status: 'issued' });

      const getSpy = vi.spyOn(mockHttpClient, 'get')
        .mockResolvedValueOnce({ data: pendingInvoice, status: 200, headers: {} })
        .mockResolvedValueOnce({ data: pendingInvoice, status: 200, headers: {} })
        .mockResolvedValueOnce({ data: completedInvoice, status: 200, headers: {} });

      const pollPromise = client.pollUntilComplete<ServiceInvoice>(
        '/companies/test-id/serviceinvoices/test-invoice-id',
        { maxAttempts: 5, intervalMs: 2000 }
      );

      // First call happens immediately
      await vi.runOnlyPendingTimersAsync();
      expect(getSpy).toHaveBeenCalledTimes(1);

      // Advance time for second poll
      await vi.advanceTimersByTimeAsync(2000);
      expect(getSpy).toHaveBeenCalledTimes(2);

      // Advance time for third poll (should complete)
      await vi.advanceTimersByTimeAsync(2000);

      const result = await pollPromise;
      expect(result).toEqual(completedInvoice);
      expect(getSpy).toHaveBeenCalledTimes(3);
    });

    it('should timeout correctly with fake timers', async () => {
      const pendingInvoice = createMockInvoice({ status: 'processing' });
      vi.spyOn(mockHttpClient, 'get').mockResolvedValue({
        data: pendingInvoice,
        status: 200,
        headers: {},
      });

      const pollPromise = client.pollUntilComplete<ServiceInvoice>(
        '/companies/test-id/serviceinvoices/test-invoice-id',
        { maxAttempts: 3, intervalMs: 1000 }
      );

      // Capture the promise rejection expectation first
      const expectation = expect(pollPromise).rejects.toThrow(PollingTimeoutError);

      // Advance through all polling attempts
      await vi.runOnlyPendingTimersAsync();
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);

      // Now await the expectation
      await expectation;
    });
  });
});
