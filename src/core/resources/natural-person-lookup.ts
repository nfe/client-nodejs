/**
 * NFE.io SDK v3 - Natural Person Lookup Resource
 *
 * Handles CPF cadastral status lookup operations via the Natural Person API.
 * Uses a separate API host: naturalperson.api.nfe.io
 *
 * Provides methods for:
 * - CPF cadastral status query (situação cadastral na Receita Federal)
 */

import type { HttpClient } from '../http/client.js';
import type { NaturalPersonStatusResponse } from '../types.js';
import { ValidationError } from '../errors/index.js';

// ============================================================================
// Constants
// ============================================================================

/** Base URL for Natural Person API */
export const NATURAL_PERSON_API_BASE_URL = 'https://naturalperson.api.nfe.io';

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Normalizes a CPF by stripping all non-digit characters.
 *
 * @param cpf - Raw CPF string, with or without punctuation
 * @returns Digits-only CPF string
 */
function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Validates a CPF format.
 * Strips non-digit characters and checks for exactly 11 digits.
 *
 * @param federalTaxNumber - CPF string to validate
 * @returns Normalized digits-only CPF string
 * @throws {ValidationError} If input is empty or not exactly 11 digits after normalization
 */
function validateCpf(federalTaxNumber: string | undefined | null): string {
  if (!federalTaxNumber || federalTaxNumber.trim() === '') {
    throw new ValidationError('Federal tax number (CPF) is required');
  }

  const normalized = normalizeCpf(federalTaxNumber);

  if (normalized.length !== 11) {
    throw new ValidationError(
      `Invalid federal tax number format: "${federalTaxNumber}". Expected 11 digits (e.g., "12345678901" or "123.456.789-01"), got ${normalized.length} digit(s).`
    );
  }

  return normalized;
}

/**
 * Validates and normalizes a birth date parameter.
 * Accepts a string in YYYY-MM-DD format or a Date object.
 *
 * @param birthDate - Birth date as string (YYYY-MM-DD) or Date object
 * @returns Normalized YYYY-MM-DD string
 * @throws {ValidationError} If input is empty, invalid format, or invalid date values
 */
function validateBirthDate(birthDate: string | Date | undefined | null): string {
  if (birthDate === undefined || birthDate === null) {
    throw new ValidationError('Birth date is required');
  }

  // Convert Date object to YYYY-MM-DD string using UTC
  if (birthDate instanceof Date) {
    if (isNaN(birthDate.getTime())) {
      throw new ValidationError('Birth date is an invalid Date object');
    }
    const year = birthDate.getUTCFullYear();
    const month = String(birthDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(birthDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Validate string format
  if (typeof birthDate === 'string') {
    if (birthDate.trim() === '') {
      throw new ValidationError('Birth date is required');
    }

    const match = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      throw new ValidationError(
        `Invalid birth date format: "${birthDate}". Expected YYYY-MM-DD format (e.g., "1990-01-15").`
      );
    }

    const monthStr = match[2] as string;
    const dayStr = match[3] as string;
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (month < 1 || month > 12) {
      throw new ValidationError(
        `Invalid birth date: "${birthDate}". Month must be between 01 and 12, got ${monthStr}.`
      );
    }

    if (day < 1 || day > 31) {
      throw new ValidationError(
        `Invalid birth date: "${birthDate}". Day must be between 01 and 31, got ${dayStr}.`
      );
    }

    return birthDate;
  }

  throw new ValidationError('Birth date must be a string (YYYY-MM-DD) or a Date object');
}

// ============================================================================
// Natural Person Lookup Resource
// ============================================================================

/**
 * Natural Person Lookup API Resource
 *
 * @description
 * Provides a read-only operation for querying CPF cadastral status (situação cadastral)
 * at the Brazilian Federal Revenue Service (Receita Federal) via the NFE.io Natural Person API.
 *
 * **Note:** This resource uses a different API host (naturalperson.api.nfe.io)
 * and may require a separate API key configured via `dataApiKey` in the client configuration.
 *
 * @example CPF cadastral status lookup
 * ```typescript
 * const result = await nfe.naturalPersonLookup.getStatus('123.456.789-01', '1990-01-15');
 * console.log(result.name);    // 'JOÃO DA SILVA'
 * console.log(result.status);  // 'Regular'
 * ```
 *
 * @example Using a Date object for birth date
 * ```typescript
 * const result = await nfe.naturalPersonLookup.getStatus('12345678901', new Date(1990, 0, 15));
 * console.log(result.status);  // 'Regular'
 * ```
 */
export class NaturalPersonLookupResource {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Lookup CPF cadastral status at Receita Federal
   *
   * @description
   * Queries the cadastral status of a CPF (pessoa física) at the Brazilian Federal
   * Revenue Service. Returns the person's name, CPF, birth date, cadastral status
   * (Regular, Suspensa, Cancelada, etc.), and query timestamp.
   *
   * @param federalTaxNumber - CPF number, with or without punctuation (e.g., "12345678901" or "123.456.789-01")
   * @param birthDate - Date of birth as string in YYYY-MM-DD format (e.g., "1990-01-15") or a Date object
   * @returns Promise with the CPF cadastral status response
   * @throws {ValidationError} If CPF format is invalid (not 11 digits) or birth date format is invalid
   * @throws {NotFoundError} If CPF is not found or birth date does not match (404)
   * @throws {AuthenticationError} If API key is invalid or missing (401)
   *
   * @example
   * ```typescript
   * // Simple lookup with string date
   * const result = await nfe.naturalPersonLookup.getStatus('12345678901', '1990-01-15');
   * console.log(result.name);    // 'JOÃO DA SILVA'
   * console.log(result.status);  // 'Regular'
   *
   * // With formatted CPF
   * const result = await nfe.naturalPersonLookup.getStatus('123.456.789-01', '1990-01-15');
   *
   * // Using a Date object
   * const result = await nfe.naturalPersonLookup.getStatus('12345678901', new Date(1990, 0, 15));
   * ```
   */
  async getStatus(
    federalTaxNumber: string,
    birthDate: string | Date
  ): Promise<NaturalPersonStatusResponse> {
    const normalizedCpf = validateCpf(federalTaxNumber);
    const normalizedDate = validateBirthDate(birthDate);

    const response = await this.http.get<NaturalPersonStatusResponse>(
      `/v1/naturalperson/status/${normalizedCpf}/${normalizedDate}`
    );

    return response.data;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a NaturalPersonLookupResource instance
 *
 * @param http - HTTP client configured for the Natural Person API
 * @returns NaturalPersonLookupResource instance
 */
export function createNaturalPersonLookupResource(http: HttpClient): NaturalPersonLookupResource {
  return new NaturalPersonLookupResource(http);
}
