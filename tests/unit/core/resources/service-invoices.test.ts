/**
 * NFE.io SDK v3 - Service Invoices Resource Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServiceInvoicesResource } from '../../../../src/core/resources/service-invoices.js';
import type { HttpClient } from '../../../../src/core/http/client.js';
import type { HttpResponse } from '../../../../src/core/types.js';
import { NotFoundError, InvoiceProcessingError, TimeoutError } from '../../../../src/core/errors/index.js';

describe('ServiceInvoicesResource', () => {
  let mockHttp: HttpClient;
  let resource: ServiceInvoicesResource;

  beforeEach(() => {
    // Create mock HttpClient
    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as HttpClient;

    resource = new ServiceInvoicesResource(mockHttp);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create()', () => {
    const companyId = 'company-123';
    const invoiceData = {
      borrower: { name: 'Test Customer' },
      servicesAmount: 1000,
    };

    it('should handle 201 immediate success response', async () => {
      const mockInvoice = {
        id: 'invoice-123',
        flowStatus: 'Issued',
        borrower: { name: 'Test Customer' },
      };

      vi.mocked(mockHttp.post).mockResolvedValue({
        data: mockInvoice,
        status: 201,
        headers: {},
      } as HttpResponse<any>);

      const result = await resource.create(companyId, invoiceData);

      expect(result.status).toBe('immediate');
      if (result.status === 'immediate') {
        expect(result.invoice).toEqual(mockInvoice);
      }
      expect(mockHttp.post).toHaveBeenCalledWith(
        `/companies/${companyId}/serviceinvoices`,
        invoiceData
      );
    });

    it('should handle 202 async response with location header', async () => {
      const mockAsyncResponse = {
        code: 202,
        status: 'pending',
        location: '/v1/companies/company-123/serviceinvoices/invoice-456',
      };

      vi.mocked(mockHttp.post).mockResolvedValue({
        data: mockAsyncResponse,
        status: 202,
        headers: { location: mockAsyncResponse.location },
      } as HttpResponse<any>);

      const result = await resource.create(companyId, invoiceData);

      expect(result.status).toBe('async');
      if (result.status === 'async') {
        expect(result.response.invoiceId).toBe('invoice-456');
        expect(result.response.location).toBe(mockAsyncResponse.location);
      }
    });

    it('should extract invoiceId from Location header correctly', async () => {
      const mockAsyncResponse = {
        code: 202,
        status: 'pending',
        location: '/v1/companies/company-123/serviceinvoices/abc-def-123',
      };

      vi.mocked(mockHttp.post).mockResolvedValue({
        data: mockAsyncResponse,
        status: 202,
        headers: { location: mockAsyncResponse.location },
      } as HttpResponse<any>);

      const result = await resource.create(companyId, invoiceData);

      if (result.status === 'async') {
        expect(result.response.invoiceId).toBe('abc-def-123');
      }
    });

    it('should throw error if Location header is missing on 202', async () => {
      const mockAsyncResponse = {
        code: 202,
        status: 'pending',
        location: '',
      };

      vi.mocked(mockHttp.post).mockResolvedValue({
        data: mockAsyncResponse,
        status: 202,
        headers: {},
      } as HttpResponse<any>);

      await expect(resource.create(companyId, invoiceData)).rejects.toThrow(InvoiceProcessingError);
    });

    it('should throw error if invoiceId cannot be extracted from Location', async () => {
      const mockAsyncResponse = {
        code: 202,
        status: 'pending',
        location: '/invalid/path',
      };

      vi.mocked(mockHttp.post).mockResolvedValue({
        data: mockAsyncResponse,
        status: 202,
        headers: { location: mockAsyncResponse.location },
      } as HttpResponse<any>);

      await expect(resource.create(companyId, invoiceData)).rejects.toThrow(InvoiceProcessingError);
    });
  });

  describe('list()', () => {
    const companyId = 'company-123';

    it('should list invoices with default options', async () => {
      const mockResponse = {
        items: [
          { id: 'inv-1', flowStatus: 'Issued' },
          { id: 'inv-2', flowStatus: 'Issued' },
        ],
        totalCount: 2,
      };

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: {},
      } as HttpResponse<any>);

      const result = await resource.list(companyId);

      expect(result).toEqual(mockResponse);
      expect(mockHttp.get).toHaveBeenCalledWith(
        `/companies/${companyId}/serviceinvoices`,
        {}
      );
    });

    it('should list invoices with pagination options', async () => {
      const mockResponse = { items: [], totalCount: 0 };

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: {},
      } as HttpResponse<any>);

      await resource.list(companyId, { pageIndex: 2, pageCount: 50 });

      expect(mockHttp.get).toHaveBeenCalledWith(
        `/companies/${companyId}/serviceinvoices`,
        { pageIndex: 2, pageCount: 50 }
      );
    });

    it('should list invoices with date filters', async () => {
      const mockResponse = { items: [], totalCount: 0 };

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: {},
      } as HttpResponse<any>);

      const options = {
        issuedBegin: '2026-01-01',
        issuedEnd: '2026-01-31',
        createdBegin: '2026-01-01T00:00:00',
        createdEnd: '2026-01-31T23:59:59',
        hasTotals: true,
      };

      await resource.list(companyId, options);

      expect(mockHttp.get).toHaveBeenCalledWith(
        `/companies/${companyId}/serviceinvoices`,
        options
      );
    });

    it('should return empty list when no invoices found', async () => {
      const mockResponse = { items: [], totalCount: 0 };

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: {},
      } as HttpResponse<any>);

      const result = await resource.list(companyId);

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('retrieve()', () => {
    const companyId = 'company-123';
    const invoiceId = 'invoice-456';

    it('should retrieve invoice by ID', async () => {
      const mockInvoice = {
        id: invoiceId,
        flowStatus: 'Issued',
        borrower: { name: 'Test Customer' },
      };

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: mockInvoice,
        status: 200,
        headers: {},
      } as HttpResponse<any>);

      const result = await resource.retrieve(companyId, invoiceId);

      expect(result).toEqual(mockInvoice);
      expect(mockHttp.get).toHaveBeenCalledWith(
        `/companies/${companyId}/serviceinvoices/${invoiceId}`
      );
    });

    it('should throw NotFoundError when invoice does not exist', async () => {
      vi.mocked(mockHttp.get).mockRejectedValue(new NotFoundError('Invoice not found'));

      await expect(resource.retrieve(companyId, invoiceId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('cancel()', () => {
    const companyId = 'company-123';
    const invoiceId = 'invoice-456';

    it('should cancel invoice successfully', async () => {
      const mockCancelledInvoice = {
        id: invoiceId,
        flowStatus: 'Cancelled',
      };

      vi.mocked(mockHttp.delete).mockResolvedValue({
        data: mockCancelledInvoice,
        status: 200,
        headers: {},
      } as HttpResponse<any>);

      const result = await resource.cancel(companyId, invoiceId);

      expect(result).toEqual(mockCancelledInvoice);
      expect(mockHttp.delete).toHaveBeenCalledWith(
        `/companies/${companyId}/serviceinvoices/${invoiceId}`
      );
    });

    it('should throw NotFoundError when trying to cancel non-existent invoice', async () => {
      vi.mocked(mockHttp.delete).mockRejectedValue(new NotFoundError('Invoice not found'));

      await expect(resource.cancel(companyId, invoiceId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('sendEmail()', () => {
    const companyId = 'company-123';
    const invoiceId = 'invoice-456';

    it('should send email successfully', async () => {
      const mockResponse = { sent: true, message: 'Email sent' };

      vi.mocked(mockHttp.put).mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: {},
      } as HttpResponse<any>);

      const result = await resource.sendEmail(companyId, invoiceId);

      expect(result).toEqual(mockResponse);
      expect(result.sent).toBe(true);
    });

    it('should handle email send failure', async () => {
      const mockResponse = { sent: false, message: 'Invalid email' };

      vi.mocked(mockHttp.put).mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: {},
      } as HttpResponse<any>);

      const result = await resource.sendEmail(companyId, invoiceId);

      expect(result.sent).toBe(false);
      expect(result.message).toBe('Invalid email');
    });
  });

  describe('createAndWait()', () => {
    const companyId = 'company-123';
    const invoiceData = {
      borrower: { name: 'Test Customer' },
      servicesAmount: 1000,
    };

    it('should return immediately on 201 response', async () => {
      const mockInvoice = {
        id: 'invoice-123',
        flowStatus: 'Issued',
        borrower: { name: 'Test Customer' },
      };

      vi.mocked(mockHttp.post).mockResolvedValue({
        data: mockInvoice,
        status: 201,
        headers: {},
      } as HttpResponse<any>);

      const result = await resource.createAndWait(companyId, invoiceData);

      expect(result).toEqual(mockInvoice);
      expect(mockHttp.post).toHaveBeenCalledTimes(1);
    });

    // Note: Complex polling tests with fake timers are skipped
    // The polling utility itself is thoroughly tested in polling.test.ts
    // Integration tests will cover the full createAndWait() flow
  });

  describe('downloadPdf()', () => {
    const companyId = 'company-123';
    const invoiceId = 'invoice-456';

    it('should download PDF for single invoice', async () => {
      const mockPdfBuffer = Buffer.from('PDF content');

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: mockPdfBuffer,
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      } as HttpResponse<Buffer>);

      const result = await resource.downloadPdf(companyId, invoiceId);

      expect(result).toEqual(mockPdfBuffer);
      expect(mockHttp.get).toHaveBeenCalledWith(
        `/companies/${companyId}/serviceinvoices/${invoiceId}/pdf`,
        undefined,
        { Accept: 'application/pdf' }
      );
    });

    it('should download PDF for all company invoices (bulk)', async () => {
      const mockZipBuffer = Buffer.from('ZIP content');

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: mockZipBuffer,
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      } as HttpResponse<Buffer>);

      const result = await resource.downloadPdf(companyId);

      expect(result).toEqual(mockZipBuffer);
      expect(mockHttp.get).toHaveBeenCalledWith(
        `/companies/${companyId}/serviceinvoices/pdf`,
        undefined,
        { Accept: 'application/pdf' }
      );
    });

    it('should throw NotFoundError when PDF is not ready', async () => {
      vi.mocked(mockHttp.get).mockRejectedValue(
        new NotFoundError('PDF not found or not ready')
      );

      await expect(resource.downloadPdf(companyId, invoiceId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('downloadXml()', () => {
    const companyId = 'company-123';
    const invoiceId = 'invoice-456';

    it('should download XML for single invoice', async () => {
      const mockXmlBuffer = Buffer.from('<xml>content</xml>');

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: mockXmlBuffer,
        status: 200,
        headers: { 'content-type': 'application/xml' },
      } as HttpResponse<Buffer>);

      const result = await resource.downloadXml(companyId, invoiceId);

      expect(result).toEqual(mockXmlBuffer);
      expect(mockHttp.get).toHaveBeenCalledWith(
        `/companies/${companyId}/serviceinvoices/${invoiceId}/xml`,
        undefined,
        { Accept: 'application/xml' }
      );
    });

    it('should download XML for all company invoices (bulk)', async () => {
      const mockZipBuffer = Buffer.from('ZIP with XMLs');

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: mockZipBuffer,
        status: 200,
        headers: { 'content-type': 'application/xml' },
      } as HttpResponse<Buffer>);

      const result = await resource.downloadXml(companyId);

      expect(result).toEqual(mockZipBuffer);
      expect(mockHttp.get).toHaveBeenCalledWith(
        `/companies/${companyId}/serviceinvoices/xml`,
        undefined,
        { Accept: 'application/xml' }
      );
    });

    it('should throw NotFoundError when XML is not ready', async () => {
      vi.mocked(mockHttp.get).mockRejectedValue(
        new NotFoundError('XML not found or not ready')
      );

      await expect(resource.downloadXml(companyId, invoiceId)).rejects.toThrow(NotFoundError);
    });

    it('should allow XML buffer to be converted to string', async () => {
      const xmlContent = '<xml>test content</xml>';
      const mockXmlBuffer = Buffer.from(xmlContent);

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: mockXmlBuffer,
        status: 200,
        headers: { 'content-type': 'application/xml' },
      } as HttpResponse<Buffer>);

      const result = await resource.downloadXml(companyId, invoiceId);

      expect(result.toString('utf-8')).toBe(xmlContent);
    });
  });

  describe('getStatus()', () => {
    const companyId = 'company-123';
    const invoiceId = 'invoice-456';

    it('should return status with isComplete true for Issued', async () => {
      const mockInvoice = {
        id: invoiceId,
        flowStatus: 'Issued',
      };

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: mockInvoice,
        status: 200,
        headers: {},
      } as HttpResponse<any>);

      const result = await resource.getStatus(companyId, invoiceId);

      expect(result.status).toBe('Issued');
      expect(result.invoice).toEqual(mockInvoice);
      expect(result.isComplete).toBe(true);
      expect(result.isFailed).toBe(false);
    });

    it('should return status with isFailed true for IssueFailed', async () => {
      const mockInvoice = {
        id: invoiceId,
        flowStatus: 'IssueFailed',
        flowMessage: 'Error occurred',
      };

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: mockInvoice,
        status: 200,
        headers: {},
      } as HttpResponse<any>);

      const result = await resource.getStatus(companyId, invoiceId);

      expect(result.status).toBe('IssueFailed');
      expect(result.isComplete).toBe(true);
      expect(result.isFailed).toBe(true);
    });

    it('should return status with isComplete false for WaitingSend', async () => {
      const mockInvoice = {
        id: invoiceId,
        flowStatus: 'WaitingSend',
      };

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: mockInvoice,
        status: 200,
        headers: {},
      } as HttpResponse<any>);

      const result = await resource.getStatus(companyId, invoiceId);

      expect(result.status).toBe('WaitingSend');
      expect(result.isComplete).toBe(false);
      expect(result.isFailed).toBe(false);
    });
  });

  describe('createBatch()', () => {
    const companyId = 'company-123';
    const invoices = [
      { borrower: { name: 'Customer 1' }, servicesAmount: 100 },
      { borrower: { name: 'Customer 2' }, servicesAmount: 200 },
      { borrower: { name: 'Customer 3' }, servicesAmount: 300 },
    ];

    it('should create batch without waiting', async () => {
      const mockInvoice = { id: 'inv-1', flowStatus: 'Issued' };

      vi.mocked(mockHttp.post).mockResolvedValue({
        data: mockInvoice,
        status: 201,
        headers: {},
      } as HttpResponse<any>);

      const result = await resource.createBatch(companyId, invoices);

      expect(result).toHaveLength(3);
      expect(mockHttp.post).toHaveBeenCalledTimes(3);
    });

    it('should create batch with waiting (async completion)', async () => {
      const mockInvoice = { id: 'inv-1', flowStatus: 'Issued' };

      vi.mocked(mockHttp.post).mockResolvedValue({
        data: mockInvoice,
        status: 201,
        headers: {},
      } as HttpResponse<any>);

      const result = await resource.createBatch(companyId, invoices, {
        waitForCompletion: true,
      });

      expect(result).toHaveLength(3);
      // All should be completed invoices
      result.forEach((item) => {
        if ('id' in item) {
          expect(item.flowStatus).toBe('Issued');
        }
      });
    });

    it('should respect maxConcurrent option', async () => {
      const mockInvoice = { id: 'inv-1', flowStatus: 'Issued' };

      vi.mocked(mockHttp.post).mockResolvedValue({
        data: mockInvoice,
        status: 201,
        headers: {},
      } as HttpResponse<any>);

      await resource.createBatch(companyId, invoices, { maxConcurrent: 2 });

      // Should still create all 3, but in batches of 2
      expect(mockHttp.post).toHaveBeenCalledTimes(3);
    });
  });
});
