import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhooksResource } from '../../src/core/resources/webhooks';
import type { HttpClient } from '../../src/core/http/client';
import type { HttpResponse, ListResponse, Webhook, WebhookEvent } from '../../src/core/types';
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

  describe('Error Handling', () => {
    it('should propagate HTTP client errors', async () => {
      const error = new Error('Network error');
      vi.mocked(mockHttpClient.get).mockRejectedValue(error);

      await expect(webhooks.list(TEST_COMPANY_ID)).rejects.toThrow('Network error');
    });
  });
});
