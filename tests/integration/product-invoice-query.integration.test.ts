/**
 * Downloads por chave de acesso, contra a API real.
 *
 * O ponto destes testes é o **caminho de erro**. Com `Accept: application/pdf`
 * puro, uma chave inexistente devolve `406` com corpo vazio: o servidor não tem
 * formatter de erro para PDF e a mensagem real morre lá. O chamador recebe um
 * erro sem causa, e o diagnóstico anterior chegou a registrar isso como
 * "downloadPdf quebrado" — não estava; o caminho feliz sempre funcionou.
 *
 * Medido em 2026-09-02 (`nfe.api.nfe.io`):
 *
 *   .pdf + "application/pdf"                          -> real: 200 %PDF-1.4 (7623 bytes)
 *                                                        inexistente: 406, corpo vazio
 *   .pdf + "application/pdf, application/json;q=0.9"  -> real: 200 %PDF-1.4 (mesmos bytes)
 *                                                        inexistente: 400 "access key is not valid"
 *
 * Somente leitura. A chave usada aqui tem formato válido e não corresponde a
 * documento nenhum — de propósito: o caminho feliz depende de uma nota real de
 * terceiro, que não entra no repositório.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createIntegrationClient, skipIfNoDataApiKey, INTEGRATION_TEST_CONFIG } from './setup.js';
import { NfeClient } from '../../src/core/client.js';
import { NfeError } from '../../src/core/errors/index.js';

/** 44 dígitos, formato válido, documento inexistente. */
const CHAVE_INEXISTENTE = '3'.repeat(44);

describe.skipIf(skipIfNoDataApiKey())('Consulta de NF-e por chave — contrato ao vivo', () => {
  let client: NfeClient;

  beforeAll(() => {
    client = createIntegrationClient();
  });

  it(
    'o erro do PDF chega com a mensagem da API, não como 406 opaco',
    { timeout: INTEGRATION_TEST_CONFIG.timeout },
    async () => {
      const erro = await client.productInvoiceQuery
        .downloadPdf(CHAVE_INEXISTENTE)
        .then(() => null)
        .catch((e: unknown) => e);

      expect(erro).toBeInstanceOf(NfeError);
      // Sem o Accept composto isto seria um 406 de corpo vazio, sem mensagem.
      expect((erro as NfeError).message.toLowerCase()).toContain('access key');
      expect((erro as NfeError).statusCode).not.toBe(406);
    }
  );

  it(
    'o erro do XML também chega legível',
    { timeout: INTEGRATION_TEST_CONFIG.timeout },
    async () => {
      const erro = await client.productInvoiceQuery
        .downloadXml(CHAVE_INEXISTENTE)
        .then(() => null)
        .catch((e: unknown) => e);

      expect(erro).toBeInstanceOf(NfeError);
      expect((erro as NfeError).statusCode).not.toBe(406);
    }
  );

  it(
    'a consulta por chave inexistente responde com erro descritivo',
    { timeout: INTEGRATION_TEST_CONFIG.timeout },
    async () => {
      const erro = await client.productInvoiceQuery
        .retrieve(CHAVE_INEXISTENTE)
        .then(() => null)
        .catch((e: unknown) => e);

      expect(erro).toBeInstanceOf(NfeError);
      expect((erro as NfeError).message.toLowerCase()).toContain('access key');
    }
  );
});
