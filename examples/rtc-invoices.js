/**
 * NFE.io SDK v5 - Reforma Tributária do Consumo (RTC)
 *
 * Emissão no leiaute RTC (grupos IBS/CBS/IS). O RTC é selecionado pelo PAYLOAD —
 * o endpoint é o mesmo da emissão atual. NFS-e usa polling; NF-e/NFC-e é
 * webhook-driven (não faz polling).
 *
 * Prereqs: NFE_API_KEY + empresa com inscrição municipal/estadual apta a emitir.
 *   node examples/rtc-invoices.js
 */

import { NfeClient } from '../dist/index.js';

const nfe = new NfeClient({ apiKey: process.env.NFE_API_KEY, environment: 'development' });
const companyId = process.env.NFE_COMPANY_ID;

/** NFS-e RTC — polling via createAndWait */
async function serviceInvoiceRtc() {
  console.log('\n🧾 NFS-e RTC (serviceInvoicesRtc)');

  // create() retorna união discriminada { status: 'immediate'|'async' }
  const result = await nfe.serviceInvoicesRtc.create(companyId, {
    borrower: { federalTaxNumber: 52998224725, name: 'Cliente Teste' },
    cityServiceCode: '10677',
    description: 'Serviço de teste RTC',
    servicesAmount: 100.0,
    ibsCbs: {
      /* grupo RTC — preencha conforme a NT_2025.002 (IBS/CBS) */
    },
  });

  if (result.status === 'async') {
    console.log('  enfileirada:', result.response.invoiceId);
    // ...ou bloqueie até emitir:
    const invoice = await nfe.serviceInvoicesRtc.createAndWait(companyId, {
      borrower: { federalTaxNumber: 52998224725, name: 'Cliente Teste' },
      cityServiceCode: '10677',
      description: 'Serviço de teste RTC',
      servicesAmount: 100.0,
      ibsCbs: {},
    });
    console.log('  emitida:', invoice.id, invoice.flowStatus);
  } else {
    console.log('  emitida (sync):', result.invoice.id);
  }
}

/** NF-e/NFC-e RTC — webhook-driven (202 = enfileirada; conclusão via webhook) */
async function productInvoiceRtc() {
  console.log('\n📦 NF-e RTC (productInvoicesRtc)');

  const invoice = await nfe.productInvoicesRtc.create(companyId, {
    // payload NF-e/NFC-e com grupos RTC (IBS estadual/municipal, CBS, IS)
    buyer: { federalTaxNumber: 52998224725, name: 'Cliente Teste' },
    items: [{ code: '001', description: 'Produto', quantity: 1, unitAmount: 100.0 }],
    ibsCbsIs: {
      /* grupos RTC conforme a NT_2025.002 */
    },
  });
  console.log('  enfileirada (aguarde o webhook):', invoice.id ?? '(202)');
}

async function main() {
  if (!process.env.NFE_API_KEY || !companyId) {
    console.error('Defina NFE_API_KEY e NFE_COMPANY_ID (empresa apta a emitir).');
    process.exit(1);
  }
  try {
    await serviceInvoiceRtc();
    await productInvoiceRtc();
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

main();
