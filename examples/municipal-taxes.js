/**
 * NFE.io SDK - Inscrições Municipais (Municipal Taxes)
 *
 * CRUD de inscrições municipais — PRÉ-REQUISITO para emissão de NFS-e. Espelha
 * `stateTaxes`. O `update` é um PUT que SUBSTITUI a inscrição: leia, altere e envie o
 * objeto de volta, omitindo `rpsNumber`/`lastRpsSent` para preservar o contador de RPS.
 *
 * `updatePrefecture` e `getSeries` estão descontinuados (@deprecated): a plataforma não
 * serve essas rotas e a chamada termina em 404.
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
      console.log('  município:', detail.city?.name, '| IM:', detail.taxNumber, '| série:', detail.rpsSerialNumber, '| status:', detail.status);
    }

    // Criar (exemplo — descomente e ajuste ao seu município):
    // const created = await nfe.municipalTaxes.create(companyId, {
    //   city: { code: '4106902', name: 'Curitiba' },
    //   taxNumber: '123456',
    //   rpsSerialNumber: 'IO',
    //   environment: 'Development',
    // });

    // Atualizar: PUT de substituição. Leia, altere e reenvie, sem o contador de RPS.
    // const current = await nfe.municipalTaxes.retrieve(companyId, first.id);
    // const { rpsNumber, lastRpsSent, ...rest } = current;
    // await nfe.municipalTaxes.update(companyId, first.id, { ...rest, issRate: 2.5 });
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

main();
