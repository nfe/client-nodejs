/**
 * Unit tests for ConsumerInvoicesResource (NFC-e issuance).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConsumerInvoicesResource } from '../../../src/core/resources/consumer-invoices.js';
import { HttpClient } from '../../../src/core/http/client.js';
import type {
  ConsumerInvoiceData,
  ConsumerInvoiceDisablementData,
} from '../../../src/core/types.js';
import { ValidationError } from '../../../src/core/errors/index.js';

describe('ConsumerInvoicesResource', () => {
  let resource: ConsumerInvoicesResource;
  let http: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    http = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    resource = new ConsumerInvoicesResource(http as unknown as HttpClient);
  });

  const companyId = 'company-123';
  const invoiceId = 'nfce-1';
  const base = `/v2/companies/${companyId}/consumerinvoices`;

  it('create POSTs to consumerinvoices and is webhook-driven (returns data, no poll)', async () => {
    const enqueued = { id: invoiceId, flowStatus: 'Processing' };
    http.post.mockResolvedValue({ status: 202, headers: {}, data: enqueued });

    const result = await resource.create(companyId, { items: [] } as unknown as ConsumerInvoiceData);

    expect(http.post).toHaveBeenCalledWith(base, { items: [] });
    expect(result).toEqual(enqueued);
    expect(http.get).not.toHaveBeenCalled();
  });

  it('list / retrieve / cancel hit the right paths', async () => {
    http.get.mockResolvedValue({ status: 200, headers: {}, data: {} });
    http.delete.mockResolvedValue({ status: 200, headers: {}, data: { id: invoiceId } });

    await resource.list(companyId, { environment: 'Test' });
    await resource.retrieve(companyId, invoiceId);
    await resource.cancel(companyId, invoiceId);

    expect(http.get).toHaveBeenCalledWith(base, { environment: 'Test' });
    expect(http.get).toHaveBeenCalledWith(`${base}/${invoiceId}`, undefined);
    expect(http.delete).toHaveBeenCalledWith(`${base}/${invoiceId}`);
  });

  it('list requires environment', async () => {
    await expect(
      resource.list(companyId, {} as unknown as { environment: 'Test' })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('items / events use sub-resource paths', async () => {
    http.get.mockResolvedValue({ status: 200, headers: {}, data: {} });
    await resource.getItems(companyId, invoiceId);
    await resource.getEvents(companyId, invoiceId);
    expect(http.get).toHaveBeenCalledWith(`${base}/${invoiceId}/items`, undefined);
    expect(http.get).toHaveBeenCalledWith(`${base}/${invoiceId}/events`, undefined);
  });

  it('downloads send the right Accept and path (pdf/xml/rejection)', async () => {
    http.get.mockResolvedValue({ status: 200, headers: {}, data: Buffer.from('x') });

    await resource.downloadPdf(companyId, invoiceId);
    await resource.downloadXml(companyId, invoiceId);
    await resource.downloadRejectionXml(companyId, invoiceId);

    expect(http.get).toHaveBeenCalledWith(`${base}/${invoiceId}/pdf`, undefined, { Accept: 'application/pdf' });
    expect(http.get).toHaveBeenCalledWith(`${base}/${invoiceId}/xml`, undefined, { Accept: 'application/xml' });
    expect(http.get).toHaveBeenCalledWith(`${base}/${invoiceId}/xml/rejection`, undefined, { Accept: 'application/xml' });
  });

  it('forwards environment on reads/downloads when provided', async () => {
    http.get.mockResolvedValue({ status: 200, headers: {}, data: {} });

    await resource.retrieve(companyId, invoiceId, 'Test');
    await resource.getItems(companyId, invoiceId, 'Test');
    await resource.getEvents(companyId, invoiceId, 'Test');
    await resource.downloadPdf(companyId, invoiceId, 'Test');

    expect(http.get).toHaveBeenCalledWith(`${base}/${invoiceId}`, { environment: 'Test' });
    expect(http.get).toHaveBeenCalledWith(`${base}/${invoiceId}/items`, { environment: 'Test' });
    expect(http.get).toHaveBeenCalledWith(`${base}/${invoiceId}/events`, { environment: 'Test' });
    expect(http.get).toHaveBeenCalledWith(`${base}/${invoiceId}/pdf`, { environment: 'Test' }, { Accept: 'application/pdf' });
  });

  it('list forwards optional filters (startingAfter/endingBefore/limit/q)', async () => {
    http.get.mockResolvedValue({ status: 200, headers: {}, data: {} });

    await resource.list(companyId, {
      environment: 'Test', startingAfter: 'a', endingBefore: 'b', limit: 5, q: 'buyer.name:X',
    });

    expect(http.get).toHaveBeenCalledWith(base, {
      environment: 'Test', startingAfter: 'a', endingBefore: 'b', limit: 5, q: 'buyer.name:X',
    });
  });

  it('disable POSTs to /disablement', async () => {
    http.post.mockResolvedValue({ status: 200, headers: {}, data: {} });
    const data = { serie: 1, numberStart: 1, numberEnd: 10 } as unknown as ConsumerInvoiceDisablementData;
    await resource.disable(companyId, data);
    expect(http.post).toHaveBeenCalledWith(`${base}/disablement`, data);
  });

  it('validates inputs', async () => {
    await expect(resource.create('', {} as ConsumerInvoiceData)).rejects.toBeInstanceOf(ValidationError);
    await expect(resource.retrieve(companyId, '')).rejects.toBeInstanceOf(ValidationError);
    await expect(resource.downloadPdf(companyId, '')).rejects.toBeInstanceOf(ValidationError);
  });
});
