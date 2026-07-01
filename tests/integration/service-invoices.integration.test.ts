/**
 * Integration tests for ServiceInvoices resource
 * Tests complete workflow: create company → issue invoice → poll → cancel
 *
 * Requires an EMISSION-CAPABLE company (one with a municipal enrollment) via
 * NFE_COMPANY_ID. NFS-e emission needs an inscrição municipal; without it the API
 * returns 503. When the configured company cannot emit, the suite self-skips (so it
 * never fails for a configuration reason). If NFE_COMPANY_ID is unset, a throwaway
 * test company is created (and deleted) instead.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import {
  createIntegrationClient,
  skipIfNoApiKey,
  shouldRunIntegrationTests,
  TEST_COMPANY_DATA,
  cleanupTestCompany,
  logTestInfo,
  INTEGRATION_TEST_CONFIG,
} from './setup.js';
import { NfeClient } from '../../src/core/client.js';

const hasApiKey = !!process.env.NFE_API_KEY;

// Determine emission capability once, at collection time, so the whole suite self-skips
// when the configured company has no municipal enrollment (the NFS-e prerequisite).
async function companyCanEmit(): Promise<boolean> {
  const companyId = process.env.NFE_COMPANY_ID?.trim();
  if (!companyId) return true; // a throwaway company is created in beforeAll
  try {
    const probe = createIntegrationClient();
    const res = (await probe.municipalTaxes.list(companyId)) as unknown as {
      municipalTaxes?: unknown[];
    };
    return (res.municipalTaxes?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

const canEmit = shouldRunIntegrationTests() ? await companyCanEmit() : false;

if (hasApiKey && !canEmit && process.env.NFE_COMPANY_ID) {
  console.warn(
    `[Integration] Company ${process.env.NFE_COMPANY_ID} has no municipal enrollment; ` +
      'ServiceInvoices emission tests will be skipped. Set NFE_COMPANY_ID to an emission-capable company.'
  );
}

describe.skipIf(!hasApiKey || !canEmit)('ServiceInvoices Integration Tests', () => {
  let client: NfeClient;
  let testCompanyId: string;
  // Only true when WE created the company (so cleanup must not delete a real one)
  let companyWasCreated = false;
  const createdInvoiceIds: string[] = [];

  beforeAll(async () => {
    if (skipIfNoApiKey()) {
      console.log('Skipping integration tests - no API key configured');
      return;
    }

    client = createIntegrationClient();
    logTestInfo('Running ServiceInvoices integration tests', {
      environment: INTEGRATION_TEST_CONFIG.environment,
    });

    // Prefer an existing, emission-capable company (municipal enrollment + certificate).
    // Fall back to creating a throwaway test company only when none is provided.
    const existingCompanyId = process.env.NFE_COMPANY_ID?.trim();
    if (existingCompanyId) {
      testCompanyId = existingCompanyId;
      logTestInfo('Using existing company from NFE_COMPANY_ID', { id: testCompanyId });
    } else {
      const companyData = {
        ...TEST_COMPANY_DATA,
        name: `Test Company for Invoices ${Date.now()}`,
      };
      const company = await client.companies.create(companyData);
      testCompanyId = company.id;
      companyWasCreated = true;
      logTestInfo('Created test company', { id: testCompanyId });
    }
    // NOTE: hooks take the timeout as a NUMBER (not an options object).
  }, INTEGRATION_TEST_CONFIG.timeout);

  afterEach(async () => {
    // Cleanup invoices (cancel them) after each test
    for (const invoiceId of createdInvoiceIds) {
      try {
        await client.serviceInvoices.cancel(testCompanyId, invoiceId);
        logTestInfo('Cancelled invoice', { id: invoiceId });
      } catch (error) {
        // Invoice might already be cancelled or not found
        console.warn(`Failed to cancel invoice ${invoiceId}:`, error);
      }
    }
    createdInvoiceIds.length = 0;
  });

  afterAll(async () => {
    // Only delete the company if THIS suite created it — never a real one passed via env
    if (companyWasCreated && testCompanyId) {
      await cleanupTestCompany(client, testCompanyId);
      logTestInfo('Cleaned up test company', { id: testCompanyId });
    }
  }, INTEGRATION_TEST_CONFIG.timeout);

  const createTestInvoiceData = () => ({
    borrower: {
      federalTaxNumber: 52998224725, // Valid CPF (correct check digits)
      name: 'Cliente Teste',
      email: 'cliente@example.com',
    },
    cityServiceCode: '10677', // Código de serviço genérico
    description: 'Serviço de teste SDK v3',
    servicesAmount: 100.0,
  });

  it.skipIf(skipIfNoApiKey())('should create a service invoice (discriminated union)', { timeout: INTEGRATION_TEST_CONFIG.timeout }, async () => {
    const invoiceData = createTestInvoiceData();

    logTestInfo('Creating service invoice', invoiceData);
    const result = await client.serviceInvoices.create(testCompanyId, invoiceData);

    expect(result).toBeDefined();

    // create() returns a discriminated union keyed on `status`
    if (result.status === 'immediate') {
      // Synchronous issuance (201)
      expect(result.invoice.id).toBeDefined();
      createdInvoiceIds.push(result.invoice.id);
      logTestInfo('Invoice created synchronously', { id: result.invoice.id });
    } else {
      // Asynchronous issuance (202 + Location)
      expect(result.status).toBe('async');
      expect(result.response.location).toBeTruthy();
      expect(result.response.invoiceId).toBeTruthy();
      createdInvoiceIds.push(result.response.invoiceId);
      logTestInfo('Invoice created asynchronously', { invoiceId: result.response.invoiceId });
    }
  });

  it.skipIf(skipIfNoApiKey())('should poll invoice until complete (if async)', { timeout: 90000 }, async () => {
    const invoiceData = createTestInvoiceData();

    logTestInfo('Creating service invoice with polling');
    const result = await client.serviceInvoices.create(testCompanyId, invoiceData);

    // If async (202), poll until complete
    if ('location' in result && result.location) {
      logTestInfo('Polling invoice until complete', { location: result.location });

      const completed = await client.pollUntilComplete(result.location, {
        intervalMs: 2000,
        timeoutMs: 60000, // 60 seconds
      });

      expect(completed).toBeDefined();
      expect(completed.id).toBeDefined();
      expect(['issued', 'completed']).toContain(completed.flowStatus || completed.status);

      createdInvoiceIds.push(completed.id);
      logTestInfo('Invoice completed', { id: completed.id, status: completed.status });
    } else if ('id' in result) {
      // Sync creation, already complete
      createdInvoiceIds.push(result.id);
      logTestInfo('Invoice created synchronously, no polling needed', { id: result.id });
    }
  }); // Longer timeout for polling

  it.skipIf(skipIfNoApiKey())('should use createAndWait helper', { timeout: 90000 }, async () => {
    const invoiceData = createTestInvoiceData();

    logTestInfo('Using createAndWait helper');
    const invoice = await client.serviceInvoices.createAndWait(testCompanyId, invoiceData, {
      pollingInterval: 2000,
      maxWaitTime: 60000,
    });

    expect(invoice).toBeDefined();
    expect(invoice.id).toBeDefined();
    expect(invoice.number).toBeDefined();

    createdInvoiceIds.push(invoice.id);
    logTestInfo('Invoice created and waited', { id: invoice.id, number: invoice.number });
  });

  it.skipIf(skipIfNoApiKey())('should retrieve invoice by id', { timeout: 90000 }, async () => {
    // Create invoice first
    const invoiceData = createTestInvoiceData();
    const created = await client.serviceInvoices.createAndWait(testCompanyId, invoiceData, {
      maxWaitTime: 60000,
    });
    createdInvoiceIds.push(created.id);

    // Retrieve it
    logTestInfo('Retrieving invoice', { id: created.id });
    const retrieved = await client.serviceInvoices.retrieve(testCompanyId, created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.number).toBe(created.number);
  });

  it.skipIf(skipIfNoApiKey())('should list service invoices', { timeout: 90000 }, async () => {
    // Create invoice first
    const invoiceData = createTestInvoiceData();
    const created = await client.serviceInvoices.createAndWait(testCompanyId, invoiceData, {
      maxWaitTime: 60000,
    });
    createdInvoiceIds.push(created.id);

    // List invoices — the API returns a `{ serviceInvoices, page }` envelope
    logTestInfo('Listing invoices for company', { companyId: testCompanyId });
    const result = await client.serviceInvoices.list(testCompanyId);

    expect(result).toBeDefined();
    expect(Array.isArray(result.serviceInvoices)).toBe(true);
    expect(result.serviceInvoices!.length).toBeGreaterThan(0);

    // Should include our created invoice
    const found = result.serviceInvoices!.find((inv) => inv.id === created.id);
    expect(found).toBeDefined();
  });

  it.skipIf(skipIfNoApiKey())('should cancel service invoice', { timeout: 90000 }, async () => {
    // Create invoice first
    const invoiceData = createTestInvoiceData();
    const created = await client.serviceInvoices.createAndWait(testCompanyId, invoiceData, {
      maxWaitTime: 60000,
    });
    createdInvoiceIds.push(created.id);

    // Cancel it — cancellation is asynchronous (202 + Location)
    logTestInfo('Cancelling invoice', { id: created.id });
    const result = await client.serviceInvoices.cancel(testCompanyId, created.id);

    expect(result.status).toBe('async');
    if (result.status === 'async') {
      expect(result.response.invoiceId).toBeTruthy();
      expect(result.response.location).toContain('/serviceinvoices/');
    }

    // Cancellation already requested; remove from cleanup to avoid a double cancel
    const index = createdInvoiceIds.indexOf(created.id);
    if (index > -1) {
      createdInvoiceIds.splice(index, 1);
    }
  });

  it.skipIf(skipIfNoApiKey())('should cancel and wait until settled', { timeout: 120000 }, async () => {
    const created = await client.serviceInvoices.createAndWait(testCompanyId, createTestInvoiceData(), {
      timeout: 60000,
    });

    logTestInfo('Cancelling invoice and waiting', { id: created.id });
    const settled = await client.serviceInvoices.cancelAndWait(testCompanyId, created.id, {
      timeout: 60000,
    });

    expect(settled).toBeDefined();
    expect(settled.id).toBe(created.id);
    expect(settled.flowStatus).toBe('Cancelled');
  });

  it.skipIf(skipIfNoApiKey())('should send invoice email', { timeout: 90000 }, async () => {
    // Create invoice first
    const invoiceData = createTestInvoiceData();
    const created = await client.serviceInvoices.createAndWait(testCompanyId, invoiceData, {
      maxWaitTime: 60000,
    });
    createdInvoiceIds.push(created.id);

    // Send email
    logTestInfo('Sending invoice email', { id: created.id });
    await client.serviceInvoices.sendEmail(testCompanyId, created.id, {
      emails: ['test@example.com'],
    });

    // Email sent successfully (no error thrown)
    logTestInfo('Invoice email sent');
  });

  it.skipIf(skipIfNoApiKey())('should download invoice PDF', { timeout: 90000 }, async () => {
    // Create invoice first
    const invoiceData = createTestInvoiceData();
    const created = await client.serviceInvoices.createAndWait(testCompanyId, invoiceData, {
      maxWaitTime: 60000,
    });
    createdInvoiceIds.push(created.id);

    // Download PDF
    logTestInfo('Downloading invoice PDF', { id: created.id });
    const pdfBuffer = await client.serviceInvoices.downloadPdf(testCompanyId, created.id);

    expect(pdfBuffer).toBeDefined();
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // PDF should start with %PDF
    expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
    logTestInfo('PDF downloaded', { size: pdfBuffer.length });
  });

  it.skipIf(skipIfNoApiKey())('should download invoice XML', { timeout: 90000 }, async () => {
    // Create invoice first
    const invoiceData = createTestInvoiceData();
    const created = await client.serviceInvoices.createAndWait(testCompanyId, invoiceData, {
      maxWaitTime: 60000,
    });
    createdInvoiceIds.push(created.id);

    // Download XML
    logTestInfo('Downloading invoice XML', { id: created.id });
    const xmlBuffer = await client.serviceInvoices.downloadXml(testCompanyId, created.id);

    expect(xmlBuffer).toBeDefined();
    expect(Buffer.isBuffer(xmlBuffer)).toBe(true);
    expect(xmlBuffer.length).toBeGreaterThan(0);

    // NFS-e XML may omit the `<?xml` prolog and start directly with `<Nfse`
    const head = xmlBuffer.toString('utf8', 0, 64).trimStart();
    expect(head.startsWith('<')).toBe(true);
    expect(head.toLowerCase()).toContain('nfse');
    logTestInfo('XML downloaded', { size: xmlBuffer.length });
  });

  it.skipIf(skipIfNoApiKey())('should handle validation errors', { timeout: INTEGRATION_TEST_CONFIG.timeout }, async () => {
    const invalidData = {
      // Missing required fields
      description: 'Invalid invoice',
    } as any;

    logTestInfo('Testing validation error');
    await expect(
      client.serviceInvoices.create(testCompanyId, invalidData)
    ).rejects.toThrow();
  });

  it.skipIf(skipIfNoApiKey())('should handle 404 for non-existent invoice', { timeout: INTEGRATION_TEST_CONFIG.timeout }, async () => {
    const fakeId = 'non-existent-invoice-' + Date.now();

    logTestInfo('Testing 404 error', { id: fakeId });
    await expect(
      client.serviceInvoices.retrieve(testCompanyId, fakeId)
    ).rejects.toThrow();
  });

  it.skipIf(skipIfNoApiKey())('should handle polling timeout', { timeout: INTEGRATION_TEST_CONFIG.timeout }, async () => {
    const invoiceData = createTestInvoiceData();
    const result = await client.serviceInvoices.create(testCompanyId, invoiceData);

    // If async, test timeout
    if ('location' in result && result.location) {
      logTestInfo('Testing polling timeout', { location: result.location });

      await expect(
        client.pollUntilComplete(result.location, {
          intervalMs: 1000,
          timeoutMs: 3000, // Very short timeout
        })
      ).rejects.toThrow(/timeout/i);

      // Extract and save invoice ID for cleanup
      const match = result.location.match(/serviceinvoices\/([^/]+)/);
      if (match) {
        createdInvoiceIds.push(match[1]);
      }
    }
  });
});
