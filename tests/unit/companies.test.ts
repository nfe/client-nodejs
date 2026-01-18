import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompaniesResource } from '../../src/core/resources/companies';
import type { HttpClient } from '../../src/core/http/client';
import type { HttpResponse, ListResponse, Company } from '../../src/core/types';
import { createMockCompany, TEST_COMPANY_ID } from '../setup';
import { CertificateValidator } from '../../src/core/utils/certificate-validator';

// Mock CertificateValidator to avoid certificate format validation issues in tests
vi.mock('../../src/core/utils/certificate-validator', () => ({
  CertificateValidator: {
    validate: vi.fn().mockResolvedValue({
      valid: true,
      metadata: {
        subject: 'CN=Test',
        issuer: 'CN=Test CA',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2026-12-31'),
      },
    }),
    isSupportedFormat: vi.fn().mockReturnValue(true),
    getDaysUntilExpiration: vi.fn().mockReturnValue(365),
    isExpiringSoon: vi.fn().mockReturnValue(false),
  },
}));

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

      const mockResponse: HttpResponse<{ companies: Company[]; page: number }> = {
        data: {
          companies: mockData,
          page: 1,
        },
        status: 200,
        headers: {},
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse as any);

      const result = await companies.list();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Company One');
      expect(mockHttpClient.get).toHaveBeenCalledWith('/companies', {});
    });
  });

  describe('retrieve', () => {
    it('should retrieve a specific company', async () => {
      const mockCompany = createMockCompany();

      const mockResponse: HttpResponse<{ companies: Company }> = {
        data: {
          companies: mockCompany,
        },
        status: 200,
        headers: {},
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse as any);

      const result = await companies.retrieve(TEST_COMPANY_ID);

      expect(result.id).toBe(TEST_COMPANY_ID);
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/companies/${TEST_COMPANY_ID}`);
    });
  });

  describe('create', () => {
    it('should create a new company', async () => {
      const companyData = {
        name: 'New Company',
        federalTaxNumber: 12345678000276,
        email: 'new@example.com',
      };

      const createdCompany = createMockCompany({ id: 'new-id', ...companyData });

      const mockResponse: HttpResponse<{ companies: Company }> = {
        data: {
          companies: createdCompany,
        },
        status: 201,
        headers: {},
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse as any);

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

      const mockResponse: HttpResponse<{ companies: Company }> = {
        data: {
          companies: updatedCompany,
        },
        status: 200,
        headers: {},
      };

      vi.mocked(mockHttpClient.put).mockResolvedValue(mockResponse as any);

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
      const originalFormData = global.FormData;
      global.FormData = undefined as any;

      const companiesWithoutFormData = new CompaniesResource(mockHttpClient);

      const certificateData = {
        file: Buffer.from('certificate-content'),
        password: 'secret123',
      };

      await expect(
        companiesWithoutFormData.uploadCertificate(TEST_COMPANY_ID, certificateData)
      ).rejects.toThrow('FormData is not available');

      // Restore FormData
      global.FormData = originalFormData;
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
        data: { companies: mockData, page: 1 },
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
        data: { companies: mockData, page: 1 },
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
          data: { companies: mockCompanies, page: 1 },
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
          data: { companies: mockCompanies, page: 1 },
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

  // Note: createBatch was removed per user request during implementation
});
