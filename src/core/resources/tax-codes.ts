/**
 * NFE.io SDK v3 - Tax Codes Resource
 *
 * Provides paginated listings of auxiliary tax code reference tables
 * needed as inputs for tax calculation: operation codes, acquisition
 * purposes, issuer tax profiles, and recipient tax profiles.
 *
 * Uses the API host: api.nfse.io
 *
 * @see https://nfe.io/docs/nota-fiscal-eletronica/motor-de-calculo-de-imposto/
 */

import type { HttpClient } from '../http/client.js';
import type { TaxCodePaginatedResponse, TaxCodeListOptions } from '../types.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build query string from pagination options.
 * @param options - Optional pagination parameters
 * @returns Query string (including leading '?') or empty string
 */
function buildPaginationQuery(options?: TaxCodeListOptions): string {
  if (!options) return '';

  const params = new URLSearchParams();

  if (options.pageIndex !== undefined && options.pageIndex !== null) {
    params.set('pageIndex', String(options.pageIndex));
  }
  if (options.pageCount !== undefined && options.pageCount !== null) {
    params.set('pageCount', String(options.pageCount));
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ============================================================================
// Resource Implementation
// ============================================================================

/**
 * Tax Codes Resource
 *
 * @description
 * Provides paginated listings of the four auxiliary reference tables used as
 * inputs for the Tax Calculation Engine:
 *
 * - **Operation Codes** — natureza de operação (e.g., 121 = "Venda de mercadoria")
 * - **Acquisition Purposes** — finalidade de aquisição (e.g., 569 = "Compra para comercialização")
 * - **Issuer Tax Profiles** — perfil fiscal do emissor (e.g., "retail", "industry")
 * - **Recipient Tax Profiles** — perfil fiscal do destinatário (e.g., "final_consumer_non_icms_contributor")
 *
 * All methods support pagination via `pageIndex` (1-based) and `pageCount` parameters.
 *
 * **Authentication:** Uses data API key (`dataApiKey` or `apiKey` fallback)
 * via the CTE HTTP client (`api.nfse.io`).
 *
 * @example
 * ```typescript
 * // List operation codes (first page)
 * const codes = await nfe.taxCodes.listOperationCodes();
 * for (const code of codes.items ?? []) {
 *   console.log(`${code.code} - ${code.description}`);
 * }
 *
 * // With pagination
 * const page2 = await nfe.taxCodes.listOperationCodes({ pageIndex: 2, pageCount: 20 });
 * console.log(`Page ${page2.currentPage} of ${page2.totalPages}`);
 * ```
 */
export class TaxCodesResource {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * List operation codes (natureza de operação)
   *
   * @description
   * Returns a paginated list of operation codes used in the `operationCode` field
   * of tax calculation item requests. Each code represents a specific operation
   * nature (e.g., sale, return, transfer).
   *
   * @param options - Optional pagination parameters
   * @returns Paginated list of operation codes
   * @throws {AuthenticationError} If API key is invalid (HTTP 401)
   *
   * @example
   * ```typescript
   * const result = await nfe.taxCodes.listOperationCodes();
   * console.log(`Total: ${result.totalCount} codes`);
   * for (const code of result.items ?? []) {
   *   console.log(`${code.code} - ${code.description}`);
   * }
   * ```
   *
   * @example With pagination
   * ```typescript
   * const page = await nfe.taxCodes.listOperationCodes({ pageIndex: 2, pageCount: 10 });
   * console.log(`Page ${page.currentPage} of ${page.totalPages}`);
   * ```
   */
  async listOperationCodes(options?: TaxCodeListOptions): Promise<TaxCodePaginatedResponse> {
    const qs = buildPaginationQuery(options);
    const response = await this.http.get<TaxCodePaginatedResponse>(
      `/tax-codes/operation-code${qs}`
    );
    return response.data;
  }

  /**
   * List acquisition purposes (finalidade de aquisição)
   *
   * @description
   * Returns a paginated list of acquisition purpose codes used in the
   * `acquisitionPurpose` field of tax calculation item requests.
   *
   * @param options - Optional pagination parameters
   * @returns Paginated list of acquisition purposes
   * @throws {AuthenticationError} If API key is invalid (HTTP 401)
   *
   * @example
   * ```typescript
   * const result = await nfe.taxCodes.listAcquisitionPurposes();
   * for (const purpose of result.items ?? []) {
   *   console.log(`${purpose.code} - ${purpose.description}`);
   * }
   * ```
   */
  async listAcquisitionPurposes(options?: TaxCodeListOptions): Promise<TaxCodePaginatedResponse> {
    const qs = buildPaginationQuery(options);
    const response = await this.http.get<TaxCodePaginatedResponse>(
      `/tax-codes/acquisition-purpose${qs}`
    );
    return response.data;
  }

  /**
   * List issuer tax profiles (perfil fiscal do emissor)
   *
   * @description
   * Returns a paginated list of issuer tax profile codes used in the
   * `issuerTaxProfile` field of tax calculation item requests or the
   * `taxProfile` field of the issuer.
   *
   * @param options - Optional pagination parameters
   * @returns Paginated list of issuer tax profiles
   * @throws {AuthenticationError} If API key is invalid (HTTP 401)
   *
   * @example
   * ```typescript
   * const result = await nfe.taxCodes.listIssuerTaxProfiles();
   * for (const profile of result.items ?? []) {
   *   console.log(`${profile.code} - ${profile.description}`);
   * }
   * ```
   */
  async listIssuerTaxProfiles(options?: TaxCodeListOptions): Promise<TaxCodePaginatedResponse> {
    const qs = buildPaginationQuery(options);
    const response = await this.http.get<TaxCodePaginatedResponse>(
      `/tax-codes/issuer-tax-profile${qs}`
    );
    return response.data;
  }

  /**
   * List recipient tax profiles (perfil fiscal do destinatário)
   *
   * @description
   * Returns a paginated list of recipient tax profile codes used in the
   * `recipientTaxProfile` field of tax calculation item requests or the
   * `taxProfile` field of the recipient.
   *
   * @param options - Optional pagination parameters
   * @returns Paginated list of recipient tax profiles
   * @throws {AuthenticationError} If API key is invalid (HTTP 401)
   *
   * @example
   * ```typescript
   * const result = await nfe.taxCodes.listRecipientTaxProfiles();
   * for (const profile of result.items ?? []) {
   *   console.log(`${profile.code} - ${profile.description}`);
   * }
   * ```
   */
  async listRecipientTaxProfiles(options?: TaxCodeListOptions): Promise<TaxCodePaginatedResponse> {
    const qs = buildPaginationQuery(options);
    const response = await this.http.get<TaxCodePaginatedResponse>(
      `/tax-codes/recipient-tax-profile${qs}`
    );
    return response.data;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new TaxCodesResource instance
 */
export function createTaxCodesResource(http: HttpClient): TaxCodesResource {
  return new TaxCodesResource(http);
}
