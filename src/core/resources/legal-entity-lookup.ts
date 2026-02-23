/**
 * NFE.io SDK v3 - Legal Entity Lookup Resource
 *
 * Handles CNPJ lookup operations via the Legal Entity API.
 * Uses a separate API host: legalentity.api.nfe.io
 *
 * Provides methods for:
 * - Basic company info lookup by CNPJ
 * - State tax registration (Inscrição Estadual) lookup
 * - State tax evaluation for invoice issuance
 * - Suggested state tax for optimal invoice issuance
 */

import type { HttpClient } from '../http/client.js';
import type {
  BrazilianState,
  LegalEntityBasicInfoOptions,
  LegalEntityBasicInfoResponse,
  LegalEntityStateTaxResponse,
  LegalEntityStateTaxForInvoiceResponse,
} from '../types.js';
import { ValidationError } from '../errors/index.js';

// ============================================================================
// Constants
// ============================================================================

/** Base URL for Legal Entity API */
export const LEGAL_ENTITY_API_BASE_URL = 'https://legalentity.api.nfe.io';

/** Set of valid Brazilian state codes (27 UFs + EX + NA) */
const VALID_BRAZILIAN_STATES: ReadonlySet<string> = new Set<string>([
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
  'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
  'EX', 'NA',
]);

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Normalizes a federal tax number (CNPJ) by stripping all non-digit characters.
 *
 * @param federalTaxNumber - Raw CNPJ string, with or without punctuation
 * @returns Digits-only CNPJ string
 */
function normalizeFederalTaxNumber(federalTaxNumber: string): string {
  return federalTaxNumber.replace(/\D/g, '');
}

/**
 * Validates a federal tax number (CNPJ) format.
 * Strips non-digit characters and checks for exactly 14 digits.
 *
 * @param federalTaxNumber - CNPJ string to validate
 * @returns Normalized digits-only CNPJ string
 * @throws {ValidationError} If input is empty or not exactly 14 digits after normalization
 */
function validateFederalTaxNumber(federalTaxNumber: string | undefined | null): string {
  if (!federalTaxNumber || federalTaxNumber.trim() === '') {
    throw new ValidationError('Federal tax number (CNPJ) is required');
  }

  const normalized = normalizeFederalTaxNumber(federalTaxNumber);

  if (normalized.length !== 14) {
    throw new ValidationError(
      `Invalid federal tax number format: "${federalTaxNumber}". Expected 14 digits (e.g., "12345678000190" or "12.345.678/0001-90"), got ${normalized.length} digit(s).`
    );
  }

  return normalized;
}

/**
 * Validates a Brazilian state code.
 * Normalizes to uppercase and checks against the valid set.
 *
 * @param state - State code to validate
 * @returns Normalized uppercase state code
 * @throws {ValidationError} If state code is empty or not in the valid set
 */
function validateState(state: string | undefined | null): BrazilianState {
  if (!state || state.trim() === '') {
    throw new ValidationError('State code is required');
  }

  const normalized = state.trim().toUpperCase();

  if (!VALID_BRAZILIAN_STATES.has(normalized)) {
    const validCodes = Array.from(VALID_BRAZILIAN_STATES).sort().join(', ');
    throw new ValidationError(
      `Invalid state code: "${state}". Valid codes: ${validCodes}`
    );
  }

  return normalized as BrazilianState;
}

// ============================================================================
// Legal Entity Lookup Resource
// ============================================================================

