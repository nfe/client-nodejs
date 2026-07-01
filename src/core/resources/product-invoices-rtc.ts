/**
 * NFE.io SDK v4 - Product Invoices RTC Resource (NF-e/NFC-e, Reforma Tributária)
 *
 * Emits NF-e / NFC-e under the RTC layout (IBS state+municipal, CBS, IS groups)
 * via the same endpoint as the legacy product-invoices resource. RTC is selected
 * by the payload shape (`tax.IBSCBS`), not by a header or a different URL.
 *
 * Host: api.nfse.io (CT-e/data client). The base URL has no version segment, so
 * `/v2` belongs in the path.
 *
 * Async model: like the legacy product-invoices resource, emission is
 * **webhook-driven** — a 202 means the invoice was enqueued; completion is
 * notified via webhooks (NOT polled). Retrieve/cancel/PDF/XML are shared with
 * `nfe.productInvoices` (same invoice id space).
 */

import type { HttpClient } from '../http/client.js';
import type { NfeProductInvoiceIssueData, ProductInvoiceRtcRequest } from '../types.js';
import { ValidationError } from '../errors/index.js';

function validateCompanyId(companyId: string): void {
  if (!companyId || companyId.trim() === '') {
    throw new ValidationError('Company ID is required');
  }
}

export class ProductInvoicesRtcResource {
  constructor(private readonly http: HttpClient) {}

  private basePath(companyId: string): string {
    return `/v2/companies/${companyId}/productinvoices`;
  }

  /**
   * Emit an NF-e / NFC-e with the RTC layout (item-level `tax.IBSCBS`).
   *
   * Webhook-driven: a 202 indicates the invoice was enqueued; monitor completion
   * via webhooks. Returns the enqueued invoice data (does NOT poll).
   */
  async create(
    companyId: string,
    data: ProductInvoiceRtcRequest
  ): Promise<NfeProductInvoiceIssueData> {
    validateCompanyId(companyId);
    const response = await this.http.post<NfeProductInvoiceIssueData>(
      this.basePath(companyId),
      data
    );
    return response.data;
  }
}

export function createProductInvoicesRtcResource(http: HttpClient): ProductInvoicesRtcResource {
  return new ProductInvoicesRtcResource(http);
}
