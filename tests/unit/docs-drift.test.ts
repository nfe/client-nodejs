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
import { join, dirname } from 'node:path';

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

// ---------------------------------------------------------------------------
// Métodos sem caminho de sucesso
// ---------------------------------------------------------------------------

/**
 * Um método depreciado porque a plataforma não serve a rota nunca funciona.
 *
 * Em 2026-10-15, um mês depois de a v6 depreciar `municipalTaxes.updatePrefecture`,
 * `municipalTaxes.getSeries` e `consumerInvoiceQuery.*`, eles ainda eram ensinados como
 * funcionais na página do recurso, numa referência da skill, no README e nos exemplos
 * — o de inscrições municipais chamava `getSeries` de fato. A verificação de nomes acima
 * não pega isso: o nome existe, só está depreciado.
 *
 * O conjunto sai do código (JSDoc com `@deprecated`), não de uma lista à mão: um método
 * novo depreciado entra sozinho. Ficam fora só as depreciações FUNCIONAIS — o método
 * funciona e foi superado — listadas abaixo com o motivo.
 *
 * LIMITE, de propósito: o critério de "trecho" é sintático. Aceita o aviso no mesmo bloco
 * (parágrafo, linha de tabela, bloco de código; em `examples/`, os comentários logo acima)
 * ou no título da seção, mesmo que o aviso fale de outro método. O CHANGELOG fica fora por
 * ser histórico.
 */
const DEPRECIACOES_FUNCIONAIS: Record<string, string> = {
  'companies.list':
    'a v1 foi superada pelo listV2, mas funciona; a doc de companies é revista na v6.1.0',
  'webhooks.getAvailableEvents':
    'lista fixa superada pelo fetchEventTypes, mas funciona',
};

const AVISO = /deprec|depreci|descontinuad|n[ãa]o (é )?servid|not served|\b404\b/i;

/** Nome do recurso no cliente a partir do arquivo: `consumer-invoice-query.ts` → `consumerInvoiceQuery`. */
const recursoDoArquivo = (arquivo: string): string =>
  arquivo.replace(/\.ts$/, '').replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/**
 * `recurso.metodo` de todo método depreciado: o JSDoc imediatamente anterior ao método traz
 * `@deprecated`, ou o da classe traz — aí valem todos os métodos públicos dela (é o caso de
 * `consumerInvoiceQuery`, cujas duas rotas não são servidas).
 */
function metodosDepreciados(): Set<string> {
  const conjunto = new Set<string>();
  const dir = 'src/core/resources';
  for (const arquivo of readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts')) {
    const texto = readFileSync(join(dir, arquivo), 'utf8');
    const recurso = recursoDoArquivo(arquivo);
    for (const m of texto.matchAll(/\/\*\*((?:(?!\*\/)[\s\S])*?)\*\/\s*(?:async\s+)?\*?\s*(\w+)\s*[(<]/g)) {
      if (m[1]!.includes('@deprecated')) conjunto.add(`${recurso}.${m[2]}`);
    }
    const classe = /\/\*\*((?:(?!\*\/)[\s\S])*?)\*\/\s*export\s+class\s+\w+/.exec(texto);
    if (classe?.[1]!.includes('@deprecated')) {
      for (const m of texto.matchAll(/^ {2}(?:public\s+)?(?:async\s+)?\*?(\w+)\s*[(<]/gm)) {
        if (m[1] !== 'constructor') conjunto.add(`${recurso}.${m[1]}`);
      }
    }
  }
  return conjunto;
}

/** Arquivos de texto sob `dir`, recursivamente, com uma das extensões. */
function listarRecursivo(dir: string, extensoes: string[]): string[] {
  if (!existsSync(dir)) return [];
  const saida: string[] = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) saida.push(...listarRecursivo(caminho, extensoes));
    else if (extensoes.some(ext => entrada.name.endsWith(ext))) saida.push(caminho);
  }
  return saida;
}

