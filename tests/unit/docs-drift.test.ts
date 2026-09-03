/**
 * A documentação cita método que existe?
 *
 * Em 2026-09-02 o README trazia exemplo copiável chamando
 * `nfe.addresses.lookupByTerm()` e `nfe.addresses.search()` — removidos na v5,
 * porque as rotas respondem 404. O trecho não compilava. E a skill publicada
 * chamava `uploadCertificate(companyId, certBuffer, 'password')`, quando a
 * assinatura recebe um objeto.
 *
 * Exemplo que não compila é pior que ausência de exemplo: o leitor gasta tempo
 * procurando erro no próprio código.
 *
 * LIMITE DESTA VERIFICAÇÃO, de propósito: ela casa **nome de método**, não
 * assinatura. Conferir assinatura exigiria compilar cada bloco de exemplo, o que
 * é trabalho de outra change. Mesmo grosseira, ela pega os casos reais desta
 * rodada — e custa milissegundos.
 *
 * Também NÃO cobre a tabela de host × chave de `docs/multi-host-routing.md`:
 * derivá-la do código exigiria interpretar a construção dos resources, e a
 * heurística erraria mais do que acertaria. Aquilo é conferência manual.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Superfície pública: tudo que os resources e o cliente declaram. */
function superficiePublica(): string {
  const partes: string[] = [readFileSync('src/core/client.ts', 'utf8')];
  const dir = 'src/core/resources';
  for (const arquivo of readdirSync(dir).filter(f => f.endsWith('.ts'))) {
    partes.push(readFileSync(join(dir, arquivo), 'utf8'));
  }
  // Utilitários também aparecem em exemplos (CertificateValidator, polling, ...).
  for (const extra of ['src/core/utils', 'src/core/errors']) {
    if (!existsSync(extra)) continue;
    for (const arquivo of readdirSync(extra).filter(f => f.endsWith('.ts'))) {
      partes.push(readFileSync(join(extra, arquivo), 'utf8'));
    }
  }
  return partes.join('\n');
}

/** Arquivos de documentação que trazem exemplo executável. */
function arquivosDeDocumentacao(): string[] {
  const arquivos = ['README.md'];
  for (const [dir, prefixo] of [
    ['docs', 'docs'],
    ['skills/nfeio-node-sdk', 'skills/nfeio-node-sdk'],
  ] as const) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter(f => f.endsWith('.md'))) {
      arquivos.push(join(prefixo, f));
    }
  }
  // A skill tem referências em subpasta.
  const refs = 'skills/nfeio-node-sdk/references';
  if (existsSync(refs)) {
    for (const f of readdirSync(refs).filter(f => f.endsWith('.md'))) {
      arquivos.push(join(refs, f));
    }
  }
  return arquivos.filter(existsSync);
}

describe('documentação × código', () => {
  const codigo = superficiePublica();
  const docs = arquivosDeDocumentacao();

  it('encontra arquivos de documentação para verificar', () => {
    expect(docs.length).toBeGreaterThan(3);
    expect(docs).toContain('README.md');
  });

  it('nenhum exemplo chama método que não existe', () => {
    const ausentes: string[] = [];

    for (const arquivo of docs) {
      const texto = readFileSync(arquivo, 'utf8');
      for (const m of texto.matchAll(/\bnfe\.(\w+)\.(\w+)\s*\(/g)) {
        const metodo = m[2]!;
        // Casa `metodo(`, `async metodo(`, `metodo<T>(` na superfície pública.
        const existe = new RegExp(`\\b${metodo}\\s*[(<]`).test(codigo);
        if (!existe) ausentes.push(`${arquivo}: nfe.${m[1]}.${metodo}()`);
      }
    }

    expect(
      ausentes,
      `Documentação cita método inexistente:\n  ${ausentes.join('\n  ')}`
    ).toEqual([]);
  });

  it('a verificação pega de verdade um método inventado', () => {
    // Guarda da guarda: se a heurística parar de casar, este teste avisa.
    const inventado = 'metodoQueNaoExisteEmLugarNenhum';
    expect(new RegExp(`\\b${inventado}\\s*[(<]`).test(codigo)).toBe(false);
  });
});
