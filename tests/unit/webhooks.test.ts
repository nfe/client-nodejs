import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhooksResource } from '../../src/core/resources/webhooks';
import type { HttpClient } from '../../src/core/http/client';
import type {
  AccountWebhook,
  HttpResponse,
  ListResponse,
  Webhook,
  WebhookEvent,
} from '../../src/core/types';
import { TEST_COMPANY_ID, TEST_WEBHOOK_ID } from '../setup';

describe('WebhooksResource', () => {
  let webhooks: WebhooksResource;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as any;

    webhooks = new WebhooksResource(mockHttpClient);
  });

  describe('list', () => {
    it('should list all webhooks for a company', async () => {
      const mockData: Webhook[] = [
        {
          id: 'webhook-1',
          url: 'https://example.com/webhook1',
          events: ['invoice.issued'] as WebhookEvent[],
          active: true,
        },
        {
          id: 'webhook-2',
          url: 'https://example.com/webhook2',
          events: ['invoice.cancelled'] as WebhookEvent[],
          active: false,
        },
      ];

      const mockListResponse: ListResponse<Webhook> = {
        data: mockData,
      };

      const mockResponse: HttpResponse<ListResponse<Webhook>> = {
        data: mockListResponse,
        status: 200,
        headers: {},
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await webhooks.list(TEST_COMPANY_ID);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('webhook-1');
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/webhooks`
      );
    });
  });

  describe('retrieve', () => {
    it('should retrieve a specific webhook', async () => {
      const mockWebhook: Webhook = {
        id: TEST_WEBHOOK_ID,
        url: 'https://example.com/webhook',
        events: ['invoice.issued', 'invoice.cancelled'] as WebhookEvent[],
        active: true,
      };

      const mockResponse: HttpResponse<Webhook> = {
        data: mockWebhook,
        status: 200,
        headers: {},
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await webhooks.retrieve(TEST_COMPANY_ID, TEST_WEBHOOK_ID);

      expect(result.id).toBe(TEST_WEBHOOK_ID);
      expect(result.url).toBe('https://example.com/webhook');
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/webhooks/${TEST_WEBHOOK_ID}`
      );
    });
  });

  describe('create', () => {
    it('should create a new webhook', async () => {
      const webhookData: Partial<Webhook> = {
        url: 'https://example.com/new-webhook',
        events: ['invoice.issued'] as WebhookEvent[],
      };

      const createdWebhook: Webhook = {
        id: 'new-webhook-id',
        ...webhookData,
        active: true,
      } as Webhook;

      const mockResponse: HttpResponse<Webhook> = {
        data: createdWebhook,
        status: 201,
        headers: {},
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      const result = await webhooks.create(TEST_COMPANY_ID, webhookData);

      expect(result.id).toBe('new-webhook-id');
      expect(result.url).toBe(webhookData.url);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/webhooks`,
        webhookData
      );
    });
  });

  describe('update', () => {
    it('should update an existing webhook', async () => {
      const updateData: Partial<Webhook> = {
        events: ['invoice.issued', 'invoice.cancelled', 'invoice.failed'] as WebhookEvent[],
      };

      const updatedWebhook: Webhook = {
        id: TEST_WEBHOOK_ID,
        url: 'https://example.com/webhook',
        ...updateData,
        active: true,
      } as Webhook;

      const mockResponse: HttpResponse<Webhook> = {
        data: updatedWebhook,
        status: 200,
        headers: {},
      };

      vi.mocked(mockHttpClient.put).mockResolvedValue(mockResponse);

      const result = await webhooks.update(TEST_COMPANY_ID, TEST_WEBHOOK_ID, updateData);

      expect(result.events).toHaveLength(3);
      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/webhooks/${TEST_WEBHOOK_ID}`,
        updateData
      );
    });
  });

  describe('delete', () => {
    it('should delete a webhook', async () => {
      const mockResponse: HttpResponse<void> = {
        data: undefined,
        status: 204,
        headers: {},
      };

      vi.mocked(mockHttpClient.delete).mockResolvedValue(mockResponse);

      await webhooks.delete(TEST_COMPANY_ID, TEST_WEBHOOK_ID);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        `/companies/${TEST_COMPANY_ID}/webhooks/${TEST_WEBHOOK_ID}`
      );
    });
  });

  describe('account-scoped operations (host-root /v2/webhooks)', () => {
    it('listAccountWebhooks GETs /webhooks and unwraps the {webHooks} envelope', async () => {
      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: { webHooks: [{ id: 'w1' }, { id: 'w2' }] }, status: 200, headers: {},
      } as HttpResponse<{ webHooks: Webhook[] }>);

      const result = await webhooks.listAccountWebhooks();
      expect(mockHttpClient.get).toHaveBeenCalledWith('/webhooks');
      expect(result.data).toHaveLength(2);
      expect(result.data[0]?.id).toBe('w1');
    });

    // Fixture do 201 real da sonda ao vivo (2026-07-02): resposta envelopada em
    // { webHook } e secret ecoado na criação. Sem o envelope no REQUEST a API
    // responde 400 "missing required properties including: 'webHook'".
    const LIVE_CREATED: AccountWebhook = {
      id: '948ee1f570934e768805c199d70e2e86',
      uri: 'https://httpbin.org/status/200',
      secret: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      contentType: 'json',
      insecureSsl: false,
      status: 'Active',
      filters: ['service_invoice.issued_successfully'],
      createdOn: '2026-07-03T02:41:53.5466401+00:00',
      modifiedOn: '2026-07-03T02:41:53.546678+00:00',
    };

    it('createAccountWebhook wraps the request in a {webHook} envelope and unwraps the response', async () => {
      vi.mocked(mockHttpClient.post).mockResolvedValue({
        data: { webHook: LIVE_CREATED }, status: 201, headers: {},
      } as HttpResponse<{ webHook: AccountWebhook }>);

      const input: AccountWebhook = {
        uri: 'https://httpbin.org/status/200',
        contentType: 'json',
        secret: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        filters: ['service_invoice.issued_successfully'],
      };
      const created = await webhooks.createAccountWebhook(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/webhooks', { webHook: input });
      expect(created.id).toBe('948ee1f570934e768805c199d70e2e86');
      expect(created.status).toBe('Active');
      expect(created.secret).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    });

    it('createAccountWebhook falls back to the raw body when the response has no envelope', async () => {
      vi.mocked(mockHttpClient.post).mockResolvedValue({
        data: { id: 'w-raw', uri: 'https://x.test/hook' }, status: 201, headers: {},
      } as HttpResponse<AccountWebhook>);

      const created = await webhooks.createAccountWebhook({ uri: 'https://x.test/hook' });
      expect(created.id).toBe('w-raw');
    });

    it('retrieve/update unwrap the {webHook} envelope; update wraps its request', async () => {
      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: { webHook: { id: 'w1', uri: 'https://x.test/hook' } }, status: 200, headers: {},
      } as HttpResponse<{ webHook: AccountWebhook }>);
      vi.mocked(mockHttpClient.put).mockResolvedValue({
        data: { webHook: { id: 'w1', uri: 'https://x.test/hook', insecureSsl: true } },
        status: 200, headers: {},
      } as HttpResponse<{ webHook: AccountWebhook }>);
      vi.mocked(mockHttpClient.delete).mockResolvedValue({ data: undefined, status: 204, headers: {} } as HttpResponse<void>);

      const got = await webhooks.retrieveAccountWebhook('w1');
      const updated = await webhooks.updateAccountWebhook('w1', { insecureSsl: true });
      await webhooks.deleteAccountWebhook('w1');
      await webhooks.pingAccountWebhook('w1');

      expect(got.id).toBe('w1');
      expect(updated.insecureSsl).toBe(true);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/webhooks/w1');
      expect(mockHttpClient.put).toHaveBeenCalledWith('/webhooks/w1', {
        webHook: { insecureSsl: true },
      });
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/webhooks/w1');
      expect(mockHttpClient.put).toHaveBeenCalledWith('/webhooks/w1/pings', {});
    });

    it('retrieve/update fall back to the raw body when the response has no envelope', async () => {
      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: { id: 'w-raw', uri: 'https://x.test/hook' }, status: 200, headers: {},
      } as HttpResponse<AccountWebhook>);
      vi.mocked(mockHttpClient.put).mockResolvedValue({
        data: { id: 'w-raw', uri: 'https://x.test/hook' }, status: 200, headers: {},
      } as HttpResponse<AccountWebhook>);

      expect((await webhooks.retrieveAccountWebhook('w-raw')).id).toBe('w-raw');
      expect((await webhooks.updateAccountWebhook('w-raw', {})).id).toBe('w-raw');
    });

    it('deleteAllAccountWebhooks is a distinct method hitting DELETE /webhooks (no id)', async () => {
      vi.mocked(mockHttpClient.delete).mockResolvedValue({ data: undefined, status: 204, headers: {} } as HttpResponse<void>);

      await webhooks.deleteAllAccountWebhooks();
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/webhooks');
      // It is NOT the same as the single-delete method
      expect(webhooks.deleteAllAccountWebhooks).not.toBe(webhooks.deleteAccountWebhook);
    });

    it('fetchEventTypes GETs /webhooks/eventTypes and extracts ids from the {eventTypes} envelope', async () => {
      vi.mocked(mockHttpClient.get).mockResolvedValue({
        data: { eventTypes: [{ id: 'invoice.issued' }, { id: 'invoice.cancelled' }, { id: 'some.new.event' }] },
        status: 200, headers: {},
      } as HttpResponse<{ eventTypes: Array<{ id: string }> }>);

      const types = await webhooks.fetchEventTypes();
      expect(mockHttpClient.get).toHaveBeenCalledWith('/webhooks/eventTypes');
      expect(types).toContain('some.new.event');
      expect(types).toHaveLength(3);
    });
  });

  describe('Error Handling', () => {
    it('should propagate HTTP client errors', async () => {
      const error = new Error('Network error');
      vi.mocked(mockHttpClient.get).mockRejectedValue(error);

      await expect(webhooks.list(TEST_COMPANY_ID)).rejects.toThrow('Network error');
    });
  });
});
