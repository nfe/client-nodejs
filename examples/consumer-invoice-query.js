/**
 * Consumer Invoice Query (CFe-SAT) — DESCONTINUADO
 *
 * `nfe.consumerInvoiceQuery.retrieve()` e `.downloadXml()` estão marcados @deprecated:
 * a plataforma não serve as rotas `/v1/consumerinvoices/coupon/{chave}` e `.xml`, que
 * respondem 404 igual ao de um caminho inexistente, inclusive sem credencial (medido em
 * 2026-09-02). Não há substituto na API hoje.
 *
 * Este exemplo só demonstra o erro que o SDK devolve, para quem encontrar o recurso
 * em código antigo.
 *
 * Usage:
 *   NFE_DATA_API_KEY=... node examples/consumer-invoice-query.js
 */

import { NfeClient } from '../dist/index.js';

const ACCESS_KEY = process.argv[2] || '35240112345678000190590000000012341234567890';

async function main() {
  const nfe = new NfeClient({
    apiKey: process.env.NFE_API_KEY,
    dataApiKey: process.env.NFE_DATA_API_KEY,
  });

  try {
    // @deprecated — a rota não é servida; a chamada termina em 404 com a explicação
    await nfe.consumerInvoiceQuery.retrieve(ACCESS_KEY);
  } catch (error) {
    console.log('Esperado (rota não servida):', error instanceof Error ? error.message : error);
  }
}

main().catch(console.error);
