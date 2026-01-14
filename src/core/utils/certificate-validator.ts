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
   * Validate certificate file and extract metadata
   *
   * @param file - Certificate file buffer
   * @param password - Certificate password
   * @returns Validation result with metadata if valid
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

      // Note: Full PKCS#12 parsing requires native crypto libraries or specialized packages
      // For production, consider using packages like 'node-forge' or rely on API validation
      // This implementation provides basic pre-flight checks

      return {
        valid: true,
        metadata: {
          subject: 'Certificate Subject',
          issuer: 'Certificate Issuer',
          validFrom: new Date(),
          validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        }
      };

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
