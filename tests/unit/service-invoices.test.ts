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
      expect(result).toEqual(mockInvoice);
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

      expect(result).toEqual(asyncResponse);
      expect((result as AsyncResponse).status).toBe('pending');
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
      const cancelledInvoice = createMockInvoice({ status: 'cancelled' });
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
      expect(result.status).toBe('cancelled');
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
        `/companies/${TEST_COMPANY_ID}/serviceinvoices/${TEST_INVOICE_ID}/pdf`
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
        `/companies/${TEST_COMPANY_ID}/serviceinvoices/pdf`
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
        `/companies/${TEST_COMPANY_ID}/serviceinvoices/${TEST_INVOICE_ID}/xml`
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
        `/companies/${TEST_COMPANY_ID}/serviceinvoices/xml`
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
});
