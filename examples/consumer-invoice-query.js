/**
 * Consumer Invoice Query Example (CFe-SAT)
 *
 * Demonstrates querying CFe-SAT (Cupom Fiscal Eletrônico) consumer invoices
 * by access key using the NFE.io SDK v3.
 *
 * Setup:
 *   export NFE_DATA_API_KEY="your-data-api-key"
 *   # or: export NFE_API_KEY="your-api-key"
 *
 * Usage:
 *   node examples/consumer-invoice-query.js
 */

import { NfeClient } from '../src/index.js';

// Replace with a real CFe-SAT access key (44 digits)
const ACCESS_KEY = process.argv[2] || '35240112345678000190590000000012341234567890';

async function main() {
  const nfe = new NfeClient({
    apiKey: process.env.NFE_API_KEY,
    dataApiKey: process.env.NFE_DATA_API_KEY,
  });

  console.log('=== Consumer Invoice Query (CFe-SAT) ===\n');

  // 1. Retrieve coupon details
  try {
    console.log(`Retrieving coupon: ${ACCESS_KEY}`);
    const coupon = await nfe.consumerInvoiceQuery.retrieve(ACCESS_KEY);

    console.log('\n--- Coupon Details ---');
    console.log('Status:', coupon.currentStatus);
    console.log('Number:', coupon.number);
    console.log('SAT Serie:', coupon.satSerie);
    console.log('Issued On:', coupon.issuedOn);
    console.log('Access Key:', coupon.accessKey);

    if (coupon.issuer) {
      console.log('\n--- Issuer ---');
      console.log('Name:', coupon.issuer.name);
      console.log('Trade Name:', coupon.issuer.tradeName);
      console.log('CNPJ:', coupon.issuer.federalTaxNumber);
      console.log('Tax Regime:', coupon.issuer.taxRegime);
    }

    if (coupon.buyer) {
      console.log('\n--- Buyer ---');
      console.log('Name:', coupon.buyer.name);
      console.log('CPF/CNPJ:', coupon.buyer.federalTaxNumber);
    }

    if (coupon.totals) {
      console.log('\n--- Totals ---');
      console.log('Coupon Amount:', coupon.totals.couponAmount);
      console.log('Total Tax (approx):', coupon.totals.totalAmount);
    }

    if (coupon.items && coupon.items.length > 0) {
      console.log(`\n--- Items (${coupon.items.length}) ---`);
      for (const item of coupon.items) {
        console.log(`  ${item.code} - ${item.description}: ${item.quantity} x ${item.unitAmount} = ${item.netAmount}`);
      }
    }

    if (coupon.payment?.paymentDetails) {
      console.log('\n--- Payment ---');
      for (const detail of coupon.payment.paymentDetails) {
        console.log(`  ${detail.method}: ${detail.amount}`);
      }
      if (coupon.payment.payBack) {
        console.log('  Change:', coupon.payment.payBack);
      }
    }
  } catch (error) {
    console.error('Failed to retrieve coupon:', error instanceof Error ? error.message : error);
  }

  // 2. Download CFe XML
  try {
    console.log(`\nDownloading CFe XML for: ${ACCESS_KEY}`);
    const xmlBuffer = await nfe.consumerInvoiceQuery.downloadXml(ACCESS_KEY);
    console.log(`XML downloaded: ${xmlBuffer.length} bytes`);
    // fs.writeFileSync('cfe.xml', xmlBuffer);
  } catch (error) {
    console.error('Failed to download XML:', error instanceof Error ? error.message : error);
  }
}

main().catch(console.error);
