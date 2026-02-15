import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NaturalPersonLookupResource, NATURAL_PERSON_API_BASE_URL } from '../../src/core/resources/natural-person-lookup.js';
import { ValidationError } from '../../src/core/errors/index.js';
import type { HttpClient } from '../../src/core/http/client.js';
import type {
  HttpResponse,
  NaturalPersonStatusResponse,
} from '../../src/core/types.js';

// ============================================================================
// Test Data
// ============================================================================

const VALID_CPF_DIGITS = '12345678901';
const VALID_CPF_FORMATTED = '123.456.789-01';
const VALID_BIRTH_DATE = '1990-01-15';

const createMockStatusResponse = (
  overrides: Partial<NaturalPersonStatusResponse> = {}
): NaturalPersonStatusResponse => ({
  name: 'JOÃO DA SILVA',
  federalTaxNumber: '12345678901',
  birthOn: '1990-01-15T00:00:00',
  status: 'Regular',
  createdOn: '2026-02-15T10:30:00',
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('NaturalPersonLookupResource', () => {
  let mockHttpClient: HttpClient;
  let resource: NaturalPersonLookupResource;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      getBuffer: vi.fn(),
    } as unknown as HttpClient;

    resource = new NaturalPersonLookupResource(mockHttpClient);
  });

  // --------------------------------------------------------------------------
  // Constants
  // --------------------------------------------------------------------------

  describe('NATURAL_PERSON_API_BASE_URL', () => {
    it('should export the correct base URL', () => {
      expect(NATURAL_PERSON_API_BASE_URL).toBe('https://naturalperson.api.nfe.io');
    });
  });

  // --------------------------------------------------------------------------
  // CPF Validation
  // --------------------------------------------------------------------------

  describe('CPF validation', () => {
    it('should reject empty CPF', async () => {
      await expect(resource.getStatus('', VALID_BIRTH_DATE)).rejects.toThrow(ValidationError);
      await expect(resource.getStatus('', VALID_BIRTH_DATE)).rejects.toThrow('Federal tax number (CPF) is required');
    });

    it('should reject whitespace-only CPF', async () => {
      await expect(resource.getStatus('   ', VALID_BIRTH_DATE)).rejects.toThrow(ValidationError);
      await expect(resource.getStatus('   ', VALID_BIRTH_DATE)).rejects.toThrow('Federal tax number (CPF) is required');
    });

    it('should reject CPF with fewer than 11 digits', async () => {
      await expect(resource.getStatus('1234567890', VALID_BIRTH_DATE)).rejects.toThrow(ValidationError);
      await expect(resource.getStatus('1234567890', VALID_BIRTH_DATE)).rejects.toThrow('Expected 11 digits');
    });

    it('should reject CPF with more than 11 digits', async () => {
      await expect(resource.getStatus('123456789012', VALID_BIRTH_DATE)).rejects.toThrow(ValidationError);
      await expect(resource.getStatus('123456789012', VALID_BIRTH_DATE)).rejects.toThrow('Expected 11 digits');
    });

    it('should accept valid 11-digit CPF', async () => {
      const mockResponse: HttpResponse<NaturalPersonStatusResponse> = {
        data: createMockStatusResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await expect(resource.getStatus(VALID_CPF_DIGITS, VALID_BIRTH_DATE)).resolves.not.toThrow();
    });

    it('should accept formatted CPF and strip punctuation', async () => {
      const mockResponse: HttpResponse<NaturalPersonStatusResponse> = {
        data: createMockStatusResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.getStatus(VALID_CPF_FORMATTED, VALID_BIRTH_DATE);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v1/naturalperson/status/${VALID_CPF_DIGITS}/${VALID_BIRTH_DATE}`
      );
    });
  });

  // --------------------------------------------------------------------------
  // Birth Date Validation
  // --------------------------------------------------------------------------

  describe('Birth date validation', () => {
    const setupMock = () => {
      const mockResponse: HttpResponse<NaturalPersonStatusResponse> = {
        data: createMockStatusResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);
    };

    it('should accept valid date string in YYYY-MM-DD format', async () => {
      setupMock();
      await expect(resource.getStatus(VALID_CPF_DIGITS, '1990-01-15')).resolves.not.toThrow();
    });

    it('should accept a Date object and convert to YYYY-MM-DD', async () => {
      setupMock();
      // Use UTC date to avoid timezone issues
      const date = new Date(Date.UTC(1990, 0, 15));
      await resource.getStatus(VALID_CPF_DIGITS, date);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v1/naturalperson/status/${VALID_CPF_DIGITS}/1990-01-15`
      );
    });

    it('should reject empty string birth date', async () => {
      await expect(resource.getStatus(VALID_CPF_DIGITS, '')).rejects.toThrow(ValidationError);
      await expect(resource.getStatus(VALID_CPF_DIGITS, '')).rejects.toThrow('Birth date is required');
    });

    it('should reject invalid date format (DD/MM/YYYY)', async () => {
      await expect(resource.getStatus(VALID_CPF_DIGITS, '15/01/1990')).rejects.toThrow(ValidationError);
      await expect(resource.getStatus(VALID_CPF_DIGITS, '15/01/1990')).rejects.toThrow('Expected YYYY-MM-DD format');
    });

    it('should reject invalid month (13)', async () => {
      await expect(resource.getStatus(VALID_CPF_DIGITS, '1990-13-01')).rejects.toThrow(ValidationError);
      await expect(resource.getStatus(VALID_CPF_DIGITS, '1990-13-01')).rejects.toThrow('Month must be between 01 and 12');
    });

    it('should reject invalid day (32)', async () => {
      await expect(resource.getStatus(VALID_CPF_DIGITS, '1990-01-32')).rejects.toThrow(ValidationError);
      await expect(resource.getStatus(VALID_CPF_DIGITS, '1990-01-32')).rejects.toThrow('Day must be between 01 and 31');
    });

    it('should reject month 00', async () => {
      await expect(resource.getStatus(VALID_CPF_DIGITS, '1990-00-15')).rejects.toThrow(ValidationError);
      await expect(resource.getStatus(VALID_CPF_DIGITS, '1990-00-15')).rejects.toThrow('Month must be between 01 and 12');
    });

    it('should reject day 00', async () => {
      await expect(resource.getStatus(VALID_CPF_DIGITS, '1990-01-00')).rejects.toThrow(ValidationError);
      await expect(resource.getStatus(VALID_CPF_DIGITS, '1990-01-00')).rejects.toThrow('Day must be between 01 and 31');
    });

    it('should reject invalid Date object', async () => {
      const invalidDate = new Date('invalid');
      await expect(resource.getStatus(VALID_CPF_DIGITS, invalidDate)).rejects.toThrow(ValidationError);
      await expect(resource.getStatus(VALID_CPF_DIGITS, invalidDate)).rejects.toThrow('invalid Date object');
    });
  });

  // --------------------------------------------------------------------------
  // getStatus() - Successful calls
  // --------------------------------------------------------------------------

  describe('getStatus()', () => {
    it('should send GET request to correct URL path', async () => {
      const mockData = createMockStatusResponse();
      const mockResponse: HttpResponse<NaturalPersonStatusResponse> = {
        data: mockData,
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await resource.getStatus(VALID_CPF_DIGITS, VALID_BIRTH_DATE);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v1/naturalperson/status/${VALID_CPF_DIGITS}/${VALID_BIRTH_DATE}`
      );
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockData);
    });

    it('should return typed response with all fields', async () => {
      const mockData = createMockStatusResponse();
      const mockResponse: HttpResponse<NaturalPersonStatusResponse> = {
        data: mockData,
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await resource.getStatus(VALID_CPF_DIGITS, VALID_BIRTH_DATE);

      expect(result.name).toBe('JOÃO DA SILVA');
      expect(result.federalTaxNumber).toBe('12345678901');
      expect(result.birthOn).toBe('1990-01-15T00:00:00');
      expect(result.status).toBe('Regular');
      expect(result.createdOn).toBe('2026-02-15T10:30:00');
    });

    it('should normalize CPF punctuation in URL', async () => {
      const mockResponse: HttpResponse<NaturalPersonStatusResponse> = {
        data: createMockStatusResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.getStatus('123.456.789-01', VALID_BIRTH_DATE);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v1/naturalperson/status/12345678901/${VALID_BIRTH_DATE}`
      );
    });

    it('should convert Date object to YYYY-MM-DD string in URL', async () => {
      const mockResponse: HttpResponse<NaturalPersonStatusResponse> = {
        data: createMockStatusResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const date = new Date(Date.UTC(1990, 0, 15));
      await resource.getStatus(VALID_CPF_DIGITS, date);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v1/naturalperson/status/${VALID_CPF_DIGITS}/1990-01-15`
      );
    });

    it('should handle response with optional fields missing', async () => {
      const mockData: NaturalPersonStatusResponse = {
        federalTaxNumber: '12345678901',
      };
      const mockResponse: HttpResponse<NaturalPersonStatusResponse> = {
        data: mockData,
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await resource.getStatus(VALID_CPF_DIGITS, VALID_BIRTH_DATE);

      expect(result.federalTaxNumber).toBe('12345678901');
      expect(result.name).toBeUndefined();
      expect(result.status).toBeUndefined();
      expect(result.birthOn).toBeUndefined();
      expect(result.createdOn).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // Error Handling
  // --------------------------------------------------------------------------

  describe('error handling', () => {
    it('should propagate 404 NotFoundError from HttpClient', async () => {
      const error = new Error('Not Found');
      error.name = 'NotFoundError';
      vi.mocked(mockHttpClient.get).mockRejectedValue(error);

      await expect(resource.getStatus(VALID_CPF_DIGITS, VALID_BIRTH_DATE)).rejects.toThrow('Not Found');
    });

    it('should propagate 401 AuthenticationError from HttpClient', async () => {
      const error = new Error('Unauthorized');
      error.name = 'AuthenticationError';
      vi.mocked(mockHttpClient.get).mockRejectedValue(error);

      await expect(resource.getStatus(VALID_CPF_DIGITS, VALID_BIRTH_DATE)).rejects.toThrow('Unauthorized');
    });

    it('should propagate 400 BadRequestError from HttpClient', async () => {
      const error = new Error('Bad Request');
      error.name = 'BadRequestError';
      vi.mocked(mockHttpClient.get).mockRejectedValue(error);

      await expect(resource.getStatus(VALID_CPF_DIGITS, VALID_BIRTH_DATE)).rejects.toThrow('Bad Request');
    });
  });
});
