/**
 * Service Invoice Complete Example - NFE.io SDK v3
 *
 * Demonstrates ALL Service Invoice operations:
 * - create() - Create invoice with sync/async handling
 * - createAndWait() - Create with automatic polling
 * - list() - List invoices with pagination and filters
 * - retrieve() - Get invoice by ID
 * - sendEmail() - Send invoice via email
 * - downloadPdf() - Download PDF (single or bulk)
 * - downloadXml() - Download XML (single or bulk)
 * - cancel() - Cancel an invoice
 * - createBatch() - Batch create multiple invoices
 * - getStatus() - Check invoice status
 *
 * Prerequisites:
 * - Valid API key in NFE_API_KEY environment variable
 * - Valid company ID in NFE_COMPANY_ID environment variable
 * - Company configured in NFE.io with valid certificate
 */

import { NfeClient } from '../dist/index.js';
import * as dotenv from 'dotenv';
import { writeFileSync } from 'fs';

// Load credentials
dotenv.config({ path: '.env.test' });

const apiKey = process.env.NFE_API_KEY;
const companyId = process.env.NFE_COMPANY_ID;
const environment = process.env.NFE_TEST_ENVIRONMENT || 'development';

if (!apiKey || !companyId) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NFE_API_KEY: Your NFE.io API key');
  console.error('   - NFE_COMPANY_ID: Your company ID');
  console.error('\n💡 Create a .env.test file with these variables');
  process.exit(1);
}

// Initialize client
const nfe = new NfeClient({
  apiKey,
  environment,
  timeout: 60000, // 60 seconds
});

console.log('🚀 NFE.io SDK v3 - Service Invoice Complete Example');
console.log('═'.repeat(80));
console.log(`Environment: ${environment}`);
console.log(`Company ID: ${companyId}`);
console.log('═'.repeat(80));

// Track created invoices for cleanup
const createdInvoiceIds = [];

/**
 * Example invoice data
 */
function createInvoiceData(description = 'Consulting Services') {
  return {
    borrower: {
      federalTaxNumber: 12345678901, // CPF (11 digits) or CNPJ (14 digits)
      name: 'João da Silva',
      email: 'joao.silva@example.com',
    },
    cityServiceCode: '10677', // Generic service code - check your city code list
    description: `${description} - SDK v3 Example`,
    servicesAmount: 1500.0, // R$ 1,500.00
  };
}

/**
 * 1. CREATE - Basic invoice creation (handles sync/async)
 */
async function example1_create() {
  console.log('\n📝 Example 1: create() - Basic Invoice Creation');
  console.log('-'.repeat(80));

  try {
    const invoiceData = createInvoiceData('Example 1 - Basic Create');
    console.log('Creating invoice...');

    const result = await nfe.serviceInvoices.create(companyId, invoiceData);

    // Check if synchronous (201) or asynchronous (202)
    if ('id' in result) {
      // Synchronous - invoice issued immediately
      console.log('✅ Invoice issued immediately (synchronous)');
      console.log(`   ID: ${result.id}`);
      console.log(`   Number: ${result.number}`);
      console.log(`   Status: ${result.status}`);
      createdInvoiceIds.push(result.id);
    } else {
      // Asynchronous - invoice being processed
      console.log('⏳ Invoice being processed (asynchronous)');
      console.log(`   Flow Status: ${result.flowStatus}`);
      console.log(`   Location: ${result.location}`);

      // You can manually poll using pollUntilComplete or use createAndWait
      console.log('\n   💡 Use createAndWait() for automatic polling (see Example 2)');
    }
  } catch (error) {
    console.error('❌ Error creating invoice:', error.message);
    if (error.status) console.error(`   HTTP Status: ${error.status}`);
  }
}

/**
 * 2. CREATE AND WAIT - Automatic polling for async processing
 */
