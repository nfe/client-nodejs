/**
 * Unit tests for CertificateValidator
 */

import { describe, it, expect } from 'vitest';
import { CertificateValidator } from '../../../src/core/utils/certificate-validator.js';

describe('CertificateValidator', () => {
  describe('validate()', () => {
    it('should reject empty buffer', async () => {
      const result = await CertificateValidator.validate(Buffer.from([]), 'password');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid file buffer');
    });

    it('should reject missing password', async () => {
      const result = await CertificateValidator.validate(Buffer.from('test'), '');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should reject invalid PKCS#12 format', async () => {
      const invalidBuffer = Buffer.from('not a certificate');
      const result = await CertificateValidator.validate(invalidBuffer, 'password');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid certificate format');
    });

    it('should accept valid PKCS#12 signature', async () => {
      // Create buffer with PKCS#12 signature (0x3082)
      const validBuffer = Buffer.from([0x30, 0x82, 0x01, 0x00]);
      const result = await CertificateValidator.validate(validBuffer, 'password');

      expect(result.valid).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.subject).toBeDefined();
      expect(result.metadata?.issuer).toBeDefined();
    });
  });

  describe('isSupportedFormat()', () => {
    it('should accept .pfx files', () => {
      expect(CertificateValidator.isSupportedFormat('certificate.pfx')).toBe(true);
      expect(CertificateValidator.isSupportedFormat('my-cert.PFX')).toBe(true);
    });

    it('should accept .p12 files', () => {
      expect(CertificateValidator.isSupportedFormat('certificate.p12')).toBe(true);
      expect(CertificateValidator.isSupportedFormat('my-cert.P12')).toBe(true);
    });

    it('should reject other formats', () => {
      expect(CertificateValidator.isSupportedFormat('certificate.pem')).toBe(false);
      expect(CertificateValidator.isSupportedFormat('certificate.crt')).toBe(false);
      expect(CertificateValidator.isSupportedFormat('certificate.txt')).toBe(false);
    });
  });

  describe('getDaysUntilExpiration()', () => {
    it('should calculate positive days for future dates', () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days
      const days = CertificateValidator.getDaysUntilExpiration(futureDate);

      expect(days).toBeGreaterThanOrEqual(9);
      expect(days).toBeLessThanOrEqual(10);
    });

    it('should calculate negative days for past dates', () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const days = CertificateValidator.getDaysUntilExpiration(pastDate);

      expect(days).toBeLessThan(0);
      expect(days).toBeGreaterThanOrEqual(-6);
    });

    it('should handle dates very close to expiration', () => {
      const almostExpired = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
      const days = CertificateValidator.getDaysUntilExpiration(almostExpired);

      expect(days).toBe(0);
    });
  });

  describe('isExpiringSoon()', () => {
    it('should detect certificates expiring within 30 days', () => {
      const expiringDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000); // 20 days

      expect(CertificateValidator.isExpiringSoon(expiringDate)).toBe(true);
    });

    it('should not flag certificates expiring after 30 days', () => {
      const validDate = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000); // 40 days

      expect(CertificateValidator.isExpiringSoon(validDate)).toBe(false);
    });

    it('should not flag expired certificates', () => {
      const expiredDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      expect(CertificateValidator.isExpiringSoon(expiredDate)).toBe(false);
    });

    it('should respect custom threshold', () => {
      const date = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days

      expect(CertificateValidator.isExpiringSoon(date, 30)).toBe(true);
      expect(CertificateValidator.isExpiringSoon(date, 10)).toBe(false);
    });
  });
});
