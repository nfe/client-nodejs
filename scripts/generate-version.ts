/**
 * Gera `src/version.ts` a partir do `package.json`.
 *
 * Por que gerar em vez de ler em runtime: `require('../package.json')` quebra em
 * bundle, acopla o runtime ao layout do pacote publicado e muda de caminho entre
 * ESM e CJS. Gerar resolve os três de uma vez, e o custo é uma constante.
 *
 * Por que não confiar só na geração: quem esquecer de rodar isto após um bump
 * teria a constante velha e nada avisaria. Por isso `tests/unit/version.test.ts`
 * compara a constante com o `package.json` lido em tempo de teste e falha na
 * divergência — a geração é a conveniência, o teste é a garantia.
 *
 * Contexto: até 2026-09-02 o User-Agent trazia `@nfe-io/sdk@3.0.0` fixo no código
 * — nome de pacote inexistente e versão três majors atrás. 93.995 requisições nos
 * 30 dias anteriores chegaram ao gateway assim, sem um único sinal de qual versão
 * estava em campo.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

async function main(): Promise<void> {
  const raw = await readFile(resolve(repoRoot, 'package.json'), 'utf8');
  const pkg = JSON.parse(raw) as { name?: unknown; version?: unknown };

  if (typeof pkg.name !== 'string' || typeof pkg.version !== 'string') {
    throw new Error('package.json precisa de "name" e "version" como string');
  }

  const conteudo = `/**
 * Identidade do pacote — GERADO por \`scripts/generate-version.ts\`.
 *
 * NÃO editar à mão, e NÃO fixar literal em outro lugar: até 2026-09-02 havia três
 * versões diferentes no repositório e o User-Agent reportava uma quarta, inexistente.
 * \`tests/unit/version.test.ts\` compara estas constantes com o \`package.json\` e
 * falha na divergência.
 */

/** Nome do pacote como publicado no npm. */
export const PACKAGE_NAME = '${pkg.name}';

/** Versão desta build, vinda do \`package.json\`. */
export const VERSION = '${pkg.version}';
`;

  const destino = resolve(repoRoot, 'src/version.ts');
  const anterior = await readFile(destino, 'utf8').catch(() => '');

  if (anterior === conteudo) {
    console.log(`✓ src/version.ts já em ${pkg.name}@${pkg.version}`);
    return;
  }

  await writeFile(destino, conteudo, 'utf8');
  console.log(`✓ src/version.ts gerado: ${pkg.name}@${pkg.version}`);
}

main().catch((erro: unknown) => {
  console.error('✗ falha ao gerar src/version.ts:', erro);
  process.exit(1);
});
