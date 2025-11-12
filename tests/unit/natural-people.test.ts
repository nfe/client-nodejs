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
      const mockResponse: HttpResponse<ListResponse<NaturalPerson>> = {
        data: { data: [mockPerson] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

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
      const mockResponse: HttpResponse<NaturalPerson> = {
        data: mockPerson,
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

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
      const mockResponse: HttpResponse<NaturalPerson> = {
        data: createdPerson,
        status: 201,
        headers: {},
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

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
      const mockResponse: HttpResponse<NaturalPerson> = {
        data: updatedPerson,
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.put).mockResolvedValue(mockResponse);

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

  describe('error handling', () => {
    it('should propagate errors from http client', async () => {
      const error = new Error('Network error');
      vi.mocked(mockHttpClient.get).mockRejectedValue(error);

      await expect(naturalPeople.list(TEST_COMPANY_ID)).rejects.toThrow('Network error');
    });
  });
});
