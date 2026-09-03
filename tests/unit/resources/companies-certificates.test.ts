/**
 * Unit tests for Companies resource - Certificate Management
 *
 * Os mocks aqui alimentam o envelope REAL de `GET /v1/companies/{id}/certificate`:
 *
 *   { certificates: [ { providerType, resolution, taxPayerId, thumbprint, taxId,
 *                       subject, validUntil, modifiedOn, status } ] }
 *
 * Até 2026-09-02 alimentavam `{hasCertificate, expiresOn, isValid}` — forma que a
 * API nunca devolveu. Os testes passavam e o método devolvia `undefined` em tudo
 * em produção: o mock validava a leitura contra a própria invenção. Confirmado na
 * spec (`CertificatesMetadataResource`, contribuintes-v2) e no fio.
 *
 * Empresa sem certificado responde **200 com `certificates: []`**, não 404 —
 * medido: 9 de 12 empresas sondadas na conta do time estão nesse caso.
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
      // Pre-flight does not fabricate metadata (verified server-side on upload).
      expect(result.metadata).toBeUndefined();
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
    /** Item como a API o devolve, com os campos que interessam ao resumo. */
    function certificate(overrides: Record<string, unknown> = {}) {
      return {
        providerType: 'Pfx',
        resolution: { status: 'Resolved' },
        taxPayerId: 'tp-1',
        thumbprint: 'AABBCC',
        taxId: '00000000000000',
        subject: 'CN=EMPRESA TESTE',
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedOn: new Date().toISOString(),
        status: 'Active',
        ...overrides,
      };
    }

    it('empresa sem certificado: 200 com lista vazia, não 404', async () => {
      vi.mocked(mockHttp.get).mockResolvedValue({ data: { certificates: [] } } as any);

      const status = await companies.getCertificateStatus('company-123');

      expect(status.hasCertificate).toBe(false);
      expect(status.certificates).toEqual([]);
      expect(status.expiresOn).toBeUndefined();
      expect(status.daysUntilExpiration).toBeUndefined();
    });

    it('deriva o vencimento de validUntil, não de expiresOn', async () => {
      const validUntil = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: { certificates: [certificate({ validUntil })] },
      } as any);

      const status = await companies.getCertificateStatus('company-123');

      expect(status.hasCertificate).toBe(true);
      expect(status.expiresOn).toBe(validUntil);
      expect(status.daysUntilExpiration).toBeGreaterThan(50);
      expect(status.isExpiringSoon).toBe(false);
    });

    it('detecta certificado a vencer', async () => {
      const validUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: { certificates: [certificate({ validUntil })] },
      } as any);

      const status = await companies.getCertificateStatus('company-123');

      expect(status.isExpiringSoon).toBe(true);
      expect(status.daysUntilExpiration).toBeLessThan(30);
    });

    it('isValid vem de status, e só Active conta', async () => {
      for (const status of ['None', 'Inactive', 'Overdue', 'Pending'] as const) {
        vi.mocked(mockHttp.get).mockResolvedValue({
          data: { certificates: [certificate({ status })] },
        } as any);

        const result = await companies.getCertificateStatus('company-123');

        expect(result.hasCertificate).toBe(true);
        expect(result.isValid).toBe(false);
      }

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: { certificates: [certificate({ status: 'Active' })] },
      } as any);
      expect((await companies.getCertificateStatus('company-123')).isValid).toBe(true);
    });

    it('expõe os itens crus para quem precisa de thumbprint e subject', async () => {
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: { certificates: [certificate()] },
      } as any);

      const status = await companies.getCertificateStatus('company-123');

      expect(status.certificates).toHaveLength(1);
      expect(status.certificates[0]?.thumbprint).toBe('AABBCC');
      expect(status.certificates[0]?.subject).toBe('CN=EMPRESA TESTE');
    });

    it('com vários certificados, o resumo descreve um ativo de vencimento mais distante', async () => {
      const perto = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      const longe = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const maisLonge = new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString();

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: {
          certificates: [
            certificate({ validUntil: perto, status: 'Active', thumbprint: 'PERTO' }),
            certificate({ validUntil: maisLonge, status: 'Overdue', thumbprint: 'VENCIDO' }),
            certificate({ validUntil: longe, status: 'Active', thumbprint: 'LONGE' }),
          ],
        },
      } as any);

      const status = await companies.getCertificateStatus('company-123');

      // O de vencimento mais distante é 'VENCIDO', mas não está ativo.
      expect(status.expiresOn).toBe(longe);
      expect(status.isValid).toBe(true);
      expect(status.certificates).toHaveLength(3);
    });

    it('sem nenhum ativo, cai para o de vencimento mais distante', async () => {
      const perto = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      const longe = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

      vi.mocked(mockHttp.get).mockResolvedValue({
        data: {
          certificates: [
            certificate({ validUntil: perto, status: 'Pending' }),
            certificate({ validUntil: longe, status: 'Overdue' }),
          ],
        },
      } as any);

      const status = await companies.getCertificateStatus('company-123');

      expect(status.expiresOn).toBe(longe);
      expect(status.isValid).toBe(false);
    });

    it('certificado sem validUntil não emite Invalid Date', async () => {
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: { certificates: [certificate({ validUntil: undefined })] },
      } as any);

      const status = await companies.getCertificateStatus('company-123');

      expect(status.hasCertificate).toBe(true);
      expect(status.expiresOn).toBeUndefined();
      expect(status.daysUntilExpiration).toBeUndefined();
      expect(status.isExpiringSoon).toBeUndefined();
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
    function withCertificate(validUntil?: string) {
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: {
          certificates: validUntil
            ? [{ thumbprint: 'AABBCC', validUntil, status: 'Active' }]
            : [],
        },
      } as any);
    }

    it('devolve null quando não há certificado', async () => {
      withCertificate(undefined);

      await expect(companies.checkCertificateExpiration('company-123')).resolves.toBeNull();
    });

    it('devolve null quando não está perto de vencer', async () => {
      withCertificate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString());

      await expect(companies.checkCertificateExpiration('company-123', 30)).resolves.toBeNull();
    });

    it('avisa quando está perto de vencer', async () => {
      withCertificate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString());

      const warning = await companies.checkCertificateExpiration('company-123', 30);

      expect(warning).not.toBeNull();
      expect(warning?.isExpiring).toBe(true);
      expect(warning?.daysRemaining).toBeLessThan(30);
      expect(warning?.expiresOn).toBeInstanceOf(Date);
    });

    it('respeita o limite informado', async () => {
      const em20Dias = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();

      withCertificate(em20Dias);
      const warning30 = await companies.checkCertificateExpiration('company-123', 30);
      withCertificate(em20Dias);
      const warning10 = await companies.checkCertificateExpiration('company-123', 10);

      expect(warning30).not.toBeNull();
      expect(warning10).toBeNull();
    });
  });
});
