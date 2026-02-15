/**
 * Unit tests for TaxCodesResource
 * Tests all four list methods, pagination parameter passing, and default behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaxCodesResource } from '../../../src/core/resources/tax-codes.js';
import { HttpClient } from '../../../src/core/http/client.js';
import type { HttpResponse, TaxCodePaginatedResponse } from '../../../src/core/types.js';

describe('TaxCodesResource', () => {
  let resource: TaxCodesResource;
  let mockHttpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    resource = new TaxCodesResource(mockHttpClient as unknown as HttpClient);
  });

  const mockPaginatedResponse: TaxCodePaginatedResponse = {
    items: [
      { code: '121', description: 'Venda de mercadoria' },
      { code: '122', description: 'Venda de mercadoria para entrega futura' },
    ],
    currentPage: 1,
    totalPages: 5,
    totalCount: 100,
  };

  function mockGet(): void {
    const httpResponse: HttpResponse<TaxCodePaginatedResponse> = {
      data: mockPaginatedResponse,
      status: 200,
      headers: {},
    };
    mockHttpClient.get.mockResolvedValue(httpResponse);
  }

  // ============================================================================
  // listOperationCodes
  // ============================================================================

  describe('listOperationCodes', () => {
    it('should list operation codes without options', async () => {
      mockGet();

      const result = await resource.listOperationCodes();

      expect(result).toEqual(mockPaginatedResponse);
      expect(result.items).toHaveLength(2);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/tax-codes/operation-code');
    });

    it('should pass pageIndex parameter', async () => {
      mockGet();

      await resource.listOperationCodes({ pageIndex: 3 });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/tax-codes/operation-code?pageIndex=3');
    });

    it('should pass pageCount parameter', async () => {
      mockGet();

      await resource.listOperationCodes({ pageCount: 20 });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/tax-codes/operation-code?pageCount=20');
    });

    it('should pass both pagination parameters', async () => {
      mockGet();

      await resource.listOperationCodes({ pageIndex: 2, pageCount: 10 });

      const calledUrl = mockHttpClient.get.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('pageIndex=2');
      expect(calledUrl).toContain('pageCount=10');
    });

    it('should skip undefined pagination values', async () => {
      mockGet();

      await resource.listOperationCodes({});

      expect(mockHttpClient.get).toHaveBeenCalledWith('/tax-codes/operation-code');
    });

    it('should propagate API errors', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Unauthorized'));
      await expect(resource.listOperationCodes()).rejects.toThrow('Unauthorized');
    });
  });

  // ============================================================================
  // listAcquisitionPurposes
  // ============================================================================

  describe('listAcquisitionPurposes', () => {
    it('should list acquisition purposes without options', async () => {
      mockGet();

      const result = await resource.listAcquisitionPurposes();

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/tax-codes/acquisition-purpose');
    });

    it('should pass pagination parameters', async () => {
      mockGet();

      await resource.listAcquisitionPurposes({ pageIndex: 2, pageCount: 25 });

      const calledUrl = mockHttpClient.get.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('/tax-codes/acquisition-purpose');
      expect(calledUrl).toContain('pageIndex=2');
      expect(calledUrl).toContain('pageCount=25');
    });

    it('should propagate API errors', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Not Found'));
      await expect(resource.listAcquisitionPurposes()).rejects.toThrow('Not Found');
    });
  });

  // ============================================================================
  // listIssuerTaxProfiles
  // ============================================================================

  describe('listIssuerTaxProfiles', () => {
    it('should list issuer tax profiles without options', async () => {
      mockGet();

      const result = await resource.listIssuerTaxProfiles();

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/tax-codes/issuer-tax-profile');
    });

    it('should pass pagination parameters', async () => {
      mockGet();

      await resource.listIssuerTaxProfiles({ pageIndex: 1, pageCount: 50 });

      const calledUrl = mockHttpClient.get.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('/tax-codes/issuer-tax-profile');
      expect(calledUrl).toContain('pageIndex=1');
      expect(calledUrl).toContain('pageCount=50');
    });

    it('should propagate API errors', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Server Error'));
      await expect(resource.listIssuerTaxProfiles()).rejects.toThrow('Server Error');
    });
  });

  // ============================================================================
  // listRecipientTaxProfiles
  // ============================================================================

  describe('listRecipientTaxProfiles', () => {
    it('should list recipient tax profiles without options', async () => {
      mockGet();

      const result = await resource.listRecipientTaxProfiles();

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/tax-codes/recipient-tax-profile');
    });

    it('should pass pagination parameters', async () => {
      mockGet();

      await resource.listRecipientTaxProfiles({ pageIndex: 3, pageCount: 15 });

      const calledUrl = mockHttpClient.get.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('/tax-codes/recipient-tax-profile');
      expect(calledUrl).toContain('pageIndex=3');
      expect(calledUrl).toContain('pageCount=15');
    });

    it('should propagate API errors', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Timeout'));
      await expect(resource.listRecipientTaxProfiles()).rejects.toThrow('Timeout');
    });
  });
});
