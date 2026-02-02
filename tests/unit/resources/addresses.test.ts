/**
 * Unit tests for AddressesResource
 * Tests address lookup, search, and validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddressesResource } from '../../../src/core/resources/addresses.js';
import { HttpClient } from '../../../src/core/http/client.js';
import type { HttpResponse, Address, AddressSearchOptions } from '../../../src/core/types.js';
import { ValidationError } from '../../../src/core/errors/index.js';

describe('AddressesResource', () => {
  let resource: AddressesResource;
  let mockHttpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    resource = new AddressesResource(mockHttpClient as unknown as HttpClient);
  });

  describe('lookupByPostalCode', () => {
    const mockAddress: Address = {
      postalCode: '01310100',
      street: 'Avenida Paulista',
      district: 'Bela Vista',
      city: {
        code: '3550308',
        name: 'São Paulo',
      },
      state: 'SP',
      country: 'BR',
    };

    it('should lookup address by postal code (without hyphen)', async () => {
      const mockResponse: HttpResponse<Address> = {
        data: mockAddress,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.lookupByPostalCode('01310100');

      expect(result).toEqual(mockAddress);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/addresses/01310100');
    });

    it('should lookup address by postal code (with hyphen)', async () => {
      const mockResponse: HttpResponse<Address> = {
        data: mockAddress,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.lookupByPostalCode('01310-100');

      expect(result).toEqual(mockAddress);
      // CEP should be normalized to remove hyphen
      expect(mockHttpClient.get).toHaveBeenCalledWith('/addresses/01310100');
    });

    it('should throw ValidationError for postal code with less than 8 digits', async () => {
      await expect(resource.lookupByPostalCode('1234567')).rejects.toThrow(ValidationError);
      await expect(resource.lookupByPostalCode('1234567')).rejects.toThrow(/Invalid postal code/);
    });

    it('should throw ValidationError for postal code with more than 8 digits', async () => {
      await expect(resource.lookupByPostalCode('123456789')).rejects.toThrow(ValidationError);
      await expect(resource.lookupByPostalCode('123456789')).rejects.toThrow(/Invalid postal code/);
    });

    it('should throw ValidationError for postal code with non-numeric characters', async () => {
      await expect(resource.lookupByPostalCode('1234567a')).rejects.toThrow(ValidationError);
      await expect(resource.lookupByPostalCode('abcd-efg')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty postal code', async () => {
      await expect(resource.lookupByPostalCode('')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for whitespace-only postal code', async () => {
      await expect(resource.lookupByPostalCode('   ')).rejects.toThrow(ValidationError);
    });

    it('should handle postal code with leading/trailing whitespace', async () => {
      const mockResponse: HttpResponse<Address> = {
        data: mockAddress,
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.lookupByPostalCode('  01310-100  ');

      expect(result).toEqual(mockAddress);
      // Implementation trims whitespace and removes hyphen
      expect(mockHttpClient.get).toHaveBeenCalledWith('/addresses/01310100');
    });

    it('should handle API error responses', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Not Found'));

      await expect(resource.lookupByPostalCode('00000000')).rejects.toThrow('Not Found');
    });
  });

  describe('search', () => {
    const mockAddresses: Address[] = [
      {
        postalCode: '01310100',
        street: 'Avenida Paulista',
        district: 'Bela Vista',
        city: { code: '3550308', name: 'São Paulo' },
        state: 'SP',
        country: 'BR',
      },
      {
        postalCode: '01310200',
        street: 'Avenida Paulista',
        district: 'Bela Vista',
        city: { code: '3550308', name: 'São Paulo' },
        state: 'SP',
        country: 'BR',
      },
    ];

    it('should search addresses with filter options', async () => {
      const mockResponse: HttpResponse<{ addresses: Address[] }> = {
        data: { addresses: mockAddresses },
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const options: AddressSearchOptions = {
        filter: "city.name eq 'São Paulo'",
      };

      const result = await resource.search(options);

      expect(result.addresses).toEqual(mockAddresses);
      // Implementation passes params object directly to http.get
      expect(mockHttpClient.get).toHaveBeenCalledWith('/addresses', {
        $filter: "city.name eq 'São Paulo'",
      });
    });

    it('should search addresses without filter (list all)', async () => {
      const mockResponse: HttpResponse<{ addresses: Address[] }> = {
        data: { addresses: mockAddresses },
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.search({});

      expect(result.addresses).toEqual(mockAddresses);
      // When no filter is provided, an empty object is passed
      expect(mockHttpClient.get).toHaveBeenCalledWith('/addresses', {});
    });

    it('should handle empty results', async () => {
      const mockResponse: HttpResponse<{ addresses: Address[] }> = {
        data: { addresses: [] },
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.search({ filter: "state eq 'XX'" });

      expect(result.addresses).toEqual([]);
    });
  });

  describe('lookupByTerm', () => {
    const mockAddresses: Address[] = [
      {
        postalCode: '01310100',
        street: 'Avenida Paulista',
        district: 'Bela Vista',
        city: { code: '3550308', name: 'São Paulo' },
        state: 'SP',
        country: 'BR',
      },
    ];

    it('should lookup addresses by term', async () => {
      const mockResponse: HttpResponse<{ addresses: Address[] }> = {
        data: { addresses: mockAddresses },
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.lookupByTerm('Avenida Paulista');

      expect(result.addresses).toEqual(mockAddresses);
      // Implementation uses URL path with encoded term
      expect(mockHttpClient.get).toHaveBeenCalledWith('/addresses/Avenida%20Paulista');
    });

    it('should throw ValidationError for empty term', async () => {
      await expect(resource.lookupByTerm('')).rejects.toThrow(ValidationError);
      await expect(resource.lookupByTerm('')).rejects.toThrow(/Search term is required/);
    });

    it('should throw ValidationError for whitespace-only term', async () => {
      await expect(resource.lookupByTerm('   ')).rejects.toThrow(ValidationError);
    });

    it('should handle term with leading/trailing whitespace', async () => {
      const mockResponse: HttpResponse<{ addresses: Address[] }> = {
        data: { addresses: mockAddresses },
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await resource.lookupByTerm('  Paulista  ');

      expect(result.addresses).toEqual(mockAddresses);
      // Term should be trimmed before encoding
      expect(mockHttpClient.get).toHaveBeenCalledWith('/addresses/Paulista');
    });

    it('should handle special characters in term', async () => {
      const mockResponse: HttpResponse<{ addresses: Address[] }> = {
        data: { addresses: [] },
        status: 200,
        headers: {},
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      // Special characters should be URL encoded
      await resource.lookupByTerm("D'Água");

      // encodeURIComponent encodes single quote as %27 but leaves it unchanged in most implementations
      expect(mockHttpClient.get).toHaveBeenCalledWith("/addresses/D'%C3%81gua");
    });
  });
});
