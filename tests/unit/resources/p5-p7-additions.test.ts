/**
 * Unit tests for P5/P7 additions: companies.exists (HEAD), serviceInvoices
 * retrieveByExternalId, stateTaxes switchAuthorizer, and NotificationsResource.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompaniesResource } from '../../../src/core/resources/companies.js';
import { ServiceInvoicesResource } from '../../../src/core/resources/service-invoices.js';
import { StateTaxesResource } from '../../../src/core/resources/state-taxes.js';
import { NotificationsResource } from '../../../src/core/resources/notifications.js';
import { HttpClient } from '../../../src/core/http/client.js';
import { NotFoundError, ValidationError } from '../../../src/core/errors/index.js';

function mockHttp() {
  return { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn(), head: vi.fn() };
}

const companyId = 'company-123';

describe('companies.exists (HEAD /v2/companies/{id})', () => {
  it('returns true when HEAD succeeds (uses the v2 client)', async () => {
    const main = mockHttp();
    const v2 = mockHttp();
    v2.head.mockResolvedValue({ status: 200, headers: {}, data: undefined });
    const companies = new CompaniesResource(main as unknown as HttpClient, v2 as unknown as HttpClient);

    expect(await companies.exists(companyId)).toBe(true);
    expect(v2.head).toHaveBeenCalledWith(`/v2/companies/${companyId}`);
  });

  it('returns false on 404 (NotFoundError) without throwing', async () => {
    const main = mockHttp();
    const v2 = mockHttp();
    v2.head.mockRejectedValue(new NotFoundError('not found'));
    const companies = new CompaniesResource(main as unknown as HttpClient, v2 as unknown as HttpClient);

    expect(await companies.exists(companyId)).toBe(false);
  });

  it('validates companyId', async () => {
    const companies = new CompaniesResource(mockHttp() as unknown as HttpClient);
    await expect(companies.exists('')).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('serviceInvoices.retrieveByExternalId', () => {
  it('GETs the external/{id} path', async () => {
    const http = mockHttp();
    http.get.mockResolvedValue({ status: 200, headers: {}, data: { id: 'inv-1' } });
    const res = new ServiceInvoicesResource(http as unknown as HttpClient);

    const inv = await res.retrieveByExternalId(companyId, 'ext-9');
    expect(http.get).toHaveBeenCalledWith(`/companies/${companyId}/serviceinvoices/external/ext-9`);
    expect(inv.id).toBe('inv-1');
  });
});

describe('stateTaxes.switchAuthorizer', () => {
  it('POSTs to .../switch-authorizer', async () => {
    const http = mockHttp();
    http.post.mockResolvedValue({ status: 200, headers: {}, data: { id: 'st-1' } });
    const res = new StateTaxesResource(http as unknown as HttpClient);

    await res.switchAuthorizer(companyId, 'st-1', { authorizer: 'SVRS' });
    expect(http.post).toHaveBeenCalledWith(
      `/v2/companies/${companyId}/statetaxes/st-1/switch-authorizer`,
      { authorizer: 'SVRS' }
    );
  });
});

describe('NotificationsResource', () => {
  let http: ReturnType<typeof mockHttp>;
  let res: NotificationsResource;
  beforeEach(() => {
    http = mockHttp();
    res = new NotificationsResource(http as unknown as HttpClient);
  });
  const base = `/companies/${companyId}/notifications`;

  it('list/retrieve/delete/email hit the right paths', async () => {
    http.get.mockResolvedValue({ status: 200, headers: {}, data: {} });
    http.delete.mockResolvedValue({ status: 204, headers: {}, data: undefined });
    http.post.mockResolvedValue({ status: 200, headers: {}, data: {} });

    await res.list(companyId);
    await res.retrieve(companyId, 'n1');
    await res.delete(companyId, 'n1');
    await res.sendEmail(companyId, { to: 'x@y.z' });

    expect(http.get).toHaveBeenCalledWith(base);
    expect(http.get).toHaveBeenCalledWith(`${base}/n1`);
    expect(http.delete).toHaveBeenCalledWith(`${base}/n1`);
    expect(http.post).toHaveBeenCalledWith(`${base}/email`, { to: 'x@y.z' });
  });

  it('validates inputs', async () => {
    await expect(res.retrieve(companyId, '')).rejects.toBeInstanceOf(ValidationError);
    await expect(res.list('')).rejects.toBeInstanceOf(ValidationError);
  });
});
