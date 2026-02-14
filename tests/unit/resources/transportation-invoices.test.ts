/**
 * Unit tests for TransportationInvoicesResource
 * Tests CT-e (Conhecimento de Transporte Eletrônico) operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransportationInvoicesResource } from '../../../src/core/resources/transportation-invoices.js';
import { HttpClient } from '../../../src/core/http/client.js';
import type {
  HttpResponse,
  TransportationInvoiceInboundSettings,
  TransportationInvoiceMetadata
} from '../../../src/core/types.js';
import { ValidationError } from '../../../src/core/errors/index.js';

describe('TransportationInvoicesResource', () => {
  let resource: TransportationInvoicesResource;
  let mockHttpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  // Valid 44-digit access key for testing
  const validAccessKey = '35240112345678000190570010000001231234567890';
  const testCompanyId = 'company-123';
  const testEventKey = 'event-key-456';

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    resource = new TransportationInvoicesResource(mockHttpClient as unknown as HttpClient);
  });

  // ==========================================================================
  // enable() tests
  // ==========================================================================

  describe('enable', () => {
    const mockSettings: TransportationInvoiceInboundSettings = {
      status: 'Active',
      startFromNsu: 1,
      createdOn: '2024-01-15T10:30:00Z',
      modifiedOn: '2024-01-15T10:30:00Z',
    };

    it('should enable automatic CT-e search with default options', async () => {
      const mockResponse: HttpResponse<TransportationInvoiceInboundSettings> = {
        data: mockSettings,
        status: 200,
        headers: {},
      };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await resource.enable(testCompanyId);

      expect(result).toEqual(mockSettings);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/transportationinvoices`,
        {}
      );
    });

    it('should enable automatic CT-e search with startFromNsu option', async () => {
      const mockResponse: HttpResponse<TransportationInvoiceInboundSettings> = {
        data: { ...mockSettings, startFromNsu: 12345 },
        status: 200,
        headers: {},
      };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await resource.enable(testCompanyId, { startFromNsu: 12345 });

      expect(result.startFromNsu).toBe(12345);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/transportationinvoices`,
        { startFromNsu: 12345 }
      );
    });

    it('should enable automatic CT-e search with startFromDate option', async () => {
      const startDate = '2024-01-01T00:00:00Z';
      const mockResponse: HttpResponse<TransportationInvoiceInboundSettings> = {
        data: { ...mockSettings, startFromDate: startDate },
        status: 200,
        headers: {},
      };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await resource.enable(testCompanyId, { startFromDate: startDate });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/transportationinvoices`,
        { startFromDate: startDate }
      );
    });

    it('should throw ValidationError for empty company ID', async () => {
      await expect(resource.enable('')).rejects.toThrow(ValidationError);
      await expect(resource.enable('')).rejects.toThrow(/Company ID is required/);
    });

    it('should throw ValidationError for whitespace-only company ID', async () => {
      await expect(resource.enable('   ')).rejects.toThrow(ValidationError);
    });

    it('should handle API error responses', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Company not found'));

      await expect(resource.enable('invalid-company')).rejects.toThrow('Company not found');
    });
  });

  // ==========================================================================
  // disable() tests
  // ==========================================================================

  describe('disable', () => {
    const mockSettings: TransportationInvoiceInboundSettings = {
      status: 'Disabled',
      startFromNsu: 1,
      createdOn: '2024-01-15T10:30:00Z',
      modifiedOn: '2024-01-16T08:00:00Z',
    };

    it('should disable automatic CT-e search', async () => {
      const mockResponse: HttpResponse<TransportationInvoiceInboundSettings> = {
        data: mockSettings,
        status: 200,
        headers: {},
      };
      mockHttpClient.delete.mockResolvedValue(mockResponse);

      const result = await resource.disable(testCompanyId);

      expect(result).toEqual(mockSettings);
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/transportationinvoices`
      );
    });

    it('should throw ValidationError for empty company ID', async () => {
      await expect(resource.disable('')).rejects.toThrow(ValidationError);
      await expect(resource.disable('')).rejects.toThrow(/Company ID is required/);
    });

    it('should handle API error responses', async () => {
      mockHttpClient.delete.mockRejectedValue(new Error('Not enabled'));

      await expect(resource.disable('invalid-company')).rejects.toThrow('Not enabled');
    });
  });

  // ==========================================================================
  // getSettings() tests
  // ==========================================================================

  describe('getSettings', () => {
    const mockSettings: TransportationInvoiceInboundSettings = {
      status: 'Active',
      startFromNsu: 5000,
      createdOn: '2024-01-15T10:30:00Z',
      modifiedOn: '2024-01-15T10:30:00Z',
    };

    it('should retrieve current CT-e search settings', async () => {
      const mockResponse: HttpResponse<TransportationInvoiceInboundSettings> = {
        data: mockSettings,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.getSettings(testCompanyId);

      expect(result).toEqual(mockSettings);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/transportationinvoices`
      );
    });

    it('should throw ValidationError for empty company ID', async () => {
      await expect(resource.getSettings('')).rejects.toThrow(ValidationError);
      await expect(resource.getSettings('')).rejects.toThrow(/Company ID is required/);
    });

    it('should handle API error responses', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Not found'));

      await expect(resource.getSettings('invalid-company')).rejects.toThrow('Not found');
    });
  });

  // ==========================================================================
  // retrieve() tests
  // ==========================================================================

  describe('retrieve', () => {
    const mockMetadata: TransportationInvoiceMetadata = {
      accessKey: validAccessKey,
      type: 'TransportationInvoice',
      nameSender: 'Test Sender Company',
      federalTaxNumberSender: '12345678000190',
      totalInvoiceAmount: 1500.50,
      issuedOn: '2024-01-15T14:30:00Z',
      receivedOn: '2024-01-15T15:00:00Z',
      status: 'Authorized',
    };

    it('should retrieve CT-e metadata by access key', async () => {
      const mockResponse: HttpResponse<TransportationInvoiceMetadata> = {
        data: mockMetadata,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.retrieve(testCompanyId, validAccessKey);

      expect(result).toEqual(mockMetadata);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/${validAccessKey}`
      );
    });

    it('should handle access key with whitespace', async () => {
      const mockResponse: HttpResponse<TransportationInvoiceMetadata> = {
        data: mockMetadata,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await resource.retrieve(testCompanyId, `  ${validAccessKey}  `);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/${validAccessKey}`
      );
    });

    it('should throw ValidationError for empty access key', async () => {
      await expect(resource.retrieve(testCompanyId, '')).rejects.toThrow(ValidationError);
      await expect(resource.retrieve(testCompanyId, '')).rejects.toThrow(/Access key is required/);
    });

    it('should throw ValidationError for whitespace-only access key', async () => {
      await expect(resource.retrieve(testCompanyId, '   ')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for access key with less than 44 digits', async () => {
      await expect(resource.retrieve(testCompanyId, '123456789012345678901234567890123456789012')).rejects.toThrow(ValidationError);
      await expect(resource.retrieve(testCompanyId, '12345')).rejects.toThrow(/Invalid access key/);
    });

    it('should throw ValidationError for access key with more than 44 digits', async () => {
      const longKey = '123456789012345678901234567890123456789012345';
      await expect(resource.retrieve(testCompanyId, longKey)).rejects.toThrow(ValidationError);
      await expect(resource.retrieve(testCompanyId, longKey)).rejects.toThrow(/Invalid access key/);
    });

    it('should throw ValidationError for access key with non-numeric characters', async () => {
      const invalidKey = '3524011234567800019057001000000123123456789a';
      await expect(resource.retrieve(testCompanyId, invalidKey)).rejects.toThrow(ValidationError);
      await expect(resource.retrieve(testCompanyId, invalidKey)).rejects.toThrow(/Invalid access key/);
    });

    it('should throw ValidationError for access key with letters', async () => {
      const invalidKey = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP';
      await expect(resource.retrieve(testCompanyId, invalidKey)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty company ID', async () => {
      await expect(resource.retrieve('', validAccessKey)).rejects.toThrow(ValidationError);
      await expect(resource.retrieve('', validAccessKey)).rejects.toThrow(/Company ID is required/);
    });

    it('should handle API error responses', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('CT-e not found'));

      await expect(resource.retrieve(testCompanyId, validAccessKey)).rejects.toThrow('CT-e not found');
    });
  });

  // ==========================================================================
  // downloadXml() tests
  // ==========================================================================

  describe('downloadXml', () => {
    const mockXml = '<?xml version="1.0" encoding="UTF-8"?><CTe>...</CTe>';

    it('should download CT-e XML by access key', async () => {
      const mockResponse: HttpResponse<string> = {
        data: mockXml,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.downloadXml(testCompanyId, validAccessKey);

      expect(result).toBe(mockXml);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/${validAccessKey}/xml`
      );
    });

    it('should throw ValidationError for invalid access key', async () => {
      await expect(resource.downloadXml(testCompanyId, 'invalid')).rejects.toThrow(ValidationError);
      await expect(resource.downloadXml(testCompanyId, 'invalid')).rejects.toThrow(/Invalid access key/);
    });

    it('should throw ValidationError for empty company ID', async () => {
      await expect(resource.downloadXml('', validAccessKey)).rejects.toThrow(ValidationError);
      await expect(resource.downloadXml('', validAccessKey)).rejects.toThrow(/Company ID is required/);
    });

    it('should handle API error responses', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('XML not available'));

      await expect(resource.downloadXml(testCompanyId, validAccessKey)).rejects.toThrow('XML not available');
    });
  });

  // ==========================================================================
  // getEvent() tests
  // ==========================================================================

  describe('getEvent', () => {
    const mockEventMetadata: TransportationInvoiceMetadata = {
      accessKey: validAccessKey,
      type: 'Event',
      nameSender: 'Test Sender Company',
      federalTaxNumberSender: '12345678000190',
      status: 'Authorized',
    };

    it('should retrieve CT-e event metadata', async () => {
      const mockResponse: HttpResponse<TransportationInvoiceMetadata> = {
        data: mockEventMetadata,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.getEvent(testCompanyId, validAccessKey, testEventKey);

      expect(result).toEqual(mockEventMetadata);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/${validAccessKey}/events/${testEventKey}`
      );
    });

    it('should handle event key with whitespace', async () => {
      const mockResponse: HttpResponse<TransportationInvoiceMetadata> = {
        data: mockEventMetadata,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await resource.getEvent(testCompanyId, validAccessKey, `  ${testEventKey}  `);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/${validAccessKey}/events/${testEventKey}`
      );
    });

    it('should throw ValidationError for empty event key', async () => {
      await expect(resource.getEvent(testCompanyId, validAccessKey, '')).rejects.toThrow(ValidationError);
      await expect(resource.getEvent(testCompanyId, validAccessKey, '')).rejects.toThrow(/Event key is required/);
    });

    it('should throw ValidationError for whitespace-only event key', async () => {
      await expect(resource.getEvent(testCompanyId, validAccessKey, '   ')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid access key', async () => {
      await expect(resource.getEvent(testCompanyId, 'invalid', testEventKey)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty company ID', async () => {
      await expect(resource.getEvent('', validAccessKey, testEventKey)).rejects.toThrow(ValidationError);
    });

    it('should handle API error responses', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Event not found'));

      await expect(resource.getEvent(testCompanyId, validAccessKey, testEventKey)).rejects.toThrow('Event not found');
    });
  });

  // ==========================================================================
  // downloadEventXml() tests
  // ==========================================================================

  describe('downloadEventXml', () => {
    const mockEventXml = '<?xml version="1.0" encoding="UTF-8"?><procEventoCTe>...</procEventoCTe>';

    it('should download CT-e event XML', async () => {
      const mockResponse: HttpResponse<string> = {
        data: mockEventXml,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.downloadEventXml(testCompanyId, validAccessKey, testEventKey);

      expect(result).toBe(mockEventXml);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/${validAccessKey}/events/${testEventKey}/xml`
      );
    });

    it('should throw ValidationError for empty event key', async () => {
      await expect(resource.downloadEventXml(testCompanyId, validAccessKey, '')).rejects.toThrow(ValidationError);
      await expect(resource.downloadEventXml(testCompanyId, validAccessKey, '')).rejects.toThrow(/Event key is required/);
    });

    it('should throw ValidationError for invalid access key', async () => {
      await expect(resource.downloadEventXml(testCompanyId, 'short', testEventKey)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty company ID', async () => {
      await expect(resource.downloadEventXml('', validAccessKey, testEventKey)).rejects.toThrow(ValidationError);
    });

    it('should handle API error responses', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Event XML not available'));

      await expect(resource.downloadEventXml(testCompanyId, validAccessKey, testEventKey)).rejects.toThrow('Event XML not available');
    });
  });

  // ==========================================================================
  // Access Key Validation (comprehensive tests)
  // ==========================================================================

  describe('Access Key Validation', () => {
    it('should accept valid 44-digit access key', async () => {
      const mockResponse: HttpResponse<TransportationInvoiceMetadata> = {
        data: { accessKey: validAccessKey } as TransportationInvoiceMetadata,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      // Should not throw
      await expect(resource.retrieve(testCompanyId, validAccessKey)).resolves.toBeDefined();
    });

    it('should reject access key with 43 digits', async () => {
      const shortKey = '3524011234567800019057001000000123123456789'; // 43 digits
      await expect(resource.retrieve(testCompanyId, shortKey)).rejects.toThrow(/Invalid access key/);
    });

    it('should reject access key with 45 digits', async () => {
      const longKey = '352401123456780001905700100000012312345678901'; // 45 digits
      await expect(resource.retrieve(testCompanyId, longKey)).rejects.toThrow(/Invalid access key/);
    });

    it('should reject access key with hyphen separators', async () => {
      const hyphenatedKey = '3524-0112-3456-7800-0190-5700-1000-0001-2312-3456-7890';
      await expect(resource.retrieve(testCompanyId, hyphenatedKey)).rejects.toThrow(/Invalid access key/);
    });

    it('should reject access key with spaces', async () => {
      const spacedKey = '35240112345678000190 57001000000123123456789';
      await expect(resource.retrieve(testCompanyId, spacedKey)).rejects.toThrow(/Invalid access key/);
    });

    it('should reject access key with special characters', async () => {
      const specialKey = '3524011234567800019057001000000123123456789!';
      await expect(resource.retrieve(testCompanyId, specialKey)).rejects.toThrow(/Invalid access key/);
    });

    it('should include the invalid access key in error message', async () => {
      const invalidKey = 'short-key';
      await expect(resource.retrieve(testCompanyId, invalidKey)).rejects.toThrow(`Invalid access key: "${invalidKey}"`);
    });
  });
});
