/**
 * Unit tests for ServiceInvoicesRtcResource (NFS-e, Reforma Tributária).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceInvoicesRtcResource } from '../../../src/core/resources/service-invoices-rtc.js';
import { HttpClient } from '../../../src/core/http/client.js';
import type { NFSeRtcRequest } from '../../../src/core/types.js';
import { ValidationError } from '../../../src/core/errors/index.js';

describe('ServiceInvoicesRtcResource', () => {
  let resource: ServiceInvoicesRtcResource;
  let http: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    http = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    resource = new ServiceInvoicesRtcResource(http as unknown as HttpClient);
  });

  const companyId = 'company-123';

  function minimalRtcPayload(): NFSeRtcRequest {
    return {
      borrower: { name: 'CONSUMIDOR MINIMO LTDA', federalTaxNumber: 191 },
      cityServiceCode: '4444',
      federalServiceCode: '01.01',
      description: 'Serviço de consultoria (RTC)',
      servicesAmount: 1000.0,
      nbsCode: '101010100',
      ibsCbs: { operationIndicator: '1005011', classCode: '000001' },
    } as unknown as NFSeRtcRequest;
  }

  describe('create()', () => {
    it('posts the RTC payload to the serviceinvoices endpoint WITHOUT a /v1 prefix', async () => {
      http.post.mockResolvedValue({ status: 201, headers: {}, data: { id: 'inv-1' } });

      await resource.create(companyId, minimalRtcPayload());

      expect(http.post).toHaveBeenCalledWith(
        `/companies/${companyId}/serviceinvoices`,
        expect.objectContaining({ ibsCbs: expect.any(Object) })
      );
    });

    it('returns an async union with invoiceId on 202 + Location', async () => {
      http.post.mockResolvedValue({
        status: 202,
        headers: { location: `/v1/companies/${companyId}/serviceinvoices/inv-async` },
        data: {},
      });

      const result = await resource.create(companyId, minimalRtcPayload());

      expect(result.status).toBe('async');
      if (result.status === 'async') {
        expect(result.response.invoiceId).toBe('inv-async');
        expect(result.response.code).toBe(202);
      }
    });

    it('returns immediate union on 201', async () => {
      http.post.mockResolvedValue({ status: 201, headers: {}, data: { id: 'inv-1' } });

      const result = await resource.create(companyId, minimalRtcPayload());

      expect(result.status).toBe('immediate');
      if (result.status === 'immediate') {
        expect(result.invoice.id).toBe('inv-1');
      }
    });

    it('throws ValidationError on empty companyId', async () => {
      await expect(resource.create('', minimalRtcPayload())).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('downloadCancellationXml()', () => {
    it('GETs the cancellation-xml path (no /v1 prefix) and returns the buffer', async () => {
      const xml = Buffer.from('<nfeProc/>');
      http.get.mockResolvedValue({ status: 200, headers: {}, data: xml });

      const result = await resource.downloadCancellationXml(companyId, 'inv-1');

      expect(http.get).toHaveBeenCalledWith(
        `/companies/${companyId}/serviceinvoices/inv-1/cancellation-xml`,
        undefined,
        { Accept: 'application/xml' }
      );
      expect(result).toBe(xml);
    });

    it('throws ValidationError on empty invoiceId', async () => {
      await expect(resource.downloadCancellationXml(companyId, '')).rejects.toBeInstanceOf(
        ValidationError
      );
    });
  });
});
