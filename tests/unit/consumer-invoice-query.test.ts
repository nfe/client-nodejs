import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConsumerInvoiceQueryResource } from '../../src/core/resources/consumer-invoice-query.js';
import { NfeClient } from '../../src/core/client.js';
import { ConfigurationError, ValidationError } from '../../src/core/errors/index.js';
import type { HttpClient } from '../../src/core/http/client.js';
import type { HttpResponse, TaxCoupon } from '../../src/core/types.js';

// ============================================================================
// Test Data
// ============================================================================

const VALID_ACCESS_KEY = '35240112345678000190590000000012341234567890';

const createMockCoupon = (overrides: Partial<TaxCoupon> = {}): TaxCoupon => ({
  currentStatus: 'Authorized',
  number: 12345,
  satSerie: '900000001',
  softwareVersion: '01.00.00',
  accessKey: VALID_ACCESS_KEY,
  cashier: 1,
  issuedOn: '2024-01-15T10:30:00Z',
  createdOn: '2024-01-15T11:00:00Z',
  xmlVersion: '0.08',
  issuer: {
    federalTaxNumber: 12345678000190,
    type: 'LegalEntity',
    name: 'Empresa Teste Ltda',
    tradeName: 'Empresa Teste',
    stateTaxNumber: '123456789',
    taxRegime: 'National_Simple',
  },
  buyer: {
    federalTaxNumber: 12345678901,
    name: 'João da Silva',
  },
  totals: {
    icms: {
      productAmount: 100.0,
      icmsAmount: 18.0,
    },
    couponAmount: 100.0,
    totalAmount: 12.0,
  },
  items: [
    {
      description: 'Produto Teste',
      quantity: 1,
      unit: 'UN',
      code: '001',
      ncm: '12345678',
      cfop: 5102,
      unitAmount: 100.0,
      netAmount: 100.0,
      grossAmount: 100.0,
      tax: {
        totalTax: 12.0,
        icms: { origin: '0', cst: '00', amount: 18.0, rate: 18.0 },
      },
    },
  ],
  payment: {
    payBack: 0,
    paymentDetails: [
      { method: 'Cash', amount: 100.0 },
    ],
  },
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('ConsumerInvoiceQueryResource', () => {
  let mockHttpClient: HttpClient;
  let resource: ConsumerInvoiceQueryResource;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      getBuffer: vi.fn(),
    } as unknown as HttpClient;

    resource = new ConsumerInvoiceQueryResource(mockHttpClient);
  });

  // --------------------------------------------------------------------------
  // Access Key Validation
  // --------------------------------------------------------------------------

  describe('access key validation', () => {
    it('should reject empty access key', async () => {
      await expect(resource.retrieve('')).rejects.toThrow(ValidationError);
      await expect(resource.retrieve('')).rejects.toThrow('Access key is required');
    });

    it('should reject whitespace-only access key', async () => {
      await expect(resource.retrieve('   ')).rejects.toThrow(ValidationError);
      await expect(resource.retrieve('   ')).rejects.toThrow('Access key is required');
    });

    it('should reject non-numeric access key', async () => {
      await expect(resource.retrieve('3524011234567800019059000000001234123456789X')).rejects.toThrow(ValidationError);
      await expect(resource.retrieve('3524011234567800019059000000001234123456789X')).rejects.toThrow('Expected 44 numeric digits');
    });

    it('should reject access key with wrong length (43 digits)', async () => {
      await expect(resource.retrieve('3524011234567800019059000000001234123456789')).rejects.toThrow(ValidationError);
      await expect(resource.retrieve('3524011234567800019059000000001234123456789')).rejects.toThrow('Expected 44 numeric digits');
    });

    it('should reject access key with wrong length (45 digits)', async () => {
      await expect(resource.retrieve('352401123456780001905900000000123412345678901')).rejects.toThrow(ValidationError);
    });

    it('should accept valid 44-digit numeric access key', async () => {
      const mockResponse: HttpResponse<TaxCoupon> = {
        data: createMockCoupon(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await expect(resource.retrieve(VALID_ACCESS_KEY)).resolves.not.toThrow();
    });

    it('should apply validation to downloadXml as well', async () => {
      await expect(resource.downloadXml('')).rejects.toThrow(ValidationError);
      await expect(resource.downloadXml('abc')).rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // retrieve()
  // --------------------------------------------------------------------------

  describe('retrieve', () => {
    it('should retrieve coupon details by access key', async () => {
      const mockCoupon = createMockCoupon();
      const mockResponse: HttpResponse<TaxCoupon> = {
        data: mockCoupon,
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await resource.retrieve(VALID_ACCESS_KEY);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v1/consumerinvoices/coupon/${VALID_ACCESS_KEY}`
      );
      expect(result).toEqual(mockCoupon);
      expect(result.currentStatus).toBe('Authorized');
      expect(result.issuer?.name).toBe('Empresa Teste Ltda');
      expect(result.items).toHaveLength(1);
      expect(result.totals?.couponAmount).toBe(100.0);
    });

    it('should propagate NotFoundError on 404', async () => {
      const notFoundError = new Error('Not Found');
      (notFoundError as any).statusCode = 404;
      vi.mocked(mockHttpClient.get).mockRejectedValue(notFoundError);

      await expect(resource.retrieve(VALID_ACCESS_KEY)).rejects.toThrow();
    });

    it('should propagate AuthenticationError on 401', async () => {
      const authError = new Error('Unauthorized');
      (authError as any).statusCode = 401;
      vi.mocked(mockHttpClient.get).mockRejectedValue(authError);

      await expect(resource.retrieve(VALID_ACCESS_KEY)).rejects.toThrow();
    });

    it('should trim whitespace from access key', async () => {
      const mockResponse: HttpResponse<TaxCoupon> = {
        data: createMockCoupon(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.retrieve(`  ${VALID_ACCESS_KEY}  `);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v1/consumerinvoices/coupon/${VALID_ACCESS_KEY}`
      );
    });
  });

  // --------------------------------------------------------------------------
  // downloadXml()
  // --------------------------------------------------------------------------

  describe('downloadXml', () => {
    it('should download XML as Buffer', async () => {
      const xmlContent = Buffer.from('<CFe><infCFe /></CFe>');
      const mockResponse = {
        data: xmlContent,
        status: 200,
        headers: { 'content-type': 'application/xml' },
      };
      vi.mocked(mockHttpClient.getBuffer).mockResolvedValue(mockResponse);

      const result = await resource.downloadXml(VALID_ACCESS_KEY);

      expect(mockHttpClient.getBuffer).toHaveBeenCalledWith(
        `/v1/consumerinvoices/coupon/${VALID_ACCESS_KEY}.xml`,
        'application/xml'
      );
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toContain('<CFe>');
    });

    it('should propagate NotFoundError on 404', async () => {
      const notFoundError = new Error('Not Found');
      (notFoundError as any).statusCode = 404;
      vi.mocked(mockHttpClient.getBuffer).mockRejectedValue(notFoundError);

      await expect(resource.downloadXml(VALID_ACCESS_KEY)).rejects.toThrow();
    });
  });
});

// ============================================================================
// NfeClient Integration
// ============================================================================

describe('NfeClient.consumerInvoiceQuery', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.NFE_API_KEY;
    delete process.env.NFE_DATA_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('should lazily initialize consumerInvoiceQuery on first access', () => {
    const client = new NfeClient({ apiKey: 'test-key' });

    const resource1 = client.consumerInvoiceQuery;
    const resource2 = client.consumerInvoiceQuery;

    expect(resource1).toBeInstanceOf(ConsumerInvoiceQueryResource);
    expect(resource1).toBe(resource2); // Same cached instance
  });

  it('should throw ConfigurationError when no API key is configured', () => {
    const client = new NfeClient({});

    expect(() => client.consumerInvoiceQuery).toThrow(ConfigurationError);
    expect(() => client.consumerInvoiceQuery).toThrow(/API key required/);
  });

  it('should work with dataApiKey', () => {
    const client = new NfeClient({ dataApiKey: 'data-key-only' });

    expect(() => client.consumerInvoiceQuery).not.toThrow();
    expect(client.consumerInvoiceQuery).toBeInstanceOf(ConsumerInvoiceQueryResource);
  });

  it('should fall back to apiKey when dataApiKey is not set', () => {
    const client = new NfeClient({ apiKey: 'main-key' });

    expect(() => client.consumerInvoiceQuery).not.toThrow();
    expect(client.consumerInvoiceQuery).toBeInstanceOf(ConsumerInvoiceQueryResource);
  });
});
