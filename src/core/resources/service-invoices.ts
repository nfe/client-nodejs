/**
 * NFE.io SDK v3 - Service Invoices Resource
 *
 * Handles service invoice operations (NFS-e)
 * This is the core functionality of NFE.io API
 */

import type {
  ServiceInvoice,
  ServiceInvoiceData,
  ListResponse,
  PaginationOptions,
  AsyncResponse
} from '../types.js';
import type { HttpClient } from '../http/client.js';
import { InvoiceProcessingError } from '../errors/index.js';

// ============================================================================
// Service Invoices Resource
// ============================================================================

export class ServiceInvoicesResource {
  constructor(private readonly http: HttpClient) {}

  // --------------------------------------------------------------------------
  // Core CRUD Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new service invoice
   * Returns 202 + location for async processing (NFE.io pattern)
   */
  async create(
    companyId: string,
    data: ServiceInvoiceData
  ): Promise<ServiceInvoice | AsyncResponse> {
    const path = `/companies/${companyId}/serviceinvoices`;
    const response = await this.http.post<ServiceInvoice | AsyncResponse>(path, data);

    return response.data;
  }

  /**
   * List service invoices for a company
   */
  async list(
    companyId: string,
    options: PaginationOptions = {}
  ): Promise<ListResponse<ServiceInvoice>> {
    const path = `/companies/${companyId}/serviceinvoices`;
    const response = await this.http.get<ListResponse<ServiceInvoice>>(path, options);

    return response.data;
  }

  /**
   * Retrieve a specific service invoice
   */
  async retrieve(companyId: string, invoiceId: string): Promise<ServiceInvoice> {
    const path = `/companies/${companyId}/serviceinvoices/${invoiceId}`;
    const response = await this.http.get<ServiceInvoice>(path);

    return response.data;
  }

