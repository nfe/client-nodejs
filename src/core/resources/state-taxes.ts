/**
 * NFE.io SDK v3 - State Taxes Resource (Inscrições Estaduais)
 *
 * Handles CRUD operations for company state tax registrations (Inscrições Estaduais)
 * via the api.nfse.io v2 API. State taxes define the series, numbering, environment,
 * and state code configuration required for NF-e issuance.
 */

import type { HttpClient } from '../http/client.js';
import type {
  NfeStateTax,
  NfeStateTaxCreateData,
  NfeStateTaxUpdateData,
  NfeStateTaxListResponse,
  NfeStateTaxListOptions,
} from '../types.js';
import { ValidationError } from '../errors/index.js';

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates company ID is not empty.
 * @param companyId - The company ID to validate
 * @throws {ValidationError} If company ID is empty
 */
function validateCompanyId(companyId: string): void {
  if (!companyId || companyId.trim() === '') {
    throw new ValidationError('Company ID is required');
  }
}

/**
 * Validates state tax ID is not empty.
 * @param stateTaxId - The state tax ID to validate
 * @throws {ValidationError} If state tax ID is empty
 */
function validateStateTaxId(stateTaxId: string): void {
  if (!stateTaxId || stateTaxId.trim() === '') {
    throw new ValidationError('State tax ID is required');
  }
}

// ============================================================================
// State Taxes Resource
// ============================================================================

/**
 * State Taxes (Inscrições Estaduais) API Resource
 *
 * @description
 * Provides CRUD operations for company state tax registrations.
 * State taxes define the series, numbering, environment, and state configuration
 * required for NF-e product invoice issuance.
 *
 * All operations are scoped by company and use the `api.nfse.io` v2 API.
 *
 * @example List state taxes
 * ```typescript
 * const result = await nfe.stateTaxes.list('company-id');
 * for (const tax of result.stateTaxes ?? []) {
 *   console.log(tax.code, tax.taxNumber, tax.status);
 * }
 * ```
 *
 * @example Create a state tax registration
 * ```typescript
 * const tax = await nfe.stateTaxes.create('company-id', {
 *   taxNumber: '123456789',
 *   serie: 1,
 *   number: 1,
 *   code: 'sP',
 *   environmentType: 'production',
 *   type: 'nFe',
 * });
 * console.log(tax.id);
 * ```
 *
 * @example Update and delete
 * ```typescript
 * await nfe.stateTaxes.update('company-id', 'state-tax-id', { serie: 2 });
 * await nfe.stateTaxes.delete('company-id', 'state-tax-id');
 * ```
 */
export class StateTaxesResource {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Returns the base path for state tax operations.
   */
  private basePath(companyId: string): string {
    return `/v2/companies/${companyId}/statetaxes`;
  }

  // --------------------------------------------------------------------------
  // List
  // --------------------------------------------------------------------------

  /**
   * List all state tax registrations (Inscrições Estaduais) for a company.
   *
   * Uses cursor-based pagination with `startingAfter`, `endingBefore`, and `limit`.
   *
   * @param companyId - The company ID
   * @param options - Optional pagination options
   * @returns List of state tax registrations
   * @throws {ValidationError} If companyId is empty
   *
   * @example
   * ```typescript
   * const result = await nfe.stateTaxes.list('company-id');
   * for (const tax of result.stateTaxes ?? []) {
   *   console.log(tax.id, tax.taxNumber, tax.serie, tax.status);
   * }
   * ```
   */
  async list(
    companyId: string,
    options?: NfeStateTaxListOptions,
  ): Promise<NfeStateTaxListResponse> {
    validateCompanyId(companyId);
    const params: Record<string, unknown> = {};
    if (options?.startingAfter !== undefined) params.startingAfter = options.startingAfter;
    if (options?.endingBefore !== undefined) params.endingBefore = options.endingBefore;
    if (options?.limit !== undefined) params.limit = options.limit;
    const response = await this.http.get<NfeStateTaxListResponse>(
      this.basePath(companyId),
      params,
    );
    return response.data;
  }

