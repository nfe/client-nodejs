import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompaniesResource } from '../../src/core/resources/companies';
import type { HttpClient } from '../../src/core/http/client';
import type { HttpResponse, ListResponse, Company } from '../../src/core/types';
import { createMockCompany, TEST_COMPANY_ID } from '../setup';

describe('CompaniesResource', () => {
  let companies: CompaniesResource;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
    } as any;

    companies = new CompaniesResource(mockHttpClient);
  });

  describe('list', () => {
    it('should list all companies', async () => {
      const mockData = [
        createMockCompany({ id: 'company-1', name: 'Company One' }),
        createMockCompany({ id: 'company-2', name: 'Company Two' }),
      ];

      const mockListResponse: ListResponse<Company> = {
        data: mockData,
      };

      const mockResponse: HttpResponse<ListResponse<Company>> = {
        data: mockListResponse,
        status: 200,
        headers: {},
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await companies.list();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Company One');
      expect(mockHttpClient.get).toHaveBeenCalledWith('/companies', {});
    });
  });

  describe('retrieve', () => {
    it('should retrieve a specific company', async () => {
      const mockCompany = createMockCompany();

      const mockResponse: HttpResponse<Company> = {
        data: mockCompany,
        status: 200,
        headers: {},
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await companies.retrieve(TEST_COMPANY_ID);

      expect(result.id).toBe(TEST_COMPANY_ID);
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/companies/${TEST_COMPANY_ID}`);
    });
  });

  describe('create', () => {
    it('should create a new company', async () => {
      const companyData = {
        name: 'New Company',
        federalTaxNumber: 12345678000190,
        email: 'new@example.com',
      };

      const createdCompany = createMockCompany({ id: 'new-id', ...companyData });

      const mockResponse: HttpResponse<Company> = {
        data: createdCompany,
        status: 201,
        headers: {},
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      const result = await companies.create(companyData as any);

      expect(result.id).toBe('new-id');
      expect(result.name).toBe('New Company');
      expect(mockHttpClient.post).toHaveBeenCalledWith('/companies', companyData);
    });
  });

  describe('update', () => {
    it('should update an existing company', async () => {
      const updateData = {
        name: 'Updated Company Name',
      };

      const updatedCompany = createMockCompany({ ...updateData });

      const mockResponse: HttpResponse<Company> = {
        data: updatedCompany,
        status: 200,
        headers: {},
      };

      vi.mocked(mockHttpClient.put).mockResolvedValue(mockResponse);

      const result = await companies.update(TEST_COMPANY_ID, updateData as any);

      expect(result.name).toBe('Updated Company Name');
      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}`,
        updateData
      );
    });
  });

  describe('Error Handling', () => {
    it('should propagate HTTP client errors', async () => {
      const error = new Error('Network error');
      vi.mocked(mockHttpClient.get).mockRejectedValue(error);

      await expect(companies.list()).rejects.toThrow('Network error');
    });
  });
});
