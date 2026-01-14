/**
 * Unit tests for Companies resource - Search Helpers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompaniesResource } from '../../../src/core/resources/companies.js';
import { ValidationError } from '../../../src/core/errors/index.js';
import type { HttpClient } from '../../../src/core/http/client.js';
import type { Company } from '../../../src/core/types.js';

describe('CompaniesResource - Search Helpers', () => {
  let mockHttp: HttpClient;
  let companies: CompaniesResource;

  const mockCompanies: Company[] = [
    {
      id: 'company-1',
      name: 'Acme Corporation',
      federalTaxNumber: 12345678901234,
      email: 'contact@acme.com'
    },
    {
      id: 'company-2',
      name: 'TechCorp Inc',
      federalTaxNumber: 98765432109876,
      email: 'info@techcorp.com'
    },
    {
      id: 'company-3',
      name: 'Acme Services',
      federalTaxNumber: 11122233344455,
      email: 'hello@acmeservices.com'
    }
  ];

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as any;

    companies = new CompaniesResource(mockHttp);

    // Mock list endpoint - return data directly as list response
    vi.mocked(mockHttp.get).mockResolvedValue({
      data: mockCompanies
    } as any);
  });

  describe('findByTaxNumber()', () => {
    it('should find company by CNPJ', async () => {
      const company = await companies.findByTaxNumber(12345678901234);

      expect(company).toBeDefined();
      expect(company?.id).toBe('company-1');
      expect(company?.name).toBe('Acme Corporation');
    });

    it('should return null if not found', async () => {
      const company = await companies.findByTaxNumber(99999999999999);

      expect(company).toBeNull();
    });

    it('should reject invalid tax number length', async () => {
      await expect(
        companies.findByTaxNumber(123)
      ).rejects.toThrow(ValidationError);
    });

    it('should accept 11-digit CPF', async () => {
      const cpfCompanies = [{
        id: 'person-1',
        name: 'John Doe',
        federalTaxNumber: 12345678901,
        email: 'john@example.com'
      }];

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: cpfCompanies
      } as any);

      const company = await companies.findByTaxNumber(12345678901);

      expect(company).toBeDefined();
    });

    it('should accept 14-digit CNPJ', async () => {
      const company = await companies.findByTaxNumber(12345678901234);

      expect(company).toBeDefined();
    });
  });

  describe('findByName()', () => {
    it('should find companies by exact name match', async () => {
      const results = await companies.findByName('Acme Corporation');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('company-1');
    });

    it('should find companies by partial name match', async () => {
      const results = await companies.findByName('Acme');

      expect(results).toHaveLength(2);
      expect(results.map(c => c.id)).toEqual(['company-1', 'company-3']);
    });

    it('should be case-insensitive', async () => {
      const results = await companies.findByName('acme');

      expect(results).toHaveLength(2);
    });

    it('should return empty array if no match', async () => {
      const results = await companies.findByName('NonExistent');

      expect(results).toHaveLength(0);
    });

    it('should reject empty search term', async () => {
      await expect(
        companies.findByName('')
      ).rejects.toThrow(ValidationError);

      await expect(
        companies.findByName('   ')
      ).rejects.toThrow(ValidationError);
    });

    it('should trim search term', async () => {
      const results = await companies.findByName('  Acme  ');

      expect(results).toHaveLength(2);
    });
  });

  describe('getCompaniesWithCertificates()', () => {
    beforeEach(() => {
      // First call: list all companies
      vi.mocked(mockHttp.get).mockResolvedValueOnce({
        data: mockCompanies
      } as any);

      // Then mock certificate status calls
      vi.mocked(mockHttp.get)
        .mockResolvedValueOnce({
          data: { hasCertificate: true, isValid: true }
        } as any)
        .mockResolvedValueOnce({
          data: { hasCertificate: false }
        } as any)
        .mockResolvedValueOnce({
          data: { hasCertificate: true, isValid: true }
        } as any);
    });

    it('should return only companies with valid certificates', async () => {
      const results = await companies.getCompaniesWithCertificates();

      expect(results).toHaveLength(2);
      expect(results.map(c => c.id)).toEqual(['company-1', 'company-3']);
    });
  });

  describe('getCompaniesWithExpiringCertificates()', () => {
    beforeEach(() => {
      const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days
      const farFutureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

      // Mock list call - first call from listAll()
      vi.mocked(mockHttp.get).mockResolvedValueOnce({
        data: mockCompanies
      } as any);

      // Mock certificate status calls with different expiration dates
      vi.mocked(mockHttp.get)
        .mockResolvedValueOnce({
          data: {
            hasCertificate: true,
            expiresOn: futureDate.toISOString()
          }
        } as any)
        .mockResolvedValueOnce({
          data: {
            hasCertificate: true,
            expiresOn: farFutureDate.toISOString()
          }
        } as any)
        .mockResolvedValueOnce({
          data: { hasCertificate: false }
        } as any);
    });

    it('should return companies with expiring certificates', async () => {
      const results = await companies.getCompaniesWithExpiringCertificates(30);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('company-1');
    });
  });
});
