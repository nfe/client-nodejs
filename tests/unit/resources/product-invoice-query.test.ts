/**
 * Unit tests for ProductInvoiceQueryResource
 * Tests NF-e product invoice query operations (consulta-nf)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductInvoiceQueryResource } from '../../../src/core/resources/product-invoice-query.js';
import { HttpClient } from '../../../src/core/http/client.js';
import type {
  HttpResponse,
  ProductInvoiceDetails,
  ProductInvoiceEventsResponse,
} from '../../../src/core/types.js';
import { ValidationError } from '../../../src/core/errors/index.js';

describe('ProductInvoiceQueryResource', () => {
  let resource: ProductInvoiceQueryResource;
  let mockHttpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getBuffer: ReturnType<typeof vi.fn>;
  };

  // Valid 44-digit access key for testing
  const validAccessKey = '35240112345678000190550010000001231234567890';

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      getBuffer: vi.fn(),
    };
    resource = new ProductInvoiceQueryResource(mockHttpClient as unknown as HttpClient);
  });

  // ==========================================================================
  // Access Key Validation
  // ==========================================================================

  describe('access key validation', () => {
    it('should throw ValidationError for empty access key', async () => {
      await expect(resource.retrieve('')).rejects.toThrow(ValidationError);
      await expect(resource.retrieve('')).rejects.toThrow(/Access key is required/);
    });

    it('should throw ValidationError for whitespace-only access key', async () => {
      await expect(resource.retrieve('   ')).rejects.toThrow(ValidationError);
      await expect(resource.retrieve('   ')).rejects.toThrow(/Access key is required/);
    });

    it('should throw ValidationError for non-numeric access key', async () => {
      await expect(resource.retrieve('a'.repeat(44))).rejects.toThrow(ValidationError);
      await expect(resource.retrieve('a'.repeat(44))).rejects.toThrow(/Expected 44 numeric digits/);
    });

    it('should throw ValidationError for too-short access key', async () => {
      await expect(resource.retrieve('12345')).rejects.toThrow(ValidationError);
      await expect(resource.retrieve('12345')).rejects.toThrow(/Expected 44 numeric digits/);
    });

    it('should throw ValidationError for too-long access key', async () => {
      await expect(resource.retrieve('1'.repeat(45))).rejects.toThrow(ValidationError);
    });

    it('should accept valid 44-digit numeric access key', async () => {
      const mockResponse: HttpResponse<ProductInvoiceDetails> = {
        data: { accessKey: validAccessKey } as ProductInvoiceDetails,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await expect(resource.retrieve(validAccessKey)).resolves.toBeDefined();
    });

    it('should validate access key on all methods', async () => {
      const badKey = 'invalid';
      await expect(resource.retrieve(badKey)).rejects.toThrow(ValidationError);
      await expect(resource.downloadPdf(badKey)).rejects.toThrow(ValidationError);
      await expect(resource.downloadXml(badKey)).rejects.toThrow(ValidationError);
      await expect(resource.listEvents(badKey)).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // retrieve()
  // ==========================================================================

  describe('retrieve', () => {
    it('should retrieve product invoice details by access key', async () => {
      const mockInvoice: Partial<ProductInvoiceDetails> = {
        accessKey: validAccessKey,
        currentStatus: 'authorized',
        issuer: {
          name: 'Test Company',
          federalTaxNumber: '12345678000190',
        } as any,
        totals: {
          icms: {
            invoiceAmount: 1500.0,
          },
        } as any,
      };

      const mockResponse: HttpResponse<ProductInvoiceDetails> = {
        data: mockInvoice as ProductInvoiceDetails,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.retrieve(validAccessKey);

      expect(result).toEqual(mockInvoice);
      expect(result.accessKey).toBe(validAccessKey);
      expect(result.currentStatus).toBe('authorized');
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/productinvoices/${validAccessKey}`
      );
    });

    it('should call correct endpoint path', async () => {
      const mockResponse: HttpResponse<ProductInvoiceDetails> = {
        data: {} as ProductInvoiceDetails,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await resource.retrieve(validAccessKey);

      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/productinvoices/${validAccessKey}`
      );
    });

    it('should propagate HTTP errors from client', async () => {
      const httpError = new Error('Not Found');
      (httpError as any).status = 404;
      mockHttpClient.get.mockRejectedValue(httpError);

      await expect(resource.retrieve(validAccessKey)).rejects.toThrow('Not Found');
    });

    it('should propagate authentication errors', async () => {
      const authError = new Error('Unauthorized');
      (authError as any).status = 401;
      mockHttpClient.get.mockRejectedValue(authError);

      await expect(resource.retrieve(validAccessKey)).rejects.toThrow('Unauthorized');
    });
  });

  // ==========================================================================
  // downloadPdf()
  // ==========================================================================

  describe('downloadPdf', () => {
    it('should download DANFE PDF as Buffer', async () => {
      const pdfContent = Buffer.from('%PDF-1.4 mock content');
      const mockResponse: HttpResponse<Buffer> = {
        data: pdfContent,
        status: 200,
        headers: {},
      };
      mockHttpClient.getBuffer.mockResolvedValue(mockResponse);

      const result = await resource.downloadPdf(validAccessKey);

      expect(result).toBeInstanceOf(Buffer);
      expect(result).toEqual(pdfContent);
      expect(mockHttpClient.getBuffer).toHaveBeenCalledWith(
        `/v2/productinvoices/${validAccessKey}.pdf`,
        'application/pdf'
      );
    });

    it('should call correct endpoint with .pdf extension', async () => {
      const mockResponse: HttpResponse<Buffer> = {
        data: Buffer.from(''),
        status: 200,
        headers: {},
      };
      mockHttpClient.getBuffer.mockResolvedValue(mockResponse);

      await resource.downloadPdf(validAccessKey);

      expect(mockHttpClient.getBuffer).toHaveBeenCalledWith(
        `/v2/productinvoices/${validAccessKey}.pdf`,
        'application/pdf'
      );
    });

    it('should propagate 404 errors', async () => {
      const notFoundError = new Error('Not Found');
      (notFoundError as any).status = 404;
      mockHttpClient.getBuffer.mockRejectedValue(notFoundError);

      await expect(resource.downloadPdf(validAccessKey)).rejects.toThrow('Not Found');
    });
  });

  // ==========================================================================
  // downloadXml()
  // ==========================================================================

  describe('downloadXml', () => {
    it('should download NF-e XML as Buffer', async () => {
      const xmlContent = Buffer.from('<?xml version="1.0"?><nfe>mock</nfe>');
      const mockResponse: HttpResponse<Buffer> = {
        data: xmlContent,
        status: 200,
        headers: {},
      };
      mockHttpClient.getBuffer.mockResolvedValue(mockResponse);

      const result = await resource.downloadXml(validAccessKey);

      expect(result).toBeInstanceOf(Buffer);
      expect(result).toEqual(xmlContent);
      expect(mockHttpClient.getBuffer).toHaveBeenCalledWith(
        `/v2/productinvoices/${validAccessKey}.xml`,
        'application/xml'
      );
    });

    it('should call correct endpoint with .xml extension', async () => {
      const mockResponse: HttpResponse<Buffer> = {
        data: Buffer.from(''),
        status: 200,
        headers: {},
      };
      mockHttpClient.getBuffer.mockResolvedValue(mockResponse);

      await resource.downloadXml(validAccessKey);

      expect(mockHttpClient.getBuffer).toHaveBeenCalledWith(
        `/v2/productinvoices/${validAccessKey}.xml`,
        'application/xml'
      );
    });

    it('should propagate 404 errors', async () => {
      const notFoundError = new Error('Not Found');
      (notFoundError as any).status = 404;
      mockHttpClient.getBuffer.mockRejectedValue(notFoundError);

      await expect(resource.downloadXml(validAccessKey)).rejects.toThrow('Not Found');
    });
  });

  // ==========================================================================
  // listEvents()
  // ==========================================================================

  describe('listEvents', () => {
    it('should list fiscal events for an access key', async () => {
      const mockEvents: ProductInvoiceEventsResponse = {
        accessKey: validAccessKey,
        events: [
          {
            eventType: 'cancellation',
            description: 'Cancelamento',
            protocol: '135240112345678',
            authorizedOn: '2024-03-15T10:30:00Z',
          } as any,
        ],
        queriedAt: '2024-03-15T12:00:00Z',
      };

      const mockResponse: HttpResponse<ProductInvoiceEventsResponse> = {
        data: mockEvents,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.listEvents(validAccessKey);

      expect(result.accessKey).toBe(validAccessKey);
      expect(result.events).toHaveLength(1);
      expect(result.events![0].eventType).toBe('cancellation');
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/productinvoices/events/${validAccessKey}`
      );
    });

    it('should handle empty events array', async () => {
      const mockEvents: ProductInvoiceEventsResponse = {
        accessKey: validAccessKey,
        events: [],
        queriedAt: '2024-03-15T12:00:00Z',
      };

      const mockResponse: HttpResponse<ProductInvoiceEventsResponse> = {
        data: mockEvents,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.listEvents(validAccessKey);

      expect(result.events).toEqual([]);
    });

    it('should call correct endpoint path with events segment', async () => {
      const mockResponse: HttpResponse<ProductInvoiceEventsResponse> = {
        data: { events: [] } as unknown as ProductInvoiceEventsResponse,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await resource.listEvents(validAccessKey);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/productinvoices/events/${validAccessKey}`
      );
    });

    it('should propagate 404 errors', async () => {
      const notFoundError = new Error('Not Found');
      (notFoundError as any).status = 404;
      mockHttpClient.get.mockRejectedValue(notFoundError);

      await expect(resource.listEvents(validAccessKey)).rejects.toThrow('Not Found');
    });
  });
});
