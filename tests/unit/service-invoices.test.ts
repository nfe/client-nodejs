import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceInvoicesResource } from '../../src/core/resources/service-invoices.js';
import type { HttpClient } from '../../src/core/http/client.js';
import type { HttpResponse, ListResponse, ServiceInvoice, AsyncResponse } from '../../src/core/types.js';
import { createMockInvoice, TEST_COMPANY_ID, TEST_INVOICE_ID } from '../setup.js';

describe('ServiceInvoicesResource', () => {
  let mockHttpClient: HttpClient;
  let serviceInvoices: ServiceInvoicesResource;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as HttpClient;

    serviceInvoices = new ServiceInvoicesResource(mockHttpClient);
  });

  describe('create', () => {
    it('should create a service invoice and return completed invoice', async () => {
      const mockInvoice = createMockInvoice();
      const mockResponse: HttpResponse<ServiceInvoice> = {
        data: mockInvoice,
        status: 201,
        headers: {},
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      const invoiceData = {
        borrower: mockInvoice.borrower,
        cityServiceCode: mockInvoice.cityServiceCode,
        description: mockInvoice.description,
        servicesAmount: 1000.00,
      };

      const result = await serviceInvoices.create(TEST_COMPANY_ID, invoiceData);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/serviceinvoices`,
        invoiceData
      );
      expect(result).toEqual({ status: 'immediate', invoice: mockInvoice });
      if (result.status === 'immediate') {
        expect(result.invoice.id).toBe(TEST_INVOICE_ID);
      }
    });

    it('should handle async response (202 status)', async () => {
      const asyncResponse: AsyncResponse = {
        code: 202,
        status: 'pending',
        location: `/companies/${TEST_COMPANY_ID}/serviceinvoices/${TEST_INVOICE_ID}`,
      };
      const mockResponse: HttpResponse<AsyncResponse> = {
        data: asyncResponse,
        status: 202,
        headers: { location: asyncResponse.location },
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      const invoiceData = {
        borrower: createMockInvoice().borrower,
        cityServiceCode: '01234',
        description: 'Test service',
        servicesAmount: 1000.00,
      };

      const result = await serviceInvoices.create(TEST_COMPANY_ID, invoiceData);

      expect(result).toEqual({
        status: 'async',
        response: {
          code: 202,
          status: 'pending',
          location: asyncResponse.location,
          invoiceId: TEST_INVOICE_ID,
        },
      });
      if (result.status === 'async') {
        expect(result.response.status).toBe('pending');
        expect(result.response.invoiceId).toBe(TEST_INVOICE_ID);
      }
    });
  });

  describe('list', () => {
    it('should list service invoices for a company', async () => {
      const mockInvoice = createMockInvoice();
      const mockResponse: HttpResponse<ListResponse<ServiceInvoice>> = {
        data: { data: [mockInvoice] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await serviceInvoices.list(TEST_COMPANY_ID);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/serviceinvoices`,
        {}
      );
      expect(result.data).toEqual([mockInvoice]);
    });

    it('should pass pagination options to http client', async () => {
      const mockResponse: HttpResponse<ListResponse<ServiceInvoice>> = {
        data: { data: [] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const options = { page: 2, pageSize: 50 };
      await serviceInvoices.list(TEST_COMPANY_ID, options);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/serviceinvoices`,
        options
      );
    });
  });

  describe('retrieve', () => {
    it('should retrieve a service invoice by id', async () => {
      const mockInvoice = createMockInvoice();
      const mockResponse: HttpResponse<ServiceInvoice> = {
        data: mockInvoice,
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await serviceInvoices.retrieve(TEST_COMPANY_ID, TEST_INVOICE_ID);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/serviceinvoices/${TEST_INVOICE_ID}`
      );
      expect(result).toEqual(mockInvoice);
    });
  });

  describe('cancel', () => {
    it('should cancel a service invoice', async () => {
      const cancelledInvoice = createMockInvoice({ flowStatus: 'Cancelled' });
      const mockResponse: HttpResponse<ServiceInvoice> = {
        data: cancelledInvoice,
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.delete).mockResolvedValue(mockResponse);

      const result = await serviceInvoices.cancel(TEST_COMPANY_ID, TEST_INVOICE_ID);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/serviceinvoices/${TEST_INVOICE_ID}`
      );
      expect(result.flowStatus).toBe('Cancelled');
    });
  });

  describe('sendEmail', () => {
    it('should send invoice via email', async () => {
      const mockEmailResponse = { sent: true, message: 'Email sent successfully' };
      const mockResponse: HttpResponse<typeof mockEmailResponse> = {
        data: mockEmailResponse,
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.put).mockResolvedValue(mockResponse);

      const result = await serviceInvoices.sendEmail(TEST_COMPANY_ID, TEST_INVOICE_ID);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/serviceinvoices/${TEST_INVOICE_ID}/sendemail`
      );
      expect(result.sent).toBe(true);
    });
  });

  describe('downloadPdf', () => {
    it('should download PDF for a specific invoice', async () => {
      const mockPdfData = Buffer.from('PDF content');
      const mockResponse: HttpResponse<any> = {
        data: mockPdfData,
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await serviceInvoices.downloadPdf(TEST_COMPANY_ID, TEST_INVOICE_ID);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/serviceinvoices/${TEST_INVOICE_ID}/pdf`,
        undefined,
        { Accept: 'application/pdf' }
      );
      expect(result).toEqual(mockPdfData);
    });

    it('should download PDF for all invoices when invoiceId is not provided', async () => {
      const mockPdfData = Buffer.from('Bulk PDF content');
      const mockResponse: HttpResponse<any> = {
        data: mockPdfData,
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await serviceInvoices.downloadPdf(TEST_COMPANY_ID);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/serviceinvoices/pdf`,
        undefined,
        { Accept: 'application/pdf' }
      );
      expect(result).toEqual(mockPdfData);
    });
  });

  describe('downloadXml', () => {
    it('should download XML for a specific invoice', async () => {
      const mockXmlData = '<xml>Invoice data</xml>';
      const mockResponse: HttpResponse<any> = {
        data: mockXmlData,
        status: 200,
        headers: { 'content-type': 'application/xml' },
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await serviceInvoices.downloadXml(TEST_COMPANY_ID, TEST_INVOICE_ID);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/serviceinvoices/${TEST_INVOICE_ID}/xml`,
        undefined,
        { Accept: 'application/xml' }
      );
      expect(result).toEqual(mockXmlData);
    });

    it('should download XML for all invoices when invoiceId is not provided', async () => {
      const mockXmlData = '<xml>Bulk invoice data</xml>';
      const mockResponse: HttpResponse<any> = {
        data: mockXmlData,
        status: 200,
        headers: { 'content-type': 'application/xml' },
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await serviceInvoices.downloadXml(TEST_COMPANY_ID);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/serviceinvoices/xml`,
        undefined,
        { Accept: 'application/xml' }
      );
      expect(result).toEqual(mockXmlData);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from http client', async () => {
      const error = new Error('API error');
      vi.mocked(mockHttpClient.get).mockRejectedValue(error);

      await expect(
        serviceInvoices.retrieve(TEST_COMPANY_ID, TEST_INVOICE_ID)
      ).rejects.toThrow('API error');
    });
  });

  describe('createAndWait', () => {
    it('should handle synchronous response (201) without polling', async () => {
      const mockInvoice = createMockInvoice({ flowStatus: 'Issued' });
      const mockResponse: HttpResponse<ServiceInvoice> = {
        data: mockInvoice,
        status: 201,
        headers: {},
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      const invoiceData = {
        borrower: mockInvoice.borrower,
        cityServiceCode: mockInvoice.cityServiceCode,
        description: mockInvoice.description,
        servicesAmount: 1000.00,
      };

      const result = await serviceInvoices.createAndWait(TEST_COMPANY_ID, invoiceData);

      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
      expect(result).toEqual(mockInvoice);
      expect(result.flowStatus).toBe('Issued');
    });

    it('should poll until completion for async response (202)', async () => {
      const asyncResponse: AsyncResponse = {
        code: 202,
        status: 'pending',
        location: `/companies/${TEST_COMPANY_ID}/serviceinvoices/${TEST_INVOICE_ID}`,
      };
      const pendingInvoice = createMockInvoice({ flowStatus: 'WaitingSend' });
      const completedInvoice = createMockInvoice({ flowStatus: 'Issued' });

      vi.mocked(mockHttpClient.post).mockResolvedValue({
        data: asyncResponse,
        status: 202,
        headers: { location: asyncResponse.location },
      });
      vi.mocked(mockHttpClient.get)
        .mockResolvedValueOnce({ data: pendingInvoice, status: 200, headers: {} })
        .mockResolvedValueOnce({ data: completedInvoice, status: 200, headers: {} });

      const invoiceData = {
        borrower: completedInvoice.borrower,
        cityServiceCode: completedInvoice.cityServiceCode,
        description: completedInvoice.description,
        servicesAmount: 1000.00,
      };

      const result = await serviceInvoices.createAndWait(TEST_COMPANY_ID, invoiceData, {
        maxAttempts: 10,
        intervalMs: 10,
      });

      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual(completedInvoice);
      expect(result.flowStatus).toBe('Issued');
    });

    it('should throw InvoiceProcessingError on polling timeout', async () => {
      const asyncResponse: AsyncResponse = {
        code: 202,
        status: 'pending',
        location: `/companies/${TEST_COMPANY_ID}/serviceinvoices/${TEST_INVOICE_ID}`,
      };
      const pendingInvoice = createMockInvoice({ flowStatus: 'WaitingSend' });

      vi.mocked(mockHttpClient.post).mockResolvedValue({
        data: asyncResponse,
        status: 202,
        headers: { location: asyncResponse.location },
      });
      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: pendingInvoice,
        status: 200,
        headers: {},
      });

      const invoiceData = {
        borrower: pendingInvoice.borrower,
        cityServiceCode: pendingInvoice.cityServiceCode,
        description: 'Test',
        servicesAmount: 1000.00,
      };

      await expect(
        serviceInvoices.createAndWait(TEST_COMPANY_ID, invoiceData, {
          timeout: 50, // Very short timeout to force timeout
          initialDelay: 10,
        })
      ).rejects.toThrow(/timeout|Timeout/i);
    }, 10000); // vitest timeout

    it('should throw InvoiceProcessingError if invoice processing fails', async () => {
      const asyncResponse: AsyncResponse = {
        code: 202,
        status: 'pending',
        location: `/companies/${TEST_COMPANY_ID}/serviceinvoices/${TEST_INVOICE_ID}`,
      };
      const failedInvoice = createMockInvoice({ flowStatus: 'IssueFailed' });

      vi.mocked(mockHttpClient.post).mockResolvedValue({
        data: asyncResponse,
        status: 202,
        headers: { location: asyncResponse.location },
      });
      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: failedInvoice,
        status: 200,
        headers: {},
      });

      const invoiceData = {
        borrower: failedInvoice.borrower,
        cityServiceCode: failedInvoice.cityServiceCode,
        description: 'Test',
        servicesAmount: 1000.00,
      };

      await expect(
        serviceInvoices.createAndWait(TEST_COMPANY_ID, invoiceData, {
          maxAttempts: 10,
          intervalMs: 10,
        })
      ).rejects.toThrow(/Invoice processing|Failed to poll/);
    });

    it.skip('should throw InvoiceProcessingError on unexpected response format', async () => {
      // TODO: Add validation for unexpected response formats
      // Currently the code assumes all non-202 responses are successful 201s
      const unexpectedResponse = {
        code: 200,
        message: 'Unexpected response',
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue({
        data: unexpectedResponse,
        status: 200,
        headers: {},
      });

      const invoiceData = {
        borrower: createMockInvoice().borrower,
        cityServiceCode: '12345',
        description: 'Test',
        servicesAmount: 1000.00,
      };

      await expect(
        serviceInvoices.createAndWait(TEST_COMPANY_ID, invoiceData)
      ).rejects.toThrow('Unexpected response from invoice creation');
    });

    it('should respect custom polling options', async () => {
      const asyncResponse: AsyncResponse = {
        code: 202,
        status: 'pending',
        location: `/companies/${TEST_COMPANY_ID}/serviceinvoices/${TEST_INVOICE_ID}`,
      };
      const completedInvoice = createMockInvoice({ flowStatus: 'Issued' });

      vi.mocked(mockHttpClient.post).mockResolvedValue({
        data: asyncResponse,
        status: 202,
        headers: { location: asyncResponse.location },
      });
      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: completedInvoice,
        status: 200,
        headers: {},
      });

      const invoiceData = {
        borrower: completedInvoice.borrower,
        cityServiceCode: completedInvoice.cityServiceCode,
        description: 'Test',
        servicesAmount: 1000.00,
      };

      const result = await serviceInvoices.createAndWait(TEST_COMPANY_ID, invoiceData, {
        maxAttempts: 50,
        intervalMs: 500,
        timeoutMs: 30000,
      });

      expect(result).toEqual(completedInvoice);
    });

    it('should handle async response without location header', async () => {
      const asyncResponse: AsyncResponse = {
        code: 202,
        status: 'pending',
        location: undefined as any,
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue({
        data: asyncResponse,
        status: 202,
        headers: {},
      });

      const invoiceData = {
        borrower: createMockInvoice().borrower,
        cityServiceCode: '12345',
        description: 'Test',
        servicesAmount: 1000.00,
      };

      await expect(
        serviceInvoices.createAndWait(TEST_COMPANY_ID, invoiceData)
      ).rejects.toThrow('Async response (202) received but no Location header found');
    });

    it('should extract path from full URL in location header', async () => {
      const asyncResponse: AsyncResponse = {
        code: 202,
        status: 'pending',
        location: `https://api.nfe.io/v1/companies/${TEST_COMPANY_ID}/serviceinvoices/${TEST_INVOICE_ID}`,
      };
      const completedInvoice = createMockInvoice({ flowStatus: 'Issued' });

      vi.mocked(mockHttpClient.post).mockResolvedValue({
        data: asyncResponse,
        status: 202,
        headers: { location: asyncResponse.location },
      });
      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: completedInvoice,
        status: 200,
        headers: {},
      });

      const invoiceData = {
        borrower: completedInvoice.borrower,
        cityServiceCode: completedInvoice.cityServiceCode,
        description: 'Test',
        servicesAmount: 1000.00,
      };

      const result = await serviceInvoices.createAndWait(TEST_COMPANY_ID, invoiceData, {
        intervalMs: 10,
      });

      // Path extracted from URL - the resource methods don't include /v1 prefix
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/serviceinvoices/${TEST_INVOICE_ID}`
      );
      expect(result).toEqual(completedInvoice);
    });

    it('should handle timeout correctly', async () => {
      const asyncResponse: AsyncResponse = {
        code: 202,
        status: 'pending',
        location: `/companies/${TEST_COMPANY_ID}/serviceinvoices/${TEST_INVOICE_ID}`,
      };
      const pendingInvoice = createMockInvoice({ flowStatus: 'WaitingSend' });

      vi.mocked(mockHttpClient.post).mockResolvedValue({
        data: asyncResponse,
        status: 202,
        headers: { location: asyncResponse.location },
      });
      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: pendingInvoice,
        status: 200,
        headers: {},
      });

      const invoiceData = {
        borrower: pendingInvoice.borrower,
        cityServiceCode: '12345',
        description: 'Test',
        servicesAmount: 1000.00,
      };

      const startTime = Date.now();

      await expect(
        serviceInvoices.createAndWait(TEST_COMPANY_ID, invoiceData, {
          timeout: 100, // 100ms timeout
          initialDelay: 10,
        })
      ).rejects.toThrow(/timeout|Timeout/i);

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(500); // Should timeout quickly
    }, 10000); // vitest timeout
  });

  describe('getStatus', () => {
    it('should return invoice status with completion flags', async () => {
      const mockInvoice = createMockInvoice({ flowStatus: 'Issued' });
      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: mockInvoice,
        status: 200,
        headers: {},
      });

      const result = await serviceInvoices.getStatus(TEST_COMPANY_ID, TEST_INVOICE_ID);

      expect(result.status).toBe('Issued');
      expect(result.invoice).toEqual(mockInvoice);
      expect(result.isComplete).toBe(true);
      expect(result.isFailed).toBe(false);
    });

    it('should recognize failed status', async () => {
      const mockInvoice = createMockInvoice({ flowStatus: 'IssueFailed' });
      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: mockInvoice,
        status: 200,
        headers: {},
      });

      const result = await serviceInvoices.getStatus(TEST_COMPANY_ID, TEST_INVOICE_ID);

      expect(result.isComplete).toBe(true); // IssueFailed is a terminal status
      expect(result.isFailed).toBe(true);
    });

    it('should recognize cancelled status as failed', async () => {
      const mockInvoice = createMockInvoice({ flowStatus: 'CancelFailed' });
      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: mockInvoice,
        status: 200,
        headers: {},
      });

      const result = await serviceInvoices.getStatus(TEST_COMPANY_ID, TEST_INVOICE_ID);

      expect(result.isFailed).toBe(true);
    });
  });

  describe('createBatch', () => {
    it('should create multiple invoices without waiting', async () => {
      const mockInvoice = createMockInvoice();
      vi.mocked(mockHttpClient.post).mockResolvedValue({
        data: mockInvoice,
        status: 201,
        headers: {},
      });

      const invoicesData = [
        { borrower: mockInvoice.borrower, cityServiceCode: '12345', servicesAmount: 1000 },
        { borrower: mockInvoice.borrower, cityServiceCode: '12346', servicesAmount: 2000 },
      ];

      const results = await serviceInvoices.createBatch(TEST_COMPANY_ID, invoicesData);

      expect(results).toHaveLength(2);
      expect(mockHttpClient.post).toHaveBeenCalledTimes(2);
    });

    it('should create multiple invoices and wait for completion', async () => {
      const mockInvoice = createMockInvoice({ flowStatus: 'Issued' });
      vi.mocked(mockHttpClient.post).mockResolvedValue({
        data: mockInvoice,
        status: 201,
        headers: {},
      });

      const invoicesData = [
        { borrower: mockInvoice.borrower, cityServiceCode: '12345', servicesAmount: 1000 },
        { borrower: mockInvoice.borrower, cityServiceCode: '12346', servicesAmount: 2000 },
      ];

      const results = await serviceInvoices.createBatch(TEST_COMPANY_ID, invoicesData, {
        waitForCompletion: true,
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => 'flowStatus' in r && r.flowStatus === 'Issued')).toBe(true);
    });

    it('should respect maxConcurrent option', async () => {
      const mockInvoice = createMockInvoice();
      let concurrentCalls = 0;
      let maxConcurrent = 0;

      vi.mocked(mockHttpClient.post).mockImplementation(async () => {
        concurrentCalls++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCalls);
        await new Promise(resolve => setTimeout(resolve, 10));
        concurrentCalls--;
        return { data: mockInvoice, status: 201, headers: {} };
      });

      const invoicesData = Array(10).fill(null).map((_, i) => ({
        borrower: mockInvoice.borrower,
        cityServiceCode: `1234${i}`,
        servicesAmount: 1000,
      }));

      await serviceInvoices.createBatch(TEST_COMPANY_ID, invoicesData, {
        maxConcurrent: 3,
      });

      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });
  });
});