/**
 * Legal Entity Lookup API Resource
 *
 * @description
 * Provides read-only operations for querying Brazilian company (CNPJ) data
 * from the NFE.io Legal Entity API. Data is sourced from Receita Federal,
 * SEFAZ state registries, and NFE.io enrichment services.
 *
 * **Note:** This resource uses a different API host (legalentity.api.nfe.io)
 * and may require a separate API key configured via `dataApiKey` in the client configuration.
 *
 * @example Basic CNPJ lookup
 * ```typescript
 * const result = await nfe.legalEntityLookup.getBasicInfo('12.345.678/0001-90');
 * console.log(result.legalEntity?.name);       // 'EMPRESA LTDA'
 * console.log(result.legalEntity?.status);      // 'Active'
 * console.log(result.legalEntity?.address?.city?.name); // 'São Paulo'
 * ```
 *
 * @example State tax registration lookup
 * ```typescript
 * const result = await nfe.legalEntityLookup.getStateTaxInfo('SP', '12345678000190');
 * for (const tax of result.legalEntity?.stateTaxes ?? []) {
 *   console.log(`IE: ${tax.taxNumber} - Status: ${tax.status}`);
 * }
 * ```
 *
 * @example Best IE for invoice issuance
 * ```typescript
 * const result = await nfe.legalEntityLookup.getSuggestedStateTaxForInvoice('SP', '12345678000190');
 * const bestIE = result.legalEntity?.stateTaxes?.[0];
 * console.log(`Best IE: ${bestIE?.taxNumber} (${bestIE?.status})`);
 * ```
 */
export class LegalEntityLookupResource {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Lookup basic company information by CNPJ
   *
   * @description
   * Queries the Receita Federal registry for company registration data including
   * legal name, trade name, address, phone numbers, economic activities (CNAE),
   * legal nature, partners, registration status, and share capital.
   *
   * @param federalTaxNumber - CNPJ number, with or without punctuation (e.g., "12345678000190" or "12.345.678/0001-90")
   * @param options - Optional lookup configuration
   * @returns Promise with company basic information
   * @throws {ValidationError} If CNPJ format is invalid (not 14 digits)
   * @throws {NotFoundError} If no company found for the given CNPJ
   * @throws {AuthenticationError} If API key is invalid or missing
   *
   * @example
   * ```typescript
   * // Simple lookup
   * const result = await nfe.legalEntityLookup.getBasicInfo('12345678000190');
   * console.log(result.legalEntity?.name);
   *
   * // With formatted CNPJ
   * const result = await nfe.legalEntityLookup.getBasicInfo('12.345.678/0001-90');
   *
   * // Disable address update from postal service
   * const result = await nfe.legalEntityLookup.getBasicInfo('12345678000190', {
   *   updateAddress: false,
   *   updateCityCode: true
   * });
   * ```
   */
  async getBasicInfo(
    federalTaxNumber: string,
    options?: LegalEntityBasicInfoOptions
  ): Promise<LegalEntityBasicInfoResponse> {
    const normalized = validateFederalTaxNumber(federalTaxNumber);

    const params: Record<string, unknown> = {};
    if (options?.updateAddress !== undefined) {
      params['updateAddress'] = options.updateAddress;
    }
    if (options?.updateCityCode !== undefined) {
      params['updateCityCode'] = options.updateCityCode;
    }

    const response = await this.http.get<LegalEntityBasicInfoResponse>(
      `/v2/legalentities/basicInfo/${normalized}`,
      Object.keys(params).length > 0 ? params : undefined
    );

    return response.data;
  }

  /**
   * Lookup state tax registration (Inscrição Estadual) by CNPJ and state
   *
   * @description
   * Queries state tax registration data for a given CNPJ in a specific Brazilian state.
   * Returns registration details including status, tax regime, economic activities,
   * and fiscal document indicators (NFe, NFSe, CTe, NFCe).
   *
   * @param state - Brazilian state abbreviation (e.g., "SP", "RJ", "MG")
   * @param federalTaxNumber - CNPJ number, with or without punctuation
   * @returns Promise with state tax registration information
   * @throws {ValidationError} If state code or CNPJ format is invalid
   * @throws {AuthenticationError} If API key is invalid or missing
   *
   * @example
   * ```typescript
   * const result = await nfe.legalEntityLookup.getStateTaxInfo('SP', '12345678000190');
   * console.log(result.legalEntity?.taxRegime);  // 'SimplesNacional'
   *
   * for (const tax of result.legalEntity?.stateTaxes ?? []) {
   *   console.log(`IE: ${tax.taxNumber} - Status: ${tax.status}`);
   *   console.log(`  NFe: ${tax.nfe?.status}, NFSe: ${tax.nfse?.status}`);
   * }
   * ```
   */
  async getStateTaxInfo(
    state: string,
    federalTaxNumber: string
  ): Promise<LegalEntityStateTaxResponse> {
    const normalizedState = validateState(state);
    const normalizedCnpj = validateFederalTaxNumber(federalTaxNumber);

    const response = await this.http.get<LegalEntityStateTaxResponse>(
      `/v2/legalentities/stateTaxInfo/${normalizedState}/${normalizedCnpj}`
    );

    return response.data;
  }

