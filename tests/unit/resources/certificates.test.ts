/**
 * Unit tests for CertificatesResource (digital certificate management).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CertificatesResource } from '../../../src/core/resources/certificates.js';
import { HttpClient } from '../../../src/core/http/client.js';
import { ValidationError } from '../../../src/core/errors/index.js';

describe('CertificatesResource', () => {
  let resource: CertificatesResource;
  let http: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    http = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    resource = new CertificatesResource(http as unknown as HttpClient);
  });

  const companyId = 'company-123';
  const thumb = 'AB12CD34';
  const v2 = `/v2/companies/${companyId}/certificates`;
  const v1 = `/v1/companies/${companyId}/certificate`;

  it('list GETs the v2 plural collection', async () => {
    http.get.mockResolvedValue({ status: 200, headers: {}, data: {} });
    await resource.list(companyId);
    expect(http.get).toHaveBeenCalledWith(v2);
  });

  it('get/delete by thumbprint hit the v2 path', async () => {
    http.get.mockResolvedValue({ status: 200, headers: {}, data: {} });
    http.delete.mockResolvedValue({ status: 204, headers: {}, data: undefined });
    await resource.getByThumbprint(companyId, thumb);
    await resource.deleteByThumbprint(companyId, thumb);
    expect(http.get).toHaveBeenCalledWith(`${v2}/${thumb}`);
    expect(http.delete).toHaveBeenCalledWith(`${v2}/${thumb}`);
  });

  it('v1 variants hit the v1 path', async () => {
    http.get.mockResolvedValue({ status: 200, headers: {}, data: {} });
    http.delete.mockResolvedValue({ status: 204, headers: {}, data: undefined });
    await resource.getByThumbprintV1(companyId, thumb);
    await resource.deleteByThumbprintV1(companyId, thumb);
    expect(http.get).toHaveBeenCalledWith(`${v1}/${thumb}`);
    expect(http.delete).toHaveBeenCalledWith(`${v1}/${thumb}`);
  });

  it('validates inputs', async () => {
    await expect(resource.list('')).rejects.toBeInstanceOf(ValidationError);
    await expect(resource.getByThumbprint(companyId, '')).rejects.toBeInstanceOf(ValidationError);
    await expect(resource.deleteByThumbprint('', thumb)).rejects.toBeInstanceOf(ValidationError);
  });
});
