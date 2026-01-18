/**
 * NFE.io SDK v3 - Service Invoices Resource
 *
 * Handles service invoice operations (NFS-e)
 * This is the core functionality of NFE.io API
 */

import type {
  ServiceInvoiceData,
  CreateServiceInvoiceData,
  ListServiceInvoicesOptions,
  ServiceInvoiceListResponse,
  ServiceInvoiceAsyncResponse,
  PollingOptions,
  FlowStatus,
  SendEmailResponse,
} from '../types.js';
import type { HttpClient } from '../http/client.js';
import { InvoiceProcessingError, NotFoundError } from '../errors/index.js';
import { poll } from '../utils/polling.js';
import { isTerminalFlowStatus } from '../types.js';

// ============================================================================
// Types
// ============================================================================

/** Discriminated union for create() response */
export type CreateInvoiceResponse =
  | { status: 'immediate'; invoice: ServiceInvoiceData }
  | { status: 'async'; response: ServiceInvoiceAsyncResponse };

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
   *
   * NFE.io typically returns 202 (async processing) with a Location header.
   * The invoice ID can be extracted from the location for polling.
   *
   * @param companyId - Company ID (GUID)
   * @param data - Invoice data following NFE.io schema
   * @returns Discriminated union: immediate (201) or async (202) response
   *
   * @example
   * ```typescript
   * const result = await nfe.serviceInvoices.create(companyId, {
   *   borrower: {
   *     federalTaxNumber: 12345678901234,
   *     name: 'Client Name',
   *     email: 'client@example.com'
   *   },
   *   cityServiceCode: '01234',
   *   federalServiceCode: '01.02',
   *   description: 'Service description',
   *   servicesAmount: 1000.00
   * });
   *
   * if (result.status === 'async') {
   *   console.log('Invoice being processed:', result.response.invoiceId);
   *   // Use createAndWait() or poll manually
   * } else {
   *   console.log('Invoice issued immediately:', result.invoice.id);
   * }
   * ```
   */
  async create(
    companyId: string,
    data: CreateServiceInvoiceData
  ): Promise<CreateInvoiceResponse> {
    const path = `/companies/${companyId}/serviceinvoices`;
    const response = await this.http.post<ServiceInvoiceData>(path, data);

    // Check for async response (202)
    if (response.status === 202) {
      const location = response.headers['location'] || response.headers['Location'];

      if (!location) {
        throw new InvoiceProcessingError(
          'Async response (202) received but no Location header found',
          { status: 202, headers: response.headers }
        );
      }

      // Extract invoice ID from location
      // Location format: /v1/companies/{companyId}/serviceinvoices/{invoiceId}
      const invoiceId = this.extractInvoiceIdFromLocation(location);

      return {
        status: 'async',
        response: {
          code: 202,
          status: 'pending',
          location,
          invoiceId,
        },
      };
    }

    // Immediate success (201)
    return {
      status: 'immediate',
      invoice: response.data,
    };
  }

  /**
   * List service invoices for a company
   *
   * Supports pagination and date filtering.
   *
   * @param companyId - Company ID (GUID)
   * @param options - Pagination and filtering options
   * @returns List of invoices with pagination metadata
   *
   * @example
   * ```typescript
   * // List recent invoices
   * const result = await nfe.serviceInvoices.list(companyId, {
   *   pageIndex: 0,
   *   pageCount: 20,
   *   issuedBegin: '2026-01-01',
   *   issuedEnd: '2026-01-31'
   * });
   *
   * console.log(`Found ${result.serviceInvoices?.length} invoices`);
   * ```
   */
  async list(
    companyId: string,
    options: ListServiceInvoicesOptions = {}
  ): Promise<ServiceInvoiceListResponse> {
    const path = `/companies/${companyId}/serviceinvoices`;
    const response = await this.http.get<ServiceInvoiceListResponse>(path, options as Record<string, unknown>);

    return response.data;
  }

  /**
   * Retrieve a specific service invoice by ID
   *
   * @param companyId - Company ID (GUID)
   * @param invoiceId - Invoice ID (GUID)
   * @returns Complete invoice data
   * @throws {NotFoundError} If invoice not found
   *
   * @example
   * ```typescript
   * const invoice = await nfe.serviceInvoices.retrieve(companyId, invoiceId);
   * console.log('Invoice status:', invoice.flowStatus);
   * ```
   */
  async retrieve(
    companyId: string,
    invoiceId: string
  ): Promise<ServiceInvoiceData> {
    const path = `/companies/${companyId}/serviceinvoices/${invoiceId}`;
    const response = await this.http.get<ServiceInvoiceData>(path);

    // The API should return the invoice directly
    if (!response.data) {
      throw new NotFoundError(
        `Invoice ${invoiceId} not found`,
        { companyId, invoiceId }
      );
    }

    return response.data;
  }

  /**
   * Cancel a service invoice
   *
   * Note: Cancellation may also be async (returns 202). Check response status.
   *
   * @param companyId - Company ID (GUID)
   * @param invoiceId - Invoice ID (GUID)
   * @returns Cancelled invoice data
   * @throws {InvoiceProcessingError} If invoice cannot be cancelled
   *
   * @example
   * ```typescript
   * const cancelled = await nfe.serviceInvoices.cancel(companyId, invoiceId);
   * console.log('Cancellation status:', cancelled.flowStatus);
   * ```
   */
  async cancel(
    companyId: string,
    invoiceId: string
  ): Promise<ServiceInvoiceData> {
    const path = `/companies/${companyId}/serviceinvoices/${invoiceId}`;
    const response = await this.http.delete<ServiceInvoiceData>(path);

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Email Operations
  // --------------------------------------------------------------------------

  /**
   * Send invoice via email to the borrower (client)
   *
   * @param companyId - Company ID (GUID)
   * @param invoiceId - Invoice ID (GUID)
   * @returns Email send result
   *
   * @example
   * ```typescript
   * const result = await nfe.serviceInvoices.sendEmail(companyId, invoiceId);
   * if (result.sent) {
   *   console.log('Email sent successfully');
   * }
   * ```
   */
  async sendEmail(
    companyId: string,
    invoiceId: string
  ): Promise<SendEmailResponse> {
    const path = `/companies/${companyId}/serviceinvoices/${invoiceId}/sendemail`;
    const response = await this.http.put<SendEmailResponse>(path);

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Async Processing Helper
  // --------------------------------------------------------------------------

  /**
   * Create invoice and wait for completion (handles async processing automatically)
   *
   * This method combines create() + polling to provide a synchronous-like experience.
   * It uses exponential backoff and respects timeout constraints.
   *
   * @param companyId - Company ID (GUID)
   * @param data - Invoice data
   * @param options - Polling configuration (timeout, delays, callbacks)
   * @returns Completed invoice (Issued status)
   * @throws {TimeoutError} If polling timeout exceeded
   * @throws {InvoiceProcessingError} If invoice processing failed
   *
   * @example
   * ```typescript
   * // Simple usage with defaults (2 min timeout)
   * const invoice = await nfe.serviceInvoices.createAndWait(companyId, data);
   * console.log('Invoice issued:', invoice.id);
   *
   * // Custom timeout and progress tracking
   * const invoice = await nfe.serviceInvoices.createAndWait(companyId, data, {
   *   timeout: 180000, // 3 minutes
   *   onPoll: (attempt, status) => {
   *     console.log(`Attempt ${attempt}: ${status}`);
   *   }
   * });
   * ```
   */
  async createAndWait(
    companyId: string,
    data: CreateServiceInvoiceData,
    options: PollingOptions = {}
  ): Promise<ServiceInvoiceData> {
    // Create invoice
    const createResult = await this.create(companyId, data);

    // If immediate success (201), return directly
    if (createResult.status === 'immediate') {
      return createResult.invoice;
    }

    // Handle async response (202) - poll until complete
    const { invoiceId } = createResult.response;

    // Build polling config
    const pollingConfig: import('../utils/polling.js').PollingOptions<ServiceInvoiceData> = {
      fn: async () => this.retrieve(companyId, invoiceId),
      isComplete: (invoice) => {
        const flowStatus = invoice.flowStatus as FlowStatus;
        return isTerminalFlowStatus(flowStatus);
      },
      timeout: options.timeout ?? 120000, // 2 minutes default
      initialDelay: options.initialDelay ?? 1000, // 1 second
      maxDelay: options.maxDelay ?? 10000, // 10 seconds
      backoffFactor: options.backoffFactor ?? 1.5,
    };

    // Add onPoll callback if provided
    if (options.onPoll) {
      pollingConfig.onPoll = (attempt, result) => {
        const flowStatus = result.flowStatus as FlowStatus;
        options.onPoll!(attempt, flowStatus);
      };
    }

    // Use polling utility from Phase 1
    const invoice = await poll<ServiceInvoiceData>(pollingConfig);

    // Check if processing failed
    const flowStatus = invoice.flowStatus as FlowStatus;
    if (flowStatus === 'IssueFailed' || flowStatus === 'CancelFailed') {
      throw new InvoiceProcessingError(
        `Invoice processing failed with status: ${flowStatus}`,
        {
          flowStatus,
          flowMessage: invoice.flowMessage,
          invoice,
        }
      );
    }

    return invoice;
  }

  // --------------------------------------------------------------------------
  // File Downloads
  // --------------------------------------------------------------------------

  /**
   * Download invoice PDF
   *
   * Downloads the PDF file for a service invoice. The invoice must be in a terminal state
   * (Issued, Cancelled) before the PDF is available.
   *
   * @param companyId - Company ID (GUID)
   * @param invoiceId - Invoice ID (GUID), or omit for bulk download
   * @returns PDF data as Buffer
   * @throws {NotFoundError} If the invoice or PDF is not found/not ready
   * @throws {AuthenticationError} If API key is invalid
   *
   * @example
   * ```typescript
   * // Download single invoice PDF
   * const pdf = await nfe.serviceInvoices.downloadPdf(companyId, invoiceId);
   * fs.writeFileSync('invoice.pdf', pdf);
   *
   * // Download all company invoices as ZIP
   * const zipPdf = await nfe.serviceInvoices.downloadPdf(companyId);
   * fs.writeFileSync('invoices.zip', zipPdf);
   * ```
   *
   * @remarks
   * - PDF is only available after invoice reaches terminal state (Issued/Cancelled)
   * - Returns 404 if PDF is not yet ready - use polling or check flowStatus first
   * - Bulk download returns ZIP file containing all PDFs for the company
   * - Large files may consume significant memory - consider streaming for production use
   */
  async downloadPdf(companyId: string, invoiceId?: string): Promise<Buffer> {
    let path: string;

    if (invoiceId) {
      path = `/companies/${companyId}/serviceinvoices/${invoiceId}/pdf`;
    } else {
      // Bulk download for company (returns ZIP)
      path = `/companies/${companyId}/serviceinvoices/pdf`;
    }

    const response = await this.http.get<Buffer>(
      path,
      undefined,
      { Accept: 'application/pdf' }
    );

    return response.data;
  }

  /**
   * Download invoice XML
   *
   * Downloads the XML file for a service invoice. The invoice must be in a terminal state
   * (Issued, Cancelled) before the XML is available.
   *
   * @param companyId - Company ID (GUID)
   * @param invoiceId - Invoice ID (GUID), or omit for bulk download
   * @returns XML data as Buffer
   * @throws {NotFoundError} If the invoice or XML is not found/not ready
   * @throws {AuthenticationError} If API key is invalid
   *
   * @example
   * ```typescript
   * // Download single invoice XML
   * const xml = await nfe.serviceInvoices.downloadXml(companyId, invoiceId);
   * fs.writeFileSync('invoice.xml', xml);
   * console.log(xml.toString('utf-8')); // View as string
   *
   * // Download all company invoices as ZIP
   * const zipXml = await nfe.serviceInvoices.downloadXml(companyId);
   * fs.writeFileSync('invoices-xml.zip', zipXml);
   * ```
   *
   * @remarks
   * - XML is only available after invoice reaches terminal state (Issued/Cancelled)
   * - Returns 404 if XML is not yet ready - use polling or check flowStatus first
   * - Bulk download returns ZIP file containing all XMLs for the company
   * - Buffer can be converted to string with `.toString('utf-8')` if needed
   */
  async downloadXml(companyId: string, invoiceId?: string): Promise<Buffer> {
    let path: string;

    if (invoiceId) {
      path = `/companies/${companyId}/serviceinvoices/${invoiceId}/xml`;
    } else {
      // Bulk download for company (returns ZIP)
      path = `/companies/${companyId}/serviceinvoices/xml`;
    }

    const response = await this.http.get<Buffer>(
      path,
      undefined,
      { Accept: 'application/xml' }
    );

    return response.data;
  }

  // --------------------------------------------------------------------------
  // High-level Convenience Methods
  // --------------------------------------------------------------------------

  /**
   * Get invoice status with detailed information
   *
   * @param companyId - Company ID (GUID)
   * @param invoiceId - Invoice ID (GUID)
   * @returns Status information with invoice data
   */
  async getStatus(companyId: string, invoiceId: string): Promise<{
    status: FlowStatus;
    invoice: ServiceInvoiceData;
    isComplete: boolean;
    isFailed: boolean;
  }> {
    const invoice = await this.retrieve(companyId, invoiceId);
    const status = (invoice.flowStatus as FlowStatus) ?? 'WaitingSend';

    return {
      status,
      invoice,
      isComplete: isTerminalFlowStatus(status),
      isFailed: ['CancelFailed', 'IssueFailed'].includes(status),
    };
  }

  /**
   * Bulk operations: Create multiple invoices
   *
   * @param companyId - Company ID (GUID)
   * @param invoices - Array of invoice data
   * @param options - Batch processing options
   * @returns Array of create responses
   */
  async createBatch(
    companyId: string,
    invoices: CreateServiceInvoiceData[],
    options: {
      waitForCompletion?: boolean;
      maxConcurrent?: number;
    } = {}
  ): Promise<Array<CreateInvoiceResponse | ServiceInvoiceData>> {
    const { waitForCompletion = false, maxConcurrent = 5 } = options;

    // Process in batches to avoid overwhelming the API
    const results: Array<CreateInvoiceResponse | ServiceInvoiceData> = [];

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

  /**
   * Extract invoice ID from Location header
   * Location format: /v1/companies/{companyId}/serviceinvoices/{invoiceId}
   */
  private extractInvoiceIdFromLocation(location: string): string {
    const match = location.match(/serviceinvoices\/([a-z0-9-]+)/i);

    if (!match || !match[1]) {
      throw new InvoiceProcessingError(
        'Could not extract invoice ID from Location header',
        { location }
      );
    }

    return match[1];
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createServiceInvoicesResource(http: HttpClient): ServiceInvoicesResource {
  return new ServiceInvoicesResource(http);
}
