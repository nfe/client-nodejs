/**
 * Unit tests for MunicipalTaxesResource (Inscrições Municipais).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MunicipalTaxesResource } from '../../../src/core/resources/municipal-taxes.js';
import { HttpClient } from '../../../src/core/http/client.js';
import type { CreateMunicipalTaxData, UpdateMunicipalTaxData } from '../../../src/core/types.js';
import { ValidationError } from '../../../src/core/errors/index.js';

describe('MunicipalTaxesResource', () => {
  let resource: MunicipalTaxesResource;
  let http: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    http = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() };
    resource = new MunicipalTaxesResource(http as unknown as HttpClient);
  });

  const companyId = 'company-123';
  const id = 'mt-1';
  const base = `/v2/companies/${companyId}/municipaltaxes`;

  it('list GETs the municipaltaxes base path', async () => {
    http.get.mockResolvedValue({ data: { municipalTaxes: [] }, status: 200, headers: {} });
    await resource.list(companyId);
    expect(http.get).toHaveBeenCalledWith(base);
  });

  // The API wraps the entity: { "municipalTax": {…} }. GET by id measured on 2026-10-15;
  // POST/PUT per the contribuintes-v2 spec (not probed: they would write).
  it('create POSTs wrapped as { municipalTax } and returns the entity', async () => {
    http.post.mockResolvedValue({ data: { municipalTax: { id } }, status: 201, headers: {} });
    const data = { taxNumber: '123' } as unknown as CreateMunicipalTaxData;
    const result = await resource.create(companyId, data);
    expect(http.post).toHaveBeenCalledWith(base, { municipalTax: data });
    expect(result).toEqual({ id });
  });

  it('retrieve/update/delete hit /{id} and return the entity, not the envelope', async () => {
    http.get.mockResolvedValue({ data: { municipalTax: { id } }, status: 200, headers: {} });
    http.put.mockResolvedValue({ data: { municipalTax: { id } }, status: 200, headers: {} });
    http.delete.mockResolvedValue({ data: undefined, status: 204, headers: {} });
    const upd = { issRate: 5 } as unknown as UpdateMunicipalTaxData;

    const retrieved = await resource.retrieve(companyId, id);
    const updated = await resource.update(companyId, id, upd);
    await resource.delete(companyId, id);

    expect(http.get).toHaveBeenCalledWith(`${base}/${id}`);
    expect(http.put).toHaveBeenCalledWith(`${base}/${id}`, { municipalTax: upd });
    expect(http.delete).toHaveBeenCalledWith(`${base}/${id}`);
    expect(retrieved.id).toBe(id);
    expect(updated.id).toBe(id);
  });

  it('also accepts the bare entity (defensive unwrap)', async () => {
    http.get.mockResolvedValue({ data: { id }, status: 200, headers: {} });
    const result = await resource.retrieve(companyId, id);
    expect(result).toEqual({ id });
  });

  it('updatePrefecture uses PATCH on .../updateprefecture', async () => {
    http.patch.mockResolvedValue({ data: { id }, status: 200, headers: {} });
    const upd = { loginPassword: 'x' } as unknown as UpdateMunicipalTaxData;
    await resource.updatePrefecture(companyId, id, upd);
    expect(http.patch).toHaveBeenCalledWith(`${base}/${id}/updateprefecture`, { municipalTax: upd });
  });

  it('getSeries GETs .../series/{serie}', async () => {
    http.get.mockResolvedValue({ data: {}, status: 200, headers: {} });
    await resource.getSeries(companyId, id, '1');
    expect(http.get).toHaveBeenCalledWith(`${base}/${id}/series/1`);
  });

  it('validates inputs', async () => {
    await expect(resource.list('')).rejects.toBeInstanceOf(ValidationError);
    await expect(resource.retrieve(companyId, '')).rejects.toBeInstanceOf(ValidationError);
    await expect(resource.getSeries(companyId, id, '')).rejects.toBeInstanceOf(ValidationError);
  });
});
