/**
 * NFE.io SDK v4 - Consumer Invoices Resource (NFC-e issuance)
 *
 * Company-scoped NFC-e lifecycle via the api.nfse.io v2 API. Distinct from the
 * read-only `ConsumerInvoiceQueryResource` (CFe-SAT coupon lookup) and from RTC
 * NFC-e (different payload). Emission is **webhook-driven** (202 = enqueued;
 * completion notified via webhooks), mirroring `product-invoices` (no polling).
 */

import type { HttpClient } from '../http/client.js';
import type {
  ConsumerInvoiceData,
  ConsumerInvoice,
  ConsumerInvoiceListResponse,
  ConsumerInvoiceDisablementData,
  ConsumerInvoiceItemsResponse,
  ConsumerInvoiceEventsResponse,
  ConsumerInvoiceCancellationResponse,
  ConsumerInvoiceFileResource,
  NfeDisablementResource,
} from '../types.js';
import { ValidationError } from '../errors/index.js';

/** The NFC-e API requires which environment's invoices to operate on. */
export type ConsumerInvoiceEnvironment = 'Production' | 'Test';

/** Options for {@link ConsumerInvoicesResource.list}. `environment` is required by the API. */
export interface ConsumerInvoiceListOptions {
  /** Required by the API (`Production` or `Test`). Omitting it yields HTTP 400. */
  environment: ConsumerInvoiceEnvironment;
  startingAfter?: string;
  endingBefore?: string;
  limit?: number;
  /** Free-text query filter, if supported by the endpoint. */
  q?: string;
}

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

/**
 * Builds a query string from present values. Mirrors the local helper in
 * `product-invoices.ts` — `http.delete()` takes no params object, so the query
 * has to go in the path.
 */
