/**
 * NFE.io SDK v3 - Consumer Invoice Query Resource
 *
 * Queries CFe-SAT (Cupom Fiscal Eletrônico) consumer invoices
 * by access key. Read-only lookups — no company scope required.
 * Uses the API host: nfe.api.nfe.io
 */

import type { HttpClient } from '../http/client.js';
import type { TaxCoupon } from '../types.js';
import { ValidationError } from '../errors/index.js';

// ============================================================================
// Constants
// ============================================================================

/** Regex pattern for valid access key (44 numeric digits) */
const ACCESS_KEY_PATTERN = /^\d{44}$/;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates access key format (44 numeric digits)
 * @param accessKey - The access key to validate
 * @throws {ValidationError} If access key is empty or has invalid format
 */
function validateAccessKey(accessKey: string): void {
  if (!accessKey || accessKey.trim() === '') {
    throw new ValidationError('Access key is required');
  }

  const normalized = accessKey.trim();
  if (!ACCESS_KEY_PATTERN.test(normalized)) {
    throw new ValidationError(
      `Invalid access key: "${accessKey}". Expected 44 numeric digits.`
    );
  }
}

// ============================================================================
// Resource Implementation
// ============================================================================

/**
 * Consumer Invoice Query Resource
 *
 * @description
 * Queries CFe-SAT (Cupom Fiscal Eletrônico) consumer invoices by access key.
 * This is a read-only resource that does not require company scope.
 *
 * **Capabilities:**
 * - Retrieve full coupon details (issuer, buyer, items, totals, payment)
 * - Download original CFe XML
 *
 * **Authentication:** Uses data API key (`dataApiKey` or `apiKey` fallback).
 *
 * @example
 * ```typescript
 * const coupon = await nfe.consumerInvoiceQuery.retrieve(
 *   '35240112345678000190590000000012341234567890'
 * );
 * console.log(coupon.issuer?.name, coupon.totals?.couponAmount);
 * ```
 */
export class ConsumerInvoiceQueryResource {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Retrieve full CFe-SAT coupon details from SEFAZ by access key
   *
   * @param accessKey - 44-digit numeric access key (Chave de Acesso)
   * @returns Full coupon details including issuer, buyer, items, totals, and payment
   * @throws {ValidationError} If access key format is invalid
   * @throws {NotFoundError} If no coupon matches the access key (HTTP 404)
   * @throws {AuthenticationError} If API key is invalid (HTTP 401)
   *
   * @example
   * ```typescript
   * const coupon = await nfe.consumerInvoiceQuery.retrieve(
   *   '35240112345678000190590000000012341234567890'
   * );
   * console.log(coupon.currentStatus); // 'Authorized'
   * console.log(coupon.issuer?.name);
   * console.log(coupon.totals?.couponAmount);
   * ```
   */
  async retrieve(accessKey: string): Promise<TaxCoupon> {
    validateAccessKey(accessKey);
    const response = await this.http.get<TaxCoupon>(
      `/v1/consumerinvoices/coupon/${accessKey.trim()}`
    );
    return response.data;
  }

  /**
   * Download the raw CFe XML for a consumer invoice by access key
   *
   * @param accessKey - 44-digit numeric access key (Chave de Acesso)
   * @returns Buffer containing the XML binary content
   * @throws {ValidationError} If access key format is invalid
   * @throws {NotFoundError} If no coupon matches the access key (HTTP 404)
   * @throws {AuthenticationError} If API key is invalid (HTTP 401)
   *
   * @example
   * ```typescript
   * const xmlBuffer = await nfe.consumerInvoiceQuery.downloadXml(
   *   '35240112345678000190590000000012341234567890'
   * );
   * fs.writeFileSync('cfe.xml', xmlBuffer);
   * ```
   */
  async downloadXml(accessKey: string): Promise<Buffer> {
    validateAccessKey(accessKey);
    const response = await this.http.getBuffer(
      `/v1/consumerinvoices/coupon/${accessKey.trim()}.xml`,
      'application/xml'
    );
    return response.data;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new ConsumerInvoiceQueryResource instance
 */
export function createConsumerInvoiceQueryResource(http: HttpClient): ConsumerInvoiceQueryResource {
  return new ConsumerInvoiceQueryResource(http);
}
