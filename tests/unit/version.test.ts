/**
 * A identidade do SDK bate com o pacote publicado?
 *
 * Até 2026-09-02 havia QUATRO valores para uma informação só:
 *
 *   src/core/http/client.ts   `@nfe-io/sdk@3.0.0`   ← ia no fio, em toda requisição
 *   src/index.ts              PACKAGE_VERSION = '5.1.0', PACKAGE_NAME = '@nfe-io/sdk'
 *   src/core/client.ts        VERSION = '5.1.0'
 *   package.json              nfe-io@5.2.0          ← o único verdadeiro
 *
 * Nos 30 dias anteriores, 93.995 requisições chegaram ao gateway anunciando
 * `@nfe-io/sdk@3.0.0` — nome de pacote inexistente e versão três majors atrás, em
 * 23 variantes de User-Agent e 5 majors de Node. O User-Agent é o único sinal de
 * adoção que a plataforma tem, e ele estava cego.
 *
 * `src/version.ts` é gerado do `package.json` por `scripts/generate-version.ts`.
 * A geração é a conveniência; ESTE TESTE é a garantia — quem esquecer de rodá-la
 * após um bump, ou voltar a fixar um literal, quebra aqui.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { PACKAGE_NAME, PACKAGE_VERSION, VERSION } from '../../src/index.js';

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
  name: string;
  version: string;
};

describe('identidade do pacote', () => {
  it('PACKAGE_NAME é o nome publicado no npm', () => {
    expect(PACKAGE_NAME).toBe(pkg.name);
  });

  it('PACKAGE_VERSION é a versão do package.json', () => {
    expect(PACKAGE_VERSION).toBe(pkg.version);
  });

  it('VERSION concorda com PACKAGE_VERSION — uma informação, um valor', () => {
    expect(VERSION).toBe(pkg.version);
    expect(VERSION).toBe(PACKAGE_VERSION);
  });

  it('o package-lock.json acompanha o package.json', () => {
    // A 6.0.0 subiu só o package.json, e o lockfile ficou em 5.2.0 até a 6.0.1.
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')) as {
      name: string;
      version: string;
      packages: Record<string, { name?: string; version?: string }>;
    };
    expect(lock.name).toBe(pkg.name);
    expect(lock.version).toBe(pkg.version);
    expect(lock.packages['']?.version).toBe(pkg.version);
  });

  it('nenhuma tag @version fixa a versão num comentário de src/', () => {
    // A varredura de literais abaixo ignora comentários, porque as notas históricas
    // citam versões antigas. Uma tag `@version` não é nota: declara a versão, e
    // apodrece — o cabeçalho de src/index.ts disse `@version 5.1.0` até a 6.0.1.
    // src/generated/ fica fora: é gerado da spec, e uma versão ali seria a da API.
    const arquivos = (readdirSync('src', { recursive: true, encoding: 'utf8' }) as string[])
      .filter(a => a.endsWith('.ts') && a.split(sep)[0] !== 'generated')
      .map(a => join('src', a));
    const comTag = arquivos.filter(a => /@version\s+\d+\.\d+\.\d+/.test(readFileSync(a, 'utf8')));
    expect(comTag).toEqual([]);
  });

  it('nenhum literal de versão sobrou em src/', () => {
    // Varredura direta: o que quebrou antes foi exatamente isto — alguém fixar o
    // valor em vez de derivar. `src/version.ts` é o único lugar onde ele aparece.
    const arquivos = ['src/index.ts', 'src/core/client.ts', 'src/core/http/client.ts'];
    for (const arquivo of arquivos) {
      const conteudo = readFileSync(arquivo, 'utf8');
      // Ignora blocos de comentário — as notas históricas citam os valores antigos.
      const codigo = conteudo
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(?<!:)\/\/.*$/gm, '');
      expect(codigo, `${arquivo} fixa uma versão literal`).not.toMatch(
        /=\s*['"]\d+\.\d+\.\d+['"]/
      );
    }
  });

  it('o nome inexistente `@nfe-io/sdk` não volta ao código', () => {
    for (const arquivo of ['src/index.ts', 'src/core/client.ts', 'src/core/http/client.ts']) {
      const codigo = readFileSync(arquivo, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(?<!:)\/\/.*$/gm, '');
      expect(codigo, `${arquivo} cita um pacote que não existe`).not.toContain('@nfe-io/sdk');
    }
  });
});

describe('User-Agent', () => {
  /** Extrai o User-Agent efetivamente enviado, sem depender de mock de rede. */
  async function userAgentEnviado(): Promise<string> {
    const { HttpClient, buildHttpConfig } = await import('../../src/core/http/client.js');
    let capturado = '';

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_url: string, init: any) => {
      capturado = init?.headers?.['User-Agent'] ?? '';
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/json' : null),
          forEach: () => {},
        },
        json: async () => ({}),
        text: async () => '{}',
        arrayBuffer: async () => new ArrayBuffer(0),
      };
    }) as any;

    try {
      const client = new HttpClient(
        buildHttpConfig('k', 'https://api.nfe.io/v1', 5000, {
          maxRetries: 0,
          baseDelay: 1,
          maxDelay: 1,
        })
      );
      await client.get('/companies');
    } finally {
      globalThis.fetch = originalFetch;
    }

    return capturado;
  }

  it('reporta o pacote e a versão reais', async () => {
    const ua = await userAgentEnviado();

    expect(ua).toContain(`${pkg.name}@${pkg.version}`);
    expect(ua).not.toContain('@nfe-io/sdk');
    expect(ua).not.toContain('3.0.0');
  });

  it('mantém Node e plataforma, que já eram o sinal útil', async () => {
    const ua = await userAgentEnviado();

    expect(ua).toContain(`node/${process.version}`);
    expect(ua).toContain(process.platform);
  });
});
