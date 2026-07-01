/**
 * NFE.io SDK v5 - NFC-e (Consumer Invoices)
 *
 * Ciclo de vida da NFC-e (nota fiscal de consumidor). Emissão é webhook-driven
 * (202 = enfileirada; conclusão notificada via webhook — NÃO faz polling).
 * ATENÇÃO: `list` e as leituras exigem `environment` ('Production' | 'Test').
 *
 * Prereqs: NFE_API_KEY + empresa habilitada para NFC-e.
 *   node examples/consumer-invoices.js
 */

import { NfeClient } from '../dist/index.js';

const nfe = new NfeClient({ apiKey: process.env.NFE_API_KEY, environment: 'development' });
const companyId = process.env.NFE_COMPANY_ID;
const ENV = 'Test'; // homologação; use 'Production' em produção

async function listAndInspect() {
  console.log('\n🧾 Listar NFC-e (environment é obrigatório)');
  const { consumerInvoices = [], hasMore } = await nfe.consumerInvoices.list(companyId, {
    environment: ENV,
    limit: 5,
  });
  console.log(`  ${consumerInvoices.length} nota(s), hasMore=${hasMore}`);

  const first = consumerInvoices[0];
  if (!first) return;

  // Leituras aceitam environment opcional (passe se a API exigir)
  const full = await nfe.consumerInvoices.retrieve(companyId, first.id, ENV);
  console.log('  status:', full.flowStatus ?? full.status);

  const items = await nfe.consumerInvoices.getItems(companyId, first.id, ENV);
  const events = await nfe.consumerInvoices.getEvents(companyId, first.id, ENV);
  console.log(`  itens=${items.items?.length ?? '?'} eventos=${events.events?.length ?? '?'}`);
}

async function emit() {
  console.log('\n📤 Emitir NFC-e (webhook-driven)');
  const invoice = await nfe.consumerInvoices.create(companyId, {
    buyer: { federalTaxNumber: 52998224725, name: 'Consumidor Final' },
    items: [{ code: '001', description: 'Produto', quantity: 1, unitAmount: 10.0 }],
    payment: { method: 'Cash', amount: 10.0 },
  });
  console.log('  enfileirada (aguarde o webhook):', invoice.id ?? '(202)');
  return invoice.id;
}

async function downloads(invoiceId) {
  if (!invoiceId) return;
  console.log('\n⬇️  Downloads (DANFE-NFC-e / XML)');
  const pdf = await nfe.consumerInvoices.downloadPdf(companyId, invoiceId, ENV);
  const xml = await nfe.consumerInvoices.downloadXml(companyId, invoiceId, ENV);
  console.log(`  pdf=${pdf.length}B xml=${xml.length}B`);
}

async function main() {
  if (!process.env.NFE_API_KEY || !companyId) {
    console.error('Defina NFE_API_KEY e NFE_COMPANY_ID.');
    process.exit(1);
  }
  try {
    await listAndInspect();
    // await emit();  // descomente para emitir de fato (homologação)
    // Cancelamento: await nfe.consumerInvoices.cancel(companyId, invoiceId);
    // Inutilização: await nfe.consumerInvoices.disable(companyId, { serie, numberStart, numberEnd });
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

main();
