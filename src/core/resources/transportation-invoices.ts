/**
 * NFE.io SDK v3 - Transportation Invoices Resource
 *
 * Handles CT-e (Conhecimento de Transporte Eletrônico) operations via Distribuição DFe
 * Uses a separate API host: api.nfse.io
 */

import type { HttpClient } from '../http/client.js';
import type {
  TransportationInvoiceInboundSettings,
  TransportationInvoiceMetadata,
  EnableTransportationInvoiceOptions
} from '../types.js';
import { ValidationError } from '../errors/index.js';

// ============================================================================
// Constants
// ============================================================================

/** Base URL for CT-e API */
export const CTE_API_BASE_URL = 'https://api.nfse.io';

/** Regex pattern for valid access key (44 numeric digits) */
const ACCESS_KEY_PATTERN = /^\d{44}$/;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates access key format (44 numeric digits)
 * @param accessKey - The CT-e access key to validate
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
 * Validates company ID is not empty
 * @param companyId - The company ID to validate
 * @throws {ValidationError} If company ID is empty
 */
function validateCompanyId(companyId: string): void {
  if (!companyId || companyId.trim() === '') {
    throw new ValidationError('Company ID is required');
  }
}

// ============================================================================
// Transportation Invoices Resource
// ============================================================================

/**
 * Transportation Invoices (CT-e) API Resource
 *
 * @description
 * Provides operations for managing CT-e (Conhecimento de Transporte Eletrônico)
 * documents via SEFAZ Distribuição DFe. This allows companies to automatically
 * receive CT-e documents destined to them.
 *
 * **Prerequisites:**
 * - Company must be registered with a valid A1 digital certificate
 * - Webhook must be configured to receive CT-e notifications
 *
 * **Note:** This resource uses a different API host (api.nfse.io) and may require
 * a separate API key configured via `dataApiKey` in the client configuration.
 * If not set, it falls back to `apiKey`.
 *
 * @example Enable automatic CT-e search
 * ```typescript
 * // Enable with default settings
 * const settings = await nfe.transportationInvoices.enable('company-id');
 *
 * // Enable starting from a specific NSU
 * const settings = await nfe.transportationInvoices.enable('company-id', {
 *   startFromNsu: 12345
 * });
 * ```
 *
 * @example Retrieve CT-e by access key
 * ```typescript
 * const cte = await nfe.transportationInvoices.retrieve(
 *   'company-id',
 *   '35240112345678000190570010000001231234567890'
 * );
 * console.log(cte.nameSender, cte.totalInvoiceAmount);
 * ```
 *
 * @example Download CT-e XML
 * ```typescript
 * const xml = await nfe.transportationInvoices.downloadXml(
 *   'company-id',
 *   '35240112345678000190570010000001231234567890'
 * );
 * // Save to file or parse as needed
 * ```
 */
export class TransportationInvoicesResource {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  // --------------------------------------------------------------------------
  // Automatic Search Management
  // --------------------------------------------------------------------------

  /**
   * Enable automatic CT-e search for a company
   *
   * Activates the automatic search for CT-e documents destined to the specified
   * company via SEFAZ Distribuição DFe. Once enabled, new CT-es will be automatically
   * retrieved and can be accessed via the configured webhook.
   *
   * @param companyId - The company ID to enable automatic search for
   * @param options - Optional settings for the automatic search
   * @returns Promise with the inbound settings after enabling
   * @throws {ValidationError} If company ID is empty
   * @throws {BadRequestError} If the request is invalid
   * @throws {NotFoundError} If the company is not found
   *
   * @example
   * ```typescript
   * // Enable with default settings
   * const settings = await nfe.transportationInvoices.enable('company-id');
   *
   * // Enable starting from a specific NSU
   * const settings = await nfe.transportationInvoices.enable('company-id', {
   *   startFromNsu: 12345
   * });
   *
   * // Enable starting from a specific date
   * const settings = await nfe.transportationInvoices.enable('company-id', {
   *   startFromDate: '2024-01-01T00:00:00Z'
   * });
   * ```
   */
  async enable(
    companyId: string,
    options?: EnableTransportationInvoiceOptions
  ): Promise<TransportationInvoiceInboundSettings> {
    validateCompanyId(companyId);

    const response = await this.http.post<TransportationInvoiceInboundSettings>(
      `/v2/companies/${companyId}/inbound/transportationinvoices`,
      options || {}
    );

    return response.data;
  }

  /**
   * Disable automatic CT-e search for a company
   *
   * Deactivates the automatic search for CT-e documents. After disabling,
   * no new CT-es will be retrieved for the company.
   *
   * @param companyId - The company ID to disable automatic search for
   * @returns Promise with the inbound settings after disabling
   * @throws {ValidationError} If company ID is empty
   * @throws {NotFoundError} If automatic search is not enabled for this company
   *
   * @example
   * ```typescript
   * const settings = await nfe.transportationInvoices.disable('company-id');
   * console.log('Automatic search disabled:', settings.status);
   * ```
   */
  async disable(companyId: string): Promise<TransportationInvoiceInboundSettings> {
    validateCompanyId(companyId);

    const response = await this.http.delete<TransportationInvoiceInboundSettings>(
      `/v2/companies/${companyId}/inbound/transportationinvoices`
    );

    return response.data;
  }

