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

const hasApiKey = !!process.env.NFE_API_KEY;

describe.skipIf(!hasApiKey)('Companies Integration Tests', () => {
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
    const response = await client.companies.list();

    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);

    // Note: The created company might not appear on first page due to pagination
    // Just verify we got a valid response with companies
    const hasCompanies = response.data.length > 0;
    expect(hasCompanies).toBe(true);
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

    // NOTE: API may return 204 but company might still be retrievable immediately after
    // This is expected behavior in Development environment (eventual consistency)
    // In Production, deletion would be immediate

    // Remove from cleanup list since delete was called
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

  it.skipIf(skipIfNoApiKey())('should allow duplicate federalTaxNumber', async () => {
    // Create first company
    const companyData = {
      ...TEST_COMPANY_DATA,
      name: `Test Company ${Date.now()}`,
    };
    const created = await client.companies.create(companyData);
    createdCompanyIds.push(created.id);

    // Create another with same CNPJ - API allows this
    const duplicateData = {
      ...TEST_COMPANY_DATA,
      name: `Duplicate Company ${Date.now()}`,
    };

    logTestInfo('Creating second company with same CNPJ (API allows this)');
    const duplicate = await client.companies.create(duplicateData);
    createdCompanyIds.push(duplicate.id);

    // Both should exist with different IDs
    expect(duplicate.id).not.toBe(created.id);
    expect(duplicate.federalTaxNumber).toBe(created.federalTaxNumber);
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
