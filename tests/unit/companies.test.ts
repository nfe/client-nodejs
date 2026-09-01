import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompaniesResource } from '../../src/core/resources/companies';
import type { HttpClient } from '../../src/core/http/client';
import type { HttpResponse, ListResponse, Company } from '../../src/core/types';
import { createMockCompany, TEST_COMPANY_ID } from '../setup';
import { ValidationError } from '../../src/core/errors/index.js';
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

  describe('pagination (1-based API contract)', () => {
    // Mirrors the real API (probed live 2026-07-13): GET /companies rejects
    // pageIndex < 1, and accepts pageCount only in 2-50 (1 is rejected too,
    // despite the API's "between 1 and 50" error message)
    const mirrorApiGet = (pages: Company[][]) =>
      vi
        .fn()
        .mockImplementation(
          (_path: string, options: { pageIndex?: number; pageCount?: number } = {}) => {
            const pageIndex = options.pageIndex ?? 1;
            if (pageIndex < 1) {
              return Promise.reject(new ValidationError('pageIndex must be greater or equal to 1'));
            }
            if (options.pageCount !== undefined && (options.pageCount < 2 || options.pageCount > 50)) {
              return Promise.reject(new ValidationError('pageCount must be between 1 and 50'));
            }
            return Promise.resolve({
              data: { companies: pages[pageIndex - 1] ?? [], page: pageIndex },
              status: 200,
              headers: {},
            });
          }
        );

    it('list returns page.pageIndex exactly as the API sent it (no 0-based normalization)', async () => {
      mockHttpClient.get = mirrorApiGet([[createMockCompany()]]);

      const result = await companies.list({ pageIndex: 1 });

      expect(result.page?.pageIndex).toBe(1);
    });

    it('list({ pageIndex: 0 }) is rejected by the API contract', async () => {
      mockHttpClient.get = mirrorApiGet([[createMockCompany()]]);

      await expect(companies.list({ pageIndex: 0 })).rejects.toThrow(
        'pageIndex must be greater or equal to 1'
      );
    });

    it('listAll starts at pageIndex 1, respects the pageCount cap, and paginates 1 -> 2', async () => {
      const fullPage = Array.from({ length: 50 }, (_, i) =>
        createMockCompany({ id: `company-${i}` })
      );
      const lastPage = [createMockCompany({ id: 'company-last' })];
      mockHttpClient.get = mirrorApiGet([fullPage, lastPage]);

      const result = await companies.listAll();

      expect(result).toHaveLength(51);
      expect(vi.mocked(mockHttpClient.get).mock.calls[0][1]).toMatchObject({
        pageIndex: 1,
        pageCount: 50,
      });
      expect(vi.mocked(mockHttpClient.get).mock.calls[1][1]).toMatchObject({ pageIndex: 2 });
    });

    it('listIterator starts at pageIndex 1', async () => {
      mockHttpClient.get = mirrorApiGet([[createMockCompany({ id: 'company-1' })]]);

      const seen: Company[] = [];
      for await (const company of companies.listIterator()) {
        seen.push(company);
      }

      expect(seen).toHaveLength(1);
      expect(vi.mocked(mockHttpClient.get).mock.calls[0][1]).toMatchObject({ pageIndex: 1 });
    });
  });

  describe('listV2 (v2 cursor API contract)', () => {
    // Mirrors the real v2 API (probed live 2026-07-14): GET /v2/companies
    // returns { hasMore, companies }; limit above 50 is rejected with
    // "limit must be less than 50"; limit=0 returns 200 with an empty page.
    const mirrorV2Get = (pages: Company[][]) =>
      vi
        .fn()
        .mockImplementation(
          (_path: string, options: { limit?: number; startingAfter?: string } = {}) => {
            if (options.limit !== undefined && options.limit > 50) {
              return Promise.reject(new ValidationError('limit must be less than 50'));
            }
            const pageIdx = options.startingAfter
              ? pages.findIndex((p) => p.some((c) => c.id === options.startingAfter)) + 1
              : 0;
            return Promise.resolve({
              data: { companies: pages[pageIdx] ?? [], hasMore: pageIdx < pages.length - 1 },
              status: 200,
              headers: {},
            });
          }
        );

    it('returns { data, hasMore } and hits /v2/companies', async () => {
      mockHttpClient.get = mirrorV2Get([[createMockCompany({ id: 'v2-1' })]]);

      const result = await companies.listV2({ limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.hasMore).toBe(false);
      expect(vi.mocked(mockHttpClient.get).mock.calls[0][0]).toBe('/v2/companies');
      expect(vi.mocked(mockHttpClient.get).mock.calls[0][1]).toMatchObject({ limit: 10 });
    });

    it('follows the cursor with startingAfter across pages', async () => {
      const page1 = [createMockCompany({ id: 'v2-1' }), createMockCompany({ id: 'v2-2' })];
      const page2 = [createMockCompany({ id: 'v2-3' })];
      mockHttpClient.get = mirrorV2Get([page1, page2]);

      const first = await companies.listV2({ limit: 2 });
      expect(first.hasMore).toBe(true);

      const second = await companies.listV2({ limit: 2, startingAfter: 'v2-2' });
      expect(second.data.map((c) => c.id)).toEqual(['v2-3']);
      expect(second.hasMore).toBe(false);
    });

    it('rejects limit 0 and 51 client-side before any HTTP call', async () => {
      mockHttpClient.get = mirrorV2Get([[]]);

      await expect(companies.listV2({ limit: 0 })).rejects.toThrow('limit must be between 1 and 50');
      await expect(companies.listV2({ limit: 51 })).rejects.toThrow('limit must be between 1 and 50');
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('handles a null companies array defensively', async () => {
      mockHttpClient.get = vi.fn().mockResolvedValue({
        data: { companies: null, hasMore: false },
        status: 200,
        headers: {},
      });

      const result = await companies.listV2();

      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
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
      global.FormData = vi.fn(function () {
        return mockFormData;
      }) as any;
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
      expect(mockFormData.append).toHaveBeenCalledWith('file', certificateBuffer);
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
        'file',
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
        'file',
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
