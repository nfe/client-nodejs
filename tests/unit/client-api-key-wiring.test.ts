/**
 * Qual chave sai no fio, por família de host.
 *
 * As duas chaves da plataforma são COMPLEMENTARES, não alternativas — cada uma
 * responde 403 no território da outra (probe ao vivo 2026-09-01, evidência em
 * tests/fixtures/live-contracts/api-key-host-matrix.json):
 *
 *   api.nfse.io / api.nfe.io  (fiscal)   → apiKey
 *   nfe.api.nfe.io, legalentity, naturalperson, address (consulta) → dataApiKey
 *
 * A suíte existente (client-multikey.test.ts) só afirmava que acessar o resource
 * NÃO LANÇA — nunca qual chave era usada. Foi por isso que o wiring errado de
 * nove resources fiscais sobreviveu. Estes testes afirmam o header.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NfeClient } from '../../src/core/client.js';

const MAIN_KEY = 'main-key-fiscal';
const DATA_KEY = 'data-key-consulta';
const COMPANY_ID = '00000000000000000000000000000001';

function mockHeaders(entries: [string, string][]): any {
  const map = new Map(entries.map(([k, v]) => [k.toLowerCase(), v]));
  return {
    get: (k: string) => map.get(k.toLowerCase()) ?? null,
    has: (k: string) => map.has(k.toLowerCase()),
    entries: () => map.entries(),
    keys: () => map.keys(),
    values: () => map.values(),
    forEach: (cb: (v: string, k: string) => void) => map.forEach((v, k) => cb(v, k)),
  };
}

describe('resolução de credencial por família de host', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.NFE_API_KEY;
    delete process.env.NFE_DATA_API_KEY;

    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: mockHeaders([['content-type', 'application/json']]),
      json: async () => ({}),
      text: async () => '{}',
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  /** Dispara a chamada e devolve a chave que foi para o header X-NFE-APIKEY. */
  async function keyOnWire(call: (c: NfeClient) => Promise<unknown>): Promise<string> {
    const client = new NfeClient({ apiKey: MAIN_KEY, dataApiKey: DATA_KEY });
    await call(client).catch(() => undefined); // erros de parse não importam aqui
    expect(fetchMock).toHaveBeenCalled();
    const init = fetchMock.mock.calls[0]![1] as { headers: Record<string, string> };
    return init.headers['X-NFE-APIKEY']!;
  }

  describe('hosts fiscais usam a chave main', () => {
    const fiscais: Array<[string, (c: NfeClient) => Promise<unknown>]> = [
      ['companies.exists (v2)', (c) => c.companies.exists(COMPANY_ID)],
      ['certificates.list', (c) => c.certificates.list(COMPANY_ID)],
      ['municipalTaxes.list', (c) => c.municipalTaxes.list(COMPANY_ID)],
      ['stateTaxes.list', (c) => c.stateTaxes.list(COMPANY_ID)],
      ['transportationInvoices.getSettings', (c) => c.transportationInvoices.getSettings(COMPANY_ID)],
      ['inboundProductInvoices.getSettings', (c) => c.inboundProductInvoices.getSettings(COMPANY_ID)],
      ['productInvoices.list', (c) => c.productInvoices.list(COMPANY_ID, { environment: 'Test' } as never)],
      ['productInvoicesRtc.create', (c) => c.productInvoicesRtc.create(COMPANY_ID, {} as never)],
      ['taxCalculation.calculate', (c) => c.taxCalculation.calculate('tenant-x', {
        issuer: { taxRegime: 'SimplesNacional', state: 'PR' },
        recipient: { state: 'SP' },
        operationType: 'Sale',
        items: [{ quantity: 1, unitPrice: 1 }],
      } as never)],
      ['taxCodes.listOperationCodes (controle: já correto)', (c) => c.taxCodes.listOperationCodes()],
      ['consumerInvoices.list (controle: já correto)', (c) => c.consumerInvoices.list(COMPANY_ID, { environment: 'Test' } as never)],
    ];

    it.each(fiscais)('%s manda a chave main', async (_nome, call) => {
      expect(await keyOnWire(call)).toBe(MAIN_KEY);
    });
  });

  describe('hosts de consulta usam a chave data', () => {
    const consulta: Array<[string, (c: NfeClient) => Promise<unknown>]> = [
      ['addresses.lookupByPostalCode', (c) => c.addresses.lookupByPostalCode('01310100')],
      ['legalEntityLookup.getBasicInfo', (c) => c.legalEntityLookup.getBasicInfo('11111111000191')],
    ];

    it.each(consulta)('%s manda a chave data', async (_nome, call) => {
      expect(await keyOnWire(call)).toBe(DATA_KEY);
    });
  });

  describe('configuração com uma chave só', () => {
    it('apenas apiKey: tudo continua funcionando (fallback data → main)', async () => {
      const client = new NfeClient({ apiKey: MAIN_KEY });
      await client.municipalTaxes.list(COMPANY_ID).catch(() => undefined);
      await client.addresses.lookupByPostalCode('01310100').catch(() => undefined);

      for (const call of fetchMock.mock.calls) {
        const init = call[1] as { headers: Record<string, string> };
        expect(init.headers['X-NFE-APIKEY']).toBe(MAIN_KEY);
      }
    });

    it('apenas dataApiKey: resources fiscais falham rápido, sem ir à rede', () => {
      const client = new NfeClient({ dataApiKey: DATA_KEY });

      // Consulta continua disponível.
      expect(() => client.addresses).not.toThrow();

      // Fiscais exigem a main: erro de configuração no acesso, não 403 depois.
      expect(() => client.municipalTaxes).toThrow(/API key required/);
      expect(() => client.transportationInvoices).toThrow(/API key required/);
      expect(() => client.certificates).toThrow(/API key required/);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
