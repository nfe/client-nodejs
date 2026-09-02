/**
 * Alignment guard: os retornos do recurso de NFC-e amarrados aos schemas
 * gerados da `nf-consumidor-v2`.
 *
 * Fatos pinados por sonda ao vivo em 2026-09-01 (evidência em
 * `tests/fixtures/live-contracts/consumer-invoice-download.json`):
 *  - downloads devolvem `FileResource` — campo `uri`, NÃO `publicTemporaryUri`
 *    (esse é o envelope das rotas de ENTRADA, tipo separado de propósito);
 *  - items e events têm envelopes PRÓPRIOS com `hasMore` — o de events não é o
 *    mesmo do recurso de produto, que era o reusado antes;
 *  - o cancelamento devolve `RequestCancellationResource`, não a nota.
 *
 * Se um sync de spec mudar qualquer um desses contratos, `npm run test:types`
 * quebra em vez de driftar em silêncio.
 */

import { describe, it, expectTypeOf } from 'vitest';
import type {
  ConsumerInvoiceFileResource,
  ConsumerInvoiceItemsResponse,
  ConsumerInvoiceEventsResponse,
  ConsumerInvoiceCancellationResponse,
  InboundFileResource,
} from '../../src/index.js';

describe('NFC-e: alinhamento spec ↔ tipo', () => {
  it('download devolve `uri`, e não o `publicTemporaryUri` da entrada', () => {
    expectTypeOf<ConsumerInvoiceFileResource>().toHaveProperty('uri');
    expectTypeOf<InboundFileResource>().toHaveProperty('publicTemporaryUri');
  });

  it('os dois envelopes de arquivo são tipos distintos', () => {
    expectTypeOf<ConsumerInvoiceFileResource>().not.toEqualTypeOf<InboundFileResource>();
  });

  it('items e events carregam `hasMore` (paginação cursor)', () => {
    expectTypeOf<ConsumerInvoiceItemsResponse>().toHaveProperty('hasMore');
    expectTypeOf<ConsumerInvoiceItemsResponse>().toHaveProperty('items');
    expectTypeOf<ConsumerInvoiceEventsResponse>().toHaveProperty('hasMore');
    expectTypeOf<ConsumerInvoiceEventsResponse>().toHaveProperty('events');
  });

  it('cancelamento devolve o recurso de cancelamento, não a nota', () => {
    expectTypeOf<ConsumerInvoiceCancellationResponse>().toHaveProperty('reason');
  });
});
