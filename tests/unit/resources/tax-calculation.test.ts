/**
 * Unit tests for TaxCalculationResource
 * Tests calculate() success, validation errors, and API error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaxCalculationResource } from '../../../src/core/resources/tax-calculation.js';
import { HttpClient } from '../../../src/core/http/client.js';
import type { HttpResponse, CalculateRequest, CalculateResponse } from '../../../src/core/types.js';
import { ValidationError } from '../../../src/core/errors/index.js';

describe('TaxCalculationResource', () => {
  let resource: TaxCalculationResource;
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
    resource = new TaxCalculationResource(mockHttpClient as unknown as HttpClient);
  });

  // Helper to build a valid request
  function validRequest(): CalculateRequest {
    return {
      operationType: 'Outgoing',
      issuer: { state: 'SP', taxRegime: 'RealProfit' },
      recipient: { state: 'RJ' },
      items: [
        {
          id: 'item-1',
          operationCode: 121,
          origin: 'National',
          quantity: 10,
          unitAmount: 100.0,
        },
      ],
    };
  }

  describe('calculate', () => {
    const mockResponse: CalculateResponse = {
      items: [
        {
          id: 'item-1',
          cfop: 6102,
          icms: { cst: '00', vBC: '1000.00', pICMS: '12.00', vICMS: '120.00' },
          pis: { cst: '01', vBC: '1000.00', pPIS: '1.65', vPIS: '16.50' },
          cofins: { cst: '01', vBC: '1000.00', pCOFINS: '7.60', vCOFINS: '76.00' },
        },
      ],
    };

    it('should calculate taxes successfully', async () => {
      const httpResponse: HttpResponse<CalculateResponse> = {
        data: mockResponse,
        status: 200,
        headers: {},
      };
      mockHttpClient.post.mockResolvedValue(httpResponse);

      const result = await resource.calculate('tenant-123', validRequest());

      expect(result).toEqual(mockResponse);
      expect(result.items).toHaveLength(1);
      expect(result.items![0]!.cfop).toBe(6102);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/tax-rules/tenant-123/engine/calculate',
        validRequest()
      );
    });

    it('should encode tenantId in URL', async () => {
      const httpResponse: HttpResponse<CalculateResponse> = {
        data: mockResponse,
        status: 200,
        headers: {},
      };
      mockHttpClient.post.mockResolvedValue(httpResponse);

      await resource.calculate('tenant with spaces', validRequest());

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/tax-rules/tenant%20with%20spaces/engine/calculate',
        validRequest()
      );
    });

    it('should trim tenantId', async () => {
      const httpResponse: HttpResponse<CalculateResponse> = {
        data: mockResponse,
        status: 200,
        headers: {},
      };
      mockHttpClient.post.mockResolvedValue(httpResponse);

      await resource.calculate('  tenant-123  ', validRequest());

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/tax-rules/tenant-123/engine/calculate',
        validRequest()
      );
    });

    // --- tenantId validation ---

    it('should throw ValidationError for empty tenantId', async () => {
      await expect(resource.calculate('', validRequest())).rejects.toThrow(ValidationError);
      await expect(resource.calculate('', validRequest())).rejects.toThrow(/tenantId is required/);
    });

    it('should throw ValidationError for whitespace-only tenantId', async () => {
      await expect(resource.calculate('   ', validRequest())).rejects.toThrow(ValidationError);
    });

    // --- CalculateRequest validation ---

    it('should throw ValidationError when request is null/undefined', async () => {
      await expect(
        resource.calculate('tenant-123', null as unknown as CalculateRequest)
      ).rejects.toThrow(ValidationError);
      await expect(
        resource.calculate('tenant-123', null as unknown as CalculateRequest)
      ).rejects.toThrow(/request is required/);
    });

    it('should throw ValidationError when issuer is missing', async () => {
      const request = { ...validRequest(), issuer: undefined } as unknown as CalculateRequest;
      await expect(resource.calculate('tenant-123', request)).rejects.toThrow(ValidationError);
      await expect(resource.calculate('tenant-123', request)).rejects.toThrow(/issuer is required/);
    });

    it('should throw ValidationError when recipient is missing', async () => {
      const request = { ...validRequest(), recipient: undefined } as unknown as CalculateRequest;
      await expect(resource.calculate('tenant-123', request)).rejects.toThrow(ValidationError);
      await expect(resource.calculate('tenant-123', request)).rejects.toThrow(/recipient is required/);
    });

    it('should throw ValidationError when operationType is missing', async () => {
      const request = { ...validRequest(), operationType: '' } as unknown as CalculateRequest;
      await expect(resource.calculate('tenant-123', request)).rejects.toThrow(ValidationError);
      await expect(resource.calculate('tenant-123', request)).rejects.toThrow(/operationType is required/);
    });

    it('should throw ValidationError when items is empty', async () => {
      const request = { ...validRequest(), items: [] };
      await expect(resource.calculate('tenant-123', request)).rejects.toThrow(ValidationError);
      await expect(resource.calculate('tenant-123', request)).rejects.toThrow(/items is required/);
    });

    it('should throw ValidationError when items is not an array', async () => {
      const request = { ...validRequest(), items: 'not-array' } as unknown as CalculateRequest;
      await expect(resource.calculate('tenant-123', request)).rejects.toThrow(ValidationError);
    });

    // --- API error handling ---

    it('should propagate API errors', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Bad Request'));
      await expect(resource.calculate('tenant-123', validRequest())).rejects.toThrow('Bad Request');
    });

    it('should propagate network errors', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Network error'));
      await expect(resource.calculate('tenant-123', validRequest())).rejects.toThrow('Network error');
    });
  });
});
