/**
 * Webhooks Resource
 * Manages webhook subscriptions for event notifications
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

import type { HttpClient } from '../http/client.js';
import type { Webhook, WebhookEvent, ListResponse, ResourceId } from '../types.js';

/**
 * Webhooks resource for managing event subscriptions
 * All operations are scoped by company_id
 */
export class WebhooksResource {
  /**
   * HTTP client for ACCOUNT-scoped endpoints (host-root `/v2/webhooks`). When not
   * provided, falls back to the company-scoped client (back-compat for tests).
   */
  private readonly account: HttpClient;

  constructor(
    private readonly http: HttpClient,
    accountHttp?: HttpClient
  ) {
    this.account = accountHttp ?? http;
  }

  /**
   * List all webhooks for a company
   * 
   * @param companyId - Company ID
   * @returns List of webhooks
   * 
   * @example
   * ```typescript
   * const result = await nfe.webhooks.list('company-id');
   * console.log(`You have ${result.data.length} webhooks configured`);
   * ```
   */
  async list(companyId: ResourceId): Promise<ListResponse<Webhook>> {
    const path = `/companies/${companyId}/webhooks`;
    const response = await this.http.get<ListResponse<Webhook>>(path);
    
    return response.data;
  }

  /**
   * Create a new webhook subscription
   * 
   * @param companyId - Company ID
   * @param data - Webhook configuration
   * @returns Created webhook
   * 
   * @example
   * ```typescript
   * const webhook = await nfe.webhooks.create('company-id', {
   *   url: 'https://seu-site.com/webhook/nfe',
   *   events: ['invoice.issued', 'invoice.cancelled'],
   *   secret: 'sua-chave-secreta-opcional'
   * });
   * ```
   */
  async create(
    companyId: ResourceId,
    data: Partial<Webhook>
  ): Promise<Webhook> {
    const path = `/companies/${companyId}/webhooks`;
    const response = await this.http.post<Webhook>(path, data);
    
    return response.data;
  }

  /**
   * Retrieve a specific webhook
   * 
   * @param companyId - Company ID
   * @param webhookId - Webhook ID
   * @returns Webhook details
   * 
   * @example
   * ```typescript
   * const webhook = await nfe.webhooks.retrieve('company-id', 'webhook-id');
   * console.log('Webhook URL:', webhook.url);
   * ```
   */
  async retrieve(
    companyId: ResourceId,
    webhookId: ResourceId
  ): Promise<Webhook> {
    const path = `/companies/${companyId}/webhooks/${webhookId}`;
    const response = await this.http.get<Webhook>(path);
    
    return response.data;
  }

  /**
   * Update a webhook
   * 
   * @param companyId - Company ID
   * @param webhookId - Webhook ID
   * @param data - Data to update
   * @returns Updated webhook
   * 
   * @example
   * ```typescript
   * const updated = await nfe.webhooks.update(
   *   'company-id',
   *   'webhook-id',
   *   { events: ['invoice.issued', 'invoice.cancelled', 'invoice.failed'] }
   * );
   * ```
   */
  async update(
    companyId: ResourceId,
    webhookId: ResourceId,
    data: Partial<Webhook>
  ): Promise<Webhook> {
    const path = `/companies/${companyId}/webhooks/${webhookId}`;
    const response = await this.http.put<Webhook>(path, data);
    
    return response.data;
  }

  /**
   * Delete a webhook
   * 
   * @param companyId - Company ID
   * @param webhookId - Webhook ID
   * 
   * @example
   * ```typescript
   * await nfe.webhooks.delete('company-id', 'webhook-id');
   * console.log('Webhook deleted');
   * ```
   */
  async delete(
    companyId: ResourceId,
    webhookId: ResourceId
  ): Promise<void> {
    const path = `/companies/${companyId}/webhooks/${webhookId}`;
    await this.http.delete(path);
  }

  /**
   * Validate a webhook signature sent by NFE.io.
   *
   * NFE.io signs every webhook delivery with `HMAC-SHA1(secret, raw_body_bytes)`,
   * encoded as hex (uppercase in the wire format, but compared case-insensitively),
   * and prefixed with `sha1=`. The signed value is delivered in the
   * `X-Hub-Signature` HTTP header.
   *
   * @param payload - The raw request body. Pass a `Buffer` whenever possible to
   *                  preserve byte-exact content. Strings are encoded as UTF-8.
   *                  Re-serializing JSON (e.g. `JSON.stringify(req.body)`) does
   *                  NOT work because property order and whitespace will differ
   *                  from the bytes NFE.io signed.
   * @param signature - The full value of the `X-Hub-Signature` header, including
   *                    the `sha1=` prefix. Accepts `string` or `string[]` (the
   *                    shape Node's `IncomingMessage` exposes for repeated
   *                    headers); `undefined`/`null` are treated as invalid.
   * @param secret - The webhook secret configured when the webhook was created.
   * @returns `true` only when the signature matches; `false` for any mismatch,
   *          malformed input, missing input, or wrong algorithm prefix. This
   *          method never throws.
   *
   * @example
   * ```typescript
   * import express from 'express';
   *
   * // IMPORTANT: capture the raw body BEFORE any JSON parser so that
   * // validateSignature sees the exact bytes NFE.io signed.
   * app.post(
   *   '/webhook/nfe',
   *   express.raw({ type: '*\/*' }),
   *   (req, res) => {
   *     const ok = nfe.webhooks.validateSignature(
   *       req.body,                              // Buffer with exact bytes
   *       req.headers['x-hub-signature'],        // correct header
   *       process.env.NFE_WEBHOOK_SECRET ?? ''
   *     );
   *     if (!ok) return res.status(401).end();
   *
   *     const event = JSON.parse(req.body.toString('utf8'));
   *     // process event...
   *     res.status(204).end();
   *   }
   * );
   * ```
   */
  validateSignature(
    payload: Buffer | string,
    signature: string | string[] | undefined,
    secret: string
  ): boolean {
    if (!secret || signature == null) return false;

    const sigStr = Array.isArray(signature) ? signature[0] : signature;
    if (typeof sigStr !== 'string' || sigStr.length === 0) return false;

    const PREFIX = 'sha1=';
    if (sigStr.length <= PREFIX.length) return false;
    if (sigStr.slice(0, PREFIX.length).toLowerCase() !== PREFIX) return false;

    // HMAC-SHA1 hex is always 40 chars. Validate shape before decoding so we
    // never feed garbage into Buffer.from(hex) (which silently returns shorter
    // buffers on invalid input).
    const received = sigStr.slice(PREFIX.length).toLowerCase();
    if (!/^[a-f0-9]{40}$/.test(received)) return false;

    const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
    const expected = createHmac('sha1', secret).update(body).digest('hex');

    // Both decode to exactly 20 bytes (guaranteed: received passed the
    // /^[a-f0-9]{40}$/ check above; expected is HMAC-SHA1 hex). That's why
    // timingSafeEqual is safe to call here without a length pre-check.
    return timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'));
  }