  /**
   * Lookup state tax registration for invoice issuance evaluation
   *
   * @description
   * Queries state tax registration data specifically for evaluating the ability
   * to issue product invoices (NF-e) in a given state. Returns extended status
   * information including temporary and unconfirmed states.
   *
   * @param state - Brazilian state abbreviation (e.g., "SP", "RJ", "MG")
   * @param federalTaxNumber - CNPJ number, with or without punctuation
   * @returns Promise with state tax data for invoice evaluation
   * @throws {ValidationError} If state code or CNPJ format is invalid
   * @throws {AuthenticationError} If API key is invalid or missing
   *
   * @example
   * ```typescript
   * const result = await nfe.legalEntityLookup.getStateTaxForInvoice('MG', '12345678000190');
   * for (const tax of result.legalEntity?.stateTaxes ?? []) {
   *   if (tax.status === 'Abled') {
   *     console.log(`Can issue invoices with IE: ${tax.taxNumber}`);
   *   }
   * }
   * ```
   */
  async getStateTaxForInvoice(
    state: string,
    federalTaxNumber: string
  ): Promise<LegalEntityStateTaxForInvoiceResponse> {
    const normalizedState = validateState(state);
    const normalizedCnpj = validateFederalTaxNumber(federalTaxNumber);

    const response = await this.http.get<LegalEntityStateTaxForInvoiceResponse>(
      `/v2/legalentities/stateTaxForInvoice/${normalizedState}/${normalizedCnpj}`
    );

    return response.data;
  }

  /**
   * Lookup the best state tax registration for invoice issuance
   *
   * @description
   * Queries the optimal state tax registration for issuing invoices when multiple
   * registrations are enabled in a state. NFE.io applies evaluation criteria to
   * suggest the best IE for invoice issuance.
   *
   * Returns the same response type as `getStateTaxForInvoice` but the API
   * prioritizes the best enabled state tax registration.
   *
   * @param state - Brazilian state abbreviation (e.g., "SP", "RJ", "MG")
   * @param federalTaxNumber - CNPJ number, with or without punctuation
   * @returns Promise with suggested state tax data for invoice evaluation
   * @throws {ValidationError} If state code or CNPJ format is invalid
   * @throws {AuthenticationError} If API key is invalid or missing
   *
   * @example
   * ```typescript
   * const result = await nfe.legalEntityLookup.getSuggestedStateTaxForInvoice('SP', '12345678000190');
   * const bestIE = result.legalEntity?.stateTaxes?.[0];
   * if (bestIE) {
   *   console.log(`Recommended IE: ${bestIE.taxNumber} (${bestIE.status})`);
   * }
   * ```
   */
  async getSuggestedStateTaxForInvoice(
    state: string,
    federalTaxNumber: string
  ): Promise<LegalEntityStateTaxForInvoiceResponse> {
    const normalizedState = validateState(state);
    const normalizedCnpj = validateFederalTaxNumber(federalTaxNumber);

    const response = await this.http.get<LegalEntityStateTaxForInvoiceResponse>(
      `/v2/legalentities/stateTaxSuggestedForInvoice/${normalizedState}/${normalizedCnpj}`
    );

    return response.data;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a LegalEntityLookupResource instance
 *
 * @param http - HTTP client configured for the Legal Entity API
 * @returns LegalEntityLookupResource instance
 */
export function createLegalEntityLookupResource(http: HttpClient): LegalEntityLookupResource {
  return new LegalEntityLookupResource(http);
}
