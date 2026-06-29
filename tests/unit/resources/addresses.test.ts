/**
 * Unit tests for AddressesResource
 *
 * The live address.api.nfe.io/v2 API supports postal-code lookup only and returns the
 * single address wrapped in an `{ address }` envelope. The resource unwraps it and
 * returns a plain `Address`.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddressesResource } from '../../../src/core/resources/addresses.js';
import { HttpClient } from '../../../src/core/http/client.js';
import type { HttpResponse, Address, AddressLookupResponse } from '../../../src/core/types.js';
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
    // Shape mirrors the real API payload (single address, alpha-3 country, formatted CEP)
    const mockAddress: Address = {
      postalCode: '01310-100',
      streetSuffix: 'Avenida',
      street: 'Paulista',
      number: 'de 612 a 1510 - lado par',
      district: 'Bela Vista',
      additionalInformation: '',
      city: {
        code: '3550308',
        name: 'São Paulo',
      },
      state: 'SP',
      country: 'BRA',
    };

    const mockEnvelope = (address: Address): HttpResponse<AddressLookupResponse> => ({
      data: { address },
      status: 200,
      headers: {},
    });

    it('unwraps the { address } envelope and returns the single Address', async () => {
      mockHttpClient.get.mockResolvedValue(mockEnvelope(mockAddress));

      const result = await resource.lookupByPostalCode('01310100');

      expect(result).toEqual(mockAddress);
      // Direct field access works (no `.addresses[0]`)
      expect(result.street).toBe('Paulista');
      expect(result.city.name).toBe('São Paulo');
      expect(mockHttpClient.get).toHaveBeenCalledWith('/addresses/01310100');
    });

    it('normalizes a hyphenated CEP to the 8-digit path', async () => {
      mockHttpClient.get.mockResolvedValue(mockEnvelope(mockAddress));

      const result = await resource.lookupByPostalCode('01310-100');

      expect(result).toEqual(mockAddress);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/addresses/01310100');
    });

    it('trims surrounding whitespace before normalizing', async () => {
      mockHttpClient.get.mockResolvedValue(mockEnvelope(mockAddress));

      const result = await resource.lookupByPostalCode('  01310-100  ');

      expect(result).toEqual(mockAddress);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/addresses/01310100');
    });

    it('throws ValidationError for a CEP with fewer than 8 digits', async () => {
      await expect(resource.lookupByPostalCode('1234567')).rejects.toThrow(ValidationError);
      await expect(resource.lookupByPostalCode('1234567')).rejects.toThrow(/Invalid postal code/);
    });

    it('throws ValidationError for a CEP with more than 8 digits', async () => {
      await expect(resource.lookupByPostalCode('123456789')).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for non-numeric characters', async () => {
      await expect(resource.lookupByPostalCode('1234567a')).rejects.toThrow(ValidationError);
      await expect(resource.lookupByPostalCode('abcd-efg')).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for empty / whitespace-only input', async () => {
      await expect(resource.lookupByPostalCode('')).rejects.toThrow(ValidationError);
      await expect(resource.lookupByPostalCode('   ')).rejects.toThrow(ValidationError);
    });

    it('propagates API errors (e.g. 404 NotFoundError)', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Not Found'));
      await expect(resource.lookupByPostalCode('00000000')).rejects.toThrow('Not Found');
    });
  });
});
