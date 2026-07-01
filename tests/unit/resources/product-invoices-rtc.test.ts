/**
 * Unit tests for ProductInvoicesRtcResource (NF-e/NFC-e, Reforma Tributária).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductInvoicesRtcResource } from '../../../src/core/resources/product-invoices-rtc.js';
import { HttpClient } from '../../../src/core/http/client.js';
import type { ProductInvoiceRtcRequest } from '../../../src/core/types.js';
import { ValidationError } from '../../../src/core/errors/index.js';

describe('ProductInvoicesRtcResource', () => {
  let resource: ProductInvoicesRtcResource;
  let http: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    http = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    resource = new ProductInvoicesRtcResource(http as unknown as HttpClient);
  });

  const companyId = 'company-123';

  function minimalRtcPayload(): ProductInvoiceRtcRequest {
    return {
      operationType: 'Outgoing',
      destination: 'InternalOperation',
      buyer: { name: 'NF-E HOMOLOGACAO', federalTaxNumber: 11223344000155 },
      items: [
        {
          description: 'PRODUTO RTC',
          ncm: '85171300',
          cfop: 5102,
          quantity: 1,
          unitAmount: 150.0,
          tax: { IBSCBS: { situationCode: '000', classCode: '000001' } },
        },
      ],
    } as unknown as ProductInvoiceRtcRequest;
  }

  describe('create()', () => {
    it('posts the RTC payload to the v2 productinvoices endpoint (webhook-driven, returns data)', async () => {
      const enqueued = { id: 'prod-1', flowStatus: 'Processing' };
      http.post.mockResolvedValue({ status: 202, headers: {}, data: enqueued });

      const result = await resource.create(companyId, minimalRtcPayload());

      expect(http.post).toHaveBeenCalledWith(
        `/v2/companies/${companyId}/productinvoices`,
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ tax: expect.objectContaining({ IBSCBS: expect.any(Object) }) }),
          ]),
        })
      );
      // Webhook-driven: returns the enqueued resource (no polling)
      expect(result).toEqual(enqueued);
      expect(http.get).not.toHaveBeenCalled();
    });

    it('throws ValidationError on empty companyId', async () => {
      await expect(resource.create('', minimalRtcPayload())).rejects.toBeInstanceOf(ValidationError);
    });
  });
});
