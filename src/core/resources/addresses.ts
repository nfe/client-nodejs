/**
 * NFE.io SDK v3 - Addresses Resource
 *
 * Handles address lookup operations via the Address API
 * Uses a separate API host: address.api.nfe.io
 */

import type { HttpClient } from '../http/client.js';
import type { AddressLookupResponse, AddressSearchOptions } from '../types.js';
import { ValidationError } from '../errors/index.js';

// ============================================================================
// Constants
// ============================================================================

/** Base URL for Address API */
export const ADDRESS_API_BASE_URL = 'https://address.api.nfe.io/v2';

/** Regex pattern for valid postal code (CEP) */
const POSTAL_CODE_PATTERN = /^\d{5}-?\d{3}$/;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates postal code format (CEP)
 * Accepts formats: 01310100 or 01310-100
 */
function validatePostalCode(postalCode: string): void {
  if (!postalCode || postalCode.trim() === '') {
    throw new ValidationError('Postal code is required');
  }

  const normalized = postalCode.trim();
  if (!POSTAL_CODE_PATTERN.test(normalized)) {
    throw new ValidationError(
      `Invalid postal code format: "${postalCode}". Expected 8 digits (e.g., "01310100" or "01310-100").`
    );
  }
}

/**
 * Validates search term is not empty
 */
function validateTerm(term: string): void {
  if (!term || term.trim() === '') {
    throw new ValidationError('Search term is required');
  }
}

/**
 * Normalizes postal code by removing hyphen and trimming whitespace
 */
function normalizePostalCode(postalCode: string): string {
  return postalCode.trim().replace(/-/g, '');
}

// ============================================================================
// Addresses Resource
// ============================================================================

/**
 * Addresses API Resource
 *
 * @description
 * Provides operations for looking up Brazilian addresses using the NFE.io Address API.
 * Data is sourced from Correios DNE (Diretório Nacional de Endereços) integrated with IBGE city codes.
 *
 * **Note:** This resource uses a different API host (address.api.nfe.io) and may require
 * a separate API key configured via `dataApiKey` in the client configuration.
 *
 * @example Basic postal code lookup
 * ```typescript
 * const result = await nfe.addresses.lookupByPostalCode('01310-100');
 * console.log(result.addresses[0].street); // 'Paulista'
 * ```
 *
 * @example Search by term
 * ```typescript
 * const result = await nfe.addresses.lookupByTerm('Avenida Paulista');
 * console.log(result.addresses.length); // Number of matching addresses
 * ```
 *
 * @example Search with filter
 * ```typescript
 * const result = await nfe.addresses.search({ filter: "city eq 'São Paulo'" });
 * ```
 */
export class AddressesResource {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Lookup address by postal code (CEP)
   *
   * @param postalCode - Brazilian postal code (CEP), with or without hyphen
   * @returns Promise with address lookup response
   * @throws {ValidationError} If postal code format is invalid
   * @throws {NotFoundError} If no address found for the postal code
   *
   * @example
   * ```typescript
   * // With hyphen
   * const result = await nfe.addresses.lookupByPostalCode('01310-100');
   *
   * // Without hyphen
   * const result = await nfe.addresses.lookupByPostalCode('01310100');
   *
   * // Access address data
   * const address = result.addresses[0];
   * console.log(`${address.streetSuffix} ${address.street}, ${address.city.name} - ${address.state}`);
   * ```
   */
  async lookupByPostalCode(postalCode: string): Promise<AddressLookupResponse> {
    validatePostalCode(postalCode);

    const normalizedCode = normalizePostalCode(postalCode);
    const response = await this.http.get<AddressLookupResponse>(
      `/addresses/${normalizedCode}`
    );

    return response.data;
  }

  /**
   * Search addresses by OData filter
   *
   * @param options - Search options with filter expression
   * @returns Promise with address lookup response
   *
   * @example
   * ```typescript
   * // Search by city
   * const result = await nfe.addresses.search({ filter: "city eq 'São Paulo'" });
   *
   * // Search by street
   * const result = await nfe.addresses.search({ filter: "street eq 'Paulista'" });
   * ```
   */
  async search(options: AddressSearchOptions = {}): Promise<AddressLookupResponse> {
    const params: Record<string, unknown> = {};

    if (options.filter) {
      params['$filter'] = options.filter;
    }

    const response = await this.http.get<AddressLookupResponse>(
      '/addresses',
      params
    );

    return response.data;
  }

  /**
   * Lookup addresses by generic search term
   *
   * @param term - Search term (street name, neighborhood, etc.)
   * @returns Promise with address lookup response
   * @throws {ValidationError} If term is empty
   * @throws {NotFoundError} If no addresses found matching the term
   *
   * @example
   * ```typescript
   * const result = await nfe.addresses.lookupByTerm('Avenida Paulista');
   *
   * for (const address of result.addresses) {
   *   console.log(`${address.postalCode} - ${address.city.name}/${address.state}`);
   * }
   * ```
   */
  async lookupByTerm(term: string): Promise<AddressLookupResponse> {
    validateTerm(term);

    const response = await this.http.get<AddressLookupResponse>(
      `/addresses/${encodeURIComponent(term.trim())}`
    );

    return response.data;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates an AddressesResource instance
 *
 * @param http - HTTP client configured for the Address API
 * @returns AddressesResource instance
 */
export function createAddressesResource(http: HttpClient): AddressesResource {
  return new AddressesResource(http);
}
