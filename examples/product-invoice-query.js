/**
 * Exemplo - Consulta de NF-e por Chave de Acesso
 *
 * Este exemplo demonstra como usar o recurso productInvoiceQuery para:
 * - Consultar dados completos de uma NF-e na SEFAZ
 * - Baixar DANFE (PDF)
 * - Baixar XML da NF-e
 * - Listar eventos fiscais (cancelamentos, correções, etc.)
 *
 * Pré-requisitos:
 * - Chave API configurada (apiKey ou dataApiKey)
 * - Chave de acesso válida de 44 dígitos
 *
 * Execute: node examples/product-invoice-query.js
 */

import { NfeClient } from '../dist/index.js';
import * as dotenv from 'dotenv';
import { writeFileSync } from 'fs';

// Carregar credenciais do .env.test
dotenv.config({ path: '.env.test' });

const apiKey = process.env.NFE_API_KEY || process.env.NFE_DATA_API_KEY;

if (!apiKey) {
  console.error('❌ NFE_API_KEY ou NFE_DATA_API_KEY não encontrada no .env.test');
  process.exit(1);
}

// Chave de acesso de exemplo (substitua por uma chave real para testar)
const ACCESS_KEY = process.argv[2] || '35240112345678000190550010000001231234567890';

// Inicializar cliente
const nfe = new NfeClient({
  apiKey,
  environment: process.env.NFE_TEST_ENVIRONMENT || 'production',
});

console.log('🔍 NFE.io SDK v3 - Consulta de NF-e por Chave de Acesso');
console.log('═'.repeat(70));
console.log(`Chave de acesso: ${ACCESS_KEY}`);
console.log('═'.repeat(70));

// ============================================================================
// 1. Consultar dados completos da NF-e
// ============================================================================

async function retrieveInvoice() {
  console.log('\n📋 1. Consultando dados da NF-e...');

  try {
    const invoice = await nfe.productInvoiceQuery.retrieve(ACCESS_KEY);

    console.log(`   Status: ${invoice.currentStatus}`);
    console.log(`   Emissor: ${invoice.issuer?.name ?? 'N/A'}`);
    console.log(`   CNPJ Emissor: ${invoice.issuer?.federalTaxNumber ?? 'N/A'}`);
    console.log(`   Destinatário: ${invoice.buyer?.name ?? 'N/A'}`);

    if (invoice.totals?.icms) {
      console.log(`   Valor Total: R$ ${invoice.totals.icms.invoiceAmount?.toFixed(2) ?? 'N/A'}`);
      console.log(`   Base ICMS: R$ ${invoice.totals.icms.taxBaseAmount?.toFixed(2) ?? 'N/A'}`);
      console.log(`   Valor ICMS: R$ ${invoice.totals.icms.taxAmount?.toFixed(2) ?? 'N/A'}`);
    }

    if (invoice.items?.length) {
      console.log(`   Itens: ${invoice.items.length}`);
      for (const item of invoice.items.slice(0, 3)) {
        console.log(`     - ${item.description} (Qtd: ${item.quantity})`);
      }
      if (invoice.items.length > 3) {
        console.log(`     ... e mais ${invoice.items.length - 3} itens`);
      }
    }

    return invoice;
  } catch (err) {
    console.error(`   ❌ Erro: ${err.message}`);
    return null;
  }
}

// ============================================================================
// 2. Baixar DANFE (PDF)
// ============================================================================

async function downloadPdf() {
  console.log('\n📄 2. Baixando DANFE (PDF)...');

  try {
    const pdfBuffer = await nfe.productInvoiceQuery.downloadPdf(ACCESS_KEY);
    const filename = `danfe-${ACCESS_KEY.substring(0, 10)}.pdf`;
    writeFileSync(filename, pdfBuffer);
    console.log(`   ✅ DANFE salvo em: ${filename} (${pdfBuffer.length} bytes)`);
  } catch (err) {
    console.error(`   ❌ Erro: ${err.message}`);
  }
}

// ============================================================================
// 3. Baixar XML da NF-e
// ============================================================================

async function downloadXml() {
  console.log('\n📝 3. Baixando XML da NF-e...');

  try {
    const xmlBuffer = await nfe.productInvoiceQuery.downloadXml(ACCESS_KEY);
    const filename = `nfe-${ACCESS_KEY.substring(0, 10)}.xml`;
    writeFileSync(filename, xmlBuffer);
    console.log(`   ✅ XML salvo em: ${filename} (${xmlBuffer.length} bytes)`);
  } catch (err) {
    console.error(`   ❌ Erro: ${err.message}`);
  }
}

// ============================================================================
// 4. Listar eventos fiscais
// ============================================================================

async function listEvents() {
  console.log('\n📅 4. Listando eventos fiscais...');

  try {
    const result = await nfe.productInvoiceQuery.listEvents(ACCESS_KEY);

    if (!result.events?.length) {
      console.log('   Nenhum evento encontrado');
      return;
    }

    console.log(`   Eventos encontrados: ${result.events.length}`);
    for (const event of result.events) {
      console.log(`   - ${event.eventType}: ${event.description}`);
      console.log(`     Protocolo: ${event.protocol ?? 'N/A'}`);
      console.log(`     Data: ${event.authorizedOn ?? 'N/A'}`);
    }
    console.log(`   Consultado em: ${result.queriedAt}`);
  } catch (err) {
    console.error(`   ❌ Erro: ${err.message}`);
  }
}

// ============================================================================
// Executar todos os exemplos
// ============================================================================

async function main() {
  try {
    await retrieveInvoice();
    await downloadPdf();
    await downloadXml();
    await listEvents();

    console.log('\n' + '═'.repeat(70));
    console.log('✅ Exemplo concluído!');
  } catch (err) {
    console.error('\n❌ Erro inesperado:', err.message);
    process.exit(1);
  }
}

main();
