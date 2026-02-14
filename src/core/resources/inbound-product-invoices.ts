/**
 * NFE.io SDK v3 - Inbound Product Invoices Resource
 *
 * Handles NF-e (Nota Fiscal Eletrônica) distribution queries via Distribuição DFe.
 * Uses the API host: api.nfse.io
 */

import type { HttpClient } from '../http/client.js';
import type {
  InboundInvoiceMetadata,
  InboundProductInvoiceMetadata,
  InboundSettings,
  EnableInboundOptions,
  ManifestEventType
} from '../types.js';
import { ValidationError } from '../errors/index.js';

// ============================================================================
// Constants
// ============================================================================

/** Regex pattern for valid access key (44 numeric digits) */
const ACCESS_KEY_PATTERN = /^\d{44}$/;

/** Default manifest event type: Ciência da Operação */
const DEFAULT_MANIFEST_EVENT_TYPE: ManifestEventType = 210210;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates company ID is not empty
 * @param companyId - The company ID to validate
 * @throws {ValidationError} If company ID is empty
 */
function validateCompanyId(companyId: string): void {
  if (!companyId || companyId.trim() === '') {
    throw new ValidationError('Company ID is required');
  }
}

/**
 * Validates access key format (44 numeric digits)
 * @param accessKey - The access key to validate
 * @throws {ValidationError} If access key format is invalid
 */
function validateAccessKey(accessKey: string): void {
  if (!accessKey || accessKey.trim() === '') {
    throw new ValidationError('Access key is required');
  }

  const normalized = accessKey.trim();
  if (!ACCESS_KEY_PATTERN.test(normalized)) {
    throw new ValidationError(
      `Invalid access key: "${accessKey}". Expected 44 numeric digits.`
    );
  }
}

/**
 * Validates event key is not empty
 * @param eventKey - The event key to validate
 * @throws {ValidationError} If event key is empty
 */
function validateEventKey(eventKey: string): void {
  if (!eventKey || eventKey.trim() === '') {
    throw new ValidationError('Event key is required');
  }
}

/**
 * Validates access key or NSU identifier is not empty
 * @param accessKeyOrNsu - The identifier to validate
 * @throws {ValidationError} If identifier is empty
 */
function validateAccessKeyOrNsu(accessKeyOrNsu: string): void {
  if (!accessKeyOrNsu || accessKeyOrNsu.trim() === '') {
    throw new ValidationError('Access key or NSU is required');
  }
}

// ============================================================================
// Inbound Product Invoices Resource
// ============================================================================

/**
 * Inbound Product Invoices (NF-e Distribution) API Resource
 *
 * @description
 * Provides operations for querying NF-e (Nota Fiscal Eletrônica) documents
 * received by a company via the SEFAZ Distribuição DFe service.
 *
 * **Capabilities:**
 * - Enable/disable automatic NF-e distribution fetch
 * - Retrieve inbound NF-e metadata by access key
 * - Download NF-e documents in XML, PDF, and JSON formats
 * - Send recipient manifest (Manifestação do Destinatário)
 * - Reprocess webhooks
 *
 * **Prerequisites:**
 * - Company must be registered with a valid A1 digital certificate
 * - Webhook must be configured to receive NF-e notifications
 *
 * **Note:** This resource uses a different API host (api.nfse.io) and may require
 * a separate API key configured via `dataApiKey` in the client configuration.
 * If not set, it falls back to `apiKey`.
 *
 * @example Enable automatic NF-e search
 * ```typescript
 * const settings = await nfe.inboundProductInvoices.enableAutoFetch('company-id', {
 *   startFromNsu: '999999',
 *   environmentSEFAZ: 'Production',
 *   webhookVersion: '2'
 * });
 * ```
 *
 * @example Retrieve NF-e details
 * ```typescript
 * const details = await nfe.inboundProductInvoices.getProductInvoiceDetails(
 *   'company-id',
 *   '35240112345678000190550010000001231234567890'
 * );
 * console.log(details.nameSender, details.totalInvoiceAmount);
 * ```
 *
 * @example Download NF-e XML
 * ```typescript
 * const xml = await nfe.inboundProductInvoices.getXml(
 *   'company-id',
 *   '35240112345678000190550010000001231234567890'
 * );
 * ```
 */