/** O trecho em volta da linha `i`: bloco de código cercado, linha de tabela ou parágrafo. */
function trechoMarkdown(linhas: string[], i: number): string {
  // Dentro de bloco cercado? Conta as cercas antes da linha.
  const cercas: number[] = [];
  linhas.forEach((l, n) => {
    if (/^\s*```/.test(l)) cercas.push(n);
  });
  for (let k = 0; k + 1 < cercas.length; k += 2) {
    if (i > cercas[k]! && i < cercas[k + 1]!) return linhas.slice(cercas[k]!, cercas[k + 1]! + 1).join('\n');
  }
  if (/^\s*\|/.test(linhas[i]!)) return linhas[i]!;
  let ini = i;
  let fim = i;
  while (ini > 0 && linhas[ini - 1]!.trim() !== '') ini--;
  while (fim + 1 < linhas.length && linhas[fim + 1]!.trim() !== '') fim++;
  return linhas.slice(ini, fim + 1).join('\n');
}

/** O título da seção mais próxima acima da linha `i`. */
function tituloDaSecao(linhas: string[], i: number): string {
  for (let n = i; n >= 0; n--) if (/^#{1,6}\s/.test(linhas[n]!)) return linhas[n]!;
  return '';
}

/** Em código de exemplo: os comentários contíguos logo acima da linha, mais a própria linha. */
function trechoCodigo(linhas: string[], i: number): string {
  let ini = i;
  while (ini > 0 && /^\s*(\/\/|\/\*|\*)/.test(linhas[ini - 1]!)) ini--;
  return linhas.slice(ini, i + 1).join('\n');
}

describe('métodos sem caminho de sucesso × documentação', () => {
  const depreciados = metodosDepreciados();
  const naoServidos = [...depreciados].filter(m => !(m in DEPRECIACOES_FUNCIONAIS));

  it('o conjunto sai do código e inclui os métodos sobre rota não servida', () => {
    for (const m of [
      'municipalTaxes.updatePrefecture',
      'municipalTaxes.getSeries',
      'consumerInvoiceQuery.retrieve',
      'consumerInvoiceQuery.downloadXml',
      'webhooks.create',
    ]) {
      expect(naoServidos, `${m} deveria estar no conjunto derivado do código`).toContain(m);
    }
  });

  it('toda depreciação funcional listada existe no código, com motivo', () => {
    for (const [metodo, motivo] of Object.entries(DEPRECIACOES_FUNCIONAIS)) {
      expect(depreciados, `${metodo} não está mais depreciado: tire da lista`).toContain(metodo);
      expect(motivo.length).toBeGreaterThan(10);
    }
  });

  it('nenhum documento ensina método sem caminho de sucesso sem avisar', () => {
    const arquivos = [
      'README.md',
      'MIGRATION.md',
      ...listarRecursivo('docs', ['.md']),
      ...listarRecursivo('skills', ['.md']),
      ...listarRecursivo('examples', ['.md', '.js', '.ts', '.mjs', '.cjs']),
    ].filter(existsSync);

    const semAviso: string[] = [];
    for (const arquivo of arquivos) {
      const linhas = readFileSync(arquivo, 'utf8').split('\n');
      const ehMarkdown = arquivo.endsWith('.md');
      linhas.forEach((linha, i) => {
        for (const metodo of naoServidos) {
          const [recurso, nome] = metodo.split('.') as [string, string];
          if (!new RegExp(`\\b${recurso}\\.${nome}\\s*\\(`).test(linha)) continue;
          const trecho = ehMarkdown
            ? `${trechoMarkdown(linhas, i)}\n${tituloDaSecao(linhas, i)}`
            : trechoCodigo(linhas, i);
          if (!AVISO.test(trecho)) semAviso.push(`${arquivo}:${i + 1}: ${metodo}()`);
        }
      });
    }

    expect(
      semAviso,
      `Documentação ensina método sem caminho de sucesso sem avisar:\n  ${semAviso.join('\n  ')}`
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Links relativos
// ---------------------------------------------------------------------------

/**
 * Link relativo precisa apontar para arquivo que existe.
 *
 * Em 2026-09-04 a issue #47 apontou três: `README.md` → `docs/MIGRATION-TO-GENERATED-TYPES.md`,
 * `CHANGELOG.md` → `RELEASE_NOTES_v3.md` e `docs/API.md` → `../LICENSE`, que nunca existiu.
 *
 * `docs/` é espelhado no portal (`nfeio-docs`), onde a árvore em volta é outra: um link
 * relativo que sai de `docs/` funciona no GitHub e quebra no portal. Por isso, em `docs/**`,
 * resolver para fora de `docs/` também falha — para o README ou o LICENSE, use URL absoluta.
 *
 * LIMITE: âncoras (`#secao`) não são validadas. Validá-las exigiria reproduzir os
 * algoritmos de slug do GitHub e do Docusaurus, que diferem.
 */
function linksQuebrados(arquivo: string, texto: string): string[] {
  const problemas: string[] = [];
  let dentroDeCodigo = false;
  texto.split('\n').forEach((linha, i) => {
    if (/^\s*```/.test(linha)) dentroDeCodigo = !dentroDeCodigo;
    if (dentroDeCodigo) return;
    for (const m of linha.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const alvo = m[1]!;
      if (/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(alvo)) continue; // URL, âncora pura ou rota do site
      const caminho = decodeURI(alvo.split('#')[0]!.split('?')[0]!);
      if (caminho === '') continue;
      const resolvido = join(dirname(arquivo), caminho);
      if (!existsSync(resolvido)) {
        problemas.push(`${arquivo}:${i + 1}: ${alvo} (não existe)`);
      } else if (arquivo.startsWith('docs/') && !resolvido.startsWith('docs/')) {
        problemas.push(`${arquivo}:${i + 1}: ${alvo} (sai de docs/; quebra no portal)`);
      }
    }
  });
  return problemas;
}

describe('links relativos da documentação', () => {
  it('apontam para arquivos que existem', () => {
    const arquivos = [
      'README.md',
      'MIGRATION.md',
      'CHANGELOG.md',
      ...listarRecursivo('docs', ['.md']),
      ...listarRecursivo('skills', ['.md']),
    ].filter(existsSync);

    const quebrados = arquivos.flatMap(a => linksQuebrados(a, readFileSync(a, 'utf8')));

    expect(quebrados, `Links quebrados:\n  ${quebrados.join('\n  ')}`).toEqual([]);
  });

  it('a verificação pega de verdade um link quebrado e um que sai de docs/', () => {
    expect(linksQuebrados('README.md', '[x](./NAO-EXISTE.md)')).toHaveLength(1);
    expect(linksQuebrados('docs/API.md', '[x](../README.md)')).toHaveLength(1);
    expect(linksQuebrados('README.md', '[x](https://example.com) [y](#ancora)')).toHaveLength(0);
  });
});
