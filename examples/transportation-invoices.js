/**
 * NFE.io SDK v3 - Transportation Invoices (CT-e) Example
 *
 * This example demonstrates how to use the Transportation Invoices (CT-e) API
 * for managing Conhecimento de Transporte Eletrônico documents via Distribuição DFe.
 *
 * Prerequisites:
 * - Company must be registered with a valid A1 digital certificate
 * - Webhook must be configured to receive CT-e notifications
 * - Valid CT-e API key (or main API key with CT-e access)
 *
 * Configuration:
 * Set one of the following environment variables:
 * - NFE_DATA_API_KEY - Data/query API key (recommended)
 * - NFE_API_KEY - Main API key (will be used as fallback)
 *
 * Or configure in code:
 * const nfe = new NfeClient({
 *   dataApiKey: 'your-data-api-key',  // Or use apiKey if you have unified access
 * });
 *
 * Usage:
 *   node transportation-invoices.js <companyId> [accessKey]
 *
 * Examples:
 *   node transportation-invoices.js 12345          # Enable and check settings
 *   node transportation-invoices.js 12345 35240... # Retrieve specific CT-e
 */

import { NfeClient } from 'nfe-io';

// ============================================================================
// Configuration
// ============================================================================

// Create client - API key fallback chain:
// 1. dataApiKey (config)
// 2. apiKey (config)
// 3. NFE_DATA_API_KEY (env)
// 4. NFE_API_KEY (env)
const nfe = new NfeClient({
  // dataApiKey: process.env.NFE_DATA_API_KEY,  // Uncomment for explicit configuration
});

// ============================================================================
// Example Functions
// ============================================================================

/**
 * Enable automatic CT-e search for a company
 */
async function enableAutomaticSearch(companyId) {
  console.log('\n📡 Enabling automatic CT-e search...');

  try {
    // Enable with default settings
    const settings = await nfe.transportationInvoices.enable(companyId);

    console.log('✅ Automatic search enabled!');
    console.log('   Status:', settings.status);
    console.log('   Start from NSU:', settings.startFromNsu);
    console.log('   Created:', settings.createdOn);

    return settings;
  } catch (error) {
    if (error.name === 'BadRequestError') {
      console.log('⚠️  Already enabled or invalid request:', error.message);
    } else {
      throw error;
    }
  }
}

/**
 * Enable automatic CT-e search starting from a specific NSU
 */
async function enableFromNsu(companyId, startFromNsu) {
  console.log(`\n📡 Enabling CT-e search starting from NSU ${startFromNsu}...`);

  const settings = await nfe.transportationInvoices.enable(companyId, {
    startFromNsu: startFromNsu
  });

  console.log('✅ Enabled with custom NSU!');
  console.log('   Start from NSU:', settings.startFromNsu);

  return settings;
}

/**
 * Enable automatic CT-e search starting from a specific date
 */
async function enableFromDate(companyId, startDate) {
  console.log(`\n📡 Enabling CT-e search starting from ${startDate}...`);

  const settings = await nfe.transportationInvoices.enable(companyId, {
    startFromDate: startDate
  });

  console.log('✅ Enabled with custom date!');
  console.log('   Start from date:', settings.startFromDate);

  return settings;
}

/**
 * Get current automatic search settings
 */
async function getSettings(companyId) {
  console.log('\n⚙️  Getting current CT-e settings...');

  try {
    const settings = await nfe.transportationInvoices.getSettings(companyId);

    console.log('📋 Current settings:');
    console.log('   Status:', settings.status);
    console.log('   Start from NSU:', settings.startFromNsu);
    console.log('   Start from date:', settings.startFromDate || 'N/A');
    console.log('   Created:', settings.createdOn);
    console.log('   Modified:', settings.modifiedOn);

    return settings;
  } catch (error) {
    if (error.name === 'NotFoundError') {
      console.log('ℹ️  Automatic search not configured for this company');
    } else {
      throw error;
    }
  }
}

/**
 * Disable automatic CT-e search
 */
async function disableAutomaticSearch(companyId) {
  console.log('\n🔒 Disabling automatic CT-e search...');

  try {
    const settings = await nfe.transportationInvoices.disable(companyId);

    console.log('✅ Automatic search disabled!');
    console.log('   Status:', settings.status);

    return settings;
  } catch (error) {
    if (error.name === 'NotFoundError') {
      console.log('ℹ️  Automatic search was not enabled');
    } else {
      throw error;
    }
  }
}