export class InboundProductInvoicesResource {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  // --------------------------------------------------------------------------
  // Automatic Search Management
  // --------------------------------------------------------------------------

  /**
   * Enable automatic NF-e distribution fetch for a company
   *
   * Activates the automatic search for NF-e documents destined to the specified
   * company via SEFAZ Distribuição DFe. Once enabled, new NF-e documents will be
   * automatically retrieved and sent to the configured webhook endpoint.
   *
   * @param companyId - The company ID to enable automatic search for
   * @param options - Configuration options for the automatic search
   * @returns Promise with the inbound settings after enabling
   * @throws {ValidationError} If company ID is empty
   * @throws {BadRequestError} If the request is invalid
   * @throws {NotFoundError} If the company is not found
   *
   * @example
   * ```typescript
   * const settings = await nfe.inboundProductInvoices.enableAutoFetch('company-id', {
   *   startFromNsu: '999999',
   *   startFromDate: '2024-01-01T00:00:00Z',
   *   environmentSEFAZ: 'Production',
   *   automaticManifesting: { minutesToWaitAwarenessOperation: '30' },
   *   webhookVersion: '2'
   * });
   * console.log('Status:', settings.status);
   * ```
   */
  async enableAutoFetch(
    companyId: string,
    options: EnableInboundOptions
  ): Promise<InboundSettings> {
    validateCompanyId(companyId);

    const response = await this.http.post<InboundSettings>(
      `/v2/companies/${companyId}/inbound/productinvoices`,
      options
    );

    return response.data;
  }

  /**
   * Disable automatic NF-e distribution fetch for a company
   *
   * Deactivates the automatic search for NF-e documents. After disabling,
   * no new NF-e documents will be retrieved for the company.
   *
   * @param companyId - The company ID to disable automatic search for
   * @returns Promise with the inbound settings after disabling
   * @throws {ValidationError} If company ID is empty
   * @throws {NotFoundError} If automatic search is not enabled for this company
   *
   * @example
   * ```typescript
   * const settings = await nfe.inboundProductInvoices.disableAutoFetch('company-id');
   * console.log('Disabled. Status:', settings.status);
   * ```
   */
  async disableAutoFetch(companyId: string): Promise<InboundSettings> {
    validateCompanyId(companyId);

    const response = await this.http.delete<InboundSettings>(
      `/v2/companies/${companyId}/inbound/productinvoices`
    );

    return response.data;
  }