async function example2_createAndWait() {
  console.log('\n📝 Example 2: createAndWait() - Create with Automatic Polling');
  console.log('-'.repeat(80));

  try {
    const invoiceData = createInvoiceData('Example 2 - Create and Wait');
    console.log('Creating invoice with automatic polling...');

    const invoice = await nfe.serviceInvoices.createAndWait(companyId, invoiceData, {
      pollingInterval: 2000, // Check every 2 seconds
      maxWaitTime: 60000, // Wait up to 60 seconds
    });

    console.log('✅ Invoice issued successfully');
    console.log(`   ID: ${invoice.id}`);
    console.log(`   Number: ${invoice.number}`);
    console.log(`   Status: ${invoice.status}`);
    console.log(`   Flow Status: ${invoice.flowStatus}`);
    console.log(`   Amount: R$ ${invoice.servicesAmount?.toFixed(2)}`);

    createdInvoiceIds.push(invoice.id);
    return invoice.id;
  } catch (error) {
    console.error('❌ Error creating invoice:', error.message);
    throw error;
  }
}

/**
 * 3. LIST - List invoices with pagination and filters
 */
async function example3_list() {
  console.log('\n📝 Example 3: list() - List Invoices with Filters');
  console.log('-'.repeat(80));

  try {
    // Example 3a: Basic list
    console.log('Listing all invoices (first page)...');
    const invoices = await nfe.serviceInvoices.list(companyId, {
      pageCount: 10, // 10 per page
    });

    console.log(`✅ Found ${invoices.length} invoices`);
    if (invoices.length > 0) {
      console.log('\n   First 3 invoices:');
      invoices.slice(0, 3).forEach((inv, idx) => {
        console.log(`   ${idx + 1}. ID: ${inv.id} | Number: ${inv.number} | Status: ${inv.status}`);
      });
    }

    // Example 3b: List with date filter
    console.log('\n\nListing invoices from last 30 days...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInvoices = await nfe.serviceInvoices.list(companyId, {
      searchPeriod: {
        startDate: thirtyDaysAgo.toISOString().split('T')[0], // YYYY-MM-DD
        endDate: new Date().toISOString().split('T')[0],
      },
      pageCount: 10,
    });

    console.log(`✅ Found ${recentInvoices.length} invoices in last 30 days`);
  } catch (error) {
    console.error('❌ Error listing invoices:', error.message);
  }
}

/**
 * 4. RETRIEVE - Get invoice by ID
 */
async function example4_retrieve(invoiceId) {
  console.log('\n📝 Example 4: retrieve() - Get Invoice by ID');
  console.log('-'.repeat(80));

  try {
    console.log(`Retrieving invoice ${invoiceId}...`);
    const invoice = await nfe.serviceInvoices.retrieve(companyId, invoiceId);

    console.log('✅ Invoice retrieved successfully');
    console.log(`   ID: ${invoice.id}`);
    console.log(`   Number: ${invoice.number}`);
    console.log(`   Status: ${invoice.status}`);
    console.log(`   Flow Status: ${invoice.flowStatus}`);
    console.log(`   Borrower: ${invoice.borrower?.name}`);
    console.log(`   Amount: R$ ${invoice.servicesAmount?.toFixed(2)}`);
    console.log(`   Issue Date: ${invoice.issuedOn}`);
  } catch (error) {
    console.error('❌ Error retrieving invoice:', error.message);
  }
}

/**
 * 5. GET STATUS - Check invoice processing status
 */
async function example5_getStatus(invoiceId) {
  console.log('\n📝 Example 5: getStatus() - Check Invoice Status');
  console.log('-'.repeat(80));

  try {
    console.log(`Checking status for invoice ${invoiceId}...`);
    const status = await nfe.serviceInvoices.getStatus(companyId, invoiceId);

    console.log('✅ Status retrieved:');
    console.log(`   Status: ${status.status}`);
    console.log(`   Is Complete: ${status.isComplete ? 'Yes' : 'No'}`);
    console.log(`   Is Failed: ${status.isFailed ? 'Yes' : 'No'}`);

    if (!status.isComplete) {
      console.log('   ⏳ Invoice still processing');
    } else if (status.isFailed) {
      console.log('   ❌ Invoice processing failed');
    } else {
      console.log('   ✅ Invoice processed successfully');
    }
  } catch (error) {
    console.error('❌ Error checking status:', error.message);
  }
}

