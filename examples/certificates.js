/**
 * NFE.io SDK v5 - Certificados por thumbprint (Certificates)
 *
 * Consulta/remoção de certificados digitais por thumbprint (host api.nfse.io).
 * Complementa o `companies.uploadCertificate` (upload legado, host api.nfe.io).
 * Há variantes v1 (`getByThumbprintV1`/`deleteByThumbprintV1`).
 *
 *   node examples/certificates.js
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
    console.log('\n🔐 Listar certificados da empresa');
    const list = await nfe.certificates.list(companyId);
    const certs = list.certificates ?? [];
    console.log(`  ${certs.length} certificado(s)`);

    const thumb = certs[0]?.thumbprint;
    if (thumb) {
      const cert = await nfe.certificates.getByThumbprint(companyId, thumb);
      console.log('  subject:', cert.subjectName ?? cert.subject ?? '(n/a)');
      console.log('  validade:', cert.expiresAt ?? cert.validTo ?? '(n/a)');

      // Remoção (descomente para remover de fato):
      // await nfe.certificates.deleteByThumbprint(companyId, thumb);

      // Variantes v1:
      // await nfe.certificates.getByThumbprintV1(companyId, thumb);
    } else {
      console.log('  (nenhum certificado — use companies.uploadCertificate para enviar um .pfx)');
    }
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

main();
