/**
 * Unit tests for ProductInvoicesResource
 * Tests all CRUD, download, correction letter, and disablement operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductInvoicesResource } from '../../../src/core/resources/product-invoices.js';
import { HttpClient } from '../../../src/core/http/client.js';
import type {
  HttpResponse,
  NfeProductInvoiceIssueData,
  NfeProductInvoice,
  NfeProductInvoiceListResponse,
  NfeInvoiceItemsResponse,
  NfeProductInvoiceEventsResponse,
  NfeFileResource,
  NfeRequestCancellationResource,
  NfeDisablementResource,
} from '../../../src/core/types.js';
import { ValidationError } from '../../../src/core/errors/index.js';

describe('ProductInvoicesResource', () => {
  let resource: ProductInvoicesResource;
  let mockHttpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getBuffer: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      getBuffer: vi.fn(),
    };
    resource = new ProductInvoicesResource(mockHttpClient as unknown as HttpClient);
  });

  const companyId = 'company-123';
  const invoiceId = 'invoice-456';
  const stateTaxId = 'statetax-789';

  function mockIssueData(): NfeProductInvoiceIssueData {
    return {
      operationNature: 'Venda de mercadoria',
      operationType: 'Outgoing',
      buyer: {
        name: 'Empresa LTDA',
        federalTaxNumber: 12345678000190,
      },
      items: [
        {
          code: 'PROD-001',
          description: 'Produto X',
          quantity: 1,
          unitAmount: 100,
        },
      ],
      payment: [
        {
          paymentDetail: [{ method: 'Cash', amount: 100 }],
        },
      ],
    } as NfeProductInvoiceIssueData;
  }

  // --------------------------------------------------------------------------
  // create
  // --------------------------------------------------------------------------

  describe('create', () => {
    it('should issue a product invoice', async () => {
      const data = mockIssueData();
      const httpResponse: HttpResponse<NfeProductInvoiceIssueData> = {
        data,
        status: 202,
        headers: {},
      };
      mockHttpClient.post.mockResolvedValue(httpResponse);

      const result = await resource.create(companyId, data);

      expect(result).toEqual(data);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices`,
        data,
      );
    });

    it('should throw ValidationError when companyId is empty', async () => {
      await expect(resource.create('', mockIssueData())).rejects.toThrow(ValidationError);
      await expect(resource.create('  ', mockIssueData())).rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // createWithStateTax
  // --------------------------------------------------------------------------

  describe('createWithStateTax', () => {
    it('should issue via state tax endpoint', async () => {
      const data = mockIssueData();
      const httpResponse: HttpResponse<NfeProductInvoiceIssueData> = {
        data,
        status: 202,
        headers: {},
      };
      mockHttpClient.post.mockResolvedValue(httpResponse);

      const result = await resource.createWithStateTax(companyId, stateTaxId, data);

      expect(result).toEqual(data);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/statetaxes/${stateTaxId}/productinvoices`,
        data,
      );
    });

    it('should throw ValidationError when stateTaxId is empty', async () => {
      await expect(resource.createWithStateTax(companyId, '', mockIssueData()))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when companyId is empty', async () => {
      await expect(resource.createWithStateTax('', stateTaxId, mockIssueData()))
        .rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // list
  // --------------------------------------------------------------------------

  describe('list', () => {
    const mockListResponse: NfeProductInvoiceListResponse = {
      productInvoices: [],
      hasMore: false,
      totalCount: 0,
    };

    it('should list product invoices', async () => {
      const httpResponse: HttpResponse<NfeProductInvoiceListResponse> = {
        data: mockListResponse,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(httpResponse);

      const result = await resource.list(companyId, { environment: 'Production' });

      expect(result).toEqual(mockListResponse);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices`,
        { environment: 'Production' },
      );
    });

    it('should pass pagination params', async () => {
      const httpResponse: HttpResponse<NfeProductInvoiceListResponse> = {
        data: mockListResponse,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(httpResponse);

      await resource.list(companyId, {
        environment: 'Test',
        limit: 10,
        startingAfter: 'cursor-abc',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices`,
        { environment: 'Test', limit: 10, startingAfter: 'cursor-abc' },
      );
    });

    it('should throw ValidationError when environment is missing', async () => {
      await expect(resource.list(companyId, {} as any)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when companyId is empty', async () => {
      await expect(resource.list('', { environment: 'Production' }))
        .rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // retrieve
  // --------------------------------------------------------------------------

  describe('retrieve', () => {
    it('should retrieve a product invoice', async () => {
      const mockInvoice = { id: invoiceId, status: 'Issued' } as unknown as NfeProductInvoice;
      const httpResponse: HttpResponse<NfeProductInvoice> = {
        data: mockInvoice,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(httpResponse);

      const result = await resource.retrieve(companyId, invoiceId);

      expect(result).toEqual(mockInvoice);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices/${invoiceId}`,
      );
    });

    it('should throw ValidationError when invoiceId is empty', async () => {
      await expect(resource.retrieve(companyId, '')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when companyId is empty', async () => {
      await expect(resource.retrieve('', invoiceId)).rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // cancel
  // --------------------------------------------------------------------------

  describe('cancel', () => {
    const mockCancellation = { id: 'cancel-1' } as unknown as NfeRequestCancellationResource;

    it('should cancel without reason', async () => {
      const httpResponse: HttpResponse<NfeRequestCancellationResource> = {
        data: mockCancellation,
        status: 204,
        headers: {},
      };
      mockHttpClient.delete.mockResolvedValue(httpResponse);

      const result = await resource.cancel(companyId, invoiceId);

      expect(result).toEqual(mockCancellation);
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices/${invoiceId}`,
      );
    });

    it('should cancel with reason', async () => {
      const httpResponse: HttpResponse<NfeRequestCancellationResource> = {
        data: mockCancellation,
        status: 204,
        headers: {},
      };
      mockHttpClient.delete.mockResolvedValue(httpResponse);

      await resource.cancel(companyId, invoiceId, 'Erro nos dados');

      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        expect.stringContaining('reason=Erro%20nos%20dados'),
      );
    });

    it('should throw ValidationError when invoiceId is empty', async () => {
      await expect(resource.cancel(companyId, '')).rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // listItems
  // --------------------------------------------------------------------------

  describe('listItems', () => {
    it('should list invoice items', async () => {
      const mockItems: NfeInvoiceItemsResponse = { items: [], hasMore: false, totalCount: 0 };
      const httpResponse: HttpResponse<NfeInvoiceItemsResponse> = {
        data: mockItems,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(httpResponse);

      const result = await resource.listItems(companyId, invoiceId);

      expect(result).toEqual(mockItems);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices/${invoiceId}/items`,
        {},
      );
    });

    it('should pass pagination options', async () => {
      const mockItems: NfeInvoiceItemsResponse = { items: [], hasMore: false, totalCount: 0 };
      mockHttpClient.get.mockResolvedValue({ data: mockItems, status: 200, headers: {} });

      await resource.listItems(companyId, invoiceId, { limit: 5 });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/items'),
        { limit: 5 },
      );
    });

    it('should throw ValidationError when invoiceId is empty', async () => {
      await expect(resource.listItems(companyId, '')).rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // listEvents
  // --------------------------------------------------------------------------

  describe('listEvents', () => {
    it('should list invoice events', async () => {
      const mockEvents: NfeProductInvoiceEventsResponse = { events: [], hasMore: false, totalCount: 0 };
      const httpResponse: HttpResponse<NfeProductInvoiceEventsResponse> = {
        data: mockEvents,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(httpResponse);

      const result = await resource.listEvents(companyId, invoiceId);

      expect(result).toEqual(mockEvents);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices/${invoiceId}/events`,
        {},
      );
    });
  });

  // --------------------------------------------------------------------------
  // downloadPdf
  // --------------------------------------------------------------------------

  describe('downloadPdf', () => {
    const mockFile: NfeFileResource = { uri: 'https://cdn.nfse.io/danfe.pdf' };

    it('should get PDF file resource', async () => {
      const httpResponse: HttpResponse<NfeFileResource> = {
        data: mockFile,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(httpResponse);

      const result = await resource.downloadPdf(companyId, invoiceId);

      expect(result).toEqual(mockFile);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices/${invoiceId}/pdf`,
        {},
      );
    });

    it('should pass force param', async () => {
      mockHttpClient.get.mockResolvedValue({ data: mockFile, status: 200, headers: {} });

      await resource.downloadPdf(companyId, invoiceId, true);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/pdf'),
        { force: true },
      );
    });

    it('should throw ValidationError when companyId is empty', async () => {
      await expect(resource.downloadPdf('', invoiceId)).rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // downloadXml
  // --------------------------------------------------------------------------

  describe('downloadXml', () => {
    it('should get XML file resource', async () => {
      const mockFile: NfeFileResource = { uri: 'https://cdn.nfse.io/nfe.xml' };
      mockHttpClient.get.mockResolvedValue({ data: mockFile, status: 200, headers: {} });

      const result = await resource.downloadXml(companyId, invoiceId);

      expect(result).toEqual(mockFile);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices/${invoiceId}/xml`,
      );
    });
  });

  // --------------------------------------------------------------------------
  // downloadRejectionXml
  // --------------------------------------------------------------------------

  describe('downloadRejectionXml', () => {
    it('should use /xml-rejection canonical path', async () => {
      const mockFile: NfeFileResource = { uri: 'https://cdn.nfse.io/rejection.xml' };
      mockHttpClient.get.mockResolvedValue({ data: mockFile, status: 200, headers: {} });

      const result = await resource.downloadRejectionXml(companyId, invoiceId);

      expect(result).toEqual(mockFile);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices/${invoiceId}/xml-rejection`,
      );
    });
  });

  // --------------------------------------------------------------------------
  // downloadEpecXml
  // --------------------------------------------------------------------------

  describe('downloadEpecXml', () => {
    it('should get EPEC XML file resource', async () => {
      const mockFile: NfeFileResource = { uri: 'https://cdn.nfse.io/epec.xml' };
      mockHttpClient.get.mockResolvedValue({ data: mockFile, status: 200, headers: {} });

      const result = await resource.downloadEpecXml(companyId, invoiceId);

      expect(result).toEqual(mockFile);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices/${invoiceId}/xml-epec`,
      );
    });
  });

  // --------------------------------------------------------------------------
  // sendCorrectionLetter
  // --------------------------------------------------------------------------

  describe('sendCorrectionLetter', () => {
    const mockResult = { id: 'cc-1' } as unknown as NfeRequestCancellationResource;
    const validReason = 'Correcao no endereco do destinatario conforme informado pelo cliente';

    it('should send correction letter', async () => {
      mockHttpClient.put.mockResolvedValue({ data: mockResult, status: 200, headers: {} });

      const result = await resource.sendCorrectionLetter(companyId, invoiceId, validReason);

      expect(result).toEqual(mockResult);
      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices/${invoiceId}/correctionletter`,
        { reason: validReason },
      );
    });

    it('should throw if reason is too short', async () => {
      await expect(resource.sendCorrectionLetter(companyId, invoiceId, 'short'))
        .rejects.toThrow(ValidationError);
      await expect(resource.sendCorrectionLetter(companyId, invoiceId, 'short'))
        .rejects.toThrow(/at least 15 characters/);
    });

    it('should throw if reason exceeds 1000 characters', async () => {
      const longReason = 'x'.repeat(1001);
      await expect(resource.sendCorrectionLetter(companyId, invoiceId, longReason))
        .rejects.toThrow(ValidationError);
      await expect(resource.sendCorrectionLetter(companyId, invoiceId, longReason))
        .rejects.toThrow(/at most 1,000 characters/);
    });

    it('should throw if reason is empty', async () => {
      await expect(resource.sendCorrectionLetter(companyId, invoiceId, ''))
        .rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // downloadCorrectionLetterPdf / downloadCorrectionLetterXml
  // --------------------------------------------------------------------------

  describe('downloadCorrectionLetterPdf', () => {
    it('should get CC-e PDF', async () => {
      const mockFile: NfeFileResource = { uri: 'https://cdn.nfse.io/cce.pdf' };
      mockHttpClient.get.mockResolvedValue({ data: mockFile, status: 200, headers: {} });

      const result = await resource.downloadCorrectionLetterPdf(companyId, invoiceId);

      expect(result).toEqual(mockFile);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices/${invoiceId}/correctionletter/pdf`,
      );
    });
  });

  describe('downloadCorrectionLetterXml', () => {
    it('should get CC-e XML', async () => {
      const mockFile: NfeFileResource = { uri: 'https://cdn.nfse.io/cce.xml' };
      mockHttpClient.get.mockResolvedValue({ data: mockFile, status: 200, headers: {} });

      const result = await resource.downloadCorrectionLetterXml(companyId, invoiceId);

      expect(result).toEqual(mockFile);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices/${invoiceId}/correctionletter/xml`,
      );
    });
  });

  // --------------------------------------------------------------------------
  // disable
  // --------------------------------------------------------------------------

  describe('disable', () => {
    const mockResult = { id: 'dis-1' } as unknown as NfeRequestCancellationResource;

    it('should disable without reason', async () => {
      mockHttpClient.post.mockResolvedValue({ data: mockResult, status: 204, headers: {} });

      const result = await resource.disable(companyId, invoiceId);

      expect(result).toEqual(mockResult);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices/${invoiceId}/disablement`,
      );
    });

    it('should disable with reason query param', async () => {
      mockHttpClient.post.mockResolvedValue({ data: mockResult, status: 204, headers: {} });

      await resource.disable(companyId, invoiceId, 'Numero inutilizado');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.stringContaining('reason=Numero%20inutilizado'),
      );
    });

    it('should throw when invoiceId is empty', async () => {
      await expect(resource.disable(companyId, '')).rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // disableRange
  // --------------------------------------------------------------------------

  describe('disableRange', () => {
    it('should disable a range of invoice numbers', async () => {
      const data = {
        environment: 'Production' as const,
        serie: 1,
        state: 'SP',
        beginNumber: 100,
        lastNumber: 110,
        reason: 'Erro de sequencia',
      };
      const mockResult = { id: 'dis-range-1' } as unknown as NfeDisablementResource;
      mockHttpClient.post.mockResolvedValue({ data: mockResult, status: 200, headers: {} });

      const result = await resource.disableRange(companyId, data);

      expect(result).toEqual(mockResult);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices/disablement`,
        data,
      );
    });

    it('should throw when companyId is empty', async () => {
      await expect(resource.disableRange('', {} as any)).rejects.toThrow(ValidationError);
    });
  });
});
