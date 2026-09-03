/**
 * `legalPeople` / `naturalPeople` contra a API real.
 *
 * Estes 14 métodos foram registrados como "quebrados, 400 em toda chamada" pelo
 * diagnóstico de julho. **Não estavam.** A sonda tinha usado a empresa do `.env`,
 * cujo id tem 32 caracteres; a rota valida o `company_id` como `ObjectId` de 24
 * hexadecimais e recusa qualquer outro formato antes de olhar o resto.
 *
 * Medido em 2026-09-02 sobre 50 empresas da mesma conta:
 *   30 com id de 24 hex   -> 200, envelope `{ legalPeople: [...] }`
 *   19 com id de 32 chars -> 400 "company id is not valid"
 *
 * O teste afirma as duas metades — a que funciona e a que o servidor recusa —
 * para que a próxima leitura não repita a generalização a partir de uma amostra.
 *
 * Somente leitura.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createIntegrationClient, skipIfNoApiKey, INTEGRATION_TEST_CONFIG } from './setup.js';
import { NfeClient } from '../../src/core/client.js';
import { ValidationError } from '../../src/core/errors/index.js';
import type { Company } from '../../src/core/types.js';

const OBJECT_ID_24_HEX = /^[0-9a-f]{24}$/i;

describe.skipIf(skipIfNoApiKey())('Pessoas vinculadas à empresa — contrato ao vivo', () => {
  let client: NfeClient;
  let elegivel: Company | undefined;
  let inelegivel: Company | undefined;

  beforeAll(async () => {
    client = createIntegrationClient();
    const page = (await client.companies.list({ pageCount: 50, pageIndex: 1 })).data;
    elegivel = page.find(c => OBJECT_ID_24_HEX.test(String(c.id)));
    inelegivel = page.find(c => !OBJECT_ID_24_HEX.test(String(c.id)));
  });

  it(
    'lista pessoas jurídicas de empresa com id no formato aceito',
    { timeout: INTEGRATION_TEST_CONFIG.timeout },
    async () => {
      expect(elegivel, 'nenhuma empresa com id de 24 hex na primeira página').toBeDefined();

      const result = await client.legalPeople.list(elegivel!.id!);

      // O envelope `{ legalPeople: [...] }` é desembrulhado em `data`.
      expect(Array.isArray(result.data)).toBe(true);
    }
  );

  it(
    'lista pessoas físicas de empresa com id no formato aceito',
    { timeout: INTEGRATION_TEST_CONFIG.timeout },
    async () => {
      expect(elegivel).toBeDefined();

      const result = await client.naturalPeople.list(elegivel!.id!);

      expect(Array.isArray(result.data)).toBe(true);
    }
  );

  it(
    'empresa com id de 32 caracteres é recusada pelo servidor, não pelo SDK',
    { timeout: INTEGRATION_TEST_CONFIG.timeout },
    async () => {
      expect(inelegivel, 'nenhuma empresa com id de 32 chars na primeira página').toBeDefined();

      const erro = await client.legalPeople
        .list(inelegivel!.id!)
        .then(() => null)
        .catch((e: unknown) => e);

      // 400 da API, com a mensagem dela — não uma validação local que o SDK inventou.
      expect(erro).toBeInstanceOf(ValidationError);
      expect((erro as ValidationError).message.toLowerCase()).toContain('company id');
    }
  );
});
