/**
 * NaturalPeople Resource
 * Manages natural persons (pessoas físicas) scoped by company
 */

import type { HttpClient } from '../http/client.js';
import type { NaturalPerson, ResourceId, ListResponse } from '../types.js';

/**
 * NaturalPeople resource for managing natural persons (pessoas físicas)
 * All operations are scoped by company_id
 */
export class NaturalPeopleResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all natural people for a company
   *
   * @param companyId - Company ID
   * @returns List of natural people
   *
   * @example
   * ```typescript
   * const result = await nfe.naturalPeople.list('company-id');
   * console.log(`Found ${result.data.length} natural persons`);
   * ```
   */
  async list(companyId: ResourceId): Promise<ListResponse<NaturalPerson>> {
    const path = `/companies/${companyId}/naturalpeople`;
    const response = await this.http.get<ListResponse<NaturalPerson>>(path);

    return response.data;
  }

  /**
   * Create a new natural person
   *
   * @param companyId - Company ID
   * @param data - Natural person data
   * @returns Created natural person
   *
   * @example
   * ```typescript
   * const naturalPerson = await nfe.naturalPeople.create('company-id', {
   *   federalTaxNumber: '12345678901',
   *   name: 'João Silva',
   *   email: 'joao@exemplo.com',
   *   address: {
   *     street: 'Rua Exemplo, 123',
   *     neighborhood: 'Centro',
   *     city: { code: '3550308', name: 'São Paulo' },
   *     state: 'SP',
   *     postalCode: '01000-000'
   *   }
   * });
   * ```
   */
  async create(
    companyId: ResourceId,
    data: Partial<NaturalPerson>
  ): Promise<NaturalPerson> {
    const path = `/companies/${companyId}/naturalpeople`;
    const response = await this.http.post<NaturalPerson>(path, data);

    return response.data;
  }

  /**
   * Retrieve a specific natural person
   *
   * @param companyId - Company ID
   * @param naturalPersonId - Natural person ID
   * @returns Natural person details
   *
   * @example
   * ```typescript
   * const naturalPerson = await nfe.naturalPeople.retrieve(
   *   'company-id',
   *   'natural-person-id'
   * );
   * console.log(naturalPerson.name);
   * ```
   */
  async retrieve(
    companyId: ResourceId,
    naturalPersonId: ResourceId
  ): Promise<NaturalPerson> {
    const path = `/companies/${companyId}/naturalpeople/${naturalPersonId}`;
    const response = await this.http.get<NaturalPerson>(path);

    return response.data;
  }

  /**
   * Update a natural person
   *
   * @param companyId - Company ID
   * @param naturalPersonId - Natural person ID
   * @param data - Data to update
   * @returns Updated natural person
   *
   * @example
   * ```typescript
   * const updated = await nfe.naturalPeople.update(
   *   'company-id',
   *   'natural-person-id',
   *   { email: 'novo@email.com' }
   * );
   * ```
   */
  async update(
    companyId: ResourceId,
    naturalPersonId: ResourceId,
    data: Partial<NaturalPerson>
  ): Promise<NaturalPerson> {
    const path = `/companies/${companyId}/naturalpeople/${naturalPersonId}`;
    const response = await this.http.put<NaturalPerson>(path, data);

    return response.data;
  }

  /**
   * Delete a natural person
   *
   * @param companyId - Company ID
   * @param naturalPersonId - Natural person ID
   *
   * @example
   * ```typescript
   * await nfe.naturalPeople.delete('company-id', 'natural-person-id');
   * ```
   */
  async delete(
    companyId: ResourceId,
    naturalPersonId: ResourceId
  ): Promise<void> {
    const path = `/companies/${companyId}/naturalpeople/${naturalPersonId}`;
    await this.http.delete(path);
  }

  /**
   * Create multiple natural people in batch
   *
   * @param companyId - Company ID
   * @param data - Array of natural people data
   * @returns Array of created natural people
   *
   * @example
   * ```typescript
   * const created = await nfe.naturalPeople.createBatch('company-id', [
   *   { name: 'João Silva', federalTaxNumber: '11111111111', ... },
   *   { name: 'Maria Santos', federalTaxNumber: '22222222222', ... }
   * ]);
   * ```
   */
  async createBatch(
    companyId: ResourceId,
    data: Array<Partial<NaturalPerson>>
  ): Promise<NaturalPerson[]> {
    const promises = data.map(person => this.create(companyId, person));
    return Promise.all(promises);
  }

  /**
   * Find natural person by federal tax number (CPF)
   *
   * @param companyId - Company ID
   * @param federalTaxNumber - CPF (only numbers)
   * @returns Natural person or undefined if not found
   *
   * @example
   * ```typescript
   * const person = await nfe.naturalPeople.findByTaxNumber(
   *   'company-id',
   *   '12345678901'
   * );
   * if (person) {
   *   console.log('Found:', person.name);
   * }
   * ```
   */
  async findByTaxNumber(
    companyId: ResourceId,
    federalTaxNumber: string
  ): Promise<NaturalPerson | undefined> {
    const result = await this.list(companyId);
    const people = (result.data ?? []) as NaturalPerson[];

    return people.find(
      (person: NaturalPerson) =>
        person.federalTaxNumber?.toString() === federalTaxNumber
    );
  }
}