/**
 * 6. SEND EMAIL - Send invoice via email
 */
async function example6_sendEmail(invoiceId) {
  console.log('\n📝 Example 6: sendEmail() - Send Invoice via Email');
  console.log('-'.repeat(80));

  try {
    console.log(`Sending invoice ${invoiceId} via email...`);
    await nfe.serviceInvoices.sendEmail(companyId, invoiceId, {
      emails: ['recipient@example.com'],
    });

    console.log('✅ Email sent successfully');
    console.log('   📧 Check recipient inbox for invoice email');
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
  }
}

/**
 * 7. DOWNLOAD PDF - Download invoice PDF
 */
async function example7_downloadPdf(invoiceId) {
  console.log('\n📝 Example 7: downloadPdf() - Download Invoice PDF');
  console.log('-'.repeat(80));

  try {
    // Example 7a: Download single invoice PDF
    console.log(`Downloading PDF for invoice ${invoiceId}...`);
    const pdfBuffer = await nfe.serviceInvoices.downloadPdf(companyId, invoiceId);

    console.log('✅ PDF downloaded successfully');
    console.log(`   Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`   Signature: ${pdfBuffer.toString('utf8', 0, 4)} (should be %PDF)`);

    // Save to file
    const filename = `invoice_${invoiceId}.pdf`;
    writeFileSync(filename, pdfBuffer);
    console.log(`   💾 Saved to: ${filename}`);

    // Example 7b: Download all invoices as ZIP
    console.log('\n\nDownloading all invoices as ZIP...');
    const zipBuffer = await nfe.serviceInvoices.downloadPdf(companyId);

    console.log('✅ ZIP downloaded successfully');
    console.log(`   Size: ${(zipBuffer.length / 1024).toFixed(2)} KB`);

    const zipFilename = `invoices_all_${Date.now()}.zip`;
    writeFileSync(zipFilename, zipBuffer);
    console.log(`   💾 Saved to: ${zipFilename}`);
  } catch (error) {
    console.error('❌ Error downloading PDF:', error.message);
  }
}

/**
 * 8. DOWNLOAD XML - Download invoice XML
 */
async function example8_downloadXml(invoiceId) {
  console.log('\n📝 Example 8: downloadXml() - Download Invoice XML');
  console.log('-'.repeat(80));

  try {
    // Example 8a: Download single invoice XML
    console.log(`Downloading XML for invoice ${invoiceId}...`);
    const xmlBuffer = await nfe.serviceInvoices.downloadXml(companyId, invoiceId);

    console.log('✅ XML downloaded successfully');
    console.log(`   Size: ${(xmlBuffer.length / 1024).toFixed(2)} KB`);

    // Convert Buffer to string and show preview
    const xmlString = xmlBuffer.toString('utf8');
    console.log(`   Preview: ${xmlString.substring(0, 100)}...`);

    // Save to file
    const filename = `invoice_${invoiceId}.xml`;
    writeFileSync(filename, xmlBuffer);
    console.log(`   💾 Saved to: ${filename}`);

    // Example 8b: Download all invoices as ZIP
    console.log('\n\nDownloading all invoices XML as ZIP...');
    const zipBuffer = await nfe.serviceInvoices.downloadXml(companyId);

    console.log('✅ ZIP downloaded successfully');
    console.log(`   Size: ${(zipBuffer.length / 1024).toFixed(2)} KB`);

    const zipFilename = `invoices_xml_all_${Date.now()}.zip`;
    writeFileSync(zipFilename, zipBuffer);
    console.log(`   💾 Saved to: ${zipFilename}`);
  } catch (error) {
    console.error('❌ Error downloading XML:', error.message);
  }
}

/**
 * 9. CREATE BATCH - Create multiple invoices concurrently
 */
async function example9_createBatch() {
  console.log('\n📝 Example 9: createBatch() - Batch Create Multiple Invoices');
  console.log('-'.repeat(80));

  try {
    // Create 3 invoices in batch
    const invoicesData = [
      createInvoiceData('Batch Invoice 1'),
      createInvoiceData('Batch Invoice 2'),
      createInvoiceData('Batch Invoice 3'),
    ];

    console.log(`Creating ${invoicesData.length} invoices in batch...`);
    console.log('⏳ Processing with maxConcurrent=2 (2 at a time)...');

    const results = await nfe.serviceInvoices.createBatch(companyId, invoicesData, {
      waitForComplete: true, // Wait for all to complete
      maxConcurrent: 2, // Process 2 at a time
    });

    console.log(`✅ Batch complete: ${results.length} invoices created`);
    results.forEach((invoice, idx) => {
      console.log(`   ${idx + 1}. ID: ${invoice.id} | Number: ${invoice.number}`);
      createdInvoiceIds.push(invoice.id);
    });
  } catch (error) {
    console.error('❌ Error in batch creation:', error.message);
  }
}

/**
 * 10. CANCEL - Cancel an invoice
 */
async function example10_cancel(invoiceId) {
  console.log('\n📝 Example 10: cancel() - Cancel Invoice');
  console.log('-'.repeat(80));

  try {
    console.log(`Cancelling invoice ${invoiceId}...`);
    // Cancellation is asynchronous (202 + Location). cancel() returns a
    // discriminated union; cancelAndWait() polls until it settles.
    const cancelled = await nfe.serviceInvoices.cancelAndWait(companyId, invoiceId);

    console.log('✅ Invoice cancelled successfully');
    console.log(`   ID: ${cancelled.id}`);
    console.log(`   Status: ${cancelled.flowStatus} (should be "Cancelled")`);
  } catch (error) {
    console.error('❌ Error cancelling invoice:', error.message);
  }
}

/**
 * Cleanup: Cancel all created invoices
 */
async function cleanup() {
  if (createdInvoiceIds.length === 0) {
    console.log('\n🧹 No invoices to clean up');
    return;
  }

  console.log('\n🧹 Cleanup: Cancelling created invoices...');
  console.log('-'.repeat(80));

  for (const invoiceId of createdInvoiceIds) {
    try {
      await nfe.serviceInvoices.cancel(companyId, invoiceId);
      console.log(`   ✅ Cancelled: ${invoiceId}`);
    } catch (error) {
      console.log(`   ⚠️  Failed to cancel ${invoiceId}: ${error.message}`);
    }
  }

  console.log('✅ Cleanup complete');
}

/**
 * Run all examples
 */
async function runAllExamples() {
  let mainInvoiceId = null;

  try {
    // Core operations
    await example1_create();
    mainInvoiceId = await example2_createAndWait();
    await example3_list();

    if (mainInvoiceId) {
      await example4_retrieve(mainInvoiceId);
      await example5_getStatus(mainInvoiceId);
      await example6_sendEmail(mainInvoiceId);
      await example7_downloadPdf(mainInvoiceId);
      await example8_downloadXml(mainInvoiceId);
    }

    // Advanced operations
    await example9_createBatch();

    // Cancellation (run last)
    if (mainInvoiceId) {
      await example10_cancel(mainInvoiceId);
    }

    console.log('\n');
    console.log('═'.repeat(80));
    console.log('✅ All examples completed successfully!');
    console.log('═'.repeat(80));
  } catch (error) {
    console.error('\n❌ Example execution failed:', error);
  } finally {
    // Cleanup remaining invoices
    await cleanup();
  }
}

// Run examples
runAllExamples().catch(console.error);
