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

  describe('uploadCertificate', () => {
    let mockFormData: any;

    beforeEach(() => {
      // Mock FormData
      mockFormData = {
        append: vi.fn(),
      };

      // Mock global FormData constructor
      global.FormData = vi.fn(() => mockFormData) as any;
    });

    it('should upload certificate with buffer and password', async () => {
      const certificateBuffer = Buffer.from('certificate-content');
      const certificateData = {
        file: certificateBuffer,
        password: 'secret123',
      };

      const mockUploadResponse = {
        uploaded: true,
        message: 'Certificate uploaded successfully',
      };

      const mockResponse: HttpResponse<typeof mockUploadResponse> = {
        data: mockUploadResponse,
        status: 200,
        headers: {},
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      const result = await companies.uploadCertificate(TEST_COMPANY_ID, certificateData);

      expect(result.uploaded).toBe(true);
      expect(result.message).toBe('Certificate uploaded successfully');
      expect(mockFormData.append).toHaveBeenCalledWith('certificate', certificateBuffer);
      expect(mockFormData.append).toHaveBeenCalledWith('password', 'secret123');
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/certificate`,
        mockFormData
      );
    });

    it('should upload certificate with custom filename', async () => {
      const certificateBuffer = Buffer.from('certificate-content');
      const certificateData = {
        file: certificateBuffer,
        password: 'secret123',
        filename: 'company-cert.pfx',
      };

      const mockUploadResponse = {
        uploaded: true,
        message: 'Certificate uploaded successfully',
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue({
        data: mockUploadResponse,
        status: 200,
        headers: {},
      });

      const result = await companies.uploadCertificate(TEST_COMPANY_ID, certificateData);

      expect(result.uploaded).toBe(true);
      expect(mockFormData.append).toHaveBeenCalledWith(
        'certificate',
        certificateBuffer,
        'company-cert.pfx'
      );
      expect(mockFormData.append).toHaveBeenCalledWith('password', 'secret123');
    });

    it('should handle Blob as file input', async () => {
      const certificateBlob = new Blob(['certificate-content']);
      const certificateData = {
        file: certificateBlob,
        password: 'secret123',
        filename: 'cert.p12',
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue({
        data: { uploaded: true },
        status: 200,
        headers: {},
      });

      await companies.uploadCertificate(TEST_COMPANY_ID, certificateData);

      expect(mockFormData.append).toHaveBeenCalledWith(
        'certificate',
        certificateBlob,
        'cert.p12'
      );
    });

    it('should propagate errors from HTTP client', async () => {
      const certificateData = {
        file: Buffer.from('certificate-content'),
        password: 'secret123',
      };

      const error = new Error('Upload failed');
      vi.mocked(mockHttpClient.post).mockRejectedValue(error);

      await expect(
        companies.uploadCertificate(TEST_COMPANY_ID, certificateData)
      ).rejects.toThrow('Upload failed');
    });

    it('should handle invalid certificate error', async () => {
      const certificateData = {
        file: Buffer.from('invalid-content'),
        password: 'wrong-password',
      };

      const mockErrorResponse = {
        uploaded: false,
        message: 'Invalid certificate or password',
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue({
        data: mockErrorResponse,
        status: 400,
        headers: {},
      });

      const result = await companies.uploadCertificate(TEST_COMPANY_ID, certificateData);

      expect(result.uploaded).toBe(false);
      expect(result.message).toContain('Invalid certificate');
    });

    it('should throw error if FormData is not available', async () => {
      // Remove FormData to simulate environment without it
      global.FormData = undefined as any;

      const companiesWithoutFormData = new CompaniesResource(mockHttpClient);

      const certificateData = {
        file: Buffer.from('certificate-content'),
        password: 'secret123',
      };

      await expect(
        companiesWithoutFormData.uploadCertificate(TEST_COMPANY_ID, certificateData)
      ).rejects.toThrow('FormData is not available');
    });
  });

  describe('getCertificateStatus', () => {
    it('should get certificate status', async () => {
      const mockStatus = {
        hasCertificate: true,
        expiresOn: '2025-12-31T23:59:59Z',
        isValid: true,
        details: { issuer: 'CA' },
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: mockStatus,
        status: 200,
        headers: {},
      });

      const result = await companies.getCertificateStatus(TEST_COMPANY_ID);

      expect(result.hasCertificate).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.expiresOn).toBe('2025-12-31T23:59:59Z');
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/certificate`
      );
    });

    it('should handle company without certificate', async () => {
      const mockStatus = {
        hasCertificate: false,
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: mockStatus,
        status: 200,
        headers: {},
      });

      const result = await companies.getCertificateStatus(TEST_COMPANY_ID);

      expect(result.hasCertificate).toBe(false);
      expect(result.isValid).toBeUndefined();
    });
  });

  describe('findByTaxNumber', () => {
    it('should find company by tax number', async () => {
      const targetTaxNumber = 12345678000190;
      const mockData = [
        createMockCompany({ id: 'company-1', federalTaxNumber: 11111111000111 }),
        createMockCompany({ id: 'company-2', federalTaxNumber: targetTaxNumber }),
        createMockCompany({ id: 'company-3', federalTaxNumber: 33333333000133 }),
      ];

      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: { data: mockData },
        status: 200,
        headers: {},
      });

      const result = await companies.findByTaxNumber(targetTaxNumber);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('company-2');
      expect(result?.federalTaxNumber).toBe(targetTaxNumber);
    });

    it('should return null if company not found', async () => {
      const mockData = [
        createMockCompany({ id: 'company-1', federalTaxNumber: 11111111000111 }),
      ];

      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: { data: mockData },
        status: 200,
        headers: {},
      });

      const result = await companies.findByTaxNumber(99999999000199);

      expect(result).toBeNull();
    });
  });

  describe('getCompaniesWithCertificates', () => {
    it('should return companies with valid certificates', async () => {
      const mockCompanies = [
        createMockCompany({ id: 'company-1' }),
        createMockCompany({ id: 'company-2' }),
        createMockCompany({ id: 'company-3' }),
      ];

      vi.mocked(mockHttpClient.get)
        .mockResolvedValueOnce({
          data: { data: mockCompanies },
          status: 200,
          headers: {},
        })
        .mockResolvedValueOnce({
          data: { hasCertificate: true, isValid: true },
          status: 200,
          headers: {},
        })
        .mockResolvedValueOnce({
          data: { hasCertificate: false },
          status: 200,
          headers: {},
        })
        .mockResolvedValueOnce({
          data: { hasCertificate: true, isValid: true },
          status: 200,
          headers: {},
        });

      const result = await companies.getCompaniesWithCertificates();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('company-1');
      expect(result[1].id).toBe('company-3');
    });

    it('should skip companies where certificate check fails', async () => {
      const mockCompanies = [
        createMockCompany({ id: 'company-1' }),
        createMockCompany({ id: 'company-2' }),
      ];

      vi.mocked(mockHttpClient.get)
        .mockResolvedValueOnce({
          data: { data: mockCompanies },
          status: 200,
          headers: {},
        })
        .mockResolvedValueOnce({
          data: { hasCertificate: true, isValid: true },
          status: 200,
          headers: {},
        })
        .mockRejectedValueOnce(new Error('Certificate check failed'));

      const result = await companies.getCompaniesWithCertificates();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('company-1');
    });
  });

  describe('createBatch', () => {
    it('should create multiple companies', async () => {
      const companiesData = [
        { name: 'Company 1', federalTaxNumber: 11111111000111, email: 'c1@test.com' },
        { name: 'Company 2', federalTaxNumber: 22222222000122, email: 'c2@test.com' },
      ];

      vi.mocked(mockHttpClient.post)
        .mockResolvedValueOnce({
          data: createMockCompany({ id: 'id-1', name: 'Company 1' }),
          status: 201,
          headers: {},
        })
        .mockResolvedValueOnce({
          data: createMockCompany({ id: 'id-2', name: 'Company 2' }),
          status: 201,
          headers: {},
        });

      const results = await companies.createBatch(companiesData as any);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('id', 'id-1');
      expect(results[1]).toHaveProperty('id', 'id-2');
    });

    it('should continue on error when continueOnError is true', async () => {
      const companiesData = [
        { name: 'Company 1', federalTaxNumber: 11111111000111, email: 'c1@test.com' },
        { name: 'Company 2', federalTaxNumber: 22222222000122, email: 'c2@test.com' },
      ];

      vi.mocked(mockHttpClient.post)
        .mockResolvedValueOnce({
          data: createMockCompany({ id: 'id-1', name: 'Company 1' }),
          status: 201,
          headers: {},
        })
        .mockRejectedValueOnce(new Error('Duplicate tax number'));

      const results = await companies.createBatch(companiesData as any, {
        continueOnError: true,
      });

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('id', 'id-1');
      expect(results[1]).toHaveProperty('error', 'Duplicate tax number');
    });

    it('should respect maxConcurrent option', async () => {
      let concurrentCalls = 0;
      let maxConcurrent = 0;

      vi.mocked(mockHttpClient.post).mockImplementation(async () => {
        concurrentCalls++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCalls);
        await new Promise(resolve => setTimeout(resolve, 10));
        concurrentCalls--;
        return {
          data: createMockCompany(),
          status: 201,
          headers: {},
        };
      });

      const companiesData = Array(10).fill(null).map((_, i) => ({
        name: `Company ${i}`,
        federalTaxNumber: 11111111000111 + i,
        email: `c${i}@test.com`,
      }));

      await companies.createBatch(companiesData as any, {
        maxConcurrent: 3,
      });

      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });
  });
});