  /**
   * Cancel a service invoice
   */
  async cancel(companyId: string, invoiceId: string): Promise<ServiceInvoice> {
    const path = `/companies/${companyId}/serviceinvoices/${invoiceId}`;
    const response = await this.http.delete<ServiceInvoice>(path);

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Email Operations
  // --------------------------------------------------------------------------

  /**
   * Send invoice via email
   */
  async sendEmail(companyId: string, invoiceId: string): Promise<{ sent: boolean; message?: string }> {
    const path = `/companies/${companyId}/serviceinvoices/${invoiceId}/sendemail`;
    const response = await this.http.put<{ sent: boolean; message?: string }>(path);

    return response.data;
  }

  // --------------------------------------------------------------------------
  // File Downloads
  // --------------------------------------------------------------------------

  /**
   * Download invoice PDF
   */
  async downloadPdf(companyId: string, invoiceId?: string): Promise<any> {
    let path: string;

    if (invoiceId) {
      path = `/companies/${companyId}/serviceinvoices/${invoiceId}/pdf`;
    } else {
      // Bulk download for company
      path = `/companies/${companyId}/serviceinvoices/pdf`;
    }

    const response = await this.http.get<any>(path);
    return response.data;
  }

  /**
   * Download invoice XML
   */
  async downloadXml(companyId: string, invoiceId?: string): Promise<any> {
    let path: string;

    if (invoiceId) {
      path = `/companies/${companyId}/serviceinvoices/${invoiceId}/xml`;
    } else {
      // Bulk download for company
      path = `/companies/${companyId}/serviceinvoices/xml`;
    }

    const response = await this.http.get<any>(path);
    return response.data;
  }

  // --------------------------------------------------------------------------
  // High-level Convenience Methods
  // --------------------------------------------------------------------------

  /**
   * Create invoice and wait for completion (handles async processing)
   */
  async createAndWait(
    companyId: string,
    data: ServiceInvoiceData,
    options: {
      maxAttempts?: number;
      intervalMs?: number;
      timeoutMs?: number
    } = {}
  ): Promise<ServiceInvoice> {
    const { maxAttempts = 30, intervalMs = 2000, timeoutMs = 60000 } = options;

    // Create invoice
    const createResult = await this.create(companyId, data);

    // If synchronous response (unusual for NFE.io), return immediately
    if ('id' in createResult && createResult.id) {
      return createResult as ServiceInvoice;
    }

    // Handle async response (202 + location)
    const asyncResult = createResult as AsyncResponse;
    if (asyncResult.code !== 202 || !asyncResult.location) {
      throw new InvoiceProcessingError(
        'Unexpected response from invoice creation',
        createResult
      );
    }

    // Poll for completion using the injected polling logic
    return this.pollInvoiceCompletion(asyncResult.location, {
      maxAttempts,
      intervalMs,
      timeoutMs,
    });
  }

  /**
   * Get invoice status (high-level wrapper)
   */
  async getStatus(companyId: string, invoiceId: string): Promise<{
    status: string;
    invoice: ServiceInvoice;
    isComplete: boolean;
    isFailed: boolean;
  }> {
    const invoice = await this.retrieve(companyId, invoiceId);
    const status = invoice.flowStatus ?? 'unknown';

    return {
      status,
      invoice,
      isComplete: ['Issued'].includes(status),
      isFailed: ['CancelFailed', 'IssueFailed'].includes(status),
    };
  }

  /**
   * Bulk operations: Create multiple invoices
   */
  async createBatch(
    companyId: string,
    invoices: ServiceInvoiceData[],
    options: {
      waitForCompletion?: boolean;
      maxConcurrent?: number;
    } = {}
  ): Promise<Array<ServiceInvoice | AsyncResponse>> {
    const { waitForCompletion = false, maxConcurrent = 5 } = options;

    // Process in batches to avoid overwhelming the API
    const results: Array<ServiceInvoice | AsyncResponse> = [];

    for (let i = 0; i < invoices.length; i += maxConcurrent) {
      const batch = invoices.slice(i, i + maxConcurrent);

      const batchPromises = batch.map(async (invoiceData) => {
        if (waitForCompletion) {
          return this.createAndWait(companyId, invoiceData);
        } else {
          return this.create(companyId, invoiceData);
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

  private async pollInvoiceCompletion(
    locationUrl: string,
    options: { maxAttempts: number; intervalMs: number; timeoutMs: number }
  ): Promise<ServiceInvoice> {
    const { maxAttempts, intervalMs, timeoutMs } = options;
    const startTime = Date.now();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new InvoiceProcessingError(
          `Invoice processing timeout after ${timeoutMs}ms`,
          { locationUrl, attempt, timeoutMs }
        );
      }

      // Wait before polling (except first attempt)
      if (attempt > 0) {
        await this.sleep(intervalMs);
      }

      try {
        // Extract path from location URL
        const path = this.extractPathFromLocationUrl(locationUrl);
        const response = await this.http.get<ServiceInvoice>(path);
        const invoice = response.data;

        // Check if processing is complete
        if (this.isInvoiceComplete(invoice)) {
          return invoice;
        }

        // Check if processing failed
        if (this.isInvoiceFailed(invoice)) {
          throw new InvoiceProcessingError(
            `Invoice processing failed: ${invoice.status}`,
            invoice
          );
        }

        // Continue polling

      } catch (error) {
        // If it's the last attempt, throw the error
        if (attempt === maxAttempts - 1) {
          throw new InvoiceProcessingError(
            'Failed to poll invoice completion',
            { error, locationUrl, attempt }
          );
        }

        // For other attempts, continue (might be temporary issue)
      }
    }

    throw new InvoiceProcessingError(
      `Invoice processing timeout after ${maxAttempts} polling attempts`,
      { locationUrl, maxAttempts, intervalMs }
    );
  }

  private extractPathFromLocationUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      // If URL parsing fails, assume it's already a path
      return url.startsWith('/') ? url : `/${url}`;
    }
  }

  private isInvoiceComplete(invoice: ServiceInvoice): boolean {
    const status = invoice.flowStatus;
    return status === 'Issued';
  }

  private isInvoiceFailed(invoice: ServiceInvoice): boolean {
    const status = invoice.flowStatus;
    return status === 'CancelFailed' || status === 'IssueFailed';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createServiceInvoicesResource(http: HttpClient): ServiceInvoicesResource {
  return new ServiceInvoicesResource(http);
}
