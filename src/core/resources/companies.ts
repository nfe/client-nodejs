/**
 * NFE.io SDK v3 - Companies Resource
 *
 * Handles company operations and certificate management
 */

import type {
  Company,
  CompanyResourceItem,
  CompanyV2ListOptions,
  CompanyV2ListResponse,
  CertificateMetadataResourceItem,
  CertificatesMetadataResource,
  CompanyCertificateV1,
  ListResponse,
  PaginationOptions
} from '../types.js';
import type { HttpClient } from '../http/client.js';
import { ValidationError, NotFoundError } from '../errors/index.js';
import { CertificateValidator } from '../utils/certificate-validator.js';

// Page size for listAll/listIterator: the API caps GET /companies at
// pageCount 50 (values above 50 — and also 1 — are rejected with a 400).
const AUTO_PAGINATION_PAGE_SIZE = 50;

/**
 * Resumo do certificado de uma empresa.
 *
 * `expiresOn` / `isValid` / os dois derivados descrevem o certificado preferido
 * (ver {@link CompaniesResource.getCertificateStatus}); `certificates` traz os itens
 * como a API devolveu, para quem precisar de `thumbprint`, `subject` ou decidir
 * por outro critério.
 */
export interface CertificateStatusSummary {
  /** Há ao menos um certificado instalado. */
  hasCertificate: boolean;
  /** Vencimento do certificado preferido (o `validUntil` da API). */
  expiresOn?: string;
  /** O certificado preferido está com `status: 'Active'`. */
  isValid?: boolean;
  /** Dias até o vencimento — negativo se já venceu. */
  daysUntilExpiration?: number;
  /** Vence dentro do limite padrão do {@link CertificateValidator} (30 dias). */
  isExpiringSoon?: boolean;
  /** Itens como a API os devolveu. Vazio quando não há certificado. */
  certificates: readonly CertificateMetadataResourceItem[];
}

/**
 * Escolhe o certificado que o resumo descreve: um ativo, o de vencimento mais
 * distante; sem nenhum ativo, o de vencimento mais distante entre todos.
 */
function pickPreferredCertificate(
  certificates: readonly CertificateMetadataResourceItem[]
): CertificateMetadataResourceItem | undefined {
  if (certificates.length === 0) return undefined;

  const byLatestExpiry = (
    a: CertificateMetadataResourceItem,
    b: CertificateMetadataResourceItem
  ): number => new Date(b.validUntil ?? 0).getTime() - new Date(a.validUntil ?? 0).getTime();

  const active = certificates.filter(c => c.status === 'Active');
  const pool = active.length > 0 ? active : certificates;
  return [...pool].sort(byLatestExpiry)[0];
}

/** Monta o resumo a partir dos itens de `/v1/companies/{id}/certificate`. */
function summarizeCertificates(
  certificates: readonly CertificateMetadataResourceItem[]
): CertificateStatusSummary {
  const preferred = pickPreferredCertificate(certificates);

  if (!preferred) {
    return { hasCertificate: false, certificates };
  }

  const summary: CertificateStatusSummary = {
    hasCertificate: true,
    isValid: preferred.status === 'Active',
    certificates,
  };

  // `validUntil` é obrigatório na spec, mas o SDK não decide por ela: sem data,
  // devolve o que dá para afirmar em vez de emitir um `Invalid Date`.
  if (preferred.validUntil) {
    const expirationDate = new Date(preferred.validUntil);
    summary.expiresOn = preferred.validUntil;
    summary.daysUntilExpiration = CertificateValidator.getDaysUntilExpiration(expirationDate);
    summary.isExpiringSoon = CertificateValidator.isExpiringSoon(expirationDate);
  }

  return summary;
}

/**
 * Lê o certificado que o item da listagem de empresas v1 já traz.
 *
 * Existe para que a varredura por conta não faça uma requisição por empresa: numa
 * conta com centenas de empresas isso é indistinguível de travamento. O campo vem
 * em todo item de `GET /v1/companies` (medido em 2026-09-02).
 */
