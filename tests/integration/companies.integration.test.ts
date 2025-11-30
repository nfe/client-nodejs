/**
 * Integration tests for Companies resource
 * Tests against real NFE.io API (sandbox)
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import {
  createIntegrationClient,
  skipIfNoApiKey,
  TEST_COMPANY_DATA,
  cleanupTestCompany,
  logTestInfo,
  INTEGRATION_TEST_CONFIG,
} from './setup.js';
import { NfeClient } from '../../src/core/client.js';

describe('Companies Integration Tests', () => {
  let client: NfeClient;
  const createdCompanyIds: string[] = [];

  beforeAll(() => {
    if (skipIfNoApiKey()) {
      console.log('Skipping integration tests - no API key configured');
    } else {
      client = createIntegrationClient();
      logTestInfo('Running Companies integration tests', {
        environment: INTEGRATION_TEST_CONFIG.environment,
      });
    }
  });

  afterEach(async () => {
    // Cleanup companies created during tests
    for (const companyId of createdCompanyIds) {
      await cleanupTestCompany(client, companyId);
    }
    createdCompanyIds.length = 0;
  });

  it.skipIf(skipIfNoApiKey())('should create a company', async () => {
    const companyData = {
      ...TEST_COMPANY_DATA,
      name: `Test Company ${Date.now()}`,
    };

    logTestInfo('Creating company', companyData);
    const company = await client.companies.create(companyData);

    expect(company).toBeDefined();
    expect(company.id).toBeDefined();
    expect(company.name).toBe(companyData.name);
    expect(company.federalTaxNumber).toBe(companyData.federalTaxNumber);

    createdCompanyIds.push(company.id);
    logTestInfo('Company created', { id: company.id });
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should retrieve a company by id', async () => {
    // Create company first
    const companyData = {
      ...TEST_COMPANY_DATA,
      name: `Test Company ${Date.now()}`,
    };
    const created = await client.companies.create(companyData);
    createdCompanyIds.push(created.id);

    // Retrieve it
    logTestInfo('Retrieving company', { id: created.id });
    const retrieved = await client.companies.retrieve(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.name).toBe(companyData.name);
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should list companies', async () => {
    // Create at least one company
    const companyData = {
      ...TEST_COMPANY_DATA,
      name: `Test Company ${Date.now()}`,
    };
    const created = await client.companies.create(companyData);
    createdCompanyIds.push(created.id);

    // List companies
    logTestInfo('Listing companies');
    const companies = await client.companies.list();

    expect(companies).toBeDefined();
    expect(Array.isArray(companies)).toBe(true);
    expect(companies.length).toBeGreaterThan(0);

    // Should include our created company
    const found = companies.find(c => c.id === created.id);
    expect(found).toBeDefined();
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should update a company', async () => {
    // Create company first
    const companyData = {
      ...TEST_COMPANY_DATA,
      name: `Test Company ${Date.now()}`,
    };
    const created = await client.companies.create(companyData);
    createdCompanyIds.push(created.id);

    // Update it
    const updatedName = `Updated ${created.name}`;
    logTestInfo('Updating company', { id: created.id, newName: updatedName });
    const updated = await client.companies.update(created.id, {
      name: updatedName,
    });

    expect(updated).toBeDefined();
    expect(updated.id).toBe(created.id);
    expect(updated.name).toBe(updatedName);
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should delete a company', async () => {
    // Create company first
    const companyData = {
      ...TEST_COMPANY_DATA,
      name: `Test Company ${Date.now()}`,
    };
    const created = await client.companies.create(companyData);

    // Delete it
    logTestInfo('Deleting company', { id: created.id });
    await client.companies.remove(created.id);

    // Verify it's gone - should throw 404
    await expect(
      client.companies.retrieve(created.id)
    ).rejects.toThrow();

    // Remove from cleanup list since already deleted
    const index = createdCompanyIds.indexOf(created.id);
    if (index > -1) {
      createdCompanyIds.splice(index, 1);
    }
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should handle 404 for non-existent company', async () => {
    const fakeId = 'non-existent-id-' + Date.now();

    logTestInfo('Testing 404 error', { id: fakeId });
    await expect(
      client.companies.retrieve(fakeId)
    ).rejects.toThrow();
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should validate required fields on create', async () => {
    const invalidData = {
      // Missing required fields
      name: 'Invalid Company',
    } as any;

    logTestInfo('Testing validation error');
    await expect(
      client.companies.create(invalidData)
    ).rejects.toThrow();
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should handle duplicate federalTaxNumber', async () => {
    // Create first company
    const companyData = {
      ...TEST_COMPANY_DATA,
      name: `Test Company ${Date.now()}`,
    };
    const created = await client.companies.create(companyData);
    createdCompanyIds.push(created.id);

    // Try to create another with same CNPJ
    const duplicateData = {
      ...TEST_COMPANY_DATA,
      name: `Duplicate Company ${Date.now()}`,
    };

    logTestInfo('Testing duplicate CNPJ error');
    await expect(
      client.companies.create(duplicateData)
    ).rejects.toThrow();
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  // Note: Certificate upload test commented out as it requires valid PFX file
  // and test environment might not support it
  it.skipIf(skipIfNoApiKey()).skip('should upload certificate', async () => {
    // Create company first
    const companyData = {
      ...TEST_COMPANY_DATA,
      name: `Test Company ${Date.now()}`,
    };
    const created = await client.companies.create(companyData);
    createdCompanyIds.push(created.id);

    // Upload certificate (requires valid PFX file)
    // const certificateBuffer = await fs.readFile('path/to/test-certificate.pfx');
    // await client.companies.uploadCertificate(created.id, {
    //   file: certificateBuffer,
    //   password: 'test-password',
    // });

    // This test is skipped as it requires:
    // 1. Valid test certificate file
    // 2. Test environment support for certificates
    // 3. Proper cleanup after upload
  });
});
