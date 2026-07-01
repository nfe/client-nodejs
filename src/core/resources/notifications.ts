/**
 * NFE.io SDK v4 - Notifications Resource (company notifications)
 *
 * Company-scoped notification operations on the main API (api.nfe.io). The
 * nf-servico-v1 spec has no component schemas for these, so types are minimal
 * hand types with a permissive index (consistent with the rest of that surface).
 */

import type { HttpClient } from '../http/client.js';
import { ValidationError } from '../errors/index.js';

/** A company notification (minimal, spec has no named schema). */
export interface Notification {
  id?: string;
  [key: string]: unknown;
}

/** List response for notifications (best-effort shape). */
export interface NotificationListResponse {
  notifications?: Notification[];
  [key: string]: unknown;
}

function validateCompanyId(companyId: string): void {
  if (!companyId || companyId.trim() === '') {
    throw new ValidationError('Company ID is required');
  }
}

function validateNotificationId(notificationId: string): void {
  if (!notificationId || notificationId.trim() === '') {
    throw new ValidationError('Notification ID is required');
  }
}

export class NotificationsResource {
  constructor(private readonly http: HttpClient) {}

  private basePath(companyId: string): string {
    return `/companies/${companyId}/notifications`;
  }

  /** List company notifications. */
  async list(companyId: string): Promise<NotificationListResponse> {
    validateCompanyId(companyId);
    const response = await this.http.get<NotificationListResponse>(this.basePath(companyId));
    return response.data;
  }

  /** Retrieve a notification by id. */
  async retrieve(companyId: string, notificationId: string): Promise<Notification> {
    validateCompanyId(companyId);
    validateNotificationId(notificationId);
    const response = await this.http.get<Notification>(
      `${this.basePath(companyId)}/${notificationId}`
    );
    return response.data;
  }

  /** Delete a notification. */
  async delete(companyId: string, notificationId: string): Promise<void> {
    validateCompanyId(companyId);
    validateNotificationId(notificationId);
    await this.http.delete(`${this.basePath(companyId)}/${notificationId}`);
  }

  /** Configure / send notification email settings. */
  async sendEmail(companyId: string, data?: Record<string, unknown>): Promise<void> {
    validateCompanyId(companyId);
    await this.http.post(`${this.basePath(companyId)}/email`, data ?? {});
  }
}

export function createNotificationsResource(http: HttpClient): NotificationsResource {
  return new NotificationsResource(http);
}