function readListedCertificate(company: Company): CompanyCertificateV1 | undefined {
  const certificate = (company as { certificate?: unknown }).certificate;
  if (!certificate || typeof certificate !== 'object') return undefined;
  return certificate as CompanyCertificateV1;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate CNPJ format (14 digits) with check digits
 */
function validateCNPJ(cnpj: number): boolean {
  const cnpjStr = cnpj.toString().padStart(14, '0');
  if (cnpjStr.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpjStr)) return false; // All same digits

  // Validate first check digit
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpjStr[i]!) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (firstDigit !== parseInt(cnpjStr[12]!)) return false;

  // Validate second check digit
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpjStr[i]!) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (secondDigit !== parseInt(cnpjStr[13]!)) return false;

  return true;
}

/**
 * Validate CPF format (11 digits) with check digits
 */
function validateCPF(cpf: number): boolean {
  const cpfStr = cpf.toString().padStart(11, '0');
  if (cpfStr.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfStr)) return false; // All same digits

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpfStr[i]!) * (10 - i);
  }
  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (firstDigit !== parseInt(cpfStr[9]!)) return false;

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpfStr[i]!) * (11 - i);
  }
  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (secondDigit !== parseInt(cpfStr[10]!)) return false;

  return true;
}

/**
 * Validate company data before API call
 */
function validateCompanyData(data: Partial<Company>): void {
  // Validate required fields for creation
  if ('federalTaxNumber' in data) {
    const taxNumber = data.federalTaxNumber;
    if (typeof taxNumber !== 'number') {
      throw new ValidationError('federalTaxNumber must be a number');
    }

    const length = taxNumber.toString().length;
    if (length === 14) {
      if (!validateCNPJ(taxNumber)) {
        throw new ValidationError('Invalid CNPJ format. Must be 14 digits and not all same digit.');
      }
    } else if (length === 11) {
      if (!validateCPF(taxNumber)) {
        throw new ValidationError('Invalid CPF format. Must be 11 digits and not all same digit.');
      }
    } else {
      throw new ValidationError('federalTaxNumber must be 11 digits (CPF) or 14 digits (CNPJ)');
    }
  }

  // Validate email format if provided
  if (data.email && typeof data.email === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new ValidationError('Invalid email format');
    }
  }
}

// ============================================================================
// Companies Resource
// ============================================================================

export class CompaniesResource {
  /**
   * @param http - Main client (api.nfe.io) for the legacy v1 company CRUD.
   * @param v2Http - Optional client for the contribuintes-v2 endpoints on
   *   api.nfse.io (e.g. the HEAD existence check). Falls back to `http`.
   */
  constructor(
    private readonly http: HttpClient,
    private readonly v2Http: HttpClient = http
  ) {}

  // --------------------------------------------------------------------------
  // Core CRUD Operations
  // --------------------------------------------------------------------------

