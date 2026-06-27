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
  NfeInvoiceItemsResponse,
  NfeProductInvoiceEventsResponse,
  NfeDisablementResource,
} from '../types.js';
import { ValidationError } from '../errors/index.js';

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

  /** List NFC-e for a company. */
  async list(companyId: string): Promise<ConsumerInvoiceListResponse> {
    validateCompanyId(companyId);
    const response = await this.http.get<ConsumerInvoiceListResponse>(this.basePath(companyId));
    return response.data;
  }

  /** Retrieve an NFC-e by id. */
  async retrieve(companyId: string, invoiceId: string): Promise<ConsumerInvoice> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<ConsumerInvoice>(
      `${this.basePath(companyId)}/${invoiceId}`
    );
    return response.data;
  }

  /** Cancel an NFC-e. */
  async cancel(companyId: string, invoiceId: string): Promise<ConsumerInvoice> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.delete<ConsumerInvoice>(
      `${this.basePath(companyId)}/${invoiceId}`
    );
    return response.data;
  }

  /** List the items of an NFC-e. */
  async getItems(companyId: string, invoiceId: string): Promise<NfeInvoiceItemsResponse> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<NfeInvoiceItemsResponse>(
      `${this.basePath(companyId)}/${invoiceId}/items`
    );
    return response.data;
  }

  /** List the events of an NFC-e. */
  async getEvents(companyId: string, invoiceId: string): Promise<NfeProductInvoiceEventsResponse> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<NfeProductInvoiceEventsResponse>(
      `${this.basePath(companyId)}/${invoiceId}/events`
    );
    return response.data;
  }

  /** Download the DANFE-NFC-e PDF. */
  async downloadPdf(companyId: string, invoiceId: string): Promise<Buffer> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<Buffer>(
      `${this.basePath(companyId)}/${invoiceId}/pdf`,
      undefined,
      { Accept: 'application/pdf' }
    );
    return response.data;
  }

  /** Download the NFC-e XML. */
  async downloadXml(companyId: string, invoiceId: string): Promise<Buffer> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<Buffer>(
      `${this.basePath(companyId)}/${invoiceId}/xml`,
      undefined,
      { Accept: 'application/xml' }
    );
    return response.data;
  }

  /** Download the rejection XML for a rejected NFC-e. */
  async downloadRejectionXml(companyId: string, invoiceId: string): Promise<Buffer> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<Buffer>(
      `${this.basePath(companyId)}/${invoiceId}/xml/rejection`,
      undefined,
      { Accept: 'application/xml' }
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
