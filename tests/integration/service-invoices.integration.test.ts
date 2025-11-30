/**
 * Integration tests for ServiceInvoices resource
 * Tests complete workflow: create company → issue invoice → poll → cancel
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

describe('ServiceInvoices Integration Tests', () => {
  let client: NfeClient;
  let testCompanyId: string;
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

    // Create test company for all invoice tests
    const companyData = {
      ...TEST_COMPANY_DATA,
      name: `Test Company for Invoices ${Date.now()}`,
    };
    const company = await client.companies.create(companyData);
    testCompanyId = company.id;
    logTestInfo('Created test company', { id: testCompanyId });
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  afterEach(async () => {
    // Cleanup invoices (cancel them)
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

  afterEach(async () => {
    // Cleanup test company after all tests
    if (testCompanyId) {
      await cleanupTestCompany(client, testCompanyId);
      logTestInfo('Cleaned up test company', { id: testCompanyId });
    }
  });

  const createTestInvoiceData = () => ({
    borrower: {
      federalTaxNumber: 12345678901,
      name: 'Cliente Teste',
      email: 'cliente@example.com',
    },
    cityServiceCode: '10677', // Código de serviço genérico
    description: 'Serviço de teste SDK v3',
    servicesAmount: 100.00,
  });

  it.skipIf(skipIfNoApiKey())('should create a service invoice (sync)', async () => {
    const invoiceData = createTestInvoiceData();

    logTestInfo('Creating service invoice', invoiceData);
    const result = await client.serviceInvoices.create(testCompanyId, invoiceData);

    expect(result).toBeDefined();

    // Check if sync (201) or async (202)
    if ('id' in result) {
      // Synchronous creation (201)
      expect(result.id).toBeDefined();
      expect(result.number).toBeDefined();
      createdInvoiceIds.push(result.id);
      logTestInfo('Invoice created synchronously', { id: result.id, number: result.number });
    } else {
      // Asynchronous creation (202) - has flowStatus and location
      expect(result.flowStatus).toBeDefined();
      expect(['pending', 'processing']).toContain(result.flowStatus);

      // Extract invoice ID from location if available
      if (result.location) {
        const match = result.location.match(/serviceinvoices\/([^/]+)/);
        if (match) {
          createdInvoiceIds.push(match[1]);
        }
      }
      logTestInfo('Invoice created asynchronously', { status: result.flowStatus });
    }
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should poll invoice until complete (if async)', async () => {
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
  }, { timeout: 90000 }); // Longer timeout for polling

  it.skipIf(skipIfNoApiKey())('should use createAndWait helper', async () => {
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
  }, { timeout: 90000 });

  it.skipIf(skipIfNoApiKey())('should retrieve invoice by id', async () => {
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
  }, { timeout: 90000 });

  it.skipIf(skipIfNoApiKey())('should list service invoices', async () => {
    // Create invoice first
    const invoiceData = createTestInvoiceData();
    const created = await client.serviceInvoices.createAndWait(testCompanyId, invoiceData, {
      maxWaitTime: 60000,
    });
    createdInvoiceIds.push(created.id);

    // List invoices
    logTestInfo('Listing invoices for company', { companyId: testCompanyId });
    const invoices = await client.serviceInvoices.list(testCompanyId);

    expect(invoices).toBeDefined();
    expect(Array.isArray(invoices)).toBe(true);
    expect(invoices.length).toBeGreaterThan(0);

    // Should include our created invoice
    const found = invoices.find(inv => inv.id === created.id);
    expect(found).toBeDefined();
  }, { timeout: 90000 });

  it.skipIf(skipIfNoApiKey())('should cancel service invoice', async () => {
    // Create invoice first
    const invoiceData = createTestInvoiceData();
    const created = await client.serviceInvoices.createAndWait(testCompanyId, invoiceData, {
      maxWaitTime: 60000,
    });
    createdInvoiceIds.push(created.id);

    // Cancel it
    logTestInfo('Cancelling invoice', { id: created.id });
    const cancelled = await client.serviceInvoices.cancel(testCompanyId, created.id);

    expect(cancelled).toBeDefined();
    expect(cancelled.id).toBe(created.id);
    expect(cancelled.status).toBe('cancelled');

    // Remove from cleanup since already cancelled
    const index = createdInvoiceIds.indexOf(created.id);
    if (index > -1) {
      createdInvoiceIds.splice(index, 1);
    }
  }, { timeout: 90000 });

  it.skipIf(skipIfNoApiKey())('should send invoice email', async () => {
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
  }, { timeout: 90000 });

  it.skipIf(skipIfNoApiKey())('should download invoice PDF', async () => {
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
  }, { timeout: 90000 });

  it.skipIf(skipIfNoApiKey())('should download invoice XML', async () => {
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

    // XML should start with <?xml
    expect(xmlBuffer.toString('utf8', 0, 5)).toBe('<?xml');
    logTestInfo('XML downloaded', { size: xmlBuffer.length });
  }, { timeout: 90000 });

  it.skipIf(skipIfNoApiKey())('should handle validation errors', async () => {
    const invalidData = {
      // Missing required fields
      description: 'Invalid invoice',
    } as any;

    logTestInfo('Testing validation error');
    await expect(
      client.serviceInvoices.create(testCompanyId, invalidData)
    ).rejects.toThrow();
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should handle 404 for non-existent invoice', async () => {
    const fakeId = 'non-existent-invoice-' + Date.now();

    logTestInfo('Testing 404 error', { id: fakeId });
    await expect(
      client.serviceInvoices.retrieve(testCompanyId, fakeId)
    ).rejects.toThrow();
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });

  it.skipIf(skipIfNoApiKey())('should handle polling timeout', async () => {
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
  }, { timeout: INTEGRATION_TEST_CONFIG.timeout });
});
