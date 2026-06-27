/**
 * NFE.io SDK v4 - Service Invoices RTC Resource (NFS-e, Reforma Tributária)
 *
 * Emits NFS-e under the RTC layout (IBS/CBS groups) via the same endpoint as the
 * legacy service-invoices resource. RTC is selected by the payload shape
 * (`ibsCbs` group), not by a header or a different URL.
 *
 * Host: api.nfe.io (main client). The base URL already carries `/v1`, so paths
 * here MUST NOT prepend `/v1`.
 *
 * Async model: NFS-e supports polling (202 + Location -> poll until terminal),
 * mirroring the legacy service-invoices resource. Retrieve/cancel/PDF/XML of an
 * emitted invoice are shared with `nfe.serviceInvoices` (same invoice id space);
 * this resource adds RTC emission + the cancellation-event XML download.
 */

import type { HttpClient } from '../http/client.js';
import type {
  ServiceInvoiceData,
  NFSeRtcRequest,
  PollingOptions,
  FlowStatus,
} from '../types.js';
import type { CreateInvoiceResponse } from './service-invoices.js';
import { InvoiceProcessingError, NotFoundError, ValidationError } from '../errors/index.js';
import { poll } from '../utils/polling.js';
import { isTerminalFlowStatus } from '../types.js';

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

export class ServiceInvoicesRtcResource {
  constructor(private readonly http: HttpClient) {}

  /** No `/v1` prefix — the main client base URL (`https://api.nfe.io/v1`) carries it. */
  private basePath(companyId: string): string {
    return `/companies/${companyId}/serviceinvoices`;
  }

  /**
   * Emit an NFS-e with the RTC layout (`ibsCbs` group).
   *
   * Returns a discriminated union: immediate (201) or async (202 + Location).
   * Use {@link createAndWait} to poll until the invoice reaches a terminal state.
   */
  async create(
    companyId: string,
    data: NFSeRtcRequest
  ): Promise<CreateInvoiceResponse> {
    validateCompanyId(companyId);
    const response = await this.http.post<ServiceInvoiceData>(this.basePath(companyId), data);

    if (response.status === 202) {
      const location = response.headers['location'] || response.headers['Location'];
      if (!location) {
        throw new InvoiceProcessingError(
          'Async response (202) received but no Location header found',
          { status: 202, headers: response.headers }
        );
      }
      const fullPath = location.startsWith('http') ? new URL(location).pathname : location;
      return {
        status: 'async',
        response: {
          code: 202,
          status: 'pending',
          location: fullPath,
          invoiceId: this.extractInvoiceIdFromLocation(location),
        },
      };
    }

    return { status: 'immediate', invoice: response.data };
  }

  /**
   * Emit an RTC NFS-e and poll until it reaches a terminal flow status.
   */
  async createAndWait(
    companyId: string,
    data: NFSeRtcRequest,
    options: PollingOptions = {}
  ): Promise<ServiceInvoiceData> {
    const createResult = await this.create(companyId, data);
    if (createResult.status === 'immediate') {
      return createResult.invoice;
    }

    const { invoiceId } = createResult.response;
    const pollingConfig: import('../utils/polling.js').PollingOptions<ServiceInvoiceData> = {
      fn: async () => this.retrieve(companyId, invoiceId),
      isComplete: (invoice) => isTerminalFlowStatus(invoice.flowStatus as FlowStatus),
      timeout: options.timeout ?? 120000,
      initialDelay: options.initialDelay ?? 1000,
      maxDelay: options.maxDelay ?? 10000,
      backoffFactor: options.backoffFactor ?? 1.5,
    };
    if (options.onPoll) {
      pollingConfig.onPoll = (attempt, result) =>
        options.onPoll!(attempt, result.flowStatus as FlowStatus);
    }

    const invoice = await poll<ServiceInvoiceData>(pollingConfig);
    const flowStatus = invoice.flowStatus as FlowStatus;
    if (flowStatus === 'IssueFailed' || flowStatus === 'CancelFailed') {
      throw new InvoiceProcessingError(
        `Invoice processing failed with status: ${flowStatus}`,
        { flowStatus, flowMessage: invoice.flowMessage, invoice }
      );
    }
    return invoice;
  }

  /** Retrieve an emitted invoice (used for polling; shares the endpoint with serviceInvoices). */
  async retrieve(companyId: string, invoiceId: string): Promise<ServiceInvoiceData> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<ServiceInvoiceData>(
      `${this.basePath(companyId)}/${invoiceId}`
    );
    if (!response.data) {
      throw new NotFoundError(`Invoice ${invoiceId} not found`, { companyId, invoiceId });
    }
    return response.data;
  }

  /**
   * Download the XML of the cancellation event (Ambiente Nacional) for an NFS-e.
   *
   * @returns The cancellation-event XML as a Buffer.
   * @throws {NotFoundError} If the invoice/cancellation XML is not found/not ready.
   */
  async downloadCancellationXml(companyId: string, invoiceId: string): Promise<Buffer> {
    validateCompanyId(companyId);
    validateInvoiceId(invoiceId);
    const response = await this.http.get<Buffer>(
      `${this.basePath(companyId)}/${invoiceId}/cancellation-xml`,
      undefined,
      { Accept: 'application/xml' }
    );
    return response.data;
  }

  private extractInvoiceIdFromLocation(location: string): string {
    const path = location.split('?')[0]!.replace(/\/+$/, '');
    return path.split('/').pop() ?? '';
  }
}

export function createServiceInvoicesRtcResource(http: HttpClient): ServiceInvoicesRtcResource {
  return new ServiceInvoicesRtcResource(http);
}