  /**
   * Check whether a company exists, via `HEAD /v2/companies/{id}` (api.nfse.io).
   *
   * @returns `true` if the company exists (2xx), `false` on 404. Other errors propagate.
   */
  async exists(companyId: string): Promise<boolean> {
    if (!companyId || companyId.trim() === '') {
      throw new ValidationError('Company ID is required');
    }
    try {
      await this.v2Http.head(`/v2/companies/${companyId}`);
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) return false;
      throw error;
    }
  }

  /**
   * Create a new company
   *
   * The API requires `name`, `federalTaxNumber`, `taxRegime` and `address`
   * (with `state`, `city { code, name }`, `district`, `street`, `number`,
   * `postalCode`, `country`) — a payload without them compiles against the
   * loose `Company`-based signature but fails with a 400. Note that `email`
   * is NOT part of the create body. For the strict wire shape, see
   * {@link CreateCompanyResourceItem} (exported from the package root).
   *
   * @param data - Company data (excluding id, createdOn, modifiedOn)
   * @returns The created company with generated id
   * @throws {ValidationError} If company data is invalid
   * @throws {AuthenticationError} If API key is invalid
   * @throws {ConflictError} If company with same tax number already exists
   *
   * @example
   * ```typescript
   * const company = await nfe.companies.create({
   *   name: 'Acme Corp',
   *   federalTaxNumber: 12345678000190,
   *   taxRegime: 'SimplesNacional',
   *   address: {
   *     state: 'SP',
   *     city: { code: '3550308', name: 'São Paulo' },
   *     district: 'Centro',
   *     street: 'Rua Exemplo',
   *     number: '100',
   *     postalCode: '01001000',
   *     country: 'BRA',
   *   },
   * });
   * ```
   */
  async create(data: Omit<Company, 'id' | 'createdOn' | 'modifiedOn'>): Promise<Company> {
    // Validate data before API call
    validateCompanyData(data);

    const path = '/companies';
    const response = await this.http.post<{ companies: Company }>(path, data);

    // API returns wrapped object: { companies: {...} }
    return response.data.companies;
  }

  /**
   * List companies (v1 API — offset pagination)
   *
   * @deprecated The v1 companies API (`api.nfe.io/v1/companies`) is being
   * discontinued. Prefer {@link listV2} (cursor-based, `api.nfse.io/v2`) for
   * page-by-page listing, or {@link listAll}/{@link listIterator} for full
   * sweeps. This method keeps working during the coexistence window.
   *
   * Pagination is 1-based (API contract): the first page is `pageIndex: 1`.
   * The API rejects `pageIndex: 0` with a validation error.
   *
   * `pageCount` accepted by the API: 2-50 (when omitted, the API returns 10
   * items). Values outside that range — including 1, despite the API's
   * "between 1 and 50" error message — are rejected with a 400.
   *
   * @param options - Pagination options (pageCount, pageIndex)
   * @returns List response with companies and pagination info
   *
   * @example
   * ```typescript
   * const page1 = await nfe.companies.list({ pageCount: 20, pageIndex: 1 });
   * const page2 = await nfe.companies.list({ pageCount: 20, pageIndex: 2 });
   * ```
   */
  async list(options: PaginationOptions = {}): Promise<ListResponse<Company>> {
    const path = '/companies';
    const response = await this.http.get<{ companies: Company[]; page: number }>(path, options);

    // API returns: { companies: [...], page: number }
    // Transform to our standard ListResponse format (pageIndex stays 1-based, as on the wire)
    return {
      data: response.data.companies,
      page: {
        pageIndex: response.data.page,
        pageCount: options.pageCount ?? 10, // the API returns 10 items when pageCount is omitted
      }
    };
  }

  /**
   * List companies via the v2 cursor API (`GET api.nfse.io/v2/companies`)
   *
   * This is the successor of {@link list} (the v1 companies API is being
   * discontinued). Cursor-based: pass the last item's `id` as
   * `startingAfter` to fetch the next page; `hasMore` tells whether more
   * pages exist. Results are ordered by name, then id.
   *
   * `limit` accepted by the API: 1-50 (default 10). Values above 50 are
   * rejected; `limit: 0` is rejected client-side (the API would silently
   * return an empty page). Items follow the **v2 projection**
   * ({@link CompanyResourceItem}) — a different shape from the v1
   * {@link Company} (no NFS-e config fields; adds `stateTaxes`,
   * `municipalTaxes`, `type`, `version`).
   *
   * Known API issue (reported 2026-07-14): on some accounts, specific
   * records make the server answer 500 for any page window containing
   * them, which breaks full sweeps — the reason {@link listAll}/
   * {@link listIterator} still run on v1 in this release.
   *
   * @param options - Cursor pagination options (limit, startingAfter, endingBefore)
   * @returns Page of companies (v2 projection) plus `hasMore`
   * @throws {ValidationError} If `limit` is outside 1-50
   *
   * @example
   * ```typescript
   * let page = await nfe.companies.listV2({ limit: 50 });
   * while (page.hasMore) {
   *   const last = page.data[page.data.length - 1];
   *   page = await nfe.companies.listV2({ limit: 50, startingAfter: last.id });
   * }
   * ```
   */
  async listV2(options: CompanyV2ListOptions = {}): Promise<CompanyV2ListResponse> {
    if (options.limit !== undefined && (options.limit < 1 || options.limit > 50)) {
      throw new ValidationError('limit must be between 1 and 50');
    }

    const params: Record<string, unknown> = {};
    if (options.limit !== undefined) params.limit = options.limit;
    if (options.startingAfter) params.startingAfter = options.startingAfter;
    if (options.endingBefore) params.endingBefore = options.endingBefore;

    // Wire response: { hasMore, companies } (the spec omits hasMore; the live API sends it)
    const response = await this.v2Http.get<{
      hasMore?: boolean;
      companies?: CompanyResourceItem[] | null;
    }>('/v2/companies', params);

    return {
      data: (response.data.companies ?? []) as CompanyResourceItem[],
      hasMore: response.data.hasMore ?? false,
    };
  }

  /**
   * List all companies with automatic pagination
   *
   * Fetches all pages automatically and returns complete list.
   * Use with caution for accounts with many companies.
   *
   * @returns Array of all companies
   *
   * @example
   * ```typescript
   * const allCompanies = await nfe.companies.listAll();
   * console.log(`Total companies: ${allCompanies.length}`);
   * ```
   */
  async listAll(): Promise<Company[]> {
    const companies: Company[] = [];
    let pageIndex = 1; // pagination is 1-based; the API rejects pageIndex 0
    let hasMore = true;

    while (hasMore) {
      const page = await this.list({ pageCount: AUTO_PAGINATION_PAGE_SIZE, pageIndex });
      const pageData = Array.isArray(page) ? page : (page.data || []);
      companies.push(...pageData);

      // Check if there are more pages
      hasMore = pageData.length === AUTO_PAGINATION_PAGE_SIZE;
      pageIndex++;
    }

    return companies;
  }

  /**
   * Async iterator for streaming companies
   *
   * Memory-efficient way to process large numbers of companies.
   * Automatically fetches new pages as needed.
   *
   * @yields Company objects one at a time
   *
   * @example
   * ```typescript
   * for await (const company of nfe.companies.listIterator()) {
   *   console.log(company.name);
   * }
   * ```
   */
  async *listIterator(): AsyncIterableIterator<Company> {
    let pageIndex = 1; // pagination is 1-based; the API rejects pageIndex 0
    let hasMore = true;

    while (hasMore) {
      const page = await this.list({ pageCount: AUTO_PAGINATION_PAGE_SIZE, pageIndex });
      const pageData = Array.isArray(page) ? page : (page.data || []);

      for (const company of pageData) {
        yield company;
      }

      hasMore = pageData.length === AUTO_PAGINATION_PAGE_SIZE;
      pageIndex++;
    }
  }

  /**
   * Retrieve a specific company by ID
   *
   * @param companyId - Company ID to retrieve
   * @returns The company data
   * @throws {NotFoundError} If company doesn't exist
   * @throws {AuthenticationError} If API key is invalid
   *
   * @example
   * ```typescript
   * const company = await nfe.companies.retrieve('company-123');
   * console.log(company.name);
   * ```
   */
  async retrieve(companyId: string): Promise<Company> {
    const path = `/companies/${companyId}`;
    const response = await this.http.get<{ companies: Company }>(path);

    // API returns wrapped object: { companies: {...} }
    return response.data.companies;
  }

  /**
   * Update a company
   *
   * **This is a PUT (full replacement), NOT a partial update.** The API
   * requires the complete object (`name`, `federalTaxNumber`, `taxRegime`,
   * `address`, ...) on every call; omitted fields are reset/replaced, not
   * kept. Sending only the fields you want to change either fails with a
   * 400 or silently wipes the rest. Always read-modify-write.
   *
   * For the strict wire shape, see {@link UpdateCompanyResourceItem}
   * (exported from the package root). The loose `Partial<Company>`
   * signature is kept for backwards compatibility only.
   *
   * @param companyId - Company ID to update
   * @param data - The COMPLETE company data (full replacement)
   * @returns The updated company
   * @throws {ValidationError} If update data is invalid
   * @throws {NotFoundError} If company doesn't exist
   *
   * @example
   * ```typescript
   * // Read-modify-write: fetch the current object, change it, send it whole
   * const current = await nfe.companies.retrieve('company-123');
   * const updated = await nfe.companies.update('company-123', {
   *   ...current,
   *   tradeName: 'Novo Nome Fantasia',
   * });
   * ```
   */
  async update(companyId: string, data: Partial<Company>): Promise<Company> {
    // Validate update data
    validateCompanyData(data);

    const path = `/companies/${companyId}`;
    const response = await this.http.put<{ companies: Company }>(path, data);

    // API returns wrapped object: { companies: {...} }
    return response.data.companies;
  }

  /**
   * Delete a company (named 'remove' to avoid JS keyword conflict)
   *
   * @param companyId - Company ID to delete
   * @returns Deletion confirmation with company ID
   * @throws {NotFoundError} If company doesn't exist
   * @throws {ConflictError} If company has dependent resources
   *
   * @example
   * ```typescript
   * const result = await nfe.companies.remove('company-123');
   * console.log(`Deleted: ${result.deleted}`); // true
   * ```
   */
  async remove(companyId: string): Promise<{ deleted: boolean; id: string }> {
    const path = `/companies/${companyId}`;
    const response = await this.http.delete<{ deleted: boolean; id: string }>(path);

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Certificate Management
  // --------------------------------------------------------------------------

  /**
   * Validate certificate before upload
   *
   * @param file - Certificate file buffer
   * @param password - Certificate password
   * @returns Validation result with metadata
   * @throws {ValidationError} If certificate format is not supported
   *
   * @example
   * ```typescript
   * const validation = await nfe.companies.validateCertificate(
   *   certificateBuffer,
   *   'password123'
   * );
   *
   * if (validation.valid) {
   *   console.log('Certificate expires:', validation.metadata?.validTo);
   * } else {
   *   console.error('Invalid certificate:', validation.error);
   * }
   * ```
   */
  async validateCertificate(
    file: Buffer,
    password: string
  ): Promise<{
    valid: boolean;
    metadata?: {
      subject: string;
      issuer: string;
      validFrom: Date;
      validTo: Date;
      serialNumber?: string;
    };
    error?: string;
  }> {
    return await CertificateValidator.validate(file, password);
  }

  /**
   * Upload digital certificate for a company
   * Automatically validates certificate before upload
   *
   * @param companyId - Company ID
   * @param certificateData - Certificate data
   * @returns Upload result
   * @throws {ValidationError} If certificate is invalid or password is wrong
   * @throws {NotFoundError} If company doesn't exist
   *
   * @example
   * ```typescript
   * import { readFileSync } from 'fs';
   *
   * const certificateBuffer = readFileSync('certificate.pfx');
   *
   * const result = await nfe.companies.uploadCertificate('company-123', {
   *   file: certificateBuffer,
   *   password: 'cert-password',
   *   filename: 'certificate.pfx'
   * });
   *
   * console.log(result.message);
   * ```
   */
  async uploadCertificate(
    companyId: string,
    certificateData: {
      /** Certificate file (Buffer or Blob) */
      file: any;
      /** Certificate password */
      password: string;
      /** Optional filename (should be .pfx or .p12) */
      filename?: string;
    }
  ): Promise<{ uploaded: boolean; message?: string }> {
    // Validate filename format if provided
    if (certificateData.filename && !CertificateValidator.isSupportedFormat(certificateData.filename)) {
      throw new ValidationError(
        'Unsupported certificate format. Only .pfx and .p12 files are supported.'
      );
    }

    // Pre-validate certificate if it's a Buffer
    if (Buffer.isBuffer(certificateData.file)) {
      const validation = await CertificateValidator.validate(
        certificateData.file,
        certificateData.password
      );

      if (!validation.valid) {
        throw new ValidationError(
          `Certificate validation failed: ${validation.error}`
        );
      }
    }

    const path = `/companies/${companyId}/certificate`;

    // Create FormData for file upload
    const formData = this.createFormData();

    // Field name MUST be `file`: the API binds this multipart field and rejects
    // anything else with 400 `{"errors":{"file":["The File field is required."]}}`.
    // Verified live on 2026-09-01 — the previous name (`certificate`) meant this
    // method could never succeed. See tests/fixtures/live-contracts/certificate-upload-field.json.
    if (certificateData.filename) {
      formData.append('file', certificateData.file, certificateData.filename);
    } else {
      formData.append('file', certificateData.file);
    }

    // Add password
    formData.append('password', certificateData.password);

    const response = await this.http.post<{ uploaded: boolean; message?: string }>(
      path,
      formData
    );

    return response.data;
  }

  /**
   * Get certificate status for a company
   * Includes expiration calculation and warnings
   *
   * @param companyId - Company ID
   * @returns Certificate status with expiration info
   * @throws {NotFoundError} If company doesn't exist
   *
   * @remarks
   * `GET /v1/companies/{id}/certificate` responde `{ certificates: [...] }`, com
   * `validUntil` e `status` em cada item — NÃO `{hasCertificate, expiresOn, isValid}`,
   * que era o que este método lia antes de 2026-09-02 (e por isso devolvia
   * `undefined` em tudo, silenciosamente). Empresa sem certificado responde
   * **200 com `certificates: []`**, não 404.
   *
   * O campo de vencimento na superfície do SDK se chama `expiresOn` — o mesmo nome
   * que a API usa quando o certificado vem embutido no item da listagem de empresas
   * ({@link CompanyCertificateV1}). No endpoint de certificado ele se chama
   * `validUntil`; a normalização acontece aqui.
   *
   * Quando há mais de um certificado, o resumo descreve o preferido: um com
   * `status: 'Active'` e, entre os ativos, o de vencimento mais distante. Se nenhum
   * for ativo, o de vencimento mais distante entre todos. Isso é convenção do SDK,
   * não contrato da API — use `certificates` para decidir de outro jeito.
   *
   * @example
   * ```typescript
   * const status = await nfe.companies.getCertificateStatus('company-123');
   *
   * if (status.hasCertificate) {
   *   console.log('Certificate expires:', status.expiresOn);
   *   console.log('Days until expiration:', status.daysUntilExpiration);
   *
   *   if (status.isExpiringSoon) {
   *     console.warn('Certificate is expiring soon!');
   *   }
   *
   *   // Dado que o resumo não expõe: thumbprint, subject, providerType...
   *   console.log(status.certificates[0]?.thumbprint);
   * }
   * ```
   */
  async getCertificateStatus(companyId: string): Promise<CertificateStatusSummary> {
    const path = `/companies/${companyId}/certificate`;
    const response = await this.http.get<CertificatesMetadataResource>(path);

    const certificates = response.data?.certificates ?? [];
    return summarizeCertificates(certificates);
  }

  /**
   * Replace existing certificate (convenience method)
   * Uploads a new certificate, replacing the existing one
   *
   * @param companyId - Company ID
   * @param certificateData - New certificate data
   * @returns Upload result
   * @throws {ValidationError} If certificate is invalid
   * @throws {NotFoundError} If company doesn't exist
   *
   * @example
   * ```typescript
   * const result = await nfe.companies.replaceCertificate('company-123', {
   *   file: newCertificateBuffer,
   *   password: 'new-password',
   *   filename: 'new-certificate.pfx'
   * });
   * ```
   */
  async replaceCertificate(
    companyId: string,
    certificateData: {
      file: any;
      password: string;
      filename?: string;
    }
  ): Promise<{ uploaded: boolean; message?: string }> {
    // Same as uploadCertificate - API handles replacement
    return await this.uploadCertificate(companyId, certificateData);
  }

  /**
   * Check if certificate is expiring soon for a company
   *
   * @param companyId - Company ID
   * @param thresholdDays - Days threshold (default: 30)
   * @returns Warning object if expiring soon, null otherwise
   * @throws {NotFoundError} If company doesn't exist
   *
   * @example
   * ```typescript
   * const warning = await nfe.companies.checkCertificateExpiration('company-123', 30);
   *
   * if (warning) {
   *   console.warn(`Certificate expiring in ${warning.daysRemaining} days!`);
   *   console.log('Expiration date:', warning.expiresOn);
   * }
   * ```
   */
  async checkCertificateExpiration(
    companyId: string,
    thresholdDays: number = 30
  ): Promise<{
    isExpiring: true;
    daysRemaining: number;
    expiresOn: Date;
  } | null> {
    const status = await this.getCertificateStatus(companyId);

    if (!status.hasCertificate || !status.expiresOn) {
      return null;
    }

    const expirationDate = new Date(status.expiresOn);
    const daysRemaining = CertificateValidator.getDaysUntilExpiration(expirationDate);

    // Check if expiring within threshold
    if (daysRemaining >= 0 && daysRemaining < thresholdDays) {
      return {
        isExpiring: true,
        daysRemaining,
        expiresOn: expirationDate
      };
    }

    return null;
  }

  // --------------------------------------------------------------------------
  // Search & Helper Methods
  // --------------------------------------------------------------------------

  /**
   * Find company by federal tax number (CNPJ or CPF)
   *
   * @param taxNumber - Federal tax number (11 digits for CPF, 14 for CNPJ)
   * @returns Company if found, null otherwise
   *
   * @example
   * ```typescript
   * const company = await nfe.companies.findByTaxNumber(12345678901234);
   *
   * if (company) {
   *   console.log('Found:', company.name);
   * } else {
   *   console.log('Company not found');
   * }
   * ```
   */
  async findByTaxNumber(taxNumber: number): Promise<Company | null> {
    // Validate tax number format
    const length = taxNumber.toString().length;
    if (length !== 11 && length !== 14) {
      throw new ValidationError('Tax number must be 11 digits (CPF) or 14 digits (CNPJ)');
    }

    const companies = await this.listAll();

    const found = companies.find((company: Company) =>
      company.federalTaxNumber === taxNumber
    );

    return found || null;
  }

  /**
   * Find company by name (case-insensitive partial match)
   *
   * @param name - Company name or part of it
   * @returns Array of matching companies
   *
   * @example
   * ```typescript
   * const companies = await nfe.companies.findByName('Acme');
   *
   * companies.forEach(company => {
   *   console.log('Match:', company.name);
   * });
   * ```
   */
  async findByName(name: string): Promise<Company[]> {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Search name cannot be empty');
    }

    const companies = await this.listAll();
    const searchTerm = name.toLowerCase().trim();

    return companies.filter((company: Company) =>
      company.name?.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get companies with active certificates
   *
   * @returns Array of companies that have valid certificates
   *
   * @example
   * ```typescript
   * const companiesWithCerts = await nfe.companies.getCompaniesWithCertificates();
   *
   * console.log(`Found ${companiesWithCerts.length} companies with certificates`);
   * ```
   */
  async getCompaniesWithCertificates(): Promise<Company[]> {
    const companies = await this.listAll();

    // Sem requisição por empresa: `GET /v1/companies` já devolve `certificate` em
    // cada item. A versão anterior chamava getCertificateStatus() em série sobre a
    // conta inteira — numa conta com centenas de empresas, centenas de idas à rede
    // por chamada.
    return companies.filter(company => readListedCertificate(company)?.status === 'Active');
  }

  /**
   * Get companies with expiring certificates
   *
   * @param thresholdDays - Days threshold (default: 30)
   * @returns Array of companies with expiring certificates
   *
   * @example
   * ```typescript
   * const expiring = await nfe.companies.getCompaniesWithExpiringCertificates(30);
   *
   * expiring.forEach(company => {
   *   console.log(`${company.name} certificate expiring soon`);
   * });
   * ```
   */
  async getCompaniesWithExpiringCertificates(thresholdDays: number = 30): Promise<Company[]> {
    const companies = await this.listAll();

    // Mesmo motivo de getCompaniesWithCertificates: o vencimento já vem na listagem,
    // no campo `expiresOn` do certificado embutido.
    return companies.filter(company => {
      const expiresOn = readListedCertificate(company)?.expiresOn;
      if (!expiresOn) return false;

      const daysRemaining = CertificateValidator.getDaysUntilExpiration(new Date(expiresOn));
      return daysRemaining >= 0 && daysRemaining < thresholdDays;
    });
  }

  // --------------------------------------------------------------------------
  // Private Helper Methods
  // --------------------------------------------------------------------------

  private createFormData(): any {
    if (typeof FormData !== 'undefined') {
      return new FormData();
    } else {
      // Fallback for environments without FormData
      throw new Error('FormData is not available in this environment');
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createCompaniesResource(http: HttpClient): CompaniesResource {
  return new CompaniesResource(http);
}
