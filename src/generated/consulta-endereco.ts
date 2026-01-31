/**
 * ⚠️  MANUALLY CREATED based on openapi/spec/consulta-endereco.yaml (Swagger 2.0)
 *
 * The consulta-endereco API spec uses Swagger 2.0 which is not supported by
 * openapi-typescript v6+. These types were manually created from the spec.
 *
 * API Base URL: https://address.api.nfe.io
 *
 * To update: Edit this file manually based on consulta-endereco.yaml changes
 * Last updated: 2026-01-31
 */

// ============================================================================
// Address Types
// ============================================================================

/**
 * City information with IBGE code
 */
export interface City {
  /** IBGE city code */
  code: string;
  /** City name */
  name: string;
}

/**
 * Complete address information from Correios DNE
 */
export interface Address {
  /** State abbreviation (e.g., 'SP', 'RJ') */
  state: string;
  /** City information with IBGE code */
  city: City;
  /** District/neighborhood name */
  district: string;
  /** Additional address information */
  additionalInformation: string;
  /** Street type suffix (e.g., 'Avenida', 'Rua') */
  streetSuffix: string;
  /** Street name */
  street: string;
  /** Address number */
  number: string;
  /** Minimum number in range */
  numberMin: string;
  /** Maximum number in range */
  numberMax: string;
  /** Postal code (CEP) */
  postalCode: string;
  /** Country code */
  country: string;
}

/**
 * Response from address lookup endpoints
 */
export interface AddressLookupResponse {
  /** Array of matching addresses */
  addresses: Address[];
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * API error detail
 */
export interface ApiError {
  /** Error code */
  code: number;
  /** Error message */
  message: string;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  /** Array of errors */
  errors: ApiError[];
}

// ============================================================================
// Request Options Types
// ============================================================================

/**
 * Options for address search
 */
export interface AddressSearchOptions {
  /** OData filter expression (e.g., "city eq 'São Paulo'") */
  filter?: string;
}

// ============================================================================
// API Endpoints (for reference)
// ============================================================================

/**
 * Available endpoints:
 *
 * GET /v2/addresses/{postalCode}
 *   - Lookup address by CEP (postal code)
 *   - Returns 200 with AddressLookupResponse or 404 if not found
 *
 * GET /v2/addresses?$filter={filter}
 *   - Search addresses by OData filter
 *   - Returns 200 with AddressLookupResponse
 *
 * GET /v2/addresses/{term}
 *   - Search addresses by generic term
 *   - Returns 200 with AddressLookupResponse or 404 if not found
 */
