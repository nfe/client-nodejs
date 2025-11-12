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
   */
  async create(data: Omit<Company, 'id' | 'createdOn' | 'modifiedOn'>): Promise<Company> {
    const path = '/companies';
    const response = await this.http.post<Company>(path, data);
    
    return response.data;
  }

  /**
   * List companies
   */
  async list(options: PaginationOptions = {}): Promise<ListResponse<Company>> {
    const path = '/companies';
    const response = await this.http.get<ListResponse<Company>>(path, options);
    
    return response.data;
  }

  /**
   * Retrieve a specific company
   */
  async retrieve(companyId: string): Promise<Company> {
    const path = `/companies/${companyId}`;
    const response = await this.http.get<Company>(path);
    
    return response.data;
  }

  /**
   * Update a company
   */
  async update(companyId: string, data: Partial<Company>): Promise<Company> {
    const path = `/companies/${companyId}`;
    const response = await this.http.put<Company>(path, data);
    
    return response.data;
  }

  /**
   * Delete a company (named 'remove' to avoid JS keyword conflict)
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
   * Upload digital certificate for a company
   * Handles FormData for file upload
   */
  async uploadCertificate(
    companyId: string, 
    certificateData: {
      /** Certificate file (Buffer or Blob) */
      file: any;
      /** Certificate password */
      password: string;
      /** Optional filename */
      filename?: string;
    }
  ): Promise<{ uploaded: boolean; message?: string }> {
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
   */
  async getCertificateStatus(companyId: string): Promise<{
    hasCertificate: boolean;
    expiresOn?: string;
    isValid?: boolean;
    details?: any;
  }> {
    const path = `/companies/${companyId}/certificate`;
    const response = await this.http.get<{
      hasCertificate: boolean;
      expiresOn?: string;
      isValid?: boolean;
      details?: any;
    }>(path);
    
    return response.data;
  }

  // --------------------------------------------------------------------------
  // High-level Convenience Methods
  // --------------------------------------------------------------------------

  /**
   * Find company by CNPJ/CPF
   */
  async findByTaxNumber(taxNumber: number): Promise<Company | null> {
    const companies = await this.list({ pageCount: 100 }); // Get reasonable batch
    
    return companies.data.find(company => 
      company.federalTaxNumber === taxNumber
    ) || null;
  }

  /**
   * Get companies with active certificates
   */
  async getCompaniesWithCertificates(): Promise<Company[]> {
    const companies = await this.list({ pageCount: 100 });
    
    const companiesWithCerts: Company[] = [];
    
    // Check certificate status for each company
    for (const company of companies.data) {
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
   * Bulk create companies
   */
  async createBatch(
    companies: Array<Omit<Company, 'id' | 'createdOn' | 'modifiedOn'>>,
    options: { 
      maxConcurrent?: number;
      continueOnError?: boolean;
    } = {}
  ): Promise<Array<Company | { error: string; data: any }>> {
    const { maxConcurrent = 3, continueOnError = true } = options;
    
    const results: Array<Company | { error: string; data: any }> = [];
    
    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < companies.length; i += maxConcurrent) {
      const batch = companies.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (companyData) => {
        try {
          return await this.create(companyData);
        } catch (error) {
          if (continueOnError) {
            return {
              error: error instanceof Error ? error.message : 'Unknown error',
              data: companyData
            };
          } else {
            throw error;
          }
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
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