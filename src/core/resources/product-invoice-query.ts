/**
 * NFE.io SDK v3 - Product Invoice Query Resource
 *
 * Queries NF-e (Nota Fiscal Eletrônica) product invoices directly on SEFAZ
 * by access key. Read-only lookups — no company scope required.
 * Uses the API host: nfe.api.nfe.io
 */

import type { HttpClient } from '../http/client.js';
import type {
  ProductInvoiceDetails,
  ProductInvoiceEventsResponse,
} from '../types.js';
import { ValidationError } from '../errors/index.js';

// ============================================================================
// Constants
// ============================================================================

/** Base URL for NF-e Query API */
export const NFE_QUERY_API_BASE_URL = 'https://nfe.api.nfe.io';

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
 * Product Invoice Query Resource
 *
 * @description
 * Queries NF-e (Nota Fiscal Eletrônica) product invoices on SEFAZ by access key.
 * This is a read-only resource that does not require company scope.
 *
 * **Capabilities:**
 * - Retrieve full invoice details (issuer, buyer, items, totals, transport, payment)
 * - Download DANFE PDF
 * - Download NF-e XML
 * - List fiscal events (cancellations, corrections, manifestations)
 *
 * **Authentication:** Uses data API key (`dataApiKey` or `apiKey` fallback).
 *
 * @example
 * ```typescript
 * const details = await nfe.productInvoiceQuery.retrieve(
 *   '35240112345678000190550010000001231234567890'
 * );
 * console.log(details.issuer?.name, details.totals?.icms?.invoiceAmount);
 * ```
 */
export class ProductInvoiceQueryResource {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Retrieve full product invoice (NF-e) details from SEFAZ by access key
   *
   * @param accessKey - 44-digit numeric access key (Chave de Acesso)
   * @returns Full invoice details including issuer, buyer, items, totals, transport, and payment
   * @throws {ValidationError} If access key format is invalid
   * @throws {NotFoundError} If no invoice matches the access key (HTTP 404)
   * @throws {AuthenticationError} If API key is invalid (HTTP 401)
   *
   * @example
   * ```typescript
   * const invoice = await nfe.productInvoiceQuery.retrieve(
   *   '35240112345678000190550010000001231234567890'
   * );
   * console.log(invoice.currentStatus); // 'authorized'
   * console.log(invoice.issuer?.name);
   * console.log(invoice.totals?.icms?.invoiceAmount);
   * ```
   */
  async retrieve(accessKey: string): Promise<ProductInvoiceDetails> {
    validateAccessKey(accessKey);
    const response = await this.http.get<ProductInvoiceDetails>(
      `/v2/productinvoices/${accessKey.trim()}`
    );
    return response.data;
  }

  /**
   * Download the DANFE PDF for a product invoice by access key
   *
   * @param accessKey - 44-digit numeric access key (Chave de Acesso)
   * @returns Buffer containing the PDF binary content
   * @throws {ValidationError} If access key format is invalid
   * @throws {NotFoundError} If no invoice matches the access key (HTTP 404)
   * @throws {AuthenticationError} If API key is invalid (HTTP 401)
   *
   * @example
   * ```typescript
   * const pdfBuffer = await nfe.productInvoiceQuery.downloadPdf(
   *   '35240112345678000190550010000001231234567890'
   * );
   * fs.writeFileSync('danfe.pdf', pdfBuffer);
   * ```
   */
  async downloadPdf(accessKey: string): Promise<Buffer> {
    validateAccessKey(accessKey);
    const response = await this.http.getBuffer(
      `/v2/productinvoices/${accessKey.trim()}.pdf`,
      'application/pdf'
    );
    return response.data;
  }

  /**
   * Download the raw NF-e XML for a product invoice by access key
   *
   * @param accessKey - 44-digit numeric access key (Chave de Acesso)
   * @returns Buffer containing the XML binary content
   * @throws {ValidationError} If access key format is invalid
   * @throws {NotFoundError} If no invoice matches the access key (HTTP 404)
   * @throws {AuthenticationError} If API key is invalid (HTTP 401)
   *
   * @example
   * ```typescript
   * const xmlBuffer = await nfe.productInvoiceQuery.downloadXml(
   *   '35240112345678000190550010000001231234567890'
   * );
   * fs.writeFileSync('nfe.xml', xmlBuffer);
   * ```
   */
  async downloadXml(accessKey: string): Promise<Buffer> {
    validateAccessKey(accessKey);
    const response = await this.http.getBuffer(
      `/v2/productinvoices/${accessKey.trim()}.xml`,
      'application/xml'
    );
    return response.data;
  }

  /**
   * List fiscal events for a product invoice by access key
   *
   * Events include cancellations, corrections, manifestations, etc.
   *
   * @param accessKey - 44-digit numeric access key (Chave de Acesso)
   * @returns Events response with an array of fiscal events and query timestamp
   * @throws {ValidationError} If access key format is invalid
   * @throws {NotFoundError} If no invoice matches the access key (HTTP 404)
   * @throws {AuthenticationError} If API key is invalid (HTTP 401)
   *
   * @example
   * ```typescript
   * const result = await nfe.productInvoiceQuery.listEvents(
   *   '35240112345678000190550010000001231234567890'
   * );
   * for (const event of result.events ?? []) {
   *   console.log(event.description, event.authorizedOn);
   * }
   * ```
   */
  async listEvents(accessKey: string): Promise<ProductInvoiceEventsResponse> {
    validateAccessKey(accessKey);
    const response = await this.http.get<ProductInvoiceEventsResponse>(
      `/v2/productinvoices/events/${accessKey.trim()}`
    );
    return response.data;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new ProductInvoiceQueryResource instance
 */
export function createProductInvoiceQueryResource(http: HttpClient): ProductInvoiceQueryResource {
  return new ProductInvoiceQueryResource(http);
}