  /**
   * Get current automatic NF-e distribution fetch settings
   *
   * Retrieves the current configuration for automatic NF-e search,
   * including status, start NSU, start date, and timestamps.
   *
   * @param companyId - The company ID to get settings for
   * @returns Promise with the current inbound settings
   * @throws {ValidationError} If company ID is empty
   * @throws {NotFoundError} If automatic search is not configured for this company
   *
   * @example
   * ```typescript
   * const settings = await nfe.inboundProductInvoices.getSettings('company-id');
   * console.log('Status:', settings.status);
   * console.log('Start NSU:', settings.startFromNsu);
   * console.log('Webhook version:', settings.webhookVersion);
   * ```
   */
  async getSettings(companyId: string): Promise<InboundSettings> {
    validateCompanyId(companyId);

    const response = await this.http.get<InboundSettings>(
      `/v2/companies/${companyId}/inbound/productinvoices`
    );

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Document Detail Operations
  // --------------------------------------------------------------------------

  /**
   * Get details of an inbound NF-e/CT-e by access key (webhook v1 format)
   *
   * Retrieves the metadata of an inbound document using its 44-digit access key.
   * This is the generic endpoint that works for both NF-e and CT-e documents.
   *
   * @param companyId - The company ID that received the document
   * @param accessKey - The 44-digit access key
   * @returns Promise with the inbound invoice metadata
   * @throws {ValidationError} If company ID or access key is invalid
   * @throws {NotFoundError} If the document is not found
   *
   * @example
   * ```typescript
   * const doc = await nfe.inboundProductInvoices.getDetails(
   *   'company-id',
   *   '35240112345678000190550010000001231234567890'
   * );
   * console.log('Sender:', doc.nameSender);
   * console.log('Amount:', doc.totalInvoiceAmount);
   * console.log('NSU:', doc.nsu);
   * ```
   */
  async getDetails(
    companyId: string,
    accessKey: string
  ): Promise<InboundInvoiceMetadata> {
    validateCompanyId(companyId);
    validateAccessKey(accessKey);

    const response = await this.http.get<InboundInvoiceMetadata>(
      `/v2/companies/${companyId}/inbound/${accessKey.trim()}`
    );

    return response.data;
  }

  /**
   * Get details of an inbound NF-e by access key (webhook v2 format)
   *
   * Retrieves the metadata of an NF-e document using its 44-digit access key.
   * This endpoint returns additional `productInvoices` array compared to the v1 format.
   *
   * @param companyId - The company ID that received the document
   * @param accessKey - The 44-digit access key
   * @returns Promise with the inbound product invoice metadata (includes productInvoices array)
   * @throws {ValidationError} If company ID or access key is invalid
   * @throws {NotFoundError} If the document is not found
   *
   * @example
   * ```typescript
   * const doc = await nfe.inboundProductInvoices.getProductInvoiceDetails(
   *   'company-id',
   *   '35240112345678000190550010000001231234567890'
   * );
   * console.log('Sender:', doc.nameSender);
   * console.log('Product invoices:', doc.productInvoices.length);
   * ```
   */
  async getProductInvoiceDetails(
    companyId: string,
    accessKey: string
  ): Promise<InboundProductInvoiceMetadata> {
    validateCompanyId(companyId);
    validateAccessKey(accessKey);

    const response = await this.http.get<InboundProductInvoiceMetadata>(
      `/v2/companies/${companyId}/inbound/productinvoice/${accessKey.trim()}`
    );

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Event Detail Operations
  // --------------------------------------------------------------------------

  /**
   * Get details of an event related to an inbound NF-e/CT-e (generic endpoint)
   *
   * Retrieves the metadata of an event associated with an inbound document.
   *
   * @param companyId - The company ID that received the document
   * @param accessKey - The 44-digit access key of the parent document
   * @param eventKey - The event key
   * @returns Promise with the event metadata
   * @throws {ValidationError} If any parameter is invalid
   * @throws {NotFoundError} If the event is not found
   *
   * @example
   * ```typescript
   * const event = await nfe.inboundProductInvoices.getEventDetails(
   *   'company-id',
   *   '35240112345678000190550010000001231234567890',
   *   'event-key-123'
   * );
   * console.log('Event:', event.description);
   * ```
   */
  async getEventDetails(
    companyId: string,
    accessKey: string,
    eventKey: string
  ): Promise<InboundInvoiceMetadata> {
    validateCompanyId(companyId);
    validateAccessKey(accessKey);
    validateEventKey(eventKey);

    const response = await this.http.get<InboundInvoiceMetadata>(
      `/v2/companies/${companyId}/inbound/${accessKey.trim()}/events/${eventKey.trim()}`
    );

    return response.data;
  }

  /**
   * Get details of an event related to an inbound NF-e (product invoice endpoint)
   *
   * Retrieves the metadata of an event associated with an inbound NF-e document.
   * Returns the webhook v2 format with `productInvoices` array.
   *
   * @param companyId - The company ID that received the document
   * @param accessKey - The 44-digit access key of the parent document
   * @param eventKey - The event key
   * @returns Promise with the product invoice event metadata
   * @throws {ValidationError} If any parameter is invalid
   * @throws {NotFoundError} If the event is not found
   *
   * @example
   * ```typescript
   * const event = await nfe.inboundProductInvoices.getProductInvoiceEventDetails(
   *   'company-id',
   *   '35240112345678000190550010000001231234567890',
   *   'event-key-123'
   * );
   * console.log('Event:', event.description);
   * console.log('Product invoices:', event.productInvoices.length);
   * ```
   */
  async getProductInvoiceEventDetails(
    companyId: string,
    accessKey: string,
    eventKey: string
  ): Promise<InboundProductInvoiceMetadata> {
    validateCompanyId(companyId);
    validateAccessKey(accessKey);
    validateEventKey(eventKey);

    const response = await this.http.get<InboundProductInvoiceMetadata>(
      `/v2/companies/${companyId}/inbound/productinvoice/${accessKey.trim()}/events/${eventKey.trim()}`
    );

    return response.data;
  }

  // --------------------------------------------------------------------------
  // File Download Operations
  // --------------------------------------------------------------------------

  /**
   * Download XML of an inbound NF-e/CT-e by access key
   *
   * Gets the XML content of an inbound document.
   *
   * @param companyId - The company ID that received the document
   * @param accessKey - The 44-digit access key
   * @returns Promise with the XML content as a string
   * @throws {ValidationError} If company ID or access key is invalid
   * @throws {NotFoundError} If the document is not found
   *
   * @example
   * ```typescript
   * const xml = await nfe.inboundProductInvoices.getXml(
   *   'company-id',
   *   '35240112345678000190550010000001231234567890'
   * );
   * fs.writeFileSync('nfe.xml', xml);
   * ```
   */
  async getXml(companyId: string, accessKey: string): Promise<string> {
    validateCompanyId(companyId);
    validateAccessKey(accessKey);

    const response = await this.http.get<string>(
      `/v2/companies/${companyId}/inbound/${accessKey.trim()}/xml`
    );

    return response.data;
  }

  /**
   * Download XML of an event related to an inbound NF-e/CT-e
   *
   * Gets the XML content of an event associated with an inbound document.
   *
   * @param companyId - The company ID that received the document
   * @param accessKey - The 44-digit access key of the parent document
   * @param eventKey - The event key
   * @returns Promise with the event XML content as a string
   * @throws {ValidationError} If any parameter is invalid
   * @throws {NotFoundError} If the event is not found
   *
   * @example
   * ```typescript
   * const xml = await nfe.inboundProductInvoices.getEventXml(
   *   'company-id',
   *   '35240112345678000190550010000001231234567890',
   *   'event-key-123'
   * );
   * fs.writeFileSync('nfe-event.xml', xml);
   * ```
   */
  async getEventXml(
    companyId: string,
    accessKey: string,
    eventKey: string
  ): Promise<string> {
    validateCompanyId(companyId);
    validateAccessKey(accessKey);
    validateEventKey(eventKey);

    const response = await this.http.get<string>(
      `/v2/companies/${companyId}/inbound/${accessKey.trim()}/events/${eventKey.trim()}/xml`
    );

    return response.data;
  }

  /**
   * Download PDF of an inbound NF-e by access key
   *
   * Gets the PDF content of an NF-e document.
   *
   * @param companyId - The company ID that received the document
   * @param accessKey - The 44-digit access key
   * @returns Promise with the PDF content as a string
   * @throws {ValidationError} If company ID or access key is invalid
   * @throws {NotFoundError} If the document is not found
   *
   * @example
   * ```typescript
   * const pdf = await nfe.inboundProductInvoices.getPdf(
   *   'company-id',
   *   '35240112345678000190550010000001231234567890'
   * );
   * fs.writeFileSync('nfe.pdf', pdf);
   * ```
   */
  async getPdf(companyId: string, accessKey: string): Promise<string> {
    validateCompanyId(companyId);
    validateAccessKey(accessKey);

    const response = await this.http.get<string>(
      `/v2/companies/${companyId}/inbound/${accessKey.trim()}/pdf`
    );

    return response.data;
  }

  /**
   * Get JSON representation of an inbound NF-e by access key
   *
   * Gets the structured JSON data of an NF-e document.
   *
   * @param companyId - The company ID that received the document
   * @param accessKey - The 44-digit access key
   * @returns Promise with the NF-e metadata in JSON format
   * @throws {ValidationError} If company ID or access key is invalid
   * @throws {NotFoundError} If the document is not found
   *
   * @example
   * ```typescript
   * const data = await nfe.inboundProductInvoices.getJson(
   *   'company-id',
   *   '35240112345678000190550010000001231234567890'
   * );
   * console.log('Sender:', data.nameSender);
   * console.log('Amount:', data.totalInvoiceAmount);
   * ```
   */
  async getJson(
    companyId: string,
    accessKey: string
  ): Promise<InboundInvoiceMetadata> {
    validateCompanyId(companyId);
    validateAccessKey(accessKey);

    const response = await this.http.get<InboundInvoiceMetadata>(
      `/v2/companies/${companyId}/inbound/productinvoice/${accessKey.trim()}/json`
    );

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Manifest Operations
  // --------------------------------------------------------------------------

  /**
   * Send recipient manifest (Manifestação do Destinatário) for an NF-e
   *
   * Sends a manifest event for an NF-e document identified by its access key.
   * Defaults to "Ciência da Operação" (210210) if no event type is specified.
   *
   * **Event types:**
   * - `210210` — Ciência da Operação (awareness, default)
   * - `210220` — Confirmação da Operação (confirmation)
   * - `210240` — Operação não Realizada (operation not performed)
   *
   * @param companyId - The company ID
   * @param accessKey - The 44-digit access key of the NF-e
   * @param tpEvent - Manifest event type (defaults to 210210)
   * @returns Promise with the manifest response
   * @throws {ValidationError} If company ID or access key is invalid
   *
   * @example Default manifest (Ciência da Operação)
   * ```typescript
   * const result = await nfe.inboundProductInvoices.manifest(
   *   'company-id',
   *   '35240112345678000190550010000001231234567890'
   * );
   * ```
   *
   * @example Confirm operation
   * ```typescript
   * const result = await nfe.inboundProductInvoices.manifest(
   *   'company-id',
   *   '35240112345678000190550010000001231234567890',
   *   210220
   * );
   * ```
   */
  async manifest(
    companyId: string,
    accessKey: string,
    tpEvent: ManifestEventType = DEFAULT_MANIFEST_EVENT_TYPE
  ): Promise<string> {
    validateCompanyId(companyId);
    validateAccessKey(accessKey);

    const response = await this.http.post<string>(
      `/v2/companies/${companyId}/inbound/${accessKey.trim()}/manifest?tpEvent=${tpEvent}`
    );

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Webhook Operations
  // --------------------------------------------------------------------------

  /**
   * Reprocess webhook for an inbound NF-e by access key or NSU
   *
   * Triggers reprocessing of the webhook notification for a specific document,
   * identified either by its 44-digit access key or by its NSU number.
   *
   * @param companyId - The company ID
   * @param accessKeyOrNsu - The 44-digit access key or NSU number
   * @returns Promise with the product invoice metadata
   * @throws {ValidationError} If company ID or identifier is empty
   * @throws {NotFoundError} If the document is not found
   *
   * @example Reprocess by access key
   * ```typescript
   * const result = await nfe.inboundProductInvoices.reprocessWebhook(
   *   'company-id',
   *   '35240112345678000190550010000001231234567890'
   * );
   * ```
   *
   * @example Reprocess by NSU
   * ```typescript
   * const result = await nfe.inboundProductInvoices.reprocessWebhook(
   *   'company-id',
   *   '12345'
   * );
   * ```
   */
  async reprocessWebhook(
    companyId: string,
    accessKeyOrNsu: string
  ): Promise<InboundProductInvoiceMetadata> {
    validateCompanyId(companyId);
    validateAccessKeyOrNsu(accessKeyOrNsu);

    const response = await this.http.post<InboundProductInvoiceMetadata>(
      `/v2/companies/${companyId}/inbound/productinvoice/${accessKeyOrNsu.trim()}/processwebhook`
    );

    return response.data;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates an InboundProductInvoicesResource instance
 *
 * @param http - HTTP client configured for the inbound API (api.nfse.io)
 * @returns InboundProductInvoicesResource instance
 */
export function createInboundProductInvoicesResource(
  http: HttpClient
): InboundProductInvoicesResource {
  return new InboundProductInvoicesResource(http);
}
