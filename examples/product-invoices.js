/**
 * NFE.io SDK v3 — Product Invoices (NF-e) Example
 *
 * Demonstrates creating, listing, retrieving, downloading files,
 * sending correction letters, and disabling product invoices.
 *
 * Usage:
 *   NFE_APIKEY=your-key node examples/product-invoices.js
 */

const { NfeClient } = require('../src/index.js');

const apiKey = process.env.NFE_APIKEY || process.env.NFE_API_KEY;
if (!apiKey) {
  console.error('Set NFE_APIKEY or NFE_API_KEY environment variable');
  process.exit(1);
}

const companyId = process.env.NFE_COMPANY_ID || 'YOUR_COMPANY_ID';

const nfe = new NfeClient({
  apiKey,
  environment: 'sandbox',
});

async function main() {
  // ── 1. List existing product invoices ─────────────────────────────────────
  console.log('\n=== List Product Invoices (Test environment) ===');
  const list = await nfe.productInvoices.list(companyId, {
    environment: 'Test',
    limit: 5,
  });
  console.log(`Found ${list.totalCount ?? 0} invoices, showing ${list.productInvoices?.length ?? 0}`);
  for (const inv of list.productInvoices ?? []) {
    console.log(`  ${inv.id} — status: ${inv.status}`);
  }

  // ── 2. Issue a product invoice ────────────────────────────────────────────
  console.log('\n=== Issue Product Invoice ===');
  const issueData = {
    operationNature: 'Venda de mercadoria',
    operationType: 'Outgoing',
    buyer: {
      name: 'Empresa Exemplo LTDA',
      federalTaxNumber: 12345678000190,
      address: {
        street: 'Rua Exemplo',
        number: '100',
        district: 'Centro',
        city: { code: '3550308', name: 'São Paulo' },
        state: 'SP',
        country: 'Brasil',
        postalCode: '01001000',
      },
    },
    items: [
      {
        code: 'PROD-001',
        description: 'Produto de Teste',
        quantity: 2,
        unitAmount: 50.0,
        ncmCode: '84713019',
      },
    ],
    payment: [
      {
        paymentDetail: [{ method: 'Cash', amount: 100.0 }],
      },
    ],
  };

  try {
    const created = await nfe.productInvoices.create(companyId, issueData);
    console.log('Invoice enqueued (202):', JSON.stringify(created, null, 2).slice(0, 200));
  } catch (err) {
    console.error('Issue failed:', err.message);
  }

  // ── 3. Retrieve a specific invoice ────────────────────────────────────────
  if (list.productInvoices?.length) {
    const invoiceId = list.productInvoices[0].id;
    console.log(`\n=== Retrieve Invoice ${invoiceId} ===`);
    const invoice = await nfe.productInvoices.retrieve(companyId, invoiceId);
    console.log(`  Status: ${invoice.status}`);
    console.log(`  Access Key: ${invoice.authorization?.accessKey ?? 'pending'}`);

    // ── 4. Download PDF ───────────────────────────────────────────────────
    console.log('\n=== Download DANFE PDF ===');
    try {
      const pdf = await nfe.productInvoices.downloadPdf(companyId, invoiceId);
      console.log('  PDF URI:', pdf.uri);
    } catch (err) {
      console.log('  PDF not available:', err.message);
    }

    // ── 5. Download XML ───────────────────────────────────────────────────
    console.log('\n=== Download XML ===');
    try {
      const xml = await nfe.productInvoices.downloadXml(companyId, invoiceId);
      console.log('  XML URI:', xml.uri);
    } catch (err) {
      console.log('  XML not available:', err.message);
    }

    // ── 6. List items ─────────────────────────────────────────────────────
    console.log('\n=== List Invoice Items ===');
    const items = await nfe.productInvoices.listItems(companyId, invoiceId);
    console.log(`  ${items.totalCount ?? 0} items`);

    // ── 7. List events ────────────────────────────────────────────────────
    console.log('\n=== List Invoice Events ===');
    const events = await nfe.productInvoices.listEvents(companyId, invoiceId);
    console.log(`  ${events.totalCount ?? 0} events`);
  }

  // ── 8. State Taxes (Inscrições Estaduais) ───────────────────────────────
  console.log('\n=== List State Taxes ===');
  const taxes = await nfe.stateTaxes.list(companyId);
  console.log(`Found ${taxes.totalCount ?? taxes.stateTaxes?.length ?? 0} registrations`);
  for (const tax of taxes.stateTaxes ?? []) {
    console.log(`  ${tax.id} — ${tax.taxNumber} (${tax.code}, serie ${tax.serie})`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
