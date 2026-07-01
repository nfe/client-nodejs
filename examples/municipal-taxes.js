/**
 * NFE.io SDK v5 - Inscrições Municipais (Municipal Taxes)
 *
 * CRUD de inscrições municipais — PRÉ-REQUISITO para emissão de NFS-e. Espelha
 * `stateTaxes`. Inclui `updatePrefecture` (HTTP PATCH) e `getSeries`.
 *
 *   node examples/municipal-taxes.js
 */

import { NfeClient } from '../dist/index.js';

const nfe = new NfeClient({ apiKey: process.env.NFE_API_KEY, environment: 'development' });
const companyId = process.env.NFE_COMPANY_ID;

async function main() {
  if (!process.env.NFE_API_KEY || !companyId) {
    console.error('Defina NFE_API_KEY e NFE_COMPANY_ID.');
    process.exit(1);
  }

  try {
    console.log('\n🏛️  Listar inscrições municipais');
    const { municipalTaxes = [] } = await nfe.municipalTaxes.list(companyId);
    console.log(`  ${municipalTaxes.length} inscrição(ões)`);

    const first = municipalTaxes[0];
    if (first) {
      const detail = await nfe.municipalTaxes.retrieve(companyId, first.id);
      console.log('  code:', detail.code, '| status:', detail.status);

      // Série de RPS para essa inscrição
      const series = await nfe.municipalTaxes.getSeries(companyId, first.id, '1');
      console.log('  série 1:', JSON.stringify(series).slice(0, 80));
    }

    // Criar (exemplo — descomente e ajuste ao seu município):
    // const created = await nfe.municipalTaxes.create(companyId, {
    //   code: '123456', specialTaxRegime: 'Nenhum', /* ...credenciais da prefeitura */
    // });

    // Atualizar credenciais da prefeitura (PATCH):
    // await nfe.municipalTaxes.updatePrefecture(companyId, created.id, { /* login/senha */ });
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

main();
