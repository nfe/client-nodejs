/**
 * NFE.io SDK v3 - Tax Calculation Resource
 *
 * Provides access to the Motor de Cálculo de Tributos (Tax Calculation Engine),
 * which computes all applicable Brazilian taxes (ICMS, ICMS-ST, PIS, COFINS,
 * IPI, II) for product operations based on fiscal context.
 *
 * Uses the API host: api.nfse.io
 *
 * @see https://nfe.io/docs/nota-fiscal-eletronica/motor-de-calculo-de-imposto/
 */

import type { HttpClient } from '../http/client.js';
import type { CalculateRequest, CalculateResponse } from '../types.js';
import { ValidationError } from '../errors/index.js';

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates that tenantId is a non-empty string.
 * @param tenantId - The tenant/subscription ID to validate
 * @throws {ValidationError} If tenantId is empty or not a string
 */
function validateTenantId(tenantId: string): void {
  if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
    throw new ValidationError('tenantId is required and must be a non-empty string');
  }
}

/**
 * Validates required fields on a CalculateRequest.
 * @param request - The request payload to validate
 * @throws {ValidationError} If required fields are missing or invalid
 */
function validateCalculateRequest(request: CalculateRequest): void {
  if (!request) {
    throw new ValidationError('request is required');
  }

  if (!request.issuer) {
    throw new ValidationError('request.issuer is required');
  }

  if (!request.recipient) {
    throw new ValidationError('request.recipient is required');
  }

  if (!request.operationType) {
    throw new ValidationError('request.operationType is required');
  }

  if (!request.items || !Array.isArray(request.items) || request.items.length === 0) {
    throw new ValidationError('request.items is required and must be a non-empty array');
  }
}

// ============================================================================
// Resource Implementation
// ============================================================================

/**
 * Tax Calculation Resource
 *
 * @description
 * Provides access to the NFE.io Tax Calculation Engine (Motor de Cálculo de
 * Tributos). The engine computes all applicable Brazilian taxes for product
 * operations, returning per-item tax breakdowns including CFOP determination.
 *
 * **Supported taxes:**
 * - ICMS (including ICMS-ST and FCP)
 * - ICMS interestadual (DIFAL / UF destination)
 * - PIS
 * - COFINS
 * - IPI
 * - II (Import Tax)
 *
 * **Authentication:** Uses data API key (`dataApiKey` or `apiKey` fallback)
 * via the CTE HTTP client (`api.nfse.io`).
 *
 * @example
 * ```typescript
 * const result = await nfe.taxCalculation.calculate('my-tenant-id', {
 *   operationType: 'Outgoing',
 *   issuer: { state: 'SP', taxRegime: 'RealProfit' },
 *   recipient: { state: 'RJ' },
 *   items: [{
 *     id: '1',
 *     operationCode: 121,
 *     origin: 'National',
 *     quantity: 10,
 *     unitAmount: 100.00,
 *     ncm: '61091000'
 *   }]
 * });
 *
 * for (const item of result.items ?? []) {
 *   console.log(`Item ${item.id}: CFOP ${item.cfop}`);
 *   console.log(`  ICMS CST: ${item.icms?.cst}, value: ${item.icms?.vICMS}`);
 *   console.log(`  PIS CST: ${item.pis?.cst}, value: ${item.pis?.vPIS}`);
 * }
 * ```
 */
export class TaxCalculationResource {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Calculate taxes for a product operation
   *
   * @description
   * Submits an operation with issuer, recipient, operation type, and product items
   * to the Tax Calculation Engine. Returns per-item tax breakdowns including all
   * applicable Brazilian taxes (ICMS, PIS, COFINS, IPI, II) with CFOP determination.
   *
   * The `tenantId` is the subscription/account identifier that scopes the tax rules.
   *
   * @param tenantId - Subscription/account ID (required, non-empty)
   * @param request - Tax calculation request with issuer, recipient, operation type, and items
   * @returns Tax calculation response with per-item breakdowns
   * @throws {ValidationError} If tenantId is empty
   * @throws {ValidationError} If required request fields are missing (issuer, recipient, operationType, items)
   * @throws {AuthenticationError} If API key is invalid (HTTP 401)
   * @throws {BadRequestError} If the API rejects the payload (HTTP 400)
   * @throws {ValidationError} If the API returns unprocessable content (HTTP 422)
   *
   * @example Basic calculation
   * ```typescript
   * const result = await nfe.taxCalculation.calculate('tenant-123', {
   *   operationType: 'Outgoing',
   *   issuer: { state: 'SP', taxRegime: 'RealProfit' },
   *   recipient: { state: 'RJ' },
   *   items: [{
   *     id: 'item-1',
   *     operationCode: 121,
   *     origin: 'National',
   *     quantity: 1,
   *     unitAmount: 500.00,
   *     ncm: '61091000'
   *   }]
   * });
   * console.log(result.items?.[0]?.cfop); // e.g., 6102
   * ```
   *
   * @example With per-item tax profiles
   * ```typescript
   * const result = await nfe.taxCalculation.calculate('tenant-123', {
   *   operationType: 'Incoming',
   *   issuer: { state: 'MG', taxRegime: 'NationalSimple' },
   *   recipient: { state: 'SP', taxRegime: 'RealProfit' },
   *   items: [{
   *     id: 'item-1',
   *     operationCode: 569,
   *     acquisitionPurpose: '569',
   *     origin: 'National',
   *     quantity: 100,
   *     unitAmount: 25.50,
   *     ncm: '39174090',
   *     issuerTaxProfile: 'industry',
   *     recipientTaxProfile: 'industry'
   *   }]
   * });
   * ```
   */
  async calculate(tenantId: string, request: CalculateRequest): Promise<CalculateResponse> {
    validateTenantId(tenantId);
    validateCalculateRequest(request);

    const response = await this.http.post<CalculateResponse>(
      `/tax-rules/${encodeURIComponent(tenantId.trim())}/engine/calculate`,
      request
    );
    return response.data;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new TaxCalculationResource instance
 */
export function createTaxCalculationResource(http: HttpClient): TaxCalculationResource {
  return new TaxCalculationResource(http);
}
