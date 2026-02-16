/**
 * NFE.io SDK v3 - Product Invoices Resource (NF-e Issuance)
 *
 * Handles NF-e (Nota Fiscal Eletrônica de Produto) issuance operations via the v2 API.
 * Uses api.nfse.io host (same as transportation/inbound resources).
 */

import type { HttpClient } from '../http/client.js';
import type {
  NfeProductInvoiceIssueData,
  NfeProductInvoice,
  NfeProductInvoiceListOptions,
  NfeProductInvoiceListResponse,
  NfeProductInvoiceSubListOptions,
  NfeInvoiceItemsResponse,
  NfeProductInvoiceEventsResponse,
  NfeFileResource,
  NfeRequestCancellationResource,
  NfeDisablementData,
  NfeDisablementResource,
} from '../types.js';
import { ValidationError } from '../errors/index.js';

// ============================================================================
// Validation Helpers
// ============================================================================

function validateCompanyId(companyId: string): void {
  if (!companyId || companyId.trim() === '') {
    throw new ValidationError('Company ID is required');
  }
}

function validateInvoiceId(invoiceId: string): void {
  if (!invoiceId || invoiceId.trim() === '') {
    throw new ValidationError('Invoice ID is required');
  }
}

function validateStateTaxId(stateTaxId: string): void {
  if (!stateTaxId || stateTaxId.trim() === '') {
    throw new ValidationError('State tax ID is required');
  }
}

