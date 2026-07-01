/**
 * NFE.io SDK v3 - Certificate Validator
 *
 * Utilities for validating digital certificates before upload
 * Supports PKCS#12 format (.pfx, .p12)
 */

// ============================================================================
// Types
// ============================================================================

export interface CertificateMetadata {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  serialNumber?: string;
}

export interface CertificateValidationResult {
  valid: boolean;
  metadata?: CertificateMetadata;
  error?: string;
}

// ============================================================================
// Certificate Validator
// ============================================================================

export class CertificateValidator {
  /**
   * Pre-flight a certificate file before upload.
   *
   * IMPORTANT: this performs **format-only** local checks (non-empty buffer,
   * password provided, PKCS#12 `3082` magic bytes). It does NOT parse the
   * certificate and CANNOT verify the password, expiry, subject or issuer —
   * doing so requires a PKCS#12 reader, which would violate the SDK's
   * no-runtime-dependency rule. Subject/issuer/validity and the password are
   * verified **server-side** by the NFE.io API when the certificate is uploaded.
   *
   * Therefore a `valid: true` result means "looks like a PKCS#12 file", not
   * "this is a valid, in-date certificate with the right password".
   *
   * @param file - Certificate file buffer
   * @param password - Certificate password (presence checked only)
   * @returns Pre-flight result (no fabricated metadata)
   */
  static async validate(
    file: Buffer,
    password: string
  ): Promise<CertificateValidationResult> {
    try {
      // Basic validation - check file format
      if (!Buffer.isBuffer(file) || file.length === 0) {
        return { valid: false, error: 'Invalid file buffer' };
      }

      // Check password is provided
      if (!password || password.trim().length === 0) {
        return { valid: false, error: 'Password is required' };
      }

      // Check PKCS#12 signature (basic format validation)
      // PKCS#12 files typically start with specific bytes
      const signature = file.toString('hex', 0, 2);
      if (signature !== '3082') {
        return { valid: false, error: 'Invalid certificate format. Expected PKCS#12 (.pfx/.p12)' };
      }

      // Format pre-flight passed. We deliberately DO NOT return metadata:
      // full PKCS#12 parsing (subject/issuer/validity) and password verification
      // require a runtime dependency we don't take. The API validates these on
      // upload. Returning fabricated metadata here would lie about validation.
      return { valid: true };

    } catch (error) {
      if (error instanceof Error) {
        // Common error messages
        if (error.message.includes('password') || error.message.includes('MAC')) {
          return { valid: false, error: 'Invalid certificate password' };
        }
        if (error.message.includes('parse') || error.message.includes('format')) {
          return { valid: false, error: 'Invalid certificate format' };
        }
      }

      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid certificate or password'
      };
    }
  }

  /**
   * Check if certificate format is supported
   *
   * @param filename - Certificate filename
   * @returns True if .pfx or .p12 format
   */
  static isSupportedFormat(filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    return ext === 'pfx' || ext === 'p12';
  }

  /**
   * Calculate days until expiration
   *
   * @param expiresOn - Expiration date
   * @returns Number of days until expiration (negative if expired)
   */
  static getDaysUntilExpiration(expiresOn: Date): number {
    const now = new Date();
    const diff = expiresOn.getTime() - now.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if certificate is expiring soon
   *
   * @param expiresOn - Expiration date
   * @param threshold - Days threshold (default: 30)
   * @returns True if expiring within threshold days
   */
  static isExpiringSoon(expiresOn: Date, threshold: number = 30): boolean {
    const days = this.getDaysUntilExpiration(expiresOn);
    return days >= 0 && days < threshold;
  }
}