  // --------------------------------------------------------------------------
  // Create
  // --------------------------------------------------------------------------

  /**
   * Create a new state tax registration (Inscrição Estadual) for a company.
   *
   * @param companyId - The company ID
   * @param data - State tax data (taxNumber, serie, and number are required)
   * @returns The created state tax record
   * @throws {ValidationError} If companyId is empty
   * @throws {BadRequestError} If required fields are missing
   *
   * @example
   * ```typescript
   * const tax = await nfe.stateTaxes.create('company-id', {
   *   taxNumber: '123456789',
   *   serie: 1,
   *   number: 1,
   *   code: 'sP',
   *   environmentType: 'production',
   * });
   * ```
   */
  async create(
    companyId: string,
    data: NfeStateTaxCreateData,
  ): Promise<NfeStateTax> {
    validateCompanyId(companyId);
    const response = await this.http.post<NfeStateTax>(
      this.basePath(companyId),
      { stateTax: data },
    );
    return response.data;
  }

  // --------------------------------------------------------------------------
  // Retrieve
  // --------------------------------------------------------------------------

  /**
   * Retrieve a specific state tax registration by ID.
   *
   * @param companyId - The company ID
   * @param stateTaxId - The state tax ID
   * @returns The state tax record
   * @throws {ValidationError} If companyId or stateTaxId is empty
   * @throws {NotFoundError} If state tax record does not exist
   *
   * @example
   * ```typescript
   * const tax = await nfe.stateTaxes.retrieve('company-id', 'state-tax-id');
   * console.log(tax.taxNumber, tax.environmentType, tax.serie);
   * ```
   */
  async retrieve(
    companyId: string,
    stateTaxId: string,
  ): Promise<NfeStateTax> {
    validateCompanyId(companyId);
    validateStateTaxId(stateTaxId);
    const response = await this.http.get<NfeStateTax>(
      `${this.basePath(companyId)}/${stateTaxId}`,
    );
    return response.data;
  }

  // --------------------------------------------------------------------------
  // Update
  // --------------------------------------------------------------------------

  /**
   * Update an existing state tax registration.
   *
   * @param companyId - The company ID
   * @param stateTaxId - The state tax ID to update
   * @param data - Fields to update
   * @returns The updated state tax record
   * @throws {ValidationError} If companyId or stateTaxId is empty
   * @throws {NotFoundError} If state tax record does not exist
   *
   * @example
   * ```typescript
   * const tax = await nfe.stateTaxes.update('company-id', 'state-tax-id', {
   *   serie: 2,
   *   environmentType: 'test',
   * });
   * ```
   */
  async update(
    companyId: string,
    stateTaxId: string,
    data: NfeStateTaxUpdateData,
  ): Promise<NfeStateTax> {
    validateCompanyId(companyId);
    validateStateTaxId(stateTaxId);
    const response = await this.http.put<NfeStateTax>(
      `${this.basePath(companyId)}/${stateTaxId}`,
      { stateTax: data },
    );
    return response.data;
  }

  // --------------------------------------------------------------------------
  // Delete
  // --------------------------------------------------------------------------

  /**
   * Delete a state tax registration.
   *
   * @param companyId - The company ID
   * @param stateTaxId - The state tax ID to delete
   * @throws {ValidationError} If companyId or stateTaxId is empty
   * @throws {NotFoundError} If state tax record does not exist
   *
   * @example
   * ```typescript
   * await nfe.stateTaxes.delete('company-id', 'state-tax-id');
   * ```
   */
  async delete(
    companyId: string,
    stateTaxId: string,
  ): Promise<void> {
    validateCompanyId(companyId);
    validateStateTaxId(stateTaxId);
    await this.http.delete(
      `${this.basePath(companyId)}/${stateTaxId}`,
    );
  }
}
