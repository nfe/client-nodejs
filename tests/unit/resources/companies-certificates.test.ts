/**
 * Unit tests for Companies resource - Certificate Management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompaniesResource } from '../../../src/core/resources/companies.js';
import { ValidationError } from '../../../src/core/errors/index.js';
import type { HttpClient } from '../../../src/core/http/client.js';

describe('CompaniesResource - Certificate Management', () => {
  let mockHttp: HttpClient;
  let companies: CompaniesResource;

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as any;

    companies = new CompaniesResource(mockHttp);
  });

  describe('validateCertificate()', () => {
    it('should validate valid PKCS#12 certificate', async () => {
      const validBuffer = Buffer.from([0x30, 0x82, 0x01, 0x00]);

      const result = await companies.validateCertificate(validBuffer, 'password');

      expect(result.valid).toBe(true);
      expect(result.metadata).toBeDefined();
    });

    it('should reject invalid certificate format', async () => {
      const invalidBuffer = Buffer.from('invalid');

      const result = await companies.validateCertificate(invalidBuffer, 'password');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('uploadCertificate()', () => {
    it('should reject unsupported file formats', async () => {
      const file = Buffer.from('test');

      await expect(
        companies.uploadCertificate('company-123', {
          file,
          password: 'password',
          filename: 'cert.pem'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should validate certificate before upload', async () => {
      const invalidBuffer = Buffer.from('invalid');

      await expect(
        companies.uploadCertificate('company-123', {
          file: invalidBuffer,
          password: 'password',
          filename: 'cert.pfx'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should upload valid certificate with Blob', async () => {
      // Create a proper Blob for FormData
      const validData = new Uint8Array([0x30, 0x82, 0x01, 0x00]);
      const blob = new Blob([validData], { type: 'application/x-pkcs12' });

      vi.mocked(mockHttp.post).mockResolvedValue({
        data: { uploaded: true, message: 'Certificate uploaded' }
      } as any);

      const result = await companies.uploadCertificate('company-123', {
        file: blob,
        password: 'password',
        filename: 'cert.pfx'
      });

      expect(result.uploaded).toBe(true);
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/companies/company-123/certificate',
        expect.any(Object)
      );
    });
  });

  describe('getCertificateStatus()', () => {
    it('should return basic status without expiration', async () => {
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: {
          hasCertificate: false
        }
      } as any);

      const status = await companies.getCertificateStatus('company-123');

      expect(status.hasCertificate).toBe(false);
      expect(status.daysUntilExpiration).toBeUndefined();
    });

    it('should calculate days until expiration', async () => {
      const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: {
          hasCertificate: true,
          expiresOn: futureDate.toISOString(),
          isValid: true
        }
      } as any);

      const status = await companies.getCertificateStatus('company-123');

      expect(status.hasCertificate).toBe(true);
      expect(status.daysUntilExpiration).toBeGreaterThan(50);
      expect(status.isExpiringSoon).toBe(false);
    });

    it('should detect expiring certificates', async () => {
      const soonDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: {
          hasCertificate: true,
          expiresOn: soonDate.toISOString(),
          isValid: true
        }
      } as any);

      const status = await companies.getCertificateStatus('company-123');

      expect(status.isExpiringSoon).toBe(true);
      expect(status.daysUntilExpiration).toBeLessThan(30);
    });
  });

  describe('replaceCertificate()', () => {
    it('should call uploadCertificate', async () => {
      const validData = new Uint8Array([0x30, 0x82, 0x01, 0x00]);
      const blob = new Blob([validData], { type: 'application/x-pkcs12' });

      vi.mocked(mockHttp.post).mockResolvedValue({
        data: { uploaded: true }
      } as any);

      const result = await companies.replaceCertificate('company-123', {
        file: blob,
        password: 'password',
        filename: 'new-cert.pfx'
      });

      expect(result.uploaded).toBe(true);
    });
  });

  describe('checkCertificateExpiration()', () => {
    it('should return null if no certificate', async () => {
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: { hasCertificate: false }
      } as any);

      const warning = await companies.checkCertificateExpiration('company-123');

      expect(warning).toBeNull();
    });

    it('should return null if not expiring soon', async () => {
      const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: {
          hasCertificate: true,
          expiresOn: futureDate.toISOString()
        }
      } as any);

      const warning = await companies.checkCertificateExpiration('company-123', 30);

      expect(warning).toBeNull();
    });

    it('should return warning if expiring soon', async () => {
      const soonDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: {
          hasCertificate: true,
          expiresOn: soonDate.toISOString()
        }
      } as any);

      const warning = await companies.checkCertificateExpiration('company-123', 30);

      expect(warning).not.toBeNull();
      expect(warning?.isExpiring).toBe(true);
      expect(warning?.daysRemaining).toBeLessThan(30);
    });

    it('should respect custom threshold', async () => {
      const date = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: {
          hasCertificate: true,
          expiresOn: date.toISOString()
        }
      } as any);

      const warning30 = await companies.checkCertificateExpiration('company-123', 30);
      const warning10 = await companies.checkCertificateExpiration('company-123', 10);

      expect(warning30).not.toBeNull();
      expect(warning10).toBeNull();
    });
  });
});