  /**
   * Test webhook delivery
   * 
   * Sends a test event to the webhook URL to verify it's working
   * 
   * @param companyId - Company ID
   * @param webhookId - Webhook ID
   * @returns Test result
   * 
   * @example
   * ```typescript
   * const result = await nfe.webhooks.test('company-id', 'webhook-id');
   * if (result.success) {
   *   console.log('Webhook is working!');
   * }
   * ```
   */
  async test(
    companyId: ResourceId,
    webhookId: ResourceId
  ): Promise<{ success: boolean; message?: string }> {
    const path = `/companies/${companyId}/webhooks/${webhookId}/test`;
    const response = await this.http.post<{ success: boolean; message?: string }>(
      path,
      {}
    );
    
    return response.data;
  }

  // --------------------------------------------------------------------------
  // Account-scoped operations (/v2/webhooks) — NOT company-scoped.
  // These take no companyId; they manage webhooks at the account level.
  // --------------------------------------------------------------------------

  /**
   * List account-level webhooks (`GET /v2/webhooks`).
   *
   * The API wraps the result as `{ webHooks: [...] }`; this normalizes it to the
   * SDK's `ListResponse<Webhook>` (`{ data: [...] }`).
   */
  async listAccountWebhooks(): Promise<ListResponse<Webhook>> {
    const response = await this.account.get<{ webHooks?: Webhook[] }>('/webhooks');
    return { data: response.data?.webHooks ?? [] };
  }

  /** Create an account-level webhook (`POST /v2/webhooks`). */
  async createAccountWebhook(data: Partial<Webhook>): Promise<Webhook> {
    const response = await this.account.post<Webhook>('/webhooks', data);
    return response.data;
  }

  /** Retrieve an account-level webhook by id (`GET /v2/webhooks/{id}`). */
  async retrieveAccountWebhook(webhookId: ResourceId): Promise<Webhook> {
    const response = await this.account.get<Webhook>(`/webhooks/${webhookId}`);
    return response.data;
  }

  /** Update an account-level webhook by id (`PUT /v2/webhooks/{id}`). */
  async updateAccountWebhook(webhookId: ResourceId, data: Partial<Webhook>): Promise<Webhook> {
    const response = await this.account.put<Webhook>(`/webhooks/${webhookId}`, data);
    return response.data;
  }

  /** Delete a single account-level webhook by id (`DELETE /v2/webhooks/{id}`). */
  async deleteAccountWebhook(webhookId: ResourceId): Promise<void> {
    await this.account.delete(`/webhooks/${webhookId}`);
  }

  /**
   * ⚠️ DANGEROUS: delete **ALL** account-level webhooks (`DELETE /v2/webhooks`).
   *
   * Named distinctly from {@link deleteAccountWebhook} so it can never be reached
   * by a mistyped single delete. This removes every webhook on the account.
   */
  async deleteAllAccountWebhooks(): Promise<void> {
    await this.account.delete('/webhooks');
  }

  /** Trigger a test ping for an account-level webhook (`PUT /v2/webhooks/{id}/pings`). */
  async pingAccountWebhook(webhookId: ResourceId): Promise<void> {
    await this.account.put(`/webhooks/${webhookId}/pings`, {});
  }

  /**
   * Fetch the live list of available webhook event types (`GET /v2/webhooks/eventTypes`).
   *
   * Prefer this over {@link getAvailableEvents}: the server is the source of truth,
   * so new event types are picked up automatically. The return is an **open** union
   * (`WebhookEvent | (string & {})`) so new server-side events don't break typing.
   * The API wraps the result as `{ eventTypes: [{ id, ... }] }`; this extracts the ids.
   */
  async fetchEventTypes(): Promise<Array<WebhookEvent | (string & {})>> {
    const response = await this.account.get<{ eventTypes?: Array<{ id: string }> }>(
      '/webhooks/eventTypes'
    );
    return (response.data?.eventTypes ?? []).map((e) => e.id);
  }

  /**
   * Get available webhook events.
   *
   * @deprecated This returns a hardcoded list that can drift from the platform's
   * real event set. Use {@link fetchEventTypes} to get the live list from the API.
   *
   * @returns List of available events
   */
  getAvailableEvents(): WebhookEvent[] {
    return [
      'invoice.issued',
      'invoice.cancelled',
      'invoice.failed',
      'invoice.processing',
      'company.created',
      'company.updated',
      'company.deleted',
    ] as WebhookEvent[];
  }
}
