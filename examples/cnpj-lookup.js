/**
 * NFE.io SDK v3 - CNPJ / Legal Entity Lookup Examples
 *
 * This example demonstrates how to use the Legal Entity Lookup API for querying
 * Brazilian company (CNPJ) data including basic info, state tax registrations,
 * and invoice-readiness evaluation.
 *
 * Prerequisites:
 *   - Set NFE_DATA_API_KEY or NFE_API_KEY environment variable
 *   - Or pass the API key directly in the configuration
 *
 * Run this example:
 *   node examples/cnpj-lookup.js
 */

import { NfeClient } from '../dist/index.js';

// Configuration
const client = new NfeClient({
  // The Legal Entity API uses dataApiKey (falls back to apiKey)
  // dataApiKey: process.env.NFE_DATA_API_KEY,
  apiKey: process.env.NFE_API_KEY,
  environment: 'production',
});

// Example CNPJ — replace with a real one for testing
const EXAMPLE_CNPJ = process.env.TEST_CNPJ || '12345678000190';
const EXAMPLE_STATE = process.env.TEST_STATE || 'SP';

/**
 * Example 1: Basic CNPJ lookup
 */
async function basicLookup() {
  console.log('\n🏢 Example 1: Basic CNPJ Lookup');
  console.log('='.repeat(50));

  try {
    const result = await client.legalEntityLookup.getBasicInfo(EXAMPLE_CNPJ);

    const entity = result.legalEntity;
    if (entity) {
      console.log('Legal Name:', entity.name);
      console.log('Trade Name:', entity.tradeName);
      console.log('CNPJ:', entity.federalTaxNumber);
      console.log('Status:', entity.status);
      console.log('Size:', entity.size);
      console.log('Opened On:', entity.openedOn);
      console.log('Unit:', entity.unit);
      console.log('Share Capital:', entity.shareCapital);
      console.log('Email:', entity.email);

      if (entity.address) {
        console.log('\nAddress:');
        console.log(`  ${entity.address.street}, ${entity.address.number}`);
        console.log(`  ${entity.address.district}`);
        console.log(`  ${entity.address.city?.name}/${entity.address.state}`);
        console.log(`  CEP: ${entity.address.postalCode}`);
      }

      if (entity.phones?.length) {
        console.log('\nPhones:');
        for (const phone of entity.phones) {
          console.log(`  (${phone.ddd}) ${phone.number}`);
        }
      }

      if (entity.economicActivities?.length) {
        console.log('\nEconomic Activities (CNAE):');
        for (const activity of entity.economicActivities.slice(0, 5)) {
          console.log(`  [${activity.type}] ${activity.code} - ${activity.description}`);
        }
      }

      if (entity.legalNature) {
        console.log('\nLegal Nature:', `${entity.legalNature.code} - ${entity.legalNature.description}`);
      }

      if (entity.partners?.length) {
        console.log('\nPartners:');
        for (const partner of entity.partners) {
          console.log(`  ${partner.name} (${partner.qualification?.description})`);
        }
      }
    } else {
      console.log('No data returned for this CNPJ');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 2: Lookup with formatted CNPJ and options
 */
async function lookupWithOptions() {
  console.log('\n⚙️  Example 2: Lookup with Options');
  console.log('='.repeat(50));

  try {
    // Formatted CNPJ is accepted — punctuation is stripped automatically
    const result = await client.legalEntityLookup.getBasicInfo('12.345.678/0001-90', {
      updateAddress: false,   // Skip postal service address enrichment
      updateCityCode: true,   // But still update city IBGE code
    });

    console.log('Lookup with options succeeded');
    console.log('Entity name:', result.legalEntity?.name ?? 'N/A');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 3: State tax registration lookup (Inscrição Estadual)
 */
async function stateTaxLookup() {
  console.log('\n📋 Example 3: State Tax Registration Lookup');
  console.log('='.repeat(50));

  try {
    const result = await client.legalEntityLookup.getStateTaxInfo(EXAMPLE_STATE, EXAMPLE_CNPJ);

    const entity = result.legalEntity;
    if (entity) {
      console.log('Legal Name:', entity.name);
      console.log('Tax Regime:', entity.taxRegime);
      console.log('Legal Nature:', entity.legalNature);
      console.log('Fiscal Unit:', entity.fiscalUnit);
      console.log('Check Code:', entity.checkCode);

      if (entity.stateTaxes?.length) {
        console.log('\nState Tax Registrations:');
        for (const tax of entity.stateTaxes) {
          console.log(`  IE: ${tax.taxNumber}`);
          console.log(`    Status: ${tax.status}`);
          console.log(`    State: ${tax.code}`);
          console.log(`    Opened: ${tax.openedOn}`);
          if (tax.nfe) console.log(`    NFe: ${tax.nfe.status}`);
          if (tax.nfse) console.log(`    NFSe: ${tax.nfse.status}`);
          if (tax.cte) console.log(`    CTe: ${tax.cte.status}`);
          if (tax.nfce) console.log(`    NFCe: ${tax.nfce.status}`);
          console.log();
        }
      } else {
        console.log('No state tax registrations found');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 4: State tax evaluation for invoice issuance
 */
async function stateTaxForInvoice() {
  console.log('\n📄 Example 4: State Tax for Invoice Evaluation');
  console.log('='.repeat(50));

  try {
    const result = await client.legalEntityLookup.getStateTaxForInvoice(EXAMPLE_STATE, EXAMPLE_CNPJ);

    const taxes = result.legalEntity?.stateTaxes ?? [];
    console.log(`Found ${taxes.length} state tax registration(s)`);

    for (const tax of taxes) {
      const canIssue = tax.status === 'Abled';
      console.log(`  IE: ${tax.taxNumber} — ${tax.status} ${canIssue ? '✅' : '❌'}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 5: Suggested (best) state tax for invoice issuance
 */
async function suggestedStateTax() {
  console.log('\n⭐ Example 5: Suggested State Tax for Invoice');
  console.log('='.repeat(50));

  try {
    const result = await client.legalEntityLookup.getSuggestedStateTaxForInvoice(EXAMPLE_STATE, EXAMPLE_CNPJ);

    const bestTax = result.legalEntity?.stateTaxes?.[0];
    if (bestTax) {
      console.log('Recommended IE:', bestTax.taxNumber);
      console.log('Status:', bestTax.status);
      console.log('State:', bestTax.code);
      if (bestTax.nfe) console.log('NFe Status:', bestTax.nfe.status);
    } else {
      console.log('No suggested state tax registration available');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 6: Error handling
 */
async function errorHandling() {
  console.log('\n⚠️  Example 6: Error Handling');
  console.log('='.repeat(50));

  // Invalid CNPJ format
  try {
    await client.legalEntityLookup.getBasicInfo('123');
  } catch (error) {
    console.log('ValidationError for invalid CNPJ:', error.message);
  }

  // Invalid state code
  try {
    await client.legalEntityLookup.getStateTaxInfo('XX', EXAMPLE_CNPJ);
  } catch (error) {
    console.log('ValidationError for invalid state:', error.message);
  }

  // Empty CNPJ
  try {
    await client.legalEntityLookup.getBasicInfo('');
  } catch (error) {
    console.log('ValidationError for empty CNPJ:', error.message);
  }
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('🏢 NFE.io CNPJ / Legal Entity Lookup Examples');
  console.log('━'.repeat(50));

  if (!process.env.NFE_API_KEY && !process.env.NFE_DATA_API_KEY) {
    console.error('\n❌ No API key found!');
    console.error('Please set NFE_API_KEY or NFE_DATA_API_KEY environment variable.');
    console.error('\nExample:');
    console.error('  export NFE_API_KEY="your-api-key"');
    console.error('  node examples/cnpj-lookup.js');
    process.exit(1);
  }

  await basicLookup();
  await lookupWithOptions();
  await stateTaxLookup();
  await stateTaxForInvoice();
  await suggestedStateTax();
  await errorHandling();

  console.log('\n✅ All examples completed!');
}

// Run main function
main().catch(console.error);