function buildQueryString(params: Record<string, string | number | boolean>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

// ============================================================================
// Product Invoices Resource
// ============================================================================

/**
 * Product Invoices (NF-e) API Resource
 *
 * @description
 * Provides full lifecycle management for NF-e (Nota Fiscal Eletronica de Produto)
 * product invoices -- issue, list, retrieve, cancel, send correction letters (CC-e),
 * disable invoice numbers, and download files (PDF/XML).
 *
 * All operations are scoped by company and use the api.nfse.io v2 API.
 *
 * **Important:** Issue, cancel, correction letter, and disablement operations are
 * asynchronous -- they return 202/204 indicating the request was enqueued.
 * Completion is notified via webhooks.
 *
 * **Prerequisites:**
 * - Company must be registered with a valid A1 digital certificate
 * - State tax registration (Inscricao Estadual) must be configured
 *
 * @example Issue a product invoice
 * \`\`\`typescript
 * const result = await nfe.productInvoices.create('company-id', {
 *   operationNature: 'Venda de mercadoria',
 *   operationType: 'Outgoing',
 *   buyer: { name: 'Empresa LTDA', federalTaxNumber: 12345678000190 },
 *   items: [{ code: 'PROD-001', description: 'Produto X', quantity: 1, unitAmount: 100 }],
 *   payment: [{ paymentDetail: [{ method: 'Cash', amount: 100 }] }],
 * });
 * \`\`\`
 */
export class ProductInvoicesResource {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  private basePath(companyId: string): string {
    return `/v2/companies/${companyId}/productinvoices`;
  }

  // --------------------------------------------------------------------------
  // Issue (Create)
  // --------------------------------------------------------------------------

  /**
   * Issue a product invoice (NF-e) by posting it to the processing queue.
   *
   * Processing is asynchronous -- a 202 response indicates the invoice was enqueued.
   * Monitor completion via webhooks.
   *
   * @param companyId - The company ID
   * @param data - Invoice issue data (buyer, items, payment, operationNature, etc.)
   * @returns The enqueued invoice data
   * @throws {ValidationError} If companyId is empty
   * @throws {BadRequestError} If invoice data is invalid
   */
  async create(
    companyId: string,
    data: NfeProductInvoiceIssueData,
  ): Promise<NfeProductInvoiceIssueData> {
    validateCompanyId(companyId);
    const response = await this.http.post<NfeProductInvoiceIssueData>(
      this.basePath(companyId),
      data,
    );
    return response.data;
  }

  /**
   * Issue a product invoice (NF-e) specifying a particular state tax registration.
   *
   * Processing is asynchronous -- a 202 response indicates the invoice was enqueued.
   *
   * @param companyId - The company ID
   * @param stateTaxId - The state tax registration ID (Inscricao Estadual)
   * @param data - Invoice issue data
   * @returns The enqueued invoice data
   * @throws {ValidationError} If companyId or stateTaxId is empty
   */
  async createWithStateTax(
    companyId: string,
    stateTaxId: string,
    data: NfeProductInvoiceIssueData,
  ): Promise<NfeProductInvoiceIssueData> {
    validateCompanyId(companyId);
    validateStateTaxId(stateTaxId);
    const response = await this.http.post<NfeProductInvoiceIssueData>(
      `/v2/companies/${companyId}/statetaxes/${stateTaxId}/productinvoices`,
      data,
    );
    return response.data;
  }

  // --------------------------------------------------------------------------
  // List & Retrieve
  // --------------------------------------------------------------------------

  /**
   * List product invoices (NF-e) for a company with cursor-based pagination.
   *
   * The environment option is required.
   *
   * @param companyId - The company ID
   * @param options - List options (environment required, pagination, ElasticSearch query)
   * @returns Paginated list of invoices
   * @throws {ValidationError} If companyId is empty or environment is missing
   */
  async list(
    companyId: string,
    options: NfeProductInvoiceListOptions,
  ): Promise<NfeProductInvoiceListResponse> {
    validateCompanyId(companyId);
    if (!options?.environment) {
      throw new ValidationError('Environment is required (Production or Test)');
    }
    const params: Record<string, unknown> = {
      environment: options.environment,
    };
    if (options.startingAfter !== undefined) params.startingAfter = options.startingAfter;
    if (options.endingBefore !== undefined) params.endingBefore = options.endingBefore;
    if (options.limit !== undefined) params.limit = options.limit;
    if (options.q !== undefined) params.q = options.q;

    const response = await this.http.get<NfeProductInvoiceListResponse>(
      this.basePath(companyId),
      params,
    );
    return response.data;
  }

  /**
   * Retrieve a single product invoice (NF-e) by ID.
   *
   * Returns full invoice details including authorization, buyer, totals,
   * transport, billing, payment, and last events.
   *
   * @param companyId - The company ID
   * @param invoiceId - The invoice ID
   * @returns Full invoice details
   * @throws {ValidationError} If companyId or invoiceId is empty
   * @throws {NotFoundError} If invoice does not exist
   */
  async retrieve(
    companyId: string,
    invoiceId: string,
  ): Promise<NfeProductInvoice> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<NfeProductInvoice>(
      `${this.basePath(companyId)}/${invoiceId}`,
    );
    return response.data;
  }

  // --------------------------------------------------------------------------
  // Cancel
  // --------------------------------------------------------------------------

  /**
   * Cancel a product invoice (NF-e) by enqueuing it for cancellation.
   *
   * Processing is asynchronous -- a 204 response indicates the request was enqueued.
   *
   * @param companyId - The company ID
   * @param invoiceId - The invoice ID to cancel
   * @param reason - Optional reason for cancellation
   * @returns Cancellation request details
   * @throws {ValidationError} If companyId or invoiceId is empty
   * @throws {NotFoundError} If invoice does not exist
   */
  async cancel(
    companyId: string,
    invoiceId: string,
    reason?: string,
  ): Promise<NfeRequestCancellationResource> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const params: Record<string, string> = {};
    if (reason !== undefined) params.reason = reason;
    const qs = buildQueryString(params);
    const response = await this.http.delete<NfeRequestCancellationResource>(
      `${this.basePath(companyId)}/${invoiceId}${qs}`,
    );
    return response.data;
  }

  // --------------------------------------------------------------------------
  // Items & Events
  // --------------------------------------------------------------------------

  /**
   * List items (products/services) for a specific invoice.
   *
   * @param companyId - The company ID
   * @param invoiceId - The invoice ID
   * @param options - Optional pagination (limit, startingAfter)
   * @returns Paginated list of invoice items
   * @throws {ValidationError} If companyId or invoiceId is empty
   * @throws {NotFoundError} If invoice does not exist
   */
  async listItems(
    companyId: string,
    invoiceId: string,
    options?: NfeProductInvoiceSubListOptions,
  ): Promise<NfeInvoiceItemsResponse> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const params: Record<string, unknown> = {};
    if (options?.limit !== undefined) params.limit = options.limit;
    if (options?.startingAfter !== undefined) params.startingAfter = options.startingAfter;
    const response = await this.http.get<NfeInvoiceItemsResponse>(
      `${this.basePath(companyId)}/${invoiceId}/items`,
      params,
    );
    return response.data;
  }

  /**
   * List fiscal events for a specific invoice.
   *
   * @param companyId - The company ID
   * @param invoiceId - The invoice ID
   * @param options - Optional pagination (limit, startingAfter)
   * @returns Paginated list of invoice events
   * @throws {ValidationError} If companyId or invoiceId is empty
   */
  async listEvents(
    companyId: string,
    invoiceId: string,
    options?: NfeProductInvoiceSubListOptions,
  ): Promise<NfeProductInvoiceEventsResponse> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const params: Record<string, unknown> = {};
    if (options?.limit !== undefined) params.limit = options.limit;
    if (options?.startingAfter !== undefined) params.startingAfter = options.startingAfter;
    const response = await this.http.get<NfeProductInvoiceEventsResponse>(
      `${this.basePath(companyId)}/${invoiceId}/events`,
      params,
    );
    return response.data;
  }

  // --------------------------------------------------------------------------
  // File Downloads (PDF / XML)
  // --------------------------------------------------------------------------

  /**
   * Get the URL for the DANFE PDF file of an invoice.
   *
   * @param companyId - The company ID
   * @param invoiceId - The invoice ID
   * @param force - If true, forces PDF regeneration regardless of FlowStatus
   * @returns File resource with URI to the PDF
   * @throws {ValidationError} If companyId or invoiceId is empty
   */
  async downloadPdf(
    companyId: string,
    invoiceId: string,
    force?: boolean,
  ): Promise<NfeFileResource> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const params: Record<string, unknown> = {};
    if (force !== undefined) params.force = force;
    const response = await this.http.get<NfeFileResource>(
      `${this.basePath(companyId)}/${invoiceId}/pdf`,
      params,
    );
    return response.data;
  }

  /**
   * Get the URL for the authorized NF-e XML file.
   *
   * @param companyId - The company ID
   * @param invoiceId - The invoice ID
   * @returns File resource with URI to the XML
   * @throws {ValidationError} If companyId or invoiceId is empty
   */
  async downloadXml(
    companyId: string,
    invoiceId: string,
  ): Promise<NfeFileResource> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<NfeFileResource>(
      `${this.basePath(companyId)}/${invoiceId}/xml`,
    );
    return response.data;
  }

  /**
   * Get the URL for the NF-e rejection XML file.
   *
   * Uses the /xml-rejection endpoint (canonical form).
   *
   * @param companyId - The company ID
   * @param invoiceId - The invoice ID
   * @returns File resource with URI to the rejection XML
   * @throws {ValidationError} If companyId or invoiceId is empty
   */
  async downloadRejectionXml(
    companyId: string,
    invoiceId: string,
  ): Promise<NfeFileResource> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<NfeFileResource>(
      `${this.basePath(companyId)}/${invoiceId}/xml-rejection`,
    );
    return response.data;
  }

  /**
   * Get the URL for the contingency authorization (EPEC) XML file.
   *
   * @param companyId - The company ID
   * @param invoiceId - The invoice ID
   * @returns File resource with URI to the EPEC XML
   * @throws {ValidationError} If companyId or invoiceId is empty
   */
  async downloadEpecXml(
    companyId: string,
    invoiceId: string,
  ): Promise<NfeFileResource> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<NfeFileResource>(
      `${this.basePath(companyId)}/${invoiceId}/xml-epec`,
    );
    return response.data;
  }

  // --------------------------------------------------------------------------
  // Correction Letter (CC-e)
  // --------------------------------------------------------------------------

  /**
   * Send a correction letter (Carta de Correcao - CC-e) for a product invoice.
   *
   * Processing is asynchronous. The reason text must contain between 15 and 1,000
   * characters without accents or special characters.
   *
   * @param companyId - The company ID
   * @param invoiceId - The invoice ID
   * @param reason - Correction reason (15-1,000 characters, no accents/special chars)
   * @returns Cancellation request resource with operation details
   * @throws {ValidationError} If reason is too short or too long
   */
  async sendCorrectionLetter(
    companyId: string,
    invoiceId: string,
    reason: string,
  ): Promise<NfeRequestCancellationResource> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    if (!reason || reason.length < 15) {
      throw new ValidationError(
        'Correction letter reason must contain at least 15 characters',
      );
    }
    if (reason.length > 1000) {
      throw new ValidationError(
        'Correction letter reason must contain at most 1,000 characters',
      );
    }
    const response = await this.http.put<NfeRequestCancellationResource>(
      `${this.basePath(companyId)}/${invoiceId}/correctionletter`,
      { reason },
    );
    return response.data;
  }

  /**
   * Get the URL for the CC-e DANFE PDF file.
   *
   * @param companyId - The company ID
   * @param invoiceId - The invoice ID
   * @returns File resource with URI to the correction letter PDF
   * @throws {ValidationError} If companyId or invoiceId is empty
   */
  async downloadCorrectionLetterPdf(
    companyId: string,
    invoiceId: string,
  ): Promise<NfeFileResource> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<NfeFileResource>(
      `${this.basePath(companyId)}/${invoiceId}/correctionletter/pdf`,
    );
    return response.data;
  }

  /**
   * Get the URL for the CC-e XML file.
   *
   * @param companyId - The company ID
   * @param invoiceId - The invoice ID
   * @returns File resource with URI to the correction letter XML
   * @throws {ValidationError} If companyId or invoiceId is empty
   */
  async downloadCorrectionLetterXml(
    companyId: string,
    invoiceId: string,
  ): Promise<NfeFileResource> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<NfeFileResource>(
      `${this.basePath(companyId)}/${invoiceId}/correctionletter/xml`,
    );
    return response.data;
  }

  // --------------------------------------------------------------------------
  // Disablement (Inutilizacao)
  // --------------------------------------------------------------------------

  /**
   * Disable (inutilizar) a specific product invoice by ID.
   *
   * Processing is asynchronous. The reason parameter is optional.
   *
   * @param companyId - The company ID
   * @param invoiceId - The invoice ID to disable
   * @param reason - Optional reason for disablement
   * @returns Cancellation request resource
   * @throws {ValidationError} If companyId or invoiceId is empty
   */
  async disable(
    companyId: string,
    invoiceId: string,
    reason?: string,
  ): Promise<NfeRequestCancellationResource> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const params: Record<string, string> = {};
    if (reason !== undefined) params.reason = reason;
    const qs = buildQueryString(params);
    const response = await this.http.post<NfeRequestCancellationResource>(
      `${this.basePath(companyId)}/${invoiceId}/disablement${qs}`,
    );
    return response.data;
  }

  /**
   * Disable a range of invoice numbers for a company.
   *
   * If disabling a single number, set beginNumber and lastNumber to the same value.
   *
   * @param companyId - The company ID
   * @param data - Disablement data (environment, serie, state, beginNumber, lastNumber, reason?)
   * @returns Disablement resource with operation details
   * @throws {ValidationError} If companyId is empty
   */
  async disableRange(
    companyId: string,
    data: NfeDisablementData,
  ): Promise<NfeDisablementResource> {
    validateCompanyId(companyId);
    const response = await this.http.post<NfeDisablementResource>(
      `${this.basePath(companyId)}/disablement`,
      data,
    );
    return response.data;
  }
}
