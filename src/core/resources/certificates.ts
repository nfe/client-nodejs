/**
 * NFE.io SDK v4 - Certificates Resource (digital certificate management)
 *
 * Manages company digital certificates via the contribuintes-v2 (Empresas) API
 * on **api.nfse.io**. Covers the gap left by the legacy singular upload on
 * `companies` (which targets the api.nfe.io host): retrieve/delete by thumbprint
 * and the plural collection.
 *
 * Host note: this targets `api.nfse.io` (the contribuintes-v2 server). It is a
 * dedicated resource — NOT folded into `companies` — because `companies` is wired
 * to the api.nfe.io main client, a different host. Types come from contribuintes-v2.
 *
 * Validation note: `CertificateValidator` only pre-flights file format; the
 * certificate validity/password is verified server-side (see fix-repo-bugs).
 */

import type { HttpClient } from '../http/client.js';
import type {
  CertificateMetadataResource,
  CertificatesMetadataResource,
} from '../types.js';
import { ValidationError } from '../errors/index.js';

function validateCompanyId(companyId: string): void {
  if (!companyId || companyId.trim() === '') {
    throw new ValidationError('Company ID is required');
  }
}

function validateThumbprint(thumbprint: string): void {
  if (!thumbprint || thumbprint.trim() === '') {
    throw new ValidationError('Certificate thumbprint is required');
  }
}

export class CertificatesResource {
  constructor(private readonly http: HttpClient) {}

  private v2Base(companyId: string): string {
    return `/v2/companies/${companyId}/certificates`;
  }

  private v1Base(companyId: string): string {
    return `/v1/companies/${companyId}/certificate`;
  }

  /** List a company's certificates (`GET /v2/companies/{id}/certificates`). */
  async list(companyId: string): Promise<CertificatesMetadataResource> {
    validateCompanyId(companyId);
    const response = await this.http.get<CertificatesMetadataResource>(this.v2Base(companyId));
    return response.data;
  }

  /** Retrieve a certificate by thumbprint (`GET /v2/companies/{id}/certificates/{thumbprint}`). */
  async getByThumbprint(
    companyId: string,
    thumbprint: string
  ): Promise<CertificateMetadataResource> {
    validateCompanyId(companyId);
    validateThumbprint(thumbprint);
    const response = await this.http.get<CertificateMetadataResource>(
      `${this.v2Base(companyId)}/${thumbprint}`
    );
    return response.data;
  }

  /** Delete a certificate by thumbprint (`DELETE /v2/companies/{id}/certificates/{thumbprint}`). */
  async deleteByThumbprint(companyId: string, thumbprint: string): Promise<void> {
    validateCompanyId(companyId);
    validateThumbprint(thumbprint);
    await this.http.delete(`${this.v2Base(companyId)}/${thumbprint}`);
  }

  /** Retrieve a certificate by thumbprint via the v1 path (`/v1/companies/{id}/certificate/{thumbprint}`). */
  async getByThumbprintV1(
    companyId: string,
    thumbprint: string
  ): Promise<CertificateMetadataResource> {
    validateCompanyId(companyId);
    validateThumbprint(thumbprint);
    const response = await this.http.get<CertificateMetadataResource>(
      `${this.v1Base(companyId)}/${thumbprint}`
    );
    return response.data;
  }

  /** Delete a certificate by thumbprint via the v1 path. */
  async deleteByThumbprintV1(companyId: string, thumbprint: string): Promise<void> {
    validateCompanyId(companyId);
    validateThumbprint(thumbprint);
    await this.http.delete(`${this.v1Base(companyId)}/${thumbprint}`);
  }
}

export function createCertificatesResource(http: HttpClient): CertificatesResource {
  return new CertificatesResource(http);
}
