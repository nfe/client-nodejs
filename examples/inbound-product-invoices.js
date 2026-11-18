/**
 * NFE.io SDK v3 - Inbound Product Invoices (NF-e Distribuição) Example
 *
 * This example demonstrates how to use the Inbound Product Invoices API
 * for querying NF-e documents received via Distribuição NF-e (DF-e).
 *
 * Prerequisites:
 * - Company must be registered with a valid A1 digital certificate
 * - Webhook must be configured to receive NF-e notifications
 * - Valid API key with NF-e distribution access
 *
 * Configuration:
 * Set one of the following environment variables:
 * - NFE_DATA_API_KEY - Data/query API key (recommended)
 * - NFE_API_KEY - Main API key (will be used as fallback)
 *
 * Usage:
 *   node inbound-product-invoices.js <companyId> [accessKey]
 *
 * Examples:
 *   node inbound-product-invoices.js 12345          # Enable and check settings
 *   node inbound-product-invoices.js 12345 35240... # Retrieve specific NF-e
 */

import { NfeClient } from 'nfe-io';

// ============================================================================
// Configuration
// ============================================================================

const nfe = new NfeClient({
  // dataApiKey: process.env.NFE_DATA_API_KEY,  // Uncomment for explicit configuration
});

// ============================================================================
// Example Functions
// ============================================================================

/**
 * Enable automatic NF-e inbound fetch for a company
 */
async function enableAutoFetch(companyId) {
  console.log('\n📡 Enabling automatic NF-e inbound fetch...');

  try {
    const settings = await nfe.inboundProductInvoices.enableAutoFetch(companyId, {
      environmentSEFAZ: 'Production',
      webhookVersion: '2',
    });

    console.log('✅ Auto-fetch enabled!');
    console.log('   Status:', settings.status);
    console.log('   Environment:', settings.environmentSEFAZ);
    console.log('   Webhook version:', settings.webhookVersion);
    if (settings.startFromNsu) {
      console.log('   Starting from NSU:', settings.startFromNsu);
    }
    return settings;
  } catch (error) {
    console.error('❌ Failed to enable auto-fetch:', error.message);
    throw error;
  }
}

/**
 * Get current inbound settings
 */
async function getSettings(companyId) {
  console.log('\n⚙️  Fetching inbound settings...');

  try {
    const settings = await nfe.inboundProductInvoices.getSettings(companyId);
    console.log('📋 Current settings:');
    console.log('   Status:', settings.status);
    console.log('   Environment:', settings.environmentSEFAZ ?? 'Not set');
    console.log('   Webhook version:', settings.webhookVersion);
    console.log('   Start from NSU:', settings.startFromNsu ?? 'Not set');
    console.log('   Created:', settings.createdOn);
    console.log('   Modified:', settings.modifiedOn);
    return settings;
  } catch (error) {
    console.error('❌ Failed to get settings:', error.message);
    throw error;
  }
}

/**
 * Get NF-e details by access key (webhook v2 format)
 */
async function getInvoiceDetails(companyId, accessKey) {
  console.log('\n🔍 Fetching NF-e details (webhook v2)...');

  try {
    const invoice = await nfe.inboundProductInvoices.getProductInvoiceDetails(
      companyId,
      accessKey
    );

    console.log('📄 Invoice details:');
    console.log('   Access Key:', invoice.accessKey);
    console.log('   NSU:', invoice.nsu);
    console.log('   NF-e Number:', invoice.nfeNumber);
    console.log('   Issuer:', invoice.issuer?.name);
    console.log('   Buyer:', invoice.buyer?.name);
    console.log('   Amount:', invoice.totalInvoiceAmount);
    console.log('   Issued on:', invoice.issuedOn);
    if (invoice.productInvoices?.length) {
      console.log('   Product invoices:', invoice.productInvoices.length);
    }
    return invoice;
  } catch (error) {
    console.error('❌ Failed to get invoice details:', error.message);
    throw error;
  }
}

/**
 * Download invoice XML
 */
