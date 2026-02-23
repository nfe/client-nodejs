/**
 * NFE.io SDK v3 — State Taxes (Inscrições Estaduais) Example
 *
 * Demonstrates CRUD operations for company state tax registrations
 * (Inscrições Estaduais) — required configuration for NF-e product
 * invoice issuance.
 *
 * Usage:
 *   NFE_APIKEY=your-key node examples/state-taxes.js
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
  // ── 1. List existing state tax registrations ─────────────────────────────
  console.log('\n=== List State Taxes ===');
  const list = await nfe.stateTaxes.list(companyId);
  console.log(`Found ${list.stateTaxes?.length ?? 0} registrations`);
  for (const tax of list.stateTaxes ?? []) {
    console.log(`  ${tax.id} — IE: ${tax.taxNumber}, state: ${tax.code}, serie: ${tax.serie}, status: ${tax.status}`);
  }

  // ── 2. List with pagination ──────────────────────────────────────────────
  console.log('\n=== List with Pagination ===');
  const paginated = await nfe.stateTaxes.list(companyId, { limit: 2 });
  console.log(`Showing ${paginated.stateTaxes?.length ?? 0} registrations`);

  // ── 3. Create a state tax registration ───────────────────────────────────
  console.log('\n=== Create State Tax Registration ===');
  try {
    const created = await nfe.stateTaxes.create(companyId, {
      taxNumber: '123456789',
      serie: 1,
      number: 1,
      code: 'sP',
      environmentType: 'test',
      type: 'nFe',
    });
    console.log('Created:', created.id, '— IE:', created.taxNumber);

    // ── 4. Retrieve the created registration ─────────────────────────────
    console.log('\n=== Retrieve State Tax ===');
    const retrieved = await nfe.stateTaxes.retrieve(companyId, created.id);
    console.log(`  ID: ${retrieved.id}`);
    console.log(`  Tax Number: ${retrieved.taxNumber}`);
    console.log(`  State: ${retrieved.code}`);
    console.log(`  Serie: ${retrieved.serie}`);
    console.log(`  Number: ${retrieved.number}`);
    console.log(`  Environment: ${retrieved.environmentType}`);
    console.log(`  Status: ${retrieved.status}`);

    // ── 5. Update the registration ───────────────────────────────────────
    console.log('\n=== Update State Tax ===');
    const updated = await nfe.stateTaxes.update(companyId, created.id, {
      serie: 2,
      environmentType: 'production',
    });
    console.log(`Updated serie to ${updated.serie}, environment to ${updated.environmentType}`);

    // ── 6. Delete the registration ───────────────────────────────────────
    console.log('\n=== Delete State Tax ===');
    await nfe.stateTaxes.delete(companyId, created.id);
    console.log('Deleted successfully');
  } catch (err) {
    console.error('Operation failed:', err.message);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
