/**
 * Nome do campo multipart no upload de certificado.
 *
 * A API faz binding do campo `file`. Com qualquer outro nome ela responde
 * 400 `{"errors":{"file":["The File field is required."]}}` — ou seja, o método
 * nunca completava enquanto enviava `certificate`.
 * Verificado ao vivo em 2026-09-01; evidência em
 * tests/fixtures/live-contracts/certificate-upload-field.json.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NfeClient } from '../../src/core/client.js';

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

describe('companies.uploadCertificate — campo multipart', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: mockHeaders([['content-type', 'application/json']]),
      json: async () => ({ uploaded: true }),
      text: async () => '{"uploaded":true}',
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    global.fetch = fetchMock as any;
  });

  afterEach(() => vi.restoreAllMocks());

  async function sentFormData(filename?: string): Promise<FormData> {
    const client = new NfeClient({ apiKey: 'main-key' });
    // Blob evita o CertificateValidator, que só roda em Buffer e abortaria antes do envio.
    const file = new Blob([new Uint8Array([0, 1, 2, 3])], { type: 'application/x-pkcs12' });

    await client.companies
      .uploadCertificate(COMPANY_ID, {
        file,
        password: 'senha',
        ...(filename ? { filename } : {}),
      })
      .catch(() => undefined);

    expect(fetchMock).toHaveBeenCalled();
    const init = fetchMock.mock.calls[0]![1] as { body: FormData };
    return init.body;
  }

  it('envia o arquivo sob o campo `file`, não `certificate`', async () => {
    const body = await sentFormData();

    expect(body.has('file')).toBe(true);
    expect(body.has('certificate')).toBe(false);
  });

  it('mantém `file` quando um filename é informado', async () => {
    const body = await sentFormData('cert.pfx');

    expect(body.has('file')).toBe(true);
    expect(body.has('certificate')).toBe(false);
  });

  it('envia a senha sob o campo `password`', async () => {
    const body = await sentFormData();

    expect(body.get('password')).toBe('senha');
  });
});
