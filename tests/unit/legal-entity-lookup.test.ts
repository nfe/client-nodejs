import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LegalEntityLookupResource, LEGAL_ENTITY_API_BASE_URL } from '../../src/core/resources/legal-entity-lookup.js';
import { ValidationError } from '../../src/core/errors/index.js';
import type { HttpClient } from '../../src/core/http/client.js';
import type {
  HttpResponse,
  LegalEntityBasicInfoResponse,
  LegalEntityStateTaxResponse,
  LegalEntityStateTaxForInvoiceResponse,
} from '../../src/core/types.js';

// ============================================================================
// Test Data
// ============================================================================

const VALID_CNPJ_DIGITS = '12345678000190';
const VALID_CNPJ_FORMATTED = '12.345.678/0001-90';

const createMockBasicInfoResponse = (
  overrides: Partial<LegalEntityBasicInfoResponse> = {}
): LegalEntityBasicInfoResponse => ({
  legalEntity: {
    tradeName: 'Empresa Teste',
    name: 'EMPRESA TESTE LTDA',
    federalTaxNumber: 12345678000190,
    size: 'ME',
    openedOn: '2020-01-15',
    status: 'Active',
    email: 'contato@empresa.com.br',
    unit: 'Headoffice',
    shareCapital: 100000,
    address: {
      state: 'SP',
      city: { code: '3550308', name: 'São Paulo' },
      district: 'Centro',
      street: 'Rua Principal',
      number: '100',
      postalCode: '01001000',
      country: 'Brasil',
    },
    phones: [{ ddd: '11', number: '99999999', source: 'RFB' }],
    economicActivities: [
      { type: 'Main', code: 6201500, description: 'Desenvolvimento de software' },
    ],
    legalNature: { code: '2062', description: 'Sociedade Empresária Limitada' },
    partners: [
      { name: 'João Silva', qualification: { code: '49', description: 'Sócio-Administrador' } },
    ],
  },
  ...overrides,
});

const createMockStateTaxResponse = (
  overrides: Partial<LegalEntityStateTaxResponse> = {}
): LegalEntityStateTaxResponse => ({
  legalEntity: {
    tradeName: 'Empresa Teste',
    name: 'EMPRESA TESTE LTDA',
    federalTaxNumber: 12345678000190,
    taxRegime: 'SimplesNacional',
    legalNature: 'SociedadeEmpresariaLimitada',
    fiscalUnit: 'SP',
    checkCode: 'ABC123',
    stateTaxes: [
      {
        status: 'Abled',
        taxNumber: '123456789012',
        openedOn: '2020-01-15',
        code: 'SP',
        nfe: { status: 'Abled', description: 'Contribuinte' },
        nfse: { status: 'Unknown', description: 'Não habilitado' },
        cte: { status: 'Unabled' },
        nfce: { status: 'Unabled' },
      },
    ],
  },
  ...overrides,
});

