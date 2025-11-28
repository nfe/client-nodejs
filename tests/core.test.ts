/**
 * Basic SDK functionality tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NfeClient } from '../src/core/client';
import { 
  NfeError, 
  AuthenticationError, 
  BadRequestError 
} from '../src/core/errors';

describe('NfeClient Core', () => {
  let client: NfeClient;

  beforeEach(() => {
    // Mock fetch globally
    global.fetch = vi.fn();
    
    client = new NfeClient({
      apiKey: 'test-key',
      environment: 'sandbox'
    });
  });

  it('should create client with valid config', () => {
    expect(client).toBeInstanceOf(NfeClient);
    const config = client.getConfig();
    expect(config.apiKey).toBe('test-key');
    expect(config.environment).toBe('sandbox');
  });

  it('should throw error for invalid config', () => {
    expect(() => {
      new NfeClient({ apiKey: '' });
    }).toThrow();
  });

  it('should validate sandbox URLs', () => {
    const sandboxClient = new NfeClient({ 
      apiKey: 'test', 
      environment: 'sandbox'
    });
    expect(sandboxClient.getConfig().baseUrl).toContain('sandbox');
  });
});

describe('Error System', () => {
  it('should create proper error hierarchy', () => {
    const authError = new AuthenticationError('Invalid API key');
    expect(authError).toBeInstanceOf(NfeError);
    expect(authError).toBeInstanceOf(AuthenticationError);
    expect(authError.type).toBe('AuthenticationError');
    expect(authError.code).toBe(401);
  });

  it('should create bad request errors', () => {
    const badRequest = new BadRequestError('Invalid data', {
      field: 'Invalid field value'
    });
    expect(badRequest).toBeInstanceOf(BadRequestError);
    expect(badRequest.type).toBe('ValidationError');
    expect(badRequest.code).toBe(400);
    expect(badRequest.details).toEqual({
      field: 'Invalid field value'
    });
  });
});

describe('ServiceInvoices Resource', () => {
  let client: NfeClient;

  beforeEach(() => {
    global.fetch = vi.fn();
    client = new NfeClient({
      apiKey: 'test-key',
      environment: 'sandbox'
    });
  });

  it('should create service invoice', async () => {
    const mockResponse = {
      id: '123',
      status: 'processing',
      _links: {
        self: { href: '/invoices/123' }
      }
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 202,
      headers: new Map([
        ['location', '/invoices/123']
      ]),
      json: () => Promise.resolve(mockResponse)
    });

    const invoice = await client.serviceInvoices.create('company-123', {
      cityServiceCode: '12345',
      description: 'Test service',
      servicesAmount: 100.00
    });

    expect(invoice.id).toBe('123');
    expect(invoice.status).toBe('processing');
  });

  it('should handle async polling', async () => {
    const mockPendingResponse = {
      id: '123',
      status: 'processing'
    };

    const mockCompletedResponse = {
      id: '123',
      status: 'issued',
      rpsNumber: 1001
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        headers: new Map([['location', '/invoices/123']]),
        json: () => Promise.resolve(mockPendingResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockCompletedResponse)
      });

    const invoice = await client.serviceInvoices.createAndWait(
      'company-123',
      {
        cityServiceCode: '12345',
        description: 'Test service',
        servicesAmount: 100.00
      },
      { maxAttempts: 2, interval: 100 }
    );

    expect(invoice.status).toBe('issued');
    expect(invoice.rpsNumber).toBe(1001);
  });
});

describe('Companies Resource', () => {
  let client: NfeClient;

  beforeEach(() => {
    global.fetch = vi.fn();
    client = new NfeClient({
      apiKey: 'test-key'
    });
  });

  it('should list companies', async () => {
    const mockResponse = {
      companies: [
        { id: '1', name: 'Company 1' },
        { id: '2', name: 'Company 2' }
      ]
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse)
    });

    const companies = await client.companies.list();
    expect(companies.companies).toHaveLength(2);
    expect(companies.companies[0].name).toBe('Company 1');
  });

  it('should create company', async () => {
    const mockResponse = {
      id: 'new-company-id',
      name: 'Test Company',
      email: 'test@company.com'
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(mockResponse)
    });

    const company = await client.companies.create({
      name: 'Test Company',
      email: 'test@company.com',
      federalTaxNumber: '12345678901234'
    });

    expect(company.id).toBe('new-company-id');
    expect(company.name).toBe('Test Company');
  });
});