function buildQueryString(params: Record<string, string | number | boolean>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

/** Cursor pagination for the NFC-e sub-collections (items and events). */
export interface ConsumerInvoicePageOptions {
  /** Page size. */
  limit?: number;
  /** Cursor: start after this index. */
  startingAfter?: number;
}

/** Builds the query for the paginated sub-collections; omits absent values. */
function buildPageParams(
  options?: ConsumerInvoicePageOptions
): Record<string, unknown> | undefined {
  if (!options) return undefined;
  const params: Record<string, unknown> = {};
  if (options.limit !== undefined) params.limit = options.limit;
  if (options.startingAfter !== undefined) params.startingAfter = options.startingAfter;
  return Object.keys(params).length > 0 ? params : undefined;
}

export class ConsumerInvoicesResource {
  constructor(private readonly http: HttpClient) {}

  private basePath(companyId: string): string {
    return `/v2/companies/${companyId}/consumerinvoices`;
  }

  /**
   * Emit an NFC-e (consumer invoice).
   *
   * Webhook-driven: a 202 indicates the invoice was enqueued; completion is
   * notified via webhooks. Returns the enqueued invoice (does NOT poll).
   */
  async create(companyId: string, data: ConsumerInvoiceData): Promise<ConsumerInvoice> {
    validateCompanyId(companyId);
    const response = await this.http.post<ConsumerInvoice>(this.basePath(companyId), data);
    return response.data;
  }

  /**
   * List NFC-e for a company. The API **requires** `environment` (`Production` or
   * `Test`); omitting it returns HTTP 400.
   */
  async list(
    companyId: string,
    options: ConsumerInvoiceListOptions
  ): Promise<ConsumerInvoiceListResponse> {
    validateCompanyId(companyId);
    // A API EXIGE `environment` aqui: sem ele responde
    // 400 {"code":40001,"message":"environment has to be production or test"}.
    // A spec marca o parametro como opcional — a spec e que esta errada
    // (verificado ao vivo em 2026-09-01). Este throw e a falha rapida equivalente.
    if (!options?.environment) {
      throw new ValidationError('Environment is required (Production or Test)');
    }
    const params: Record<string, unknown> = { environment: options.environment };
    if (options.startingAfter) params.startingAfter = options.startingAfter;
    if (options.endingBefore) params.endingBefore = options.endingBefore;
    if (options.limit !== undefined) params.limit = options.limit;
    if (options.q) params.q = options.q;
    const response = await this.http.get<ConsumerInvoiceListResponse>(
      this.basePath(companyId),
      params
    );
    return response.data;
  }

  /**
   * Retrieve an NFC-e by id.
   *
   * The route takes no query parameters — `environment` is neither required nor
   * defined by the spec here (verified live 2026-09-01).
   */
  async retrieve(companyId: string, invoiceId: string): Promise<ConsumerInvoice> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<ConsumerInvoice>(
      `${this.basePath(companyId)}/${invoiceId}`
    );
    return response.data;
  }

  /**
   * Cancel an NFC-e.
   *
   * @param reason - Optional cancellation reason, sent as the `reason` query
   *   parameter defined by the spec.
   */
  async cancel(
    companyId: string,
    invoiceId: string,
    reason?: string
  ): Promise<ConsumerInvoiceCancellationResponse> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const params: Record<string, string> = {};
    if (reason !== undefined) params.reason = reason;
    const response = await this.http.delete<ConsumerInvoiceCancellationResponse>(
      `${this.basePath(companyId)}/${invoiceId}${buildQueryString(params)}`
    );
    return response.data;
  }

  /**
   * List the items of an NFC-e, with cursor pagination (`limit`/`startingAfter`).
   * The response carries `hasMore`.
   */
  async getItems(
    companyId: string,
    invoiceId: string,
    options?: ConsumerInvoicePageOptions
  ): Promise<ConsumerInvoiceItemsResponse> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<ConsumerInvoiceItemsResponse>(
      `${this.basePath(companyId)}/${invoiceId}/items`,
      buildPageParams(options)
    );
    return response.data;
  }

  /**
   * List the events of an NFC-e, with cursor pagination (`limit`/`startingAfter`).
   * The response carries `hasMore`.
   */
  async getEvents(
    companyId: string,
    invoiceId: string,
    options?: ConsumerInvoicePageOptions
  ): Promise<ConsumerInvoiceEventsResponse> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<ConsumerInvoiceEventsResponse>(
      `${this.basePath(companyId)}/${invoiceId}/events`,
      buildPageParams(options)
    );
    return response.data;
  }

  /**
   * Get the DANFE-NFC-e PDF link.
   *
   * @param force - Force regeneration of the document (spec `force` query param).
   *
   * A API devolve `{ uri }` — URL temporaria para o arquivo, nao o binario. O
   * header `Accept` nao altera a resposta. Verificado ao vivo em 2026-09-01
   * (tests/fixtures/live-contracts/consumer-invoice-download.json).
   *
   * Atencao: o envelope difere das rotas de ENTRADA, que usam `publicTemporaryUri`.
   */
  async downloadPdf(
    companyId: string,
    invoiceId: string,
    force?: boolean
  ): Promise<ConsumerInvoiceFileResource> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<ConsumerInvoiceFileResource>(
      `${this.basePath(companyId)}/${invoiceId}/pdf`,
      force === undefined ? undefined : { force }
    );
    return response.data;
  }

  /**
   * Get the NFC-e XML link.
   *
   * A API devolve `{ uri }` — URL temporaria para o arquivo, nao o binario. O
   * header `Accept` nao altera a resposta. Verificado ao vivo em 2026-09-01
   * (tests/fixtures/live-contracts/consumer-invoice-download.json).
   *
   * Atencao: o envelope difere das rotas de ENTRADA, que usam `publicTemporaryUri`.
   */
  async downloadXml(
    companyId: string,
    invoiceId: string
  ): Promise<ConsumerInvoiceFileResource> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<ConsumerInvoiceFileResource>(
      `${this.basePath(companyId)}/${invoiceId}/xml`
    );
    return response.data;
  }

  /**
   * Get the rejection XML link for a rejected NFC-e.
   *
   * A API devolve `{ uri }` — URL temporaria para o arquivo, nao o binario. O
   * header `Accept` nao altera a resposta. Verificado ao vivo em 2026-09-01
   * (tests/fixtures/live-contracts/consumer-invoice-download.json).
   *
   * Atencao: o envelope difere das rotas de ENTRADA, que usam `publicTemporaryUri`.
   */
  async downloadRejectionXml(
    companyId: string,
    invoiceId: string
  ): Promise<ConsumerInvoiceFileResource> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<ConsumerInvoiceFileResource>(
      `${this.basePath(companyId)}/${invoiceId}/xml/rejection`
    );
    return response.data;
  }

  /** Disable (inutilizar) a range of NFC-e numbers. */
  async disable(
    companyId: string,
    data: ConsumerInvoiceDisablementData
  ): Promise<NfeDisablementResource> {
    validateCompanyId(companyId);
    const response = await this.http.post<NfeDisablementResource>(
      `${this.basePath(companyId)}/disablement`,
      data
    );
    return response.data;
  }
}

export function createConsumerInvoicesResource(http: HttpClient): ConsumerInvoicesResource {
  return new ConsumerInvoicesResource(http);
}
