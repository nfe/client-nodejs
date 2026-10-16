/**
 * A licença declarada vem junto do código?
 *
 * Até a v6.0.0 o repositório não tinha arquivo de licença: o MIT existia só no
 * campo `license` do package.json, e a API do GitHub reportava o repositório
 * como sem licença (issue #47). Para uma varredura de dependências ou uma
 * revisão jurídica, licença só em metadado é "licença não confirmada".
 *
 * Este teste prende três coisas:
 * - o SPDX do package.json corresponde ao texto do LICENSE, comparado ao modelo
 *   inteiro, não a uma palavra-chave;
 * - o LICENSE entra no tarball (`npm pack --dry-run`, sem rodar scripts);
 * - todo lugar que cita a licença usa o mesmo SPDX e a mesma forma do titular.
 *
 * Trocar de licença exige trocar o modelo aqui junto, de propósito: o teste
 * falha até as duas coisas andarem juntas.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

/** Decisão de 2026-10-16 (design D6 da change fix-inbound-routes-and-doc-accuracy). */
const TITULAR = 'NFE.IO HUB SERVICOS DE TECNOLOGIA LTDA';
const LINHA_DE_COPYRIGHT = `Copyright (c) 2026 ${TITULAR}`;

/** Modelos por SPDX, no formato do choosealicense.com, que é o que o GitHub usa para detectar. */
const MODELOS: Record<string, string> = {
  MIT: `MIT License

Copyright (c) [year] [fullname]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
};

const normalizar = (texto: string) => texto.replace(/\s+/g, ' ').trim();

/** `null` quando o texto é o modelo do SPDX declarado; senão, o motivo. */
function divergenciaDoTexto(spdx: string, texto: string): string | null {
  const modelo = MODELOS[spdx];
  if (!modelo) return `SPDX "${spdx}" sem modelo neste teste: atualize MODELOS junto com a licença`;
  const linha = texto.split('\n').find(l => l.startsWith('Copyright (c) '));
  if (!linha) return 'o texto não tem linha de copyright';
  const preenchido = modelo.replace('Copyright (c) [year] [fullname]', linha.trim());
  return normalizar(preenchido) === normalizar(texto) ? null : `o texto não é o modelo ${spdx}`;
}

/** O npm inclui LICENSE/LICENCE da raiz no tarball mesmo fora de `files`. */
const temArquivoDeLicenca = (arquivos: string[]) =>
  arquivos.some(a => /^LICEN[CS]E(\.[a-z]+)?$/i.test(a));

function arquivosDoTarball(): string[] {
  const saida = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const [pacote] = JSON.parse(saida) as Array<{ files: Array<{ path: string }> }>;
  return pacote?.files.map(f => f.path) ?? [];
}

/** Citações de titular que não usam a forma decidida ("MIT © NFE.io", "NFe.io", pessoa física). */
function titularesDivergentes(arquivo: string, conteudo: string): string[] {
  const citacoes = conteudo.match(/(?:Copyright \(c\)|©|@copyright)[^\n]*/gi) ?? [];
  return citacoes.filter(c => !c.includes(TITULAR)).map(c => `${arquivo}: "${c.trim()}"`);
}

function listarRecursivo(dir: string, extensao: string): string[] {
  return readdirSync(dir).flatMap(nome => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return listarRecursivo(caminho, extensao);
    return caminho.endsWith(extensao) ? [caminho] : [];
  });
}

describe('licença do pacote', () => {
  const spdx =
    (JSON.parse(readFileSync('package.json', 'utf8')) as { license?: string }).license ?? '';
  const texto = readFileSync('LICENSE', 'utf8');

  it('o SPDX do package.json corresponde ao texto do LICENSE', () => {
    expect(divergenciaDoTexto(spdx, texto)).toBeNull();
  });

  it('o LICENSE traz o titular decidido', () => {
    expect(texto).toContain(LINHA_DE_COPYRIGHT);
  });

  it('o LICENSE entra no tarball', () => {
    expect(temArquivoDeLicenca(arquivosDoTarball())).toBe(true);
  }, 30_000);

  it('os lugares que citam a licença usam o SPDX declarado e o mesmo titular', () => {
    const citacoes: Array<[arquivo: string, trechos: string[]]> = [
      ['README.md', [`[${spdx}](./LICENSE)`, LINHA_DE_COPYRIGHT]],
      ['CONTRIBUTING.md', [spdx, '[LICENSE](./LICENSE)']],
      ['src/index.ts', [`@license ${spdx}`, `@copyright 2026 ${TITULAR}`]],
      ['src/core/client.ts', [`@license ${spdx}`, `@copyright 2026 ${TITULAR}`]],
      ['tsdown.config.ts', [`SPDX-License-Identifier: ${spdx}`, LINHA_DE_COPYRIGHT]],
    ];
    const faltas = citacoes.flatMap(([arquivo, trechos]) => {
      const conteudo = readFileSync(arquivo, 'utf8');
      return trechos.filter(t => !conteudo.includes(t)).map(t => `${arquivo}: falta "${t}"`);
    });
    expect(faltas).toEqual([]);
  });

  it('nenhum lugar escreve o titular de outro jeito', () => {
    const arquivos = [
      'LICENSE',
      'README.md',
      'MIGRATION.md',
      'CONTRIBUTING.md',
      'tsdown.config.ts',
      ...listarRecursivo('src', '.ts').filter(a => !a.startsWith(join('src', 'generated'))),
      ...listarRecursivo('docs', '.md'),
      ...listarRecursivo('skills', '.md'),
    ];
    const divergentes = arquivos.flatMap(a => titularesDivergentes(a, readFileSync(a, 'utf8')));
    expect(divergentes).toEqual([]);
  });

  describe('a verificação falha quando deve', () => {
    it('SPDX trocado sem trocar o texto', () => {
      expect(divergenciaDoTexto('Apache-2.0', texto)).not.toBeNull();
    });

    it('texto do LICENSE alterado', () => {
      expect(divergenciaDoTexto('MIT', texto.replace('free of charge', 'for a fee'))).not.toBeNull();
    });

    it('LICENSE fora do tarball', () => {
      expect(temArquivoDeLicenca(['package.json', 'README.md', 'dist/index.js'])).toBe(false);
    });

    it('titular na forma antiga do README', () => {
      expect(titularesDivergentes('README.md', 'MIT © [NFE.io](https://nfe.io)')).toHaveLength(1);
    });
  });
});
