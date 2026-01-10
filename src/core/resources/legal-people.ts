/**
 * LegalPeople Resource
 * Manages legal entities (pessoas jurídicas) scoped by company
 */

import type { HttpClient } from '../http/client.js';
import type { LegalPerson, ListLegalPeopleResponse, ResourceId } from '../types.js';

/**
 * LegalPeople resource for managing legal entities (pessoas jurídicas)
 * All operations are scoped by company_id
 */
export class LegalPeopleResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all legal people for a company
   *
   * @param companyId - Company ID
   * @returns List of legal people
   *
   * @example
   * ```typescript
   * const result = await nfe.legalPeople.list('company-id');
   * console.log(`Found ${result.legalPeople?.length ?? 0} legal entities`);
   * ```
   */
  async list(companyId: ResourceId): Promise<ListLegalPeopleResponse> {
    const path = `/companies/${companyId}/legalpeople`;
    const response = await this.http.get<ListLegalPeopleResponse>(path);

    return response.data;
  }

  /**
   * Create a new legal person
   *
   * @param companyId - Company ID
   * @param data - Legal person data
   * @returns Created legal person
   *
   * @example
   * ```typescript
   * const legalPerson = await nfe.legalPeople.create('company-id', {
   *   federalTaxNumber: '12345678901234',
   *   name: 'Empresa Exemplo Ltda',
   *   email: 'contato@empresa.com.br',
   *   address: {
   *     street: 'Av. Paulista, 1000',
   *     neighborhood: 'Bela Vista',
   *     city: { code: '3550308', name: 'São Paulo' },
   *     state: 'SP',
   *     postalCode: '01310-100'
   *     }
   * });
   * ```
   */
  async create(
    companyId: ResourceId,
    data: Partial<LegalPerson>
  ): Promise<LegalPerson> {
    const path = `/companies/${companyId}/legalpeople`;
    const response = await this.http.post<LegalPerson>(path, data);

    return response.data;
  }

  /**
   * Retrieve a specific legal person
   *
   * @param companyId - Company ID
   * @param legalPersonId - Legal person ID
   * @returns Legal person details
   *
   * @example
   * ```typescript
   * const legalPerson = await nfe.legalPeople.retrieve(
   *   'company-id',
   *   'legal-person-id'
   * );
   * console.log(legalPerson.name);
   * ```
   */
  async retrieve(
    companyId: ResourceId,
    legalPersonId: ResourceId
  ): Promise<LegalPerson> {
    const path = `/companies/${companyId}/legalpeople/${legalPersonId}`;
    const response = await this.http.get<LegalPerson>(path);

    return response.data;
  }

  /**
   * Update a legal person
   *
   * @param companyId - Company ID
   * @param legalPersonId - Legal person ID
   * @param data - Data to update
   * @returns Updated legal person
   *
   * @example
   * ```typescript
   * const updated = await nfe.legalPeople.update(
   *   'company-id',
   *   'legal-person-id',
   *   { email: 'novo@email.com' }
   * );
   * ```
   */
  async update(
    companyId: ResourceId,
    legalPersonId: ResourceId,
    data: Partial<LegalPerson>
  ): Promise<LegalPerson> {
    const path = `/companies/${companyId}/legalpeople/${legalPersonId}`;
    const response = await this.http.put<LegalPerson>(path, data);

    return response.data;
  }

  /**
   * Delete a legal person
   *
   * @param companyId - Company ID
   * @param legalPersonId - Legal person ID
   *
   * @example
   * ```typescript
   * await nfe.legalPeople.delete('company-id', 'legal-person-id');
   * ```
   */
  async delete(
    companyId: ResourceId,
    legalPersonId: ResourceId
  ): Promise<void> {
    const path = `/companies/${companyId}/legalpeople/${legalPersonId}`;
    await this.http.delete(path);
  }

  /**
   * Create multiple legal people in batch
   *
   * @param companyId - Company ID
   * @param data - Array of legal people data
   * @returns Array of created legal people
   *
   * @example
   * ```typescript
   * const created = await nfe.legalPeople.createBatch('company-id', [
   *   { name: 'Empresa 1', federalTaxNumber: '11111111111111', ... },
   *   { name: 'Empresa 2', federalTaxNumber: '22222222222222', ... }
   * ]);
   * ```
   */
  async createBatch(
    companyId: ResourceId,
    data: Array<Partial<LegalPerson>>
  ): Promise<LegalPerson[]> {
    const promises = data.map(person => this.create(companyId, person));
    return Promise.all(promises);
  }

  /**
   * Find legal person by federal tax number (CNPJ)
   *
   * @param companyId - Company ID
   * @param federalTaxNumber - CNPJ (only numbers)
   * @returns Legal person or undefined if not found
   *
   * @example
   * ```typescript
   * const person = await nfe.legalPeople.findByTaxNumber(
   *   'company-id',
   *   '12345678901234'
   * );
   * if (person) {
   *   console.log('Found:', person.name);
   * }
   * ```
   */
  async findByTaxNumber(
    companyId: ResourceId,
    federalTaxNumber: string
  ): Promise<LegalPerson | undefined> {
    // Note: The API returns a single object, not an array
    // This method needs to be refactored if the API actually returns arrays
    const result = await this.list(companyId);

    // For now, check if the single returned object matches
    if (result.federalTaxNumber?.toString() === federalTaxNumber) {
      return result as LegalPerson;
    }

    return undefined;
  }
}
