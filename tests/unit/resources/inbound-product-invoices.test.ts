/**
 * Unit tests for InboundProductInvoicesResource
 * Tests NF-e distribution (Consulta NF-e Distribuição) operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InboundProductInvoicesResource } from '../../../src/core/resources/inbound-product-invoices.js';
import { HttpClient } from '../../../src/core/http/client.js';
import type {
  HttpResponse,
  InboundInvoiceMetadata,
  InboundProductInvoiceMetadata,
  InboundSettings
} from '../../../src/core/types.js';
import { ValidationError } from '../../../src/core/errors/index.js';

describe('InboundProductInvoicesResource', () => {
  let resource: InboundProductInvoicesResource;
  let mockHttpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  // Valid 44-digit access key for testing
  const validAccessKey = '35240112345678000190550010000001231234567890';
  const testCompanyId = 'company-123';
  const testEventKey = 'event-key-456';

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    resource = new InboundProductInvoicesResource(mockHttpClient as unknown as HttpClient);
  });

  // ==========================================================================
  // Validation tests
  // ==========================================================================

  describe('validation', () => {
    it('should throw ValidationError for empty companyId on enableAutoFetch', async () => {
      await expect(resource.enableAutoFetch('', {})).rejects.toThrow(ValidationError);
      await expect(resource.enableAutoFetch('', {})).rejects.toThrow(/Company ID is required/);
    });

    it('should throw ValidationError for whitespace-only companyId', async () => {
      await expect(resource.enableAutoFetch('   ', {})).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty companyId on disableAutoFetch', async () => {
      await expect(resource.disableAutoFetch('')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty companyId on getSettings', async () => {
      await expect(resource.getSettings('')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid access key format', async () => {
      await expect(resource.getDetails(testCompanyId, '12345')).rejects.toThrow(ValidationError);
      await expect(resource.getDetails(testCompanyId, '12345')).rejects.toThrow(/Expected 44 numeric digits/);
    });

    it('should throw ValidationError for empty access key', async () => {
      await expect(resource.getDetails(testCompanyId, '')).rejects.toThrow(ValidationError);
      await expect(resource.getDetails(testCompanyId, '')).rejects.toThrow(/Access key is required/);
    });

    it('should throw ValidationError for non-numeric access key', async () => {
      await expect(resource.getDetails(testCompanyId, 'a'.repeat(44))).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty eventKey', async () => {
      await expect(resource.getEventDetails(testCompanyId, validAccessKey, '')).rejects.toThrow(ValidationError);
      await expect(resource.getEventDetails(testCompanyId, validAccessKey, '')).rejects.toThrow(/Event key is required/);
    });

    it('should throw ValidationError for whitespace-only eventKey', async () => {
      await expect(resource.getEventDetails(testCompanyId, validAccessKey, '   ')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty accessKeyOrNsu on reprocessWebhook', async () => {
      await expect(resource.reprocessWebhook(testCompanyId, '')).rejects.toThrow(ValidationError);
      await expect(resource.reprocessWebhook(testCompanyId, '')).rejects.toThrow(/Access key or NSU is required/);
    });
  });

  // ==========================================================================
  // enableAutoFetch() tests
  // ==========================================================================

  describe('enableAutoFetch', () => {
    const mockSettings: InboundSettings = {
      startFromNsu: '999999',
      startFromDate: '2024-01-01T00:00:00Z',
      environmentSEFAZ: 'Production',
      automaticManifesting: { minutesToWaitAwarenessOperation: '30' },
      webhookVersion: '2',
      companyId: testCompanyId,
      status: 'Active',
      createdOn: '2024-01-15T10:30:00Z',
      modifiedOn: '2024-01-15T10:30:00Z',
    };

    it('should enable auto-fetch with provided options', async () => {
      const mockResponse: HttpResponse<InboundSettings> = {
        data: mockSettings,
        status: 200,
        headers: {},
      };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const options = {
        startFromNsu: '999999',
        environmentSEFAZ: 'Production',
        webhookVersion: '2',
      };

      const result = await resource.enableAutoFetch(testCompanyId, options);

      expect(result).toEqual(mockSettings);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/productinvoices`,
        options
      );
    });
  });

  // ==========================================================================
  // disableAutoFetch() tests
  // ==========================================================================

  describe('disableAutoFetch', () => {
    it('should disable auto-fetch for a company', async () => {
      const mockSettings: InboundSettings = {
        startFromNsu: '999999',
        startFromDate: '2024-01-01T00:00:00Z',
        environmentSEFAZ: null,
        automaticManifesting: { minutesToWaitAwarenessOperation: '30' },
        webhookVersion: '2',
        companyId: testCompanyId,
        status: 'Inactive',
        createdOn: '2024-01-15T10:30:00Z',
        modifiedOn: '2024-01-16T10:30:00Z',
      };
      const mockResponse: HttpResponse<InboundSettings> = {
        data: mockSettings,
        status: 200,
        headers: {},
      };
      mockHttpClient.delete.mockResolvedValue(mockResponse);

      const result = await resource.disableAutoFetch(testCompanyId);

      expect(result).toEqual(mockSettings);
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/productinvoices`
      );
    });
  });

  // ==========================================================================
  // getSettings() tests
  // ==========================================================================

  describe('getSettings', () => {
    it('should get current settings for a company', async () => {
      const mockSettings: InboundSettings = {
        startFromNsu: '999999',
        startFromDate: '2024-01-01T00:00:00Z',
        environmentSEFAZ: 'Production',
        automaticManifesting: { minutesToWaitAwarenessOperation: '30' },
        webhookVersion: '2',
        companyId: testCompanyId,
        status: 'Active',
        createdOn: '2024-01-15T10:30:00Z',
        modifiedOn: '2024-01-15T10:30:00Z',
      };
      const mockResponse: HttpResponse<InboundSettings> = {
        data: mockSettings,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.getSettings(testCompanyId);

      expect(result).toEqual(mockSettings);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/productinvoices`
      );
    });
  });

  // ==========================================================================
  // getDetails() / getProductInvoiceDetails() tests
  // ==========================================================================

  describe('getDetails', () => {
    const mockMetadata: InboundInvoiceMetadata = {
      id: 'doc-123',
      createdOn: '2024-01-15T10:30:00Z',
      accessKey: validAccessKey,
      parentAccessKey: '',
      company: { id: testCompanyId, federalTaxNumber: '12345678000190' },
      issuer: { federalTaxNumber: '98765432000110', name: 'Issuer Corp' },
      buyer: { federalTaxNumber: '12345678000190', name: 'Buyer Corp' },
      transportation: { federalTaxNumber: '11111111000111', name: 'Transport Co' },
      links: { xml: 'https://example.com/xml', pdf: 'https://example.com/pdf' },
      xmlUrl: 'https://example.com/xml',
      federalTaxNumberSender: '98765432000110',
      nameSender: 'Issuer Corp',
      type: null,
      nsu: '12345',
      nsuParent: '',
      nfeNumber: '1001',
      nfeSerialNumber: '1',
      issuedOn: '2024-01-10T08:00:00Z',
      description: 'Test invoice',
      totalInvoiceAmount: '1500.00',
      operationType: null,
    };

    it('should get details by access key (webhook v1)', async () => {
      const mockResponse: HttpResponse<InboundInvoiceMetadata> = {
        data: mockMetadata,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.getDetails(testCompanyId, validAccessKey);

      expect(result).toEqual(mockMetadata);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/${validAccessKey}`
      );
    });
  });

  describe('getProductInvoiceDetails', () => {
    const mockProductMetadata: InboundProductInvoiceMetadata = {
      id: 'doc-123',
      createdOn: '2024-01-15T10:30:00Z',
      accessKey: validAccessKey,
      parentAccessKey: '',
      company: { id: testCompanyId, federalTaxNumber: '12345678000190' },
      issuer: { federalTaxNumber: '98765432000110', name: 'Issuer Corp' },
      buyer: { federalTaxNumber: '12345678000190', name: 'Buyer Corp' },
      transportation: { federalTaxNumber: '11111111000111', name: 'Transport Co' },
      links: { xml: 'https://example.com/xml', pdf: 'https://example.com/pdf' },
      xmlUrl: 'https://example.com/xml',
      federalTaxNumberSender: '98765432000110',
      nameSender: 'Issuer Corp',
      type: null,
      nsu: '12345',
      nfeNumber: '1001',
      issuedOn: '2024-01-10T08:00:00Z',
      description: 'Test invoice',
      totalInvoiceAmount: '1500.00',
      productInvoices: [{ accessKey: '11111111111111111111111111111111111111111111' }],
    };

    it('should get product invoice details by access key (webhook v2)', async () => {
      const mockResponse: HttpResponse<InboundProductInvoiceMetadata> = {
        data: mockProductMetadata,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.getProductInvoiceDetails(testCompanyId, validAccessKey);

      expect(result).toEqual(mockProductMetadata);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/productinvoice/${validAccessKey}`
      );
    });
  });

  // ==========================================================================
  // getEventDetails() / getProductInvoiceEventDetails() tests
  // ==========================================================================

  describe('getEventDetails', () => {
    it('should get event details with correct path', async () => {
      const mockResponse: HttpResponse<InboundInvoiceMetadata> = {
        data: {} as InboundInvoiceMetadata,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await resource.getEventDetails(testCompanyId, validAccessKey, testEventKey);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/${validAccessKey}/events/${testEventKey}`
      );
    });

    it('should throw ValidationError for empty eventKey', async () => {
      await expect(
        resource.getEventDetails(testCompanyId, validAccessKey, '')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getProductInvoiceEventDetails', () => {
    it('should get product invoice event details with correct path', async () => {
      const mockResponse: HttpResponse<InboundProductInvoiceMetadata> = {
        data: {} as InboundProductInvoiceMetadata,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await resource.getProductInvoiceEventDetails(testCompanyId, validAccessKey, testEventKey);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/productinvoice/${validAccessKey}/events/${testEventKey}`
      );
    });
  });

  // ==========================================================================
  // Download methods tests (getXml, getEventXml, getPdf, getJson)
  // ==========================================================================

  describe('getXml', () => {
    it('should download XML with correct path', async () => {
      const mockResponse: HttpResponse<string> = {
        data: '<xml>content</xml>',
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.getXml(testCompanyId, validAccessKey);

      expect(result).toBe('<xml>content</xml>');
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/${validAccessKey}/xml`
      );
    });
  });

  describe('getEventXml', () => {
    it('should download event XML with correct path', async () => {
      const mockResponse: HttpResponse<string> = {
        data: '<xml>event</xml>',
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.getEventXml(testCompanyId, validAccessKey, testEventKey);

      expect(result).toBe('<xml>event</xml>');
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/${validAccessKey}/events/${testEventKey}/xml`
      );
    });

    it('should throw ValidationError for empty eventKey', async () => {
      await expect(
        resource.getEventXml(testCompanyId, validAccessKey, '')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getPdf', () => {
    it('should download PDF with correct path', async () => {
      const mockResponse: HttpResponse<string> = {
        data: 'pdf-content',
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.getPdf(testCompanyId, validAccessKey);

      expect(result).toBe('pdf-content');
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/${validAccessKey}/pdf`
      );
    });
  });

  describe('getJson', () => {
    it('should get JSON with correct path', async () => {
      const mockResponse: HttpResponse<InboundInvoiceMetadata> = {
        data: {} as InboundInvoiceMetadata,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await resource.getJson(testCompanyId, validAccessKey);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/productinvoice/${validAccessKey}/json`
      );
    });
  });

  // ==========================================================================
  // manifest() tests
  // ==========================================================================

  describe('manifest', () => {
    it('should send manifest with default tpEvent=210210', async () => {
      const mockResponse: HttpResponse<string> = {
        data: 'ok',
        status: 200,
        headers: {},
      };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await resource.manifest(testCompanyId, validAccessKey);

      expect(result).toBe('ok');
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/${validAccessKey}/manifest?tpEvent=210210`
      );
    });

    it('should send manifest with explicit tpEvent=210220', async () => {
      const mockResponse: HttpResponse<string> = {
        data: 'ok',
        status: 200,
        headers: {},
      };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      await resource.manifest(testCompanyId, validAccessKey, 210220);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/${validAccessKey}/manifest?tpEvent=210220`
      );
    });

    it('should send manifest with tpEvent=210240', async () => {
      const mockResponse: HttpResponse<string> = {
        data: 'ok',
        status: 200,
        headers: {},
      };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      await resource.manifest(testCompanyId, validAccessKey, 210240);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/${validAccessKey}/manifest?tpEvent=210240`
      );
    });

    it('should throw ValidationError for invalid access key', async () => {
      await expect(resource.manifest(testCompanyId, 'invalid')).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // reprocessWebhook() tests
  // ==========================================================================

  describe('reprocessWebhook', () => {
    it('should reprocess webhook by access key', async () => {
      const mockResponse: HttpResponse<InboundProductInvoiceMetadata> = {
        data: {} as InboundProductInvoiceMetadata,
        status: 200,
        headers: {},
      };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      await resource.reprocessWebhook(testCompanyId, validAccessKey);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/productinvoice/${validAccessKey}/processwebhook`
      );
    });

    it('should reprocess webhook by NSU', async () => {
      const mockResponse: HttpResponse<InboundProductInvoiceMetadata> = {
        data: {} as InboundProductInvoiceMetadata,
        status: 200,
        headers: {},
      };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      await resource.reprocessWebhook(testCompanyId, '12345');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v2/companies/${testCompanyId}/inbound/productinvoice/12345/processwebhook`
      );
    });

    it('should throw ValidationError for empty identifier', async () => {
      await expect(resource.reprocessWebhook(testCompanyId, '')).rejects.toThrow(ValidationError);
      await expect(resource.reprocessWebhook(testCompanyId, '')).rejects.toThrow(/Access key or NSU is required/);
    });

    it('should throw ValidationError for whitespace-only identifier', async () => {
      await expect(resource.reprocessWebhook(testCompanyId, '   ')).rejects.toThrow(ValidationError);
    });
  });
});
