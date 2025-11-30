/**
 * NFE.io SDK v3 - Basic Usage Example
 *
 * Demonstrates core functionality of the SDK
 */

import { NfeClient } from '../src/index.js';

async function basicExample() {
  // Create client
  const nfe = new NfeClient({
    apiKey: 'your-api-key-here',
    environment: 'development', // or 'production'
    timeout: 30000
  });

  try {
    // Test client configuration
    console.log('✅ Client created successfully');
    console.log('Client info:', nfe.getClientInfo());

    // Health check
    const health = await nfe.healthCheck();
    console.log('Health check:', health);

    // List companies (should work with any valid API key)
    const companies = await nfe.companies.list({ pageCount: 5 });
    console.log(`Found ${companies.data.length} companies`);

    if (companies.data.length > 0) {
      const firstCompany = companies.data[0];
      console.log('First company:', firstCompany.name);

      // List service invoices for first company
      const invoices = await nfe.serviceInvoices.list(firstCompany.id!, { pageCount: 5 });
      console.log(`Found ${invoices.data.length} invoices for ${firstCompany.name}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function createInvoiceExample() {
  const nfe = new NfeClient({
    apiKey: 'your-api-key-here',
    environment: 'development'
  });

  try {
    // Example invoice data
    const invoiceData = {
      cityServiceCode: '2690',
      description: 'Consultoria em desenvolvimento de software',
      servicesAmount: 1500.00,
      borrower: {
        type: 'LegalEntity' as const,
        federalTaxNumber: 12345678000123,
        name: 'Empresa Cliente LTDA',
        email: 'cliente@exemplo.com.br',
        address: {
          country: 'BRA',
          postalCode: '01234-567',
          street: 'Rua Exemplo, 123',
          district: 'Centro',
          city: {
            code: '3550308',
            name: 'São Paulo'
          },
          state: 'SP'
        }
      }
    };

    // Create invoice with automatic wait for completion
    const invoice = await nfe.serviceInvoices.createAndWait('company-id', invoiceData);
    console.log('✅ Invoice created:', invoice.id, invoice.number);

  } catch (error) {
    console.error('❌ Error creating invoice:', error);
  }
}

// Environment check
function checkEnvironment() {
  console.log('=== NFE.io SDK v3 Environment Check ===');

  const envCheck = {
    nodeVersion: process.version,
    hasFetch: typeof fetch !== 'undefined',
    hasAbortController: typeof AbortController !== 'undefined',
    platform: process.platform,
    arch: process.arch
  };

  console.log('Environment:', envCheck);

  if (!envCheck.hasFetch) {
    console.error('❌ Fetch API not available - requires Node.js 18+');
    return false;
  }

  const majorVersion = parseInt(process.version.slice(1).split('.')[0]);
  if (majorVersion < 18) {
    console.error(`❌ Node.js ${majorVersion} not supported - requires Node.js 18+`);
    return false;
  }

  console.log('✅ Environment is compatible');
  return true;
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('NFE.io SDK v3 - Basic Example\n');

  if (checkEnvironment()) {
    console.log('\n=== Basic Usage ===');
    await basicExample();

    console.log('\n=== Invoice Creation ===');
    // Uncomment to test invoice creation (requires valid API key and company ID)
    // await createInvoiceExample();
  }
}
