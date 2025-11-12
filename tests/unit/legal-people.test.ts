import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LegalPeopleResource } from '../../src/core/resources/legal-people.js';
import type { HttpClient } from '../../src/core/http/client.js';
import type { HttpResponse, ListResponse, LegalPerson } from '../../src/core/types.js';
import { createMockLegalPerson, TEST_COMPANY_ID, TEST_PERSON_ID } from '../setup.js';

describe('LegalPeopleResource', () => {
  let mockHttpClient: HttpClient;
  let legalPeople: LegalPeopleResource;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as HttpClient;

    legalPeople = new LegalPeopleResource(mockHttpClient);
  });

  describe('list', () => {
    it('should list legal people for a company', async () => {
      const mockPerson = createMockLegalPerson();
      const mockResponse: HttpResponse<ListResponse<LegalPerson>> = {
        data: { data: [mockPerson] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await legalPeople.list(TEST_COMPANY_ID);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/legalpeople`
      );
      expect(result.data).toEqual([mockPerson]);
    });
  });

  describe('retrieve', () => {
    it('should retrieve a legal person by id', async () => {
      const mockPerson = createMockLegalPerson();
      const mockResponse: HttpResponse<LegalPerson> = {
        data: mockPerson,
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await legalPeople.retrieve(TEST_COMPANY_ID, TEST_PERSON_ID);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/legalpeople/${TEST_PERSON_ID}`
      );
      expect(result).toEqual(mockPerson);
    });
  });

  describe('create', () => {
    it('should create a new legal person', async () => {
      const newPerson = createMockLegalPerson({ id: undefined });
      const createdPerson = createMockLegalPerson();
      const mockResponse: HttpResponse<LegalPerson> = {
        data: createdPerson,
        status: 201,
        headers: {},
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      const result = await legalPeople.create(TEST_COMPANY_ID, newPerson);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/legalpeople`,
        newPerson
      );
      expect(result).toEqual(createdPerson);
    });
  });

  describe('update', () => {
    it('should update an existing legal person', async () => {
      const updates = { email: 'new@email.com' };
      const updatedPerson = createMockLegalPerson(updates);
      const mockResponse: HttpResponse<LegalPerson> = {
        data: updatedPerson,
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.put).mockResolvedValue(mockResponse);

      const result = await legalPeople.update(TEST_COMPANY_ID, TEST_PERSON_ID, updates);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/legalpeople/${TEST_PERSON_ID}`,
        updates
      );
      expect(result).toEqual(updatedPerson);
    });
  });

  describe('delete', () => {
    it('should delete a legal person', async () => {
      const mockResponse: HttpResponse<void> = {
        data: undefined,
        status: 204,
        headers: {},
      };
      vi.mocked(mockHttpClient.delete).mockResolvedValue(mockResponse);

      await legalPeople.delete(TEST_COMPANY_ID, TEST_PERSON_ID);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/legalpeople/${TEST_PERSON_ID}`
      );
    });
  });

  describe('error handling', () => {
    it('should propagate errors from http client', async () => {
      const error = new Error('Network error');
      vi.mocked(mockHttpClient.get).mockRejectedValue(error);

      await expect(legalPeople.list(TEST_COMPANY_ID)).rejects.toThrow('Network error');
    });
  });
});