/**
 * Retrieve CT-e metadata by access key
 */
async function retrieveCte(companyId, accessKey) {
  console.log('\n📄 Retrieving CT-e metadata...');
  console.log('   Access Key:', accessKey);

  const cte = await nfe.transportationInvoices.retrieve(companyId, accessKey);

  console.log('\n📋 CT-e Information:');
  console.log('   Type:', cte.type);
  console.log('   Status:', cte.status);
  console.log('   Sender:', cte.nameSender);
  console.log('   Sender CNPJ:', cte.federalTaxNumberSender);
  console.log('   Total Amount:', cte.totalInvoiceAmount ? `R$ ${cte.totalInvoiceAmount.toFixed(2)}` : 'N/A');
  console.log('   Issued:', cte.issuedOn);
  console.log('   Received:', cte.receivedOn);

  return cte;
}

/**
 * Download CT-e XML content
 */
async function downloadXml(companyId, accessKey) {
  console.log('\n📥 Downloading CT-e XML...');

  const xml = await nfe.transportationInvoices.downloadXml(companyId, accessKey);

  console.log('✅ XML downloaded successfully!');
  console.log('   Size:', xml.length, 'bytes');
  console.log('   Preview:', xml.substring(0, 100) + '...');

  // In a real application, you would save this to a file:
  // import { writeFileSync } from 'fs';
  // writeFileSync(`cte-${accessKey}.xml`, xml);

  return xml;
}

/**
 * Retrieve event metadata for a CT-e
 */
async function getEvent(companyId, accessKey, eventKey) {
  console.log('\n📌 Retrieving CT-e event...');
  console.log('   Access Key:', accessKey);
  console.log('   Event Key:', eventKey);

  const event = await nfe.transportationInvoices.getEvent(companyId, accessKey, eventKey);

  console.log('\n📋 Event Information:');
  console.log('   Type:', event.type);
  console.log('   Status:', event.status);

  return event;
}

/**
 * Download event XML content
 */
async function downloadEventXml(companyId, accessKey, eventKey) {
  console.log('\n📥 Downloading event XML...');

  const xml = await nfe.transportationInvoices.downloadEventXml(companyId, accessKey, eventKey);

  console.log('✅ Event XML downloaded successfully!');
  console.log('   Size:', xml.length, 'bytes');

  return xml;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node transportation-invoices.js <companyId> [accessKey] [eventKey]');
    console.log('');
    console.log('Examples:');
    console.log('  node transportation-invoices.js 12345');
    console.log('  node transportation-invoices.js 12345 35240112345678000190570010000001231234567890');
    console.log('  node transportation-invoices.js 12345 35240112345678000190570010000001231234567890 event-123');
    process.exit(1);
  }

  const [companyId, accessKey, eventKey] = args;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  NFE.io SDK v3 - Transportation Invoices (CT-e) Demo');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Company ID:', companyId);
  if (accessKey) console.log('  Access Key:', accessKey);
  if (eventKey) console.log('  Event Key:', eventKey);
  console.log('═══════════════════════════════════════════════════════════════');

  try {
    // If access key provided, retrieve the specific CT-e
    if (accessKey) {
      await retrieveCte(companyId, accessKey);
      await downloadXml(companyId, accessKey);

      if (eventKey) {
        await getEvent(companyId, accessKey, eventKey);
        await downloadEventXml(companyId, accessKey, eventKey);
      }
    } else {
      // Otherwise, demonstrate automatic search management
      await getSettings(companyId);

      // Uncomment to enable/disable automatic search:
      // await enableAutomaticSearch(companyId);
      // await enableFromNsu(companyId, 12345);
      // await enableFromDate(companyId, '2024-01-01T00:00:00Z');
      // await disableAutomaticSearch(companyId);
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ✅ Demo completed successfully!');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.name === 'ConfigurationError') {
      console.error('   Make sure you have set NFE_DATA_API_KEY or NFE_API_KEY');
    }
    if (error.name === 'ValidationError') {
      console.error('   Check your input parameters');
    }
    process.exit(1);
  }
}

main();
