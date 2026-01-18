/**
 * Webhooks Resource
 * Manages webhook subscriptions for event notifications
 */

import type { HttpClient } from '../http/client.js';
import type { Webhook, WebhookEvent, ListResponse, ResourceId } from '../types.js';

/**
 * Webhooks resource for managing event subscriptions
 * All operations are scoped by company_id
 */
export class WebhooksResource {
  constructor(private readonly http: HttpClient) {}

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
   * Validate webhook signature
   * 
   * Verifies that a webhook request came from NFE.io by validating its signature.
   * This should be used to ensure webhook security.
   * 
   * @param payload - Raw webhook payload (as string)
   * @param signature - Signature from X-NFE-Signature header
   * @param secret - Your webhook secret
   * @returns True if signature is valid
   * 
   * @example
   * ```typescript
   * // In your webhook endpoint:
   * app.post('/webhook/nfe', async (req, res) => {
   *   const signature = req.headers['x-nfe-signature'];
   *   const payload = JSON.stringify(req.body);
   *   
   *   const isValid = nfe.webhooks.validateSignature(
   *     payload,
   *     signature,
   *     'sua-chave-secreta'
   *   );
   *   
   *   if (!isValid) {
   *     return res.status(401).send('Invalid signature');
   *   }
   *   
   *   // Process webhook...
   * });
   * ```
   */
  validateSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      // Import crypto dynamically to avoid issues in non-Node environments
      const crypto = (globalThis as any).require?.('crypto');
      if (!crypto) {
        throw new Error('crypto module not available');
      }

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
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

  /**
   * Get available webhook events
   * 
   * Returns a list of all available webhook event types
   * 
   * @returns List of available events
   * 
   * @example
   * ```typescript
   * const events = nfe.webhooks.getAvailableEvents();
   * console.log('Available events:', events);
   * ```
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
