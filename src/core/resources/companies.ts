/**
 * NFE.io SDK v3 - Companies Resource
 *
 * Handles company operations and certificate management
 */

import type {
  Company,
  ListResponse,
  PaginationOptions
} from '../types.js';
import type { HttpClient } from '../http/client.js';
import { ValidationError } from '../errors/index.js';
import { CertificateValidator } from '../utils/certificate-validator.js';

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate CNPJ format (14 digits)
 */
function validateCNPJ(cnpj: number): boolean {
  const cnpjStr = cnpj.toString();
  if (cnpjStr.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpjStr)) return false; // All same digits
  return true; // Simplified validation - full check digit validation could be added
}

/**
 * Validate CPF format (11 digits)
 */
function validateCPF(cpf: number): boolean {
  const cpfStr = cpf.toString();
  if (cpfStr.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfStr)) return false; // All same digits
  return true; // Simplified validation - full check digit validation could be added
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
  constructor(private readonly http: HttpClient) {}

  // --------------------------------------------------------------------------
  // Core CRUD Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new company
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
   *   federalTaxNumber: 12345678901234,
   *   email: 'contact@acme.com'
   * });
   * ```
   */
  async create(data: Omit<Company, 'id' | 'createdOn' | 'modifiedOn'>): Promise<Company> {
    // Validate data before API call
    validateCompanyData(data);

    const path = '/companies';
    const response = await this.http.post<Company>(path, data);

    return response.data;
  }

  /**
   * List companies
   *
   * @param options - Pagination options (pageCount, pageIndex)
   * @returns List response with companies and pagination info
   *
   * @example
   * ```typescript
   * const page1 = await nfe.companies.list({ pageCount: 20, pageIndex: 0 });
   * const page2 = await nfe.companies.list({ pageCount: 20, pageIndex: 1 });
   * ```
   */
  async list(options: PaginationOptions = {}): Promise<ListResponse<Company>> {
    const path = '/companies';
    const response = await this.http.get<ListResponse<Company>>(path, options);

    return response.data;
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
    let pageIndex = 0;
    let hasMore = true;

    while (hasMore) {
      const page = await this.list({ pageCount: 100, pageIndex });
      const pageData = Array.isArray(page) ? page : (page.data || []);
      companies.push(...pageData);

      // Check if there are more pages
      hasMore = pageData.length === 100;
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
    let pageIndex = 0;
    let hasMore = true;

    while (hasMore) {
      const page = await this.list({ pageCount: 100, pageIndex });
      const pageData = Array.isArray(page) ? page : (page.data || []);

      for (const company of pageData) {
        yield company;
      }

      hasMore = pageData.length === 100;
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
    const response = await this.http.get<Company>(path);

    return response.data;
  }

  /**
   * Update a company
   *
   * @param companyId - Company ID to update
   * @param data - Partial company data (only fields to update)
   * @returns The updated company
   * @throws {ValidationError} If update data is invalid
   * @throws {NotFoundError} If company doesn't exist
   *
   * @example
   * ```typescript
   * const updated = await nfe.companies.update('company-123', {
   *   name: 'New Name',
   *   email: 'new@example.com'
   * });
   * ```
   */
  async update(companyId: string, data: Partial<Company>): Promise<Company> {
    // Validate update data
    validateCompanyData(data);

    const path = `/companies/${companyId}`;
    const response = await this.http.put<Company>(path, data);

    return response.data;
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

    // Add certificate file
    if (certificateData.filename) {
      formData.append('certificate', certificateData.file, certificateData.filename);
    } else {
      formData.append('certificate', certificateData.file);
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
   * }
   * ```
   */
  async getCertificateStatus(companyId: string): Promise<{
    hasCertificate: boolean;
    expiresOn?: string;
    isValid?: boolean;
    daysUntilExpiration?: number;
    isExpiringSoon?: boolean;
    details?: any;
  }> {
    const path = `/companies/${companyId}/certificate`;
    const response = await this.http.get<{
      hasCertificate: boolean;
      expiresOn?: string;
      isValid?: boolean;
      details?: any;
    }>(path);

    const status = response.data;

    // Calculate days until expiration if available
    if (status.hasCertificate && status.expiresOn) {
      const expirationDate = new Date(status.expiresOn);
      const daysUntilExpiration = CertificateValidator.getDaysUntilExpiration(expirationDate);
      const isExpiringSoon = CertificateValidator.isExpiringSoon(expirationDate);

      return {
        ...status,
        daysUntilExpiration,
        isExpiringSoon
      };
    }

    return status;
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

    const companiesWithCerts: Company[] = [];

    // Check certificate status for each company
    for (const company of companies) {
      try {
        const certStatus = await this.getCertificateStatus(company.id!);
        if (certStatus.hasCertificate && certStatus.isValid) {
          companiesWithCerts.push(company);
        }
      } catch {
        // Skip companies where we can't check certificate status
        continue;
      }
    }

    return companiesWithCerts;
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

    const expiringCompanies: Company[] = [];

    for (const company of companies) {
      try {
        const warning = await this.checkCertificateExpiration(company.id!, thresholdDays);
        if (warning) {
          expiringCompanies.push(company);
        }
      } catch {
        // Skip companies where we can't check certificate
        continue;
      }
    }

    return expiringCompanies;
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
