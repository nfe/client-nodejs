/**
 * NFE.io SDK v3 - Addresses Resource
 *
 * Handles address lookup operations via the Address API
 * Uses a separate API host: address.api.nfe.io
 */

import type { HttpClient } from '../http/client.js';
import type { Address, AddressLookupResponse } from '../types.js';
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
 * The live `address.api.nfe.io/v2` API supports **postal code lookup only**. A single
 * address is returned for a given CEP; there is no working address search/free-text
 * endpoint on this host (see the `fix-address-lookup-api-mismatch` change).
 *
 * @example Basic postal code lookup
 * ```typescript
 * const address = await nfe.addresses.lookupByPostalCode('01310-100');
 * console.log(address.street); // 'Paulista'
 * console.log(`${address.streetSuffix} ${address.street}, ${address.city.name}/${address.state}`);
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
   * Calls `GET /v2/addresses/{cep}` and returns the single {@link Address} carried in
   * the API's `{ address }` envelope.
   *
   * @param postalCode - Brazilian postal code (CEP), with or without hyphen
   * @returns Promise resolving to the matching {@link Address}
   * @throws {ValidationError} If postal code format is invalid
   * @throws {NotFoundError} If no address found for the postal code
   *
   * @example
   * ```typescript
   * // With or without hyphen — both normalize to the 8-digit form
   * const address = await nfe.addresses.lookupByPostalCode('01310-100');
   *
   * console.log(`${address.streetSuffix} ${address.street}, ${address.city.name} - ${address.state}`);
   * console.log(address.postalCode); // '01310-100' (API returns it formatted)
   * ```
   */
  async lookupByPostalCode(postalCode: string): Promise<Address> {
    validatePostalCode(postalCode);

    const normalizedCode = normalizePostalCode(postalCode);
    const response = await this.http.get<AddressLookupResponse>(
      `/addresses/${normalizedCode}`
    );

    return response.data.address;
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
