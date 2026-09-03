/**
 * O que `healthCheck()` manda no fio.
 *
 * O método existe para responder "a integração está de pé?" e respondia
 * `status: 'error'` SEMPRE, com credencial válida e API no ar, porque enviava
 * `pageCount: 1`:
 *
 *   GET /v1/companies?pageCount=1  → 400 "pageCount must be between 1 and 50"
 *   GET /v1/companies?pageCount=2  → 200
 *   GET /v1/companies              → 200
 *
 * (medido em 2026-09-02 contra api.nfe.io com chave real)
 *
 * O limite inferior do servidor está um a mais do que a própria mensagem diz.
 * Enquanto isso não for corrigido upstream, o SDK omite o parâmetro — e este
 * teste existe para que a omissão não seja desfeita por engano. Afirmar
 * `status: 'ok'` contra um mock não bastaria: o mock responde 200 para
 * qualquer query, inclusive a que a API recusa.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NfeClient } from '../../src/core/client.js';

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

describe('healthCheck', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.NFE_API_KEY;
    delete process.env.NFE_DATA_API_KEY;
    fetchMock = vi.fn();
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  function okResponse() {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: mockHeaders([['content-type', 'application/json']]),
      json: async () => ({ companies: [], page: 1 }),
      text: async () => '{"companies":[],"page":1}',
      arrayBuffer: async () => new ArrayBuffer(0),
    };
  }

  it('não envia pageCount — a API recusa o valor 1 que o SDK mandava', async () => {
    fetchMock.mockResolvedValue(okResponse());
    const nfe = new NfeClient({ apiKey: 'k' });

    await nfe.healthCheck();

    const url = new URL(fetchMock.mock.calls[0]![0] as string);
    expect(url.pathname).toBe('/v1/companies');
    expect(url.searchParams.get('pageCount')).toBeNull();
    // Nenhum parâmetro de paginação, não só o pageCount.
    expect([...url.searchParams.keys()]).toEqual([]);
  });

  it('responde ok quando a API responde 200', async () => {
    fetchMock.mockResolvedValue(okResponse());
    const nfe = new NfeClient({ apiKey: 'k' });

    await expect(nfe.healthCheck()).resolves.toEqual({ status: 'ok' });
  });

  it('continua reportando erro quando a API recusa a credencial', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: mockHeaders([['content-type', 'application/json']]),
      json: async () => ({ message: 'API Key inválida' }),
      text: async () => '{"message":"API Key inválida"}',
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    const nfe = new NfeClient({ apiKey: 'chave-ruim' });

    const health = await nfe.healthCheck();

    expect(health.status).toBe('error');
    expect(health.details?.error).toBeTruthy();
    expect(health.details?.config?.hasApiKey).toBe(true);
  });

  it('continua reportando erro quando o host está inalcançável', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    // Sem retry: erro de conexão é retentável, e o backoff levaria o teste ao
    // timeout do vitest. O que interessa aqui é o veredito, não a política.
    const nfe = new NfeClient({
      apiKey: 'k',
      retryConfig: { maxRetries: 0, baseDelay: 1, maxDelay: 1 },
    });

    const health = await nfe.healthCheck();

    expect(health.status).toBe('error');
    expect(health.details?.error).toBeTruthy();
  });
});
