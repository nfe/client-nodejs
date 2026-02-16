/**
 * Unit tests for StateTaxesResource
 * Tests CRUD operations, validation, and API error handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateTaxesResource } from '../../../src/core/resources/state-taxes.js';
import { HttpClient } from '../../../src/core/http/client.js';
import type {
  HttpResponse,
  NfeStateTax,
  NfeStateTaxCreateData,
  NfeStateTaxUpdateData,
  NfeStateTaxListResponse,
} from '../../../src/core/types.js';
import { ValidationError } from '../../../src/core/errors/index.js';

describe('StateTaxesResource', () => {
  let resource: StateTaxesResource;
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
    resource = new StateTaxesResource(mockHttpClient as unknown as HttpClient);
  });

  const companyId = 'company-123';
  const stateTaxId = 'statetax-456';

  const mockStateTax: NfeStateTax = {
    id: stateTaxId,
    taxNumber: '123456789',
    serie: 1,
    lastNumber: 0,
    code: 'sP',
    environmentType: 'production',
    status: 'active',
    type: 'nFe',
  } as NfeStateTax;

  // --------------------------------------------------------------------------
  // list
  // --------------------------------------------------------------------------

  describe('list', () => {
    const mockListResponse: NfeStateTaxListResponse = {
      stateTaxes: [mockStateTax],
      hasMore: false,
      totalCount: 1,
    };

    it('should list state taxes', async () => {
      const httpResponse: HttpResponse<NfeStateTaxListResponse> = {
        data: mockListResponse,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(httpResponse);

      const result = await resource.list(companyId);

      expect(result).toEqual(mockListResponse);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/statetaxes`,
        {},
      );
    });

    it('should pass pagination options', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: mockListResponse,
        status: 200,
        headers: {},
      });

      await resource.list(companyId, { limit: 5, startingAfter: 'cursor-abc' });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/statetaxes`,
        { limit: 5, startingAfter: 'cursor-abc' },
      );
    });

    it('should throw ValidationError when companyId is empty', async () => {
      await expect(resource.list('')).rejects.toThrow(ValidationError);
      await expect(resource.list('  ')).rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // create
  // --------------------------------------------------------------------------

  describe('create', () => {
    const createData: NfeStateTaxCreateData = {
      taxNumber: '123456789',
      serie: 1,
      number: 1,
      code: 'sP',
      environmentType: 'production',
    } as NfeStateTaxCreateData;

    it('should create a state tax registration', async () => {
      const httpResponse: HttpResponse<NfeStateTax> = {
        data: mockStateTax,
        status: 201,
        headers: {},
      };
      mockHttpClient.post.mockResolvedValue(httpResponse);

      const result = await resource.create(companyId, createData);

      expect(result).toEqual(mockStateTax);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/statetaxes`,
        { stateTax: createData },
      );
    });

    it('should throw ValidationError when companyId is empty', async () => {
      await expect(resource.create('', createData)).rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // retrieve
  // --------------------------------------------------------------------------

  describe('retrieve', () => {
    it('should retrieve a state tax by ID', async () => {
      const httpResponse: HttpResponse<NfeStateTax> = {
        data: mockStateTax,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(httpResponse);

      const result = await resource.retrieve(companyId, stateTaxId);

      expect(result).toEqual(mockStateTax);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/statetaxes/${stateTaxId}`,
      );
    });

    it('should throw ValidationError when stateTaxId is empty', async () => {
      await expect(resource.retrieve(companyId, '')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when companyId is empty', async () => {
      await expect(resource.retrieve('', stateTaxId)).rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // update
  // --------------------------------------------------------------------------

  describe('update', () => {
    const updateData: NfeStateTaxUpdateData = {
      serie: 2,
      environmentType: 'test',
    } as NfeStateTaxUpdateData;

    it('should update a state tax registration', async () => {
      const updatedTax = { ...mockStateTax, serie: 2, environmentType: 'test' as const };
      const httpResponse: HttpResponse<NfeStateTax> = {
        data: updatedTax,
        status: 200,
        headers: {},
      };
      mockHttpClient.put.mockResolvedValue(httpResponse);

      const result = await resource.update(companyId, stateTaxId, updateData);

      expect(result).toEqual(updatedTax);
      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/statetaxes/${stateTaxId}`,
        { stateTax: updateData },
      );
    });

    it('should throw ValidationError when stateTaxId is empty', async () => {
      await expect(resource.update(companyId, '', updateData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when companyId is empty', async () => {
      await expect(resource.update('', stateTaxId, updateData)).rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // delete
  // --------------------------------------------------------------------------

  describe('delete', () => {
    it('should delete a state tax registration', async () => {
      mockHttpClient.delete.mockResolvedValue({ data: undefined, status: 204, headers: {} });

      await resource.delete(companyId, stateTaxId);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/statetaxes/${stateTaxId}`,
      );
    });

    it('should throw ValidationError when stateTaxId is empty', async () => {
      await expect(resource.delete(companyId, '')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when companyId is empty', async () => {
      await expect(resource.delete('', stateTaxId)).rejects.toThrow(ValidationError);
    });
  });
});