  /**
   * Get current automatic CT-e search settings
   *
   * Retrieves the current configuration for automatic CT-e search,
   * including status, start NSU, start date, and timestamps.
   *
   * @param companyId - The company ID to get settings for
   * @returns Promise with the current inbound settings
   * @throws {ValidationError} If company ID is empty
   * @throws {NotFoundError} If automatic search is not configured for this company
   *
   * @example
   * ```typescript
   * const settings = await nfe.transportationInvoices.getSettings('company-id');
   * console.log('Status:', settings.status);
   * console.log('Start NSU:', settings.startFromNsu);
   * console.log('Created:', settings.createdOn);
   * ```
   */
  async getSettings(companyId: string): Promise<TransportationInvoiceInboundSettings> {
    validateCompanyId(companyId);

    const response = await this.http.get<TransportationInvoiceInboundSettings>(
      `/v2/companies/${companyId}/inbound/transportationinvoices`
    );

    return response.data;
  }

  // --------------------------------------------------------------------------
  // CT-e Document Operations
  // --------------------------------------------------------------------------

  /**
   * Retrieve CT-e metadata by access key
   *
   * Gets the metadata of a CT-e document by its 44-digit access key.
   *
   * @param companyId - The company ID that received the CT-e
   * @param accessKey - The 44-digit CT-e access key
   * @returns Promise with the CT-e metadata
   * @throws {ValidationError} If company ID or access key is invalid
   * @throws {NotFoundError} If the CT-e is not found
   *
   * @example
   * ```typescript
   * const cte = await nfe.transportationInvoices.retrieve(
   *   'company-id',
   *   '35240112345678000190570010000001231234567890'
   * );
   * console.log('Sender:', cte.nameSender);
   * console.log('CNPJ:', cte.federalTaxNumberSender);
   * console.log('Amount:', cte.totalInvoiceAmount);
   * console.log('Issued:', cte.issuedOn);
   * ```
   */
  async retrieve(
    companyId: string,
    accessKey: string
  ): Promise<TransportationInvoiceMetadata> {
    validateCompanyId(companyId);
    validateAccessKey(accessKey);

    const response = await this.http.get<TransportationInvoiceMetadata>(
      `/v2/companies/${companyId}/inbound/${accessKey.trim()}`
    );

    return response.data;
  }

  /**
   * Download CT-e XML by access key
   *
   * Gets the XML content of a CT-e document.
   *
   * @param companyId - The company ID that received the CT-e
   * @param accessKey - The 44-digit CT-e access key
   * @returns Promise with the XML content as a string
   * @throws {ValidationError} If company ID or access key is invalid
   * @throws {NotFoundError} If the CT-e is not found
   *
   * @example
   * ```typescript
   * const xml = await nfe.transportationInvoices.downloadXml(
   *   'company-id',
   *   '35240112345678000190570010000001231234567890'
   * );
   *
   * // Save to file
   * fs.writeFileSync('cte.xml', xml);
   *
   * // Or parse with an XML library
   * const parsed = parseXml(xml);
   * ```
   */
  async downloadXml(companyId: string, accessKey: string): Promise<string> {
    validateCompanyId(companyId);
    validateAccessKey(accessKey);

    const response = await this.http.get<string>(
      `/v2/companies/${companyId}/inbound/${accessKey.trim()}/xml`
    );

    return response.data;
  }

  // --------------------------------------------------------------------------
  // CT-e Event Operations
  // --------------------------------------------------------------------------

  /**
   * Retrieve CT-e event metadata
   *
   * Gets the metadata of an event related to a CT-e document.
   *
   * @param companyId - The company ID that received the CT-e
   * @param accessKey - The 44-digit CT-e access key
   * @param eventKey - The event key
   * @returns Promise with the event metadata
   * @throws {ValidationError} If any parameter is invalid
   * @throws {NotFoundError} If the event is not found
   *
   * @example
   * ```typescript
   * const event = await nfe.transportationInvoices.getEvent(
   *   'company-id',
   *   '35240112345678000190570010000001231234567890',
   *   'event-key-123'
   * );
   * console.log('Event:', event.description);
   * ```
   */
  async getEvent(
    companyId: string,
    accessKey: string,
    eventKey: string
  ): Promise<TransportationInvoiceMetadata> {
    validateCompanyId(companyId);
    validateAccessKey(accessKey);

    if (!eventKey || eventKey.trim() === '') {
      throw new ValidationError('Event key is required');
    }

    const response = await this.http.get<TransportationInvoiceMetadata>(
      `/v2/companies/${companyId}/inbound/${accessKey.trim()}/events/${eventKey.trim()}`
    );

    return response.data;
  }

  /**
   * Download CT-e event XML
   *
   * Gets the XML content of a CT-e event.
   *
   * @param companyId - The company ID that received the CT-e
   * @param accessKey - The 44-digit CT-e access key
   * @param eventKey - The event key
   * @returns Promise with the event XML content as a string
   * @throws {ValidationError} If any parameter is invalid
   * @throws {NotFoundError} If the event is not found
   *
   * @example
   * ```typescript
   * const xml = await nfe.transportationInvoices.downloadEventXml(
   *   'company-id',
   *   '35240112345678000190570010000001231234567890',
   *   'event-key-123'
   * );
   * fs.writeFileSync('cte-event.xml', xml);
   * ```
   */
  async downloadEventXml(
    companyId: string,
    accessKey: string,
    eventKey: string
  ): Promise<string> {
    validateCompanyId(companyId);
    validateAccessKey(accessKey);

    if (!eventKey || eventKey.trim() === '') {
      throw new ValidationError('Event key is required');
    }

    const response = await this.http.get<string>(
      `/v2/companies/${companyId}/inbound/${accessKey.trim()}/events/${eventKey.trim()}/xml`
    );

    return response.data;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a TransportationInvoicesResource instance
 *
 * @param http - HTTP client configured for the CT-e API
 * @returns TransportationInvoicesResource instance
 */
export function createTransportationInvoicesResource(
  http: HttpClient
): TransportationInvoicesResource {
  return new TransportationInvoicesResource(http);
}
