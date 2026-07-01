/**
 * NFE.io SDK v3 - Address Lookup Examples
 *
 * This example demonstrates how to use the Addresses API for looking up
 * Brazilian addresses (CEP/postal code lookups).
 *
 * Prerequisites:
 *   - Set NFE_DATA_API_KEY or NFE_API_KEY environment variable
 *   - Or pass the API key directly in the configuration
 *
 * Run this example:
 *   node examples/address-lookup.js
 */

import { NfeClient } from '../dist/index.js';

// Configuration with separate data API key (optional)
const client = new NfeClient({
  // You can use a separate API key for data/query services (addresses, CT-e)
  // dataApiKey: process.env.NFE_DATA_API_KEY,

  // Or use the main API key (will be used as fallback for data services)
  apiKey: process.env.NFE_API_KEY,

  // Environment: 'production' or 'development'
  environment: 'production',
});

/**
 * Example 1: Basic postal code lookup
 */
async function lookupByPostalCode() {
  console.log('\n📮 Example 1: Postal Code Lookup');
  console.log('='.repeat(50));

  try {
    // Lookup a São Paulo CEP (Avenida Paulista)
    const result = await client.addresses.lookupByPostalCode('01310-100');

    console.log('CEP:', result.postalCode);
    console.log('Street:', result.street);
    console.log('District:', result.district);
    console.log('City:', result.city?.name);
    console.log('State:', result.state);
    console.log('Country:', result.country);

    // Works with or without hyphen
    const result2 = await client.addresses.lookupByPostalCode('01310100');
    console.log('\nSame CEP without hyphen:', result2.postalCode);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Note: the live address.api.nfe.io/v2 host supports postal-code lookup only.
 * There is no working free-text/search endpoint, so this SDK exposes
 * `lookupByPostalCode` only.
 */

/**
 * Example 2: Using only dataApiKey (isolated usage)
 */
async function isolatedAddressUsage() {
  console.log('\n🔐 Example 2: Isolated Data API Usage');
  console.log('='.repeat(50));

  // Create a client with ONLY dataApiKey
  // This is useful when you only have access to data/query services
  const dataOnlyClient = new NfeClient({
    dataApiKey: process.env.NFE_DATA_API_KEY || process.env.NFE_API_KEY,
  });

  try {
    // Addresses work
    const result = await dataOnlyClient.addresses.lookupByPostalCode('20040-020');
    console.log('Rio de Janeiro CEP lookup succeeded!');
    console.log(`  ${result.street}, ${result.city?.name}/${result.state}`);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Other resources will throw an error (commented out to avoid runtime error)
  // This would throw: "API key required for this resource"
  // await addressOnlyClient.serviceInvoices.list('company-id');
}

/**
 * Example 3: Error handling
 */
async function errorHandling() {
  console.log('\n⚠️  Example 3: Error Handling');
  console.log('='.repeat(50));

  try {
    // Invalid CEP format
    await client.addresses.lookupByPostalCode('invalid');
  } catch (error) {
    console.log('ValidationError for invalid CEP:', error.message);
  }

  try {
    // Non-existent CEP (will get NotFoundError from API)
    await client.addresses.lookupByPostalCode('00000000');
  } catch (error) {
    console.log('API error for non-existent CEP:', error.message);
  }
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('🏠 NFE.io Address Lookup Examples');
  console.log('━'.repeat(50));

  if (!process.env.NFE_API_KEY && !process.env.NFE_DATA_API_KEY) {
    console.error('\n❌ No API key found!');
    console.error('Please set NFE_API_KEY or NFE_DATA_API_KEY environment variable.');
    console.error('\nExample:');
    console.error('  export NFE_API_KEY="your-api-key"');
    console.error('  node examples/address-lookup.js');
    process.exit(1);
  }

  await lookupByPostalCode();
  await isolatedAddressUsage();
  await errorHandling();

  console.log('\n✅ All examples completed!');
}

// Run main function
main().catch(console.error);
