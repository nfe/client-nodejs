/**
 * NFE.io SDK v3 - CPF / Natural Person Lookup Example
 *
 * This example demonstrates how to use the Natural Person Lookup API for querying
 * Brazilian CPF cadastral status (situação cadastral) at Receita Federal.
 *
 * Prerequisites:
 *   - Set NFE_DATA_API_KEY or NFE_API_KEY environment variable
 *   - Or pass the API key directly in the configuration
 *
 * Run this example:
 *   node examples/cpf-lookup.js
 */

import { NfeClient } from '../dist/index.js';

// Configuration
const client = new NfeClient({
  // The Natural Person API uses dataApiKey (falls back to apiKey)
  // dataApiKey: process.env.NFE_DATA_API_KEY,
  apiKey: process.env.NFE_API_KEY,
  environment: 'production',
});

// Example CPF and birth date — replace with real values for testing
const EXAMPLE_CPF = process.env.TEST_CPF || '12345678901';
const EXAMPLE_BIRTH_DATE = process.env.TEST_BIRTH_DATE || '1990-01-15';

/**
 * Example 1: CPF lookup with string date
 */
async function cpfLookupWithString() {
  console.log('\n👤 Example 1: CPF Lookup with String Date');
  console.log('='.repeat(50));

  try {
    const result = await client.naturalPersonLookup.getStatus(EXAMPLE_CPF, EXAMPLE_BIRTH_DATE);

    console.log('Name:              ', result.name ?? 'N/A');
    console.log('CPF:               ', result.federalTaxNumber);
    console.log('Birth Date:        ', result.birthOn ?? 'N/A');
    console.log('Cadastral Status:  ', result.status ?? 'N/A');
    console.log('Query Timestamp:   ', result.createdOn ?? 'N/A');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 2: CPF lookup with formatted CPF and Date object
 */
async function cpfLookupWithDate() {
  console.log('\n👤 Example 2: CPF Lookup with Date Object');
  console.log('='.repeat(50));

  try {
    // The SDK accepts formatted CPF (punctuation is stripped automatically)
    const formattedCpf = '123.456.789-01';

    // The SDK also accepts Date objects for birth date
    const birthDate = new Date(1990, 0, 15); // January 15, 1990

    const result = await client.naturalPersonLookup.getStatus(formattedCpf, birthDate);

    console.log('Name:              ', result.name ?? 'N/A');
    console.log('Cadastral Status:  ', result.status ?? 'N/A');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 3: Error handling
 */
async function errorHandling() {
  console.log('\n⚠️  Example 3: Error Handling');
  console.log('='.repeat(50));

  // Invalid CPF (too short)
  try {
    await client.naturalPersonLookup.getStatus('123', '1990-01-15');
  } catch (error) {
    console.log('Validation error (short CPF):', error.message);
  }

  // Invalid birth date format
  try {
    await client.naturalPersonLookup.getStatus('12345678901', '15/01/1990');
  } catch (error) {
    console.log('Validation error (bad date):', error.message);
  }

  // CPF not found (404)
  try {
    await client.naturalPersonLookup.getStatus('00000000000', '2000-01-01');
  } catch (error) {
    console.log('API error (not found):       ', error.message);
  }
}

/**
 * Run all examples
 */
async function main() {
  console.log('🇧🇷 NFE.io SDK v3 - CPF Lookup Examples');
  console.log('━'.repeat(50));
  console.log(`Using CPF: ${EXAMPLE_CPF}`);
  console.log(`Using birth date: ${EXAMPLE_BIRTH_DATE}`);

  await cpfLookupWithString();
  await cpfLookupWithDate();
  await errorHandling();

  console.log('\n✅ All examples completed');
}

main().catch(console.error);
