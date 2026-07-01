/**
 * NFE.io SDK v4 - Municipal Taxes Resource (Inscrições Municipais)
 *
 * CRUD for company municipal tax registrations via the api.nfse.io v2 API,
 * mirroring StateTaxesResource. Municipal registration is a prerequisite for
 * NFS-e issuance in most municipalities. Adds `updateprefecture` (PATCH) and the
 * RPS `series` lookup. Types come from `contribuintes-v2` (sync change).
 */

import type { HttpClient } from '../http/client.js';
import type {
  MunicipalTax,
  CreateMunicipalTaxData,
  UpdateMunicipalTaxData,
  MunicipalTaxListResponse,
} from '../types.js';
import { ValidationError } from '../errors/index.js';

function validateCompanyId(companyId: string): void {
  if (!companyId || companyId.trim() === '') {
    throw new ValidationError('Company ID is required');
  }
}

function validateMunicipalTaxId(municipalTaxId: string): void {
  if (!municipalTaxId || municipalTaxId.trim() === '') {
    throw new ValidationError('Municipal tax ID is required');
  }
}

export class MunicipalTaxesResource {
  constructor(private readonly http: HttpClient) {}

  private basePath(companyId: string): string {
    return `/v2/companies/${companyId}/municipaltaxes`;
  }

  /** List municipal tax registrations for a company. */
  async list(companyId: string): Promise<MunicipalTaxListResponse> {
    validateCompanyId(companyId);
    const response = await this.http.get<MunicipalTaxListResponse>(this.basePath(companyId));
    return response.data;
  }

  /** Create a municipal tax registration (wrapped as `{ municipalTax }`). */
  async create(companyId: string, data: CreateMunicipalTaxData): Promise<MunicipalTax> {
    validateCompanyId(companyId);
    const response = await this.http.post<MunicipalTax>(this.basePath(companyId), {
      municipalTax: data,
    });
    return response.data;
  }

  /** Retrieve a municipal tax registration by id. */
  async retrieve(companyId: string, municipalTaxId: string): Promise<MunicipalTax> {
    validateCompanyId(companyId);
    validateMunicipalTaxId(municipalTaxId);
    const response = await this.http.get<MunicipalTax>(
      `${this.basePath(companyId)}/${municipalTaxId}`
    );
    return response.data;
  }

  /** Update a municipal tax registration. */
  async update(
    companyId: string,
    municipalTaxId: string,
    data: UpdateMunicipalTaxData
  ): Promise<MunicipalTax> {
    validateCompanyId(companyId);
    validateMunicipalTaxId(municipalTaxId);
    const response = await this.http.put<MunicipalTax>(
      `${this.basePath(companyId)}/${municipalTaxId}`,
      { municipalTax: data }
    );
    return response.data;
  }

  /** Delete a municipal tax registration. */
  async delete(companyId: string, municipalTaxId: string): Promise<void> {
    validateCompanyId(companyId);
    validateMunicipalTaxId(municipalTaxId);
    await this.http.delete(`${this.basePath(companyId)}/${municipalTaxId}`);
  }

  /**
   * Update the prefecture (city hall) credentials/integration for a municipal tax
   * registration. Uses HTTP PATCH (`.../updateprefecture`).
   */
  async updatePrefecture(
    companyId: string,
    municipalTaxId: string,
    data: UpdateMunicipalTaxData
  ): Promise<MunicipalTax> {
    validateCompanyId(companyId);
    validateMunicipalTaxId(municipalTaxId);
    const response = await this.http.patch<MunicipalTax>(
      `${this.basePath(companyId)}/${municipalTaxId}/updateprefecture`,
      { municipalTax: data }
    );
    return response.data;
  }

  /** Look up an RPS series for a municipal tax registration. */
  async getSeries(
    companyId: string,
    municipalTaxId: string,
    serie: string
  ): Promise<Record<string, unknown>> {
    validateCompanyId(companyId);
    validateMunicipalTaxId(municipalTaxId);
    if (!serie || serie.trim() === '') {
      throw new ValidationError('Serie is required');
    }
    const response = await this.http.get<Record<string, unknown>>(
      `${this.basePath(companyId)}/${municipalTaxId}/series/${serie}`
    );
    return response.data;
  }
}

export function createMunicipalTaxesResource(http: HttpClient): MunicipalTaxesResource {
  return new MunicipalTaxesResource(http);
}
