import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NaturalPeopleResource } from '../../src/core/resources/natural-people.js';
import type { HttpClient } from '../../src/core/http/client.js';
import type { HttpResponse, ListResponse, NaturalPerson } from '../../src/core/types.js';
import { createMockNaturalPerson, TEST_COMPANY_ID, TEST_PERSON_ID } from '../setup.js';

describe('NaturalPeopleResource', () => {
  let mockHttpClient: HttpClient;
  let naturalPeople: NaturalPeopleResource;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as HttpClient;

    naturalPeople = new NaturalPeopleResource(mockHttpClient);
  });

  describe('list', () => {
    it('should list natural people for a company', async () => {
      const mockPerson = createMockNaturalPerson();
      const mockResponse: HttpResponse<{ naturalPeople: NaturalPerson[] }> = {
        data: { naturalPeople: [mockPerson] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse as any);

      const result = await naturalPeople.list(TEST_COMPANY_ID);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/naturalpeople`
      );
      expect(result.data).toEqual([mockPerson]);
    });
  });

  describe('retrieve', () => {
    it('should retrieve a natural person by id', async () => {
      const mockPerson = createMockNaturalPerson();
      const mockResponse: HttpResponse<{ naturalPeople: NaturalPerson }> = {
        data: { naturalPeople: mockPerson },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse as any);

      const result = await naturalPeople.retrieve(TEST_COMPANY_ID, TEST_PERSON_ID);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/naturalpeople/${TEST_PERSON_ID}`
      );
      expect(result).toEqual(mockPerson);
    });
  });

  describe('create', () => {
    it('should create a new natural person', async () => {
      const newPerson = createMockNaturalPerson({ id: undefined });
      const createdPerson = createMockNaturalPerson();
      const mockResponse: HttpResponse<{ naturalPeople: NaturalPerson }> = {
        data: { naturalPeople: createdPerson },
        status: 201,
        headers: {},
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse as any);

      const result = await naturalPeople.create(TEST_COMPANY_ID, newPerson);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/naturalpeople`,
        newPerson
      );
      expect(result).toEqual(createdPerson);
    });
  });

  describe('update', () => {
    it('should update an existing natural person', async () => {
      const updates = { email: 'newemail@example.com' };
      const updatedPerson = createMockNaturalPerson(updates);
      const mockResponse: HttpResponse<{ naturalPeople: NaturalPerson }> = {
        data: { naturalPeople: updatedPerson },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.put).mockResolvedValue(mockResponse as any);

      const result = await naturalPeople.update(TEST_COMPANY_ID, TEST_PERSON_ID, updates);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/naturalpeople/${TEST_PERSON_ID}`,
        updates
      );
      expect(result).toEqual(updatedPerson);
    });
  });

  describe('delete', () => {
    it('should delete a natural person', async () => {
      const mockResponse: HttpResponse<void> = {
        data: undefined,
        status: 204,
        headers: {},
      };
      vi.mocked(mockHttpClient.delete).mockResolvedValue(mockResponse);

      await naturalPeople.delete(TEST_COMPANY_ID, TEST_PERSON_ID);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/naturalpeople/${TEST_PERSON_ID}`
      );
    });
  });

  // A v1 devolve federalTaxNumber como número; um CPF que começa com zero chega sem ele.
  describe('findByTaxNumber', () => {
    it('acha o registro numérico pela string com zero à esquerda e máscara', async () => {
      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: {
          naturalPeople: [
            createMockNaturalPerson({ id: 'p1', federalTaxNumber: 1234567890 as unknown as string }),
          ],
        },
        status: 200,
        headers: {},
      } as any);

      expect((await naturalPeople.findByTaxNumber(TEST_COMPANY_ID, '01234567890'))?.id).toBe('p1');
      expect((await naturalPeople.findByTaxNumber(TEST_COMPANY_ID, '012.345.678-90'))?.id).toBe('p1');
      expect(await naturalPeople.findByTaxNumber(TEST_COMPANY_ID, '98765432100')).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should propagate errors from http client', async () => {
      const error = new Error('Network error');
      vi.mocked(mockHttpClient.get).mockRejectedValue(error);

      await expect(naturalPeople.list(TEST_COMPANY_ID)).rejects.toThrow('Network error');
    });
  });
});
