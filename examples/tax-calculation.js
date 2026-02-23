/**
 * NFE.io SDK v3 - Tax Calculation Example
 *
 * Demonstrates the standalone tax calculation flow:
 * 1. List available operation codes and tax profiles
 * 2. Submit a tax calculation request
 * 3. Inspect the per-item tax breakdown
 *
 * Prerequisites:
 * - Configure .env.test with NFE_API_KEY (or NFE_DATA_API_KEY)
 * - npm run build
 *
 * Run:
 *   node examples/tax-calculation.js
 */

// Load environment variables
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '..', '.env.test');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

const { NfeClient } = require('../dist/index.js');

async function main() {
  console.log('='.repeat(60));
  console.log('  NFE.io SDK v3 - Tax Calculation Example');
  console.log('='.repeat(60));
  console.log();

  const apiKey = process.env.NFE_DATA_API_KEY || process.env.NFE_API_KEY;
  if (!apiKey) {
    console.error('❌ API key not found. Set NFE_API_KEY or NFE_DATA_API_KEY in .env.test');
    process.exit(1);
  }

  const nfe = new NfeClient({
    apiKey: apiKey,
    environment: process.env.NFE_TEST_ENVIRONMENT || 'development',
  });

  // -----------------------------------------------------------------------
  // 1. List available reference codes (optional — for discovery)
  // -----------------------------------------------------------------------
  console.log('📋 Step 1: Listing available tax codes...\n');

  try {
    const operationCodes = await nfe.taxCodes.listOperationCodes({ pageIndex: 1, pageCount: 5 });
    console.log(`  Operation codes: ${operationCodes.totalCount ?? '?'} total`);
    for (const code of (operationCodes.items ?? []).slice(0, 3)) {
      console.log(`    ${code.code} - ${code.description}`);
    }
    console.log();

    const issuerProfiles = await nfe.taxCodes.listIssuerTaxProfiles({ pageIndex: 1, pageCount: 5 });
    console.log(`  Issuer tax profiles: ${issuerProfiles.totalCount ?? '?'} total`);
    for (const profile of (issuerProfiles.items ?? []).slice(0, 3)) {
      console.log(`    ${profile.code} - ${profile.description}`);
    }
    console.log();
  } catch (err) {
    console.log(`  ⚠️  Could not list tax codes: ${err.message}`);
    console.log('  (This is expected if the API host is not reachable or credentials differ)\n');
  }

  // -----------------------------------------------------------------------
  // 2. Submit a tax calculation request
  // -----------------------------------------------------------------------
  console.log('🧮 Step 2: Calculating taxes for a sample operation...\n');

  // NOTE: Replace 'your-tenant-id' with your actual subscription/account ID
  const tenantId = process.env.NFE_TENANT_ID || 'your-tenant-id';

  const calculateRequest = {
    operationType: 'Outgoing', // Sale / Saída
    issuer: {
      state: 'SP',
      taxRegime: 'RealProfit',
    },
    recipient: {
      state: 'RJ',
    },
    items: [
      {
        id: 'item-1',
        operationCode: 121,           // Venda de mercadoria (example)
        origin: 'National',
        ncm: '61091000',              // T-shirts, knitted
        quantity: 10,
        unitAmount: 100.00,
        freightAmount: 50.00,
      },
      {
        id: 'item-2',
        operationCode: 121,
        origin: 'National',
        ncm: '39174090',              // Plastic tubes
        quantity: 50,
        unitAmount: 25.50,
        discountAmount: 10.00,
      },
    ],
  };

  try {
    const result = await nfe.taxCalculation.calculate(tenantId, calculateRequest);

    console.log('  ✅ Tax calculation successful!\n');
    console.log(`  Items calculated: ${result.items?.length ?? 0}\n`);

    for (const item of result.items ?? []) {
      console.log(`  📦 Item ${item.id}:`);
      console.log(`     CFOP: ${item.cfop}`);
      if (item.icms) {
        console.log(`     ICMS: CST=${item.icms.cst || item.icms.csosn}, ` +
          `Base=${item.icms.vBC}, Rate=${item.icms.pICMS}%, Value=${item.icms.vICMS}`);
      }
      if (item.pis) {
        console.log(`     PIS:  CST=${item.pis.cst}, Value=${item.pis.vPIS}`);
      }
      if (item.cofins) {
        console.log(`     COFINS: CST=${item.cofins.cst}, Value=${item.cofins.vCOFINS}`);
      }
      if (item.ipi) {
        console.log(`     IPI:  CST=${item.ipi.cst}, Value=${item.ipi.vIPI}`);
      }
      if (item.icmsUfDest) {
        console.log(`     ICMS UF Dest: ${item.icmsUfDest.vICMSUFDest}`);
      }
      if (item.benefit) {
        console.log(`     Benefit: ${item.benefit}`);
      }
      console.log();
    }
  } catch (err) {
    console.log(`  ❌ Tax calculation failed: ${err.message}`);
    if (tenantId === 'your-tenant-id') {
      console.log('  💡 Set NFE_TENANT_ID in .env.test with your subscription ID');
    }
    console.log();
  }

  console.log('='.repeat(60));
  console.log('  Example complete!');
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