async function downloadXml(companyId, accessKey) {
  console.log('\n📥 Downloading NF-e XML...');

  try {
    const xml = await nfe.inboundProductInvoices.getXml(companyId, accessKey);
    console.log('✅ XML downloaded successfully');
    console.log('   Size:', xml.length, 'characters');
    // In a real app, you'd save to file:
    // fs.writeFileSync(`nfe-${accessKey}.xml`, xml);
    return xml;
  } catch (error) {
    console.error('❌ Failed to download XML:', error.message);
    throw error;
  }
}

/**
 * Download invoice PDF (DANFE)
 */
async function downloadPdf(companyId, accessKey) {
  console.log('\n📥 Downloading NF-e PDF (DANFE)...');

  try {
    const pdf = await nfe.inboundProductInvoices.getPdf(companyId, accessKey);
    console.log('✅ PDF downloaded successfully');
    // In a real app, you'd save to file:
    // fs.writeFileSync(`nfe-${accessKey}.pdf`, pdf);
    return pdf;
  } catch (error) {
    console.error('❌ Failed to download PDF:', error.message);
    throw error;
  }
}

/**
 * Send manifest event (Ciência da Operação by default)
 */
async function sendManifest(companyId, accessKey, tpEvent = 210210) {
  const eventNames = {
    210200: 'Confirmação da Operação',
    210210: 'Ciência da Operação',
    210220: 'Desconhecimento da Operação (NÃO é Confirmação; a Confirmação é 210200)',
    210240: 'Operação não Realizada',
  };
  const eventName = eventNames[tpEvent] || `Event ${tpEvent}`;

  console.log(`\n📨 Sending manifest: ${eventName}...`);

  try {
    const result = await nfe.inboundProductInvoices.manifest(
      companyId,
      accessKey,
      tpEvent
    );
    console.log('✅ Manifest sent successfully');
    return result;
  } catch (error) {
    console.error('❌ Failed to send manifest:', error.message);
    throw error;
  }
}

/**
 * Reprocess a webhook notification
 */
async function reprocessWebhook(companyId, accessKeyOrNsu) {
  console.log('\n🔄 Reprocessing webhook...');

  try {
    const result = await nfe.inboundProductInvoices.reprocessWebhook(
      companyId,
      accessKeyOrNsu
    );
    console.log('✅ Webhook reprocessed successfully');
    return result;
  } catch (error) {
    console.error('❌ Failed to reprocess webhook:', error.message);
    throw error;
  }
}

/**
 * Disable automatic NF-e fetching
 */
async function disableAutoFetch(companyId) {
  console.log('\n🔌 Disabling auto-fetch...');

  try {
    const settings = await nfe.inboundProductInvoices.disableAutoFetch(companyId);
    console.log('✅ Auto-fetch disabled');
    console.log('   Status:', settings.status);
    return settings;
  } catch (error) {
    console.error('❌ Failed to disable auto-fetch:', error.message);
    throw error;
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const companyId = process.argv[2];
  const accessKey = process.argv[3];

  if (!companyId) {
    console.error('Usage: node inbound-product-invoices.js <companyId> [accessKey]');
    process.exit(1);
  }

  console.log('🏢 Company ID:', companyId);
  if (accessKey) {
    console.log('🔑 Access Key:', accessKey);
  }

  // Step 1: Enable auto-fetch and check settings
  await enableAutoFetch(companyId);
  await getSettings(companyId);

  // Step 2: If access key provided, fetch details and downloads
  if (accessKey) {
    await getInvoiceDetails(companyId, accessKey);
    await downloadXml(companyId, accessKey);
    await downloadPdf(companyId, accessKey);

    // Step 3: Send manifest (Ciência da Operação)
    await sendManifest(companyId, accessKey);

    // Step 4: Reprocess webhook
    await reprocessWebhook(companyId, accessKey);
  }

  console.log('\n✨ Done!');
}

main().catch((error) => {
  console.error('\n💥 Unhandled error:', error);
  process.exit(1);
});
