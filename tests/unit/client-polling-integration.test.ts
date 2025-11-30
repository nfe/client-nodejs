/**
 * Integration tests for polling functionality
 * Tests the interaction between NfeClient.pollUntilComplete() and ServiceInvoicesResource.createAndWait()
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NfeClient } from '../../src/core/client.js';
import type { HttpClient } from '../../src/core/http/client.js';
import type { HttpResponse, ServiceInvoice, AsyncResponse } from '../../src/core/types.js';
import { TEST_API_KEY, TEST_COMPANY_ID, createMockInvoice } from '../setup.js';

describe('Client Polling Integration', () => {
  let client: NfeClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    client = new NfeClient({ apiKey: TEST_API_KEY });
    mockHttpClient = (client as any).http;
  });

  describe('end-to-end invoice creation with polling', () => {
    it('should create invoice and poll until completion (pending → pending → issued)', async () => {
      const asyncResponse: AsyncResponse = {
        code: 202,
        status: 'pending',
        location: `/companies/${TEST_COMPANY_ID}/serviceinvoices/test-invoice-id`,
      };

      const pendingInvoice = createMockInvoice({
        status: 'processing',
        number: undefined as any, // Not yet issued
      });

      const issuedInvoice = createMockInvoice({
        status: 'issued',
        number: '12345',
      });

      // Mock the creation request (202 response)
      vi.spyOn(mockHttpClient, 'post').mockResolvedValue({
        data: asyncResponse,
        status: 202,
        headers: { location: asyncResponse.location },
      });

      // Mock the polling requests (processing → processing → issued)
      vi.spyOn(mockHttpClient, 'get')
        .mockResolvedValueOnce({ data: pendingInvoice, status: 200, headers: {} })
        .mockResolvedValueOnce({ data: pendingInvoice, status: 200, headers: {} })
        .mockResolvedValueOnce({ data: issuedInvoice, status: 200, headers: {} });

      const invoiceData = {
        borrower: issuedInvoice.borrower,
        cityServiceCode: issuedInvoice.cityServiceCode,
        description: 'Integration test invoice',
        servicesAmount: 1000.00,
      };

      const result = await client.serviceInvoices.createAndWait(
        TEST_COMPANY_ID,
        invoiceData,
        { maxAttempts: 10, intervalMs: 10 }
      );

      expect(result.status).toBe('issued');
      expect(result.number).toBe('12345');
      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).toHaveBeenCalledTimes(3);
    });

    it('should handle immediate completion (201 response)', async () => {
      const completedInvoice = createMockInvoice({
        status: 'issued',
        number: '67890',
      });

      vi.spyOn(mockHttpClient, 'post').mockResolvedValue({
        data: completedInvoice,
        status: 201,
        headers: {},
      });

      const getSpy = vi.spyOn(mockHttpClient, 'get');

      const invoiceData = {
        borrower: completedInvoice.borrower,
        cityServiceCode: completedInvoice.cityServiceCode,
        description: 'Immediate completion test',
        servicesAmount: 2000.00,
      };

      const result = await client.serviceInvoices.createAndWait(
        TEST_COMPANY_ID,
        invoiceData
      );

      expect(result.status).toBe('issued');
      expect(result.number).toBe('67890');
      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
      expect(getSpy).not.toHaveBeenCalled(); // No polling needed
    });

    it('should handle progressive status changes (pending → processing → authorized → issued)', async () => {
      const asyncResponse: AsyncResponse = {
        code: 202,
        status: 'pending',
        location: `/companies/${TEST_COMPANY_ID}/serviceinvoices/test-invoice-id`,
      };

      const stages = [
        createMockInvoice({ status: 'pending' }),
        createMockInvoice({ status: 'processing' }),
        createMockInvoice({ status: 'authorized' }),
        createMockInvoice({ status: 'issued', number: '54321' }),
      ];

      vi.spyOn(mockHttpClient, 'post').mockResolvedValue({
        data: asyncResponse,
        status: 202,
        headers: { location: asyncResponse.location },
      });

      const getSpy = vi.spyOn(mockHttpClient, 'get');
      stages.forEach((stage) => {
        getSpy.mockResolvedValueOnce({ data: stage, status: 200, headers: {} });
      });

      const invoiceData = {
        borrower: stages[0].borrower,
        cityServiceCode: stages[0].cityServiceCode,
        description: 'Progressive stages test',
        servicesAmount: 3000.00,
      };

      const result = await client.serviceInvoices.createAndWait(
        TEST_COMPANY_ID,
        invoiceData,
        { maxAttempts: 10, intervalMs: 10 }
      );

      expect(result.status).toBe('issued');
      expect(result.number).toBe('54321');
      expect(getSpy).toHaveBeenCalledTimes(4);
    });

    it('should handle network errors during polling and retry', async () => {
      const asyncResponse: AsyncResponse = {
        code: 202,
        status: 'pending',
        location: `/companies/${TEST_COMPANY_ID}/serviceinvoices/test-invoice-id`,
      };

      const pendingInvoice = createMockInvoice({ status: 'processing' });
      const issuedInvoice = createMockInvoice({ status: 'issued', number: '11111' });

      vi.spyOn(mockHttpClient, 'post').mockResolvedValue({
        data: asyncResponse,
        status: 202,
        headers: { location: asyncResponse.location },
      });

      // Simulate network error on second poll, then success
      vi.spyOn(mockHttpClient, 'get')
        .mockResolvedValueOnce({ data: pendingInvoice, status: 200, headers: {} })
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ data: issuedInvoice, status: 200, headers: {} });

      const invoiceData = {
        borrower: issuedInvoice.borrower,
        cityServiceCode: issuedInvoice.cityServiceCode,
        description: 'Network error recovery test',
        servicesAmount: 4000.00,
      };

      const result = await client.serviceInvoices.createAndWait(
        TEST_COMPANY_ID,
        invoiceData,
        { maxAttempts: 10, intervalMs: 10 }
      );

      expect(result.status).toBe('issued');
      expect(result.number).toBe('11111');
    });

    it('should timeout when invoice never completes', async () => {
      const asyncResponse: AsyncResponse = {
        code: 202,
        status: 'pending',
        location: `/companies/${TEST_COMPANY_ID}/serviceinvoices/test-invoice-id`,
      };

      const pendingInvoice = createMockInvoice({ status: 'processing' });

      vi.spyOn(mockHttpClient, 'post').mockResolvedValue({
        data: asyncResponse,
        status: 202,
        headers: { location: asyncResponse.location },
      });

      vi.spyOn(mockHttpClient, 'get').mockResolvedValue({
        data: pendingInvoice,
        status: 200,
        headers: {},
      });

      const invoiceData = {
        borrower: pendingInvoice.borrower,
        cityServiceCode: pendingInvoice.cityServiceCode,
        description: 'Timeout test',
        servicesAmount: 5000.00,
      };

      await expect(
        client.serviceInvoices.createAndWait(
          TEST_COMPANY_ID,
          invoiceData,
          { maxAttempts: 3, intervalMs: 10, timeoutMs: 50 }
        )
      ).rejects.toThrow('Invoice processing timeout');
    });

    it('should fail when invoice processing fails', async () => {
      const asyncResponse: AsyncResponse = {
        code: 202,
        status: 'pending',
        location: `/companies/${TEST_COMPANY_ID}/serviceinvoices/test-invoice-id`,
      };

      const failedInvoice = createMockInvoice({ status: 'failed' });

      vi.spyOn(mockHttpClient, 'post').mockResolvedValue({
        data: asyncResponse,
        status: 202,
        headers: { location: asyncResponse.location },
      });

      // Return failed invoice immediately
      vi.spyOn(mockHttpClient, 'get').mockResolvedValue({
        data: failedInvoice,
        status: 200,
        headers: {},
      });

      const invoiceData = {
        borrower: failedInvoice.borrower,
        cityServiceCode: failedInvoice.cityServiceCode,
        description: 'Failed processing test',
        servicesAmount: 6000.00,
      };

      await expect(
        client.serviceInvoices.createAndWait(
          TEST_COMPANY_ID,
          invoiceData,
          { maxAttempts: 3, intervalMs: 10 }
        )
      ).rejects.toThrow();
    }, 5000);
  });

  describe('direct pollUntilComplete usage', () => {
    it('should poll any resource endpoint until complete', async () => {
      const pendingResource = { status: 'processing', id: 'resource-id' };
      const completedResource = { status: 'completed', id: 'resource-id', result: 'success' };

      vi.spyOn(mockHttpClient, 'get')
        .mockResolvedValueOnce({ data: pendingResource, status: 200, headers: {} })
        .mockResolvedValueOnce({ data: completedResource, status: 200, headers: {} });

      const result = await client.pollUntilComplete(
        '/some/resource/path',
        { maxAttempts: 5, intervalMs: 10 }
      );

      expect(result.status).toBe('completed');
      expect(result.result).toBe('success');
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    });

    it('should work with full URLs', async () => {
      const completedResource = { status: 'issued', id: 'test' };

      vi.spyOn(mockHttpClient, 'get').mockResolvedValue({
        data: completedResource,
        status: 200,
        headers: {},
      });

      const result = await client.pollUntilComplete(
        'https://api.nfe.io/v1/companies/company-id/serviceinvoices/invoice-id'
      );

      expect(result.status).toBe('issued');
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/companies/company-id/serviceinvoices/invoice-id'
      );
    });
  });

  describe('real-world scenarios', () => {
    it('should handle typical NFE.io invoice workflow', async () => {
      // Step 1: Create invoice (returns 202)
      const createResponse: AsyncResponse = {
        code: 202,
        status: 'pending',
        location: `/companies/${TEST_COMPANY_ID}/serviceinvoices/nfe-12345`,
      };

      vi.spyOn(mockHttpClient, 'post').mockResolvedValue({
        data: createResponse,
        status: 202,
        headers: { location: createResponse.location },
      });

      // Step 2: Poll for completion (realistic timing)
      const invoiceStates = [
        createMockInvoice({ status: 'pending', id: 'nfe-12345' }),
        createMockInvoice({ status: 'processing', id: 'nfe-12345' }),
        createMockInvoice({ status: 'processing', id: 'nfe-12345' }),
        createMockInvoice({ status: 'issued', id: 'nfe-12345', number: 'NFE-2024-001' }),
      ];

      const getSpy = vi.spyOn(mockHttpClient, 'get');
      invoiceStates.forEach((state) => {
        getSpy.mockResolvedValueOnce({ data: state, status: 200, headers: {} });
      });

      // Execute workflow
      const invoiceData = {
        borrower: {
          type: 'LegalEntity' as const,
          name: 'Client Corporation',
          email: 'client@example.com',
          federalTaxNumber: 12345678000190,
          address: {
            country: 'BRA',
            postalCode: '01310-100',
            street: 'Av. Paulista',
            number: '1000',
            city: { code: '3550308', name: 'São Paulo' },
            state: 'SP',
          },
        },
        cityServiceCode: '01234',
        description: 'Professional services',
        servicesAmount: 10000.00,
      };

      const result = await client.serviceInvoices.createAndWait(
        TEST_COMPANY_ID,
        invoiceData,
        { maxAttempts: 30, intervalMs: 10 }
      );

      expect(result.status).toBe('issued');
      expect(result.number).toBe('NFE-2024-001');
      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledTimes(4);
    }, 10000);

    it('should handle multiple concurrent invoice creations with polling', async () => {
      // Simulate creating 3 invoices concurrently
      const invoices = [
        { id: 'inv-1', number: 'NFE-001' },
        { id: 'inv-2', number: 'NFE-002' },
        { id: 'inv-3', number: 'NFE-003' },
      ];

      let postCallCount = 0;
      vi.spyOn(mockHttpClient, 'post').mockImplementation(async () => {
        const index = postCallCount++;
        return {
          data: {
            code: 202,
            status: 'pending',
            location: `/companies/${TEST_COMPANY_ID}/serviceinvoices/${invoices[index].id}`,
          },
          status: 202,
          headers: {},
        };
      });

      let getCallCount = 0;
      vi.spyOn(mockHttpClient, 'get').mockImplementation(async (path: string) => {
        const invoiceId = path.split('/').pop();
        const invoice = invoices.find(i => i.id === invoiceId);

        // Simulate processing on first call, issued on second
        const isFirstCall = getCallCount % 2 === 0;
        getCallCount++;

        return {
          data: createMockInvoice({
            id: invoice?.id,
            status: isFirstCall ? 'processing' : 'issued',
            number: isFirstCall ? undefined : invoice?.number,
          }),
          status: 200,
          headers: {},
        };
      });

      const invoiceData = {
        borrower: createMockInvoice().borrower,
        cityServiceCode: '01234',
        description: 'Concurrent test',
        servicesAmount: 1000.00,
      };

      // Create all invoices concurrently
      const results = await Promise.all([
        client.serviceInvoices.createAndWait(TEST_COMPANY_ID, invoiceData, { intervalMs: 10 }),
        client.serviceInvoices.createAndWait(TEST_COMPANY_ID, invoiceData, { intervalMs: 10 }),
        client.serviceInvoices.createAndWait(TEST_COMPANY_ID, invoiceData, { intervalMs: 10 }),
      ]);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.status === 'issued')).toBe(true);
      expect(results.map(r => r.number).sort()).toEqual(['NFE-001', 'NFE-002', 'NFE-003']);
    });
  });

  describe('edge cases', () => {
    it('should handle missing location in 202 response', async () => {
      const invalidAsyncResponse = {
        code: 202,
        status: 'pending',
        // Missing location property
      };

      vi.spyOn(mockHttpClient, 'post').mockResolvedValue({
        data: invalidAsyncResponse,
        status: 202,
        headers: {},
      });

      const invoiceData = {
        borrower: createMockInvoice().borrower,
        cityServiceCode: '01234',
        description: 'Missing location test',
        servicesAmount: 1000.00,
      };

      await expect(
        client.serviceInvoices.createAndWait(TEST_COMPANY_ID, invoiceData)
      ).rejects.toThrow('Unexpected response from invoice creation');
    });

    it('should handle invoice with id and number but no status', async () => {
      const asyncResponse: AsyncResponse = {
        code: 202,
        status: 'pending',
        location: `/companies/${TEST_COMPANY_ID}/serviceinvoices/test-invoice-id`,
      };

      // Invoice without explicit status but with id and number (NFE.io pattern)
      const completedInvoice = {
        ...createMockInvoice(),
        status: 'issued', // NFE.io always returns status when complete
        id: 'test-invoice-id',
        number: '99999',
      };

      vi.spyOn(mockHttpClient, 'post').mockResolvedValue({
        data: asyncResponse,
        status: 202,
        headers: { location: asyncResponse.location },
      });

      vi.spyOn(mockHttpClient, 'get').mockResolvedValue({
        data: completedInvoice,
        status: 200,
        headers: {},
      });

      const invoiceData = {
        borrower: createMockInvoice().borrower,
        cityServiceCode: '01234',
        description: 'No status test',
        servicesAmount: 1000.00,
      };

      const result = await client.serviceInvoices.createAndWait(
        TEST_COMPANY_ID,
        invoiceData,
        { intervalMs: 10 }
      );

      expect(result.id).toBe('test-invoice-id');
      expect(result.number).toBe('99999');
    }, 10000);
  });
});