const createMockStateTaxForInvoiceResponse = (
  overrides: Partial<LegalEntityStateTaxForInvoiceResponse> = {}
): LegalEntityStateTaxForInvoiceResponse => ({
  legalEntity: {
    tradeName: 'Empresa Teste',
    name: 'EMPRESA TESTE LTDA',
    federalTaxNumber: 12345678000190,
    taxRegime: 'SimplesNacional',
    legalNature: 'SociedadeEmpresariaLimitada',
    fiscalUnit: 'SP',
    checkCode: 'ABC123',
    stateTaxes: [
      {
        status: 'Abled',
        taxNumber: '123456789012',
        openedOn: '2020-01-15',
        code: 'SP',
        nfe: { status: 'Abled', description: 'Contribuinte' },
        nfse: { status: 'Unknown' },
        cte: { status: 'Unabled' },
        nfce: { status: 'Unabled' },
      },
    ],
  },
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('LegalEntityLookupResource', () => {
  let mockHttpClient: HttpClient;
  let resource: LegalEntityLookupResource;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      getBuffer: vi.fn(),
    } as unknown as HttpClient;

    resource = new LegalEntityLookupResource(mockHttpClient);
  });

  // --------------------------------------------------------------------------
  // Constants
  // --------------------------------------------------------------------------

  describe('LEGAL_ENTITY_API_BASE_URL', () => {
    it('should export the correct base URL', () => {
      expect(LEGAL_ENTITY_API_BASE_URL).toBe('https://legalentity.api.nfe.io');
    });
  });

  // --------------------------------------------------------------------------
  // CNPJ Validation
  // --------------------------------------------------------------------------

  describe('CNPJ validation', () => {
    it('should reject empty CNPJ', async () => {
      await expect(resource.getBasicInfo('')).rejects.toThrow(ValidationError);
      await expect(resource.getBasicInfo('')).rejects.toThrow('Federal tax number (CNPJ) is required');
    });

    it('should reject whitespace-only CNPJ', async () => {
      await expect(resource.getBasicInfo('   ')).rejects.toThrow(ValidationError);
      await expect(resource.getBasicInfo('   ')).rejects.toThrow('Federal tax number (CNPJ) is required');
    });

    it('should reject CNPJ with fewer than 14 digits', async () => {
      await expect(resource.getBasicInfo('1234567800019')).rejects.toThrow(ValidationError);
      await expect(resource.getBasicInfo('1234567800019')).rejects.toThrow('Expected 14 digits');
    });

    it('should reject CNPJ with more than 14 digits', async () => {
      await expect(resource.getBasicInfo('123456780001901')).rejects.toThrow(ValidationError);
      await expect(resource.getBasicInfo('123456780001901')).rejects.toThrow('Expected 14 digits');
    });

    it('should accept valid 14-digit CNPJ', async () => {
      const mockResponse: HttpResponse<LegalEntityBasicInfoResponse> = {
        data: createMockBasicInfoResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await expect(resource.getBasicInfo(VALID_CNPJ_DIGITS)).resolves.not.toThrow();
    });

    it('should accept formatted CNPJ and strip punctuation', async () => {
      const mockResponse: HttpResponse<LegalEntityBasicInfoResponse> = {
        data: createMockBasicInfoResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.getBasicInfo(VALID_CNPJ_FORMATTED);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/legalentities/basicInfo/${VALID_CNPJ_DIGITS}`,
        undefined
      );
    });

    it('should apply CNPJ validation to getStateTaxInfo', async () => {
      await expect(resource.getStateTaxInfo('SP', '')).rejects.toThrow(ValidationError);
      await expect(resource.getStateTaxInfo('SP', '123')).rejects.toThrow(ValidationError);
    });

    it('should apply CNPJ validation to getStateTaxForInvoice', async () => {
      await expect(resource.getStateTaxForInvoice('SP', '')).rejects.toThrow(ValidationError);
    });

    it('should apply CNPJ validation to getSuggestedStateTaxForInvoice', async () => {
      await expect(resource.getSuggestedStateTaxForInvoice('SP', '')).rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // State Code Validation
  // --------------------------------------------------------------------------

  describe('state code validation', () => {
    it('should reject empty state code', async () => {
      await expect(resource.getStateTaxInfo('', VALID_CNPJ_DIGITS)).rejects.toThrow(ValidationError);
      await expect(resource.getStateTaxInfo('', VALID_CNPJ_DIGITS)).rejects.toThrow('State code is required');
    });

    it('should reject whitespace-only state code', async () => {
      await expect(resource.getStateTaxInfo('   ', VALID_CNPJ_DIGITS)).rejects.toThrow(ValidationError);
    });

    it('should reject invalid state code', async () => {
      await expect(resource.getStateTaxInfo('XX', VALID_CNPJ_DIGITS)).rejects.toThrow(ValidationError);
      await expect(resource.getStateTaxInfo('XX', VALID_CNPJ_DIGITS)).rejects.toThrow('Invalid state code');
    });

    it('should accept valid uppercase state code', async () => {
      const mockResponse: HttpResponse<LegalEntityStateTaxResponse> = {
        data: createMockStateTaxResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await expect(resource.getStateTaxInfo('SP', VALID_CNPJ_DIGITS)).resolves.not.toThrow();
    });

    it('should accept lowercase state code and normalize to uppercase', async () => {
      const mockResponse: HttpResponse<LegalEntityStateTaxResponse> = {
        data: createMockStateTaxResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.getStateTaxInfo('sp', VALID_CNPJ_DIGITS);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/legalentities/stateTaxInfo/SP/${VALID_CNPJ_DIGITS}`
      );
    });

    it('should accept mixed-case state code', async () => {
      const mockResponse: HttpResponse<LegalEntityStateTaxResponse> = {
        data: createMockStateTaxResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.getStateTaxInfo('Rj', VALID_CNPJ_DIGITS);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/legalentities/stateTaxInfo/RJ/${VALID_CNPJ_DIGITS}`
      );
    });

    it('should accept EX and NA special codes', async () => {
      const mockResponse: HttpResponse<LegalEntityStateTaxResponse> = {
        data: createMockStateTaxResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await expect(resource.getStateTaxInfo('EX', VALID_CNPJ_DIGITS)).resolves.not.toThrow();
    });

    it('should apply state validation to getStateTaxForInvoice', async () => {
      await expect(resource.getStateTaxForInvoice('XX', VALID_CNPJ_DIGITS)).rejects.toThrow(ValidationError);
    });

    it('should apply state validation to getSuggestedStateTaxForInvoice', async () => {
      await expect(resource.getSuggestedStateTaxForInvoice('XX', VALID_CNPJ_DIGITS)).rejects.toThrow(ValidationError);
    });
  });

  // --------------------------------------------------------------------------
  // getBasicInfo()
  // --------------------------------------------------------------------------

  describe('getBasicInfo', () => {
    it('should retrieve basic info by CNPJ', async () => {
      const mockData = createMockBasicInfoResponse();
      const mockResponse: HttpResponse<LegalEntityBasicInfoResponse> = {
        data: mockData,
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await resource.getBasicInfo(VALID_CNPJ_DIGITS);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/legalentities/basicInfo/${VALID_CNPJ_DIGITS}`,
        undefined
      );
      expect(result.legalEntity?.name).toBe('EMPRESA TESTE LTDA');
      expect(result.legalEntity?.tradeName).toBe('Empresa Teste');
      expect(result.legalEntity?.status).toBe('Active');
      expect(result.legalEntity?.address?.city?.name).toBe('São Paulo');
      expect(result.legalEntity?.economicActivities).toHaveLength(1);
      expect(result.legalEntity?.partners).toHaveLength(1);
    });

    it('should pass updateAddress query parameter when specified', async () => {
      const mockResponse: HttpResponse<LegalEntityBasicInfoResponse> = {
        data: createMockBasicInfoResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.getBasicInfo(VALID_CNPJ_DIGITS, { updateAddress: false });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/legalentities/basicInfo/${VALID_CNPJ_DIGITS}`,
        { updateAddress: false }
      );
    });

    it('should pass updateCityCode query parameter when specified', async () => {
      const mockResponse: HttpResponse<LegalEntityBasicInfoResponse> = {
        data: createMockBasicInfoResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.getBasicInfo(VALID_CNPJ_DIGITS, { updateCityCode: true });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/legalentities/basicInfo/${VALID_CNPJ_DIGITS}`,
        { updateCityCode: true }
      );
    });

    it('should pass both options when both are specified', async () => {
      const mockResponse: HttpResponse<LegalEntityBasicInfoResponse> = {
        data: createMockBasicInfoResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.getBasicInfo(VALID_CNPJ_DIGITS, {
        updateAddress: false,
        updateCityCode: true,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/legalentities/basicInfo/${VALID_CNPJ_DIGITS}`,
        { updateAddress: false, updateCityCode: true }
      );
    });

    it('should not pass params when no options are given', async () => {
      const mockResponse: HttpResponse<LegalEntityBasicInfoResponse> = {
        data: createMockBasicInfoResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.getBasicInfo(VALID_CNPJ_DIGITS);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/legalentities/basicInfo/${VALID_CNPJ_DIGITS}`,
        undefined
      );
    });

    it('should strip formatting from CNPJ in URL', async () => {
      const mockResponse: HttpResponse<LegalEntityBasicInfoResponse> = {
        data: createMockBasicInfoResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.getBasicInfo('12.345.678/0001-90');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v2/legalentities/basicInfo/12345678000190',
        undefined
      );
    });
  });

  // --------------------------------------------------------------------------
  // getStateTaxInfo()
  // --------------------------------------------------------------------------

  describe('getStateTaxInfo', () => {
    it('should retrieve state tax info by state and CNPJ', async () => {
      const mockData = createMockStateTaxResponse();
      const mockResponse: HttpResponse<LegalEntityStateTaxResponse> = {
        data: mockData,
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await resource.getStateTaxInfo('SP', VALID_CNPJ_DIGITS);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/legalentities/stateTaxInfo/SP/${VALID_CNPJ_DIGITS}`
      );
      expect(result.legalEntity?.taxRegime).toBe('SimplesNacional');
      expect(result.legalEntity?.stateTaxes).toHaveLength(1);
      expect(result.legalEntity?.stateTaxes?.[0]?.status).toBe('Abled');
      expect(result.legalEntity?.stateTaxes?.[0]?.taxNumber).toBe('123456789012');
    });

    it('should normalize state to uppercase in URL', async () => {
      const mockResponse: HttpResponse<LegalEntityStateTaxResponse> = {
        data: createMockStateTaxResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.getStateTaxInfo('mg', VALID_CNPJ_DIGITS);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/legalentities/stateTaxInfo/MG/${VALID_CNPJ_DIGITS}`
      );
    });

    it('should strip CNPJ formatting in URL', async () => {
      const mockResponse: HttpResponse<LegalEntityStateTaxResponse> = {
        data: createMockStateTaxResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.getStateTaxInfo('SP', '12.345.678/0001-90');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/legalentities/stateTaxInfo/SP/${VALID_CNPJ_DIGITS}`
      );
    });
  });

  // --------------------------------------------------------------------------
  // getStateTaxForInvoice()
  // --------------------------------------------------------------------------

  describe('getStateTaxForInvoice', () => {
    it('should retrieve state tax for invoice by state and CNPJ', async () => {
      const mockData = createMockStateTaxForInvoiceResponse();
      const mockResponse: HttpResponse<LegalEntityStateTaxForInvoiceResponse> = {
        data: mockData,
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await resource.getStateTaxForInvoice('SP', VALID_CNPJ_DIGITS);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/legalentities/stateTaxForInvoice/SP/${VALID_CNPJ_DIGITS}`
      );
      expect(result.legalEntity?.stateTaxes).toHaveLength(1);
      expect(result.legalEntity?.stateTaxes?.[0]?.status).toBe('Abled');
    });

    it('should normalize state to uppercase in URL', async () => {
      const mockResponse: HttpResponse<LegalEntityStateTaxForInvoiceResponse> = {
        data: createMockStateTaxForInvoiceResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.getStateTaxForInvoice('rj', VALID_CNPJ_DIGITS);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/legalentities/stateTaxForInvoice/RJ/${VALID_CNPJ_DIGITS}`
      );
    });
  });

  // --------------------------------------------------------------------------
  // getSuggestedStateTaxForInvoice()
  // --------------------------------------------------------------------------

  describe('getSuggestedStateTaxForInvoice', () => {
    it('should retrieve suggested state tax for invoice by state and CNPJ', async () => {
      const mockData = createMockStateTaxForInvoiceResponse();
      const mockResponse: HttpResponse<LegalEntityStateTaxForInvoiceResponse> = {
        data: mockData,
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await resource.getSuggestedStateTaxForInvoice('SP', VALID_CNPJ_DIGITS);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/legalentities/stateTaxSuggestedForInvoice/SP/${VALID_CNPJ_DIGITS}`
      );
      expect(result.legalEntity?.stateTaxes).toHaveLength(1);
    });

    it('should use a different URL path from getStateTaxForInvoice', async () => {
      const mockResponse: HttpResponse<LegalEntityStateTaxForInvoiceResponse> = {
        data: createMockStateTaxForInvoiceResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.getSuggestedStateTaxForInvoice('SP', VALID_CNPJ_DIGITS);

      const calledUrl = vi.mocked(mockHttpClient.get).mock.calls[0]?.[0];
      expect(calledUrl).toContain('stateTaxSuggestedForInvoice');
      expect(calledUrl).not.toContain('stateTaxForInvoice/');
    });

    it('should normalize state to uppercase in URL', async () => {
      const mockResponse: HttpResponse<LegalEntityStateTaxForInvoiceResponse> = {
        data: createMockStateTaxForInvoiceResponse(),
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await resource.getSuggestedStateTaxForInvoice('ba', VALID_CNPJ_DIGITS);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v2/legalentities/stateTaxSuggestedForInvoice/BA/${VALID_CNPJ_DIGITS}`
      );
    });
  });

  // --------------------------------------------------------------------------
  // Error Handling
  // --------------------------------------------------------------------------

  describe('error handling', () => {
    it('should propagate errors from HTTP client on 404', async () => {
      const notFoundError = new Error('Not Found');
      (notFoundError as any).statusCode = 404;
      vi.mocked(mockHttpClient.get).mockRejectedValue(notFoundError);

      await expect(resource.getBasicInfo(VALID_CNPJ_DIGITS)).rejects.toThrow();
    });

    it('should propagate errors from HTTP client on 400', async () => {
      const badRequestError = new Error('Bad Request');
      (badRequestError as any).statusCode = 400;
      vi.mocked(mockHttpClient.get).mockRejectedValue(badRequestError);

      await expect(resource.getBasicInfo(VALID_CNPJ_DIGITS)).rejects.toThrow();
    });

    it('should propagate authentication errors on 401', async () => {
      const authError = new Error('Unauthorized');
      (authError as any).statusCode = 401;
      vi.mocked(mockHttpClient.get).mockRejectedValue(authError);

      await expect(resource.getStateTaxInfo('SP', VALID_CNPJ_DIGITS)).rejects.toThrow();
    });

    it('should propagate server errors on 500', async () => {
      const serverError = new Error('Internal Server Error');
      (serverError as any).statusCode = 500;
      vi.mocked(mockHttpClient.get).mockRejectedValue(serverError);

      await expect(resource.getStateTaxForInvoice('SP', VALID_CNPJ_DIGITS)).rejects.toThrow();
    });

    it('should propagate network errors', async () => {
      const networkError = new Error('fetch failed');
      vi.mocked(mockHttpClient.get).mockRejectedValue(networkError);

      await expect(resource.getSuggestedStateTaxForInvoice('SP', VALID_CNPJ_DIGITS)).rejects.toThrow('fetch failed');
    });
  });
});
