/**
 * NFE.io SDK v3 - HTTP Client with Fetch API
 *
 * Modern HTTP client using native fetch (Node.js 18+)
 * Zero external dependencies with automatic retries and proper error handling
 */

import type { HttpConfig, HttpResponse, RetryConfig } from '../types.js';
import {
  ErrorFactory,
  ConnectionError,
  TimeoutError,
  RateLimitError,
  NfeError
} from '../errors/index.js';

// Simple type declarations for runtime APIs
declare const fetch: any;
declare const AbortController: any;
declare const URLSearchParams: any;
declare const FormData: any;
declare const setTimeout: any;
declare const clearTimeout: any;
declare const Buffer: any;
declare const process: any;

// ============================================================================
// HTTP Client Implementation
// ============================================================================

export class HttpClient {
  private readonly config: HttpConfig;

  constructor(config: HttpConfig) {
    this.config = config;
    this.validateFetchSupport();
  }

  // --------------------------------------------------------------------------
  // Public HTTP Methods
  // --------------------------------------------------------------------------

  async get<T = unknown>(path: string, params?: Record<string, unknown>): Promise<HttpResponse<T>> {
    const url = this.buildUrl(path, params);
    return this.request<T>('GET', url);
  }

  async post<T = unknown>(path: string, data?: unknown): Promise<HttpResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('POST', url, data);
  }

  async put<T = unknown>(path: string, data?: unknown): Promise<HttpResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('PUT', url, data);
  }

  async delete<T = unknown>(path: string): Promise<HttpResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('DELETE', url);
  }

  // --------------------------------------------------------------------------
  // Core Request Method with Retry Logic
  // --------------------------------------------------------------------------

  private async request<T>(
    method: string,
    url: string,
    data?: unknown
  ): Promise<HttpResponse<T>> {
    const { maxRetries, baseDelay } = this.config.retryConfig;
    let lastError: NfeError | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.executeRequest<T>(method, url, data);
        return response;
      } catch (error) {
        lastError = error as NfeError;

        // Don't retry on client errors (4xx) except rate limits
        if (this.shouldNotRetry(lastError, attempt, maxRetries)) {
          throw lastError;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = this.calculateRetryDelay(attempt, baseDelay);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new ConnectionError('Request failed after all retries');
  }

  // --------------------------------------------------------------------------
  // Single Request Execution
  // --------------------------------------------------------------------------

  private async executeRequest<T>(
    method: string,
    url: string,
    data?: unknown
  ): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers = this.buildHeaders(data);
      const body = this.buildBody(data);

      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return await this.processResponse<T>(response);

    } catch (error) {
      clearTimeout(timeoutId);

      // Re-throw NfeError instances (from handleErrorResponse)
      if (error instanceof NfeError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TimeoutError(`Request timeout after ${this.config.timeout}ms`, error);
        }
        throw ErrorFactory.fromNetworkError(error);
      }

      throw new ConnectionError('Unknown network error', error);
    }
  }

  // --------------------------------------------------------------------------
  // Response Processing
  // --------------------------------------------------------------------------

  private async processResponse<T>(response: any): Promise<HttpResponse<T>> {
    // Special handling for NFE.io async responses (202 with location)
    if (response.status === 202) {
      const location = response.headers.get('location');
      if (location) {
        return {
          data: {
            code: 202,
            status: 'pending',
            location
          } as T,
          status: response.status,
          headers: this.extractHeaders(response)
        };
      }
    }

    // Handle error responses
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    // Parse successful response
    const data = await this.parseResponseData<T>(response);

    return {
      data,
      status: response.status,
      headers: this.extractHeaders(response)
    };
  }

  private async parseResponseData<T>(response: any): Promise<T> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    if (contentType.includes('application/pdf') || contentType.includes('application/xml')) {
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer) as unknown as T;
    }

    // Default to text
    return response.text() as unknown as T;
  }

  private async handleErrorResponse(response: any): Promise<never> {
    let errorData: unknown;

    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = await response.text();
      }
    } catch {
      // Ignore parse errors, use status as fallback
      errorData = { status: response.status, statusText: response.statusText };
    }

    // Extract error message from response data
    const message = this.extractErrorMessage(errorData, response.status);

    throw ErrorFactory.fromHttpResponse(response.status, errorData, message);
  }

  private extractErrorMessage(data: unknown, status: number): string {
    if (typeof data === 'object' && data !== null) {
      const errorObj = data as Record<string, unknown>;

      // Try common error message fields
      if (typeof errorObj.message === 'string') return errorObj.message;
      if (typeof errorObj.error === 'string') return errorObj.error;
      if (typeof errorObj.detail === 'string') return errorObj.detail;
      if (typeof errorObj.details === 'string') return errorObj.details;
    }

    if (typeof data === 'string') {
      return data;
    }

    return `HTTP ${status} error`;
  }

  // --------------------------------------------------------------------------
  // URL and Header Building
  // --------------------------------------------------------------------------

  private buildUrl(path: string, params?: Record<string, unknown>): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    const cleanPath = path.replace(/^\//, ''); // Remove leading slash
    let url = `${baseUrl}/${cleanPath}`;

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  private buildHeaders(data?: unknown): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': this.config.apiKey,
      'Accept': 'application/json',
      'User-Agent': this.getUserAgent(),
    };

    // Add Content-Type for requests with body (but not FormData)
    if (data !== undefined && data !== null && !this.isFormData(data)) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  private buildBody(data?: unknown): string | any | undefined {
    if (data === undefined || data === null) {
      return undefined;
    }

    // Handle FormData (for file uploads)
    if (this.isFormData(data)) {
      return data as any;
    }

    // Default to JSON
    return JSON.stringify(data);
  }

  private isFormData(data: unknown): boolean {
    return typeof FormData !== 'undefined' && data instanceof FormData;
  }

  private getUserAgent(): string {
    const nodeVersion = process.version;
    const platform = process.platform;

    // Try to get package version (will be undefined in development)
    const packageVersion = '3.0.0'; // TODO: Read from package.json

    return `@nfe-io/sdk@${packageVersion} node/${nodeVersion} (${platform})`;
  }

  private extractHeaders(response: any): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value: any, key: any) => {
      headers[key] = value;
    });
    return headers;
  }

  // --------------------------------------------------------------------------
  // Retry Logic
  // --------------------------------------------------------------------------

  private shouldNotRetry(error: NfeError, attempt: number, maxRetries: number): boolean {
    // Don't retry if we've exhausted attempts
    if (attempt >= maxRetries) {
      return true;
    }

    // Always retry rate limits (with backoff)
    if (error instanceof RateLimitError) {
      return false;
    }

    // Don't retry client errors (4xx) - these are permanent errors
    if (error.code && error.code >= 400 && error.code < 500) {
      return true; // Don't retry any 4xx errors
    }

    // Retry server errors (5xx) and network errors
    return false;
  }

  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    const { maxDelay = 30000, backoffMultiplier = 2 } = this.config.retryConfig;

    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(backoffMultiplier, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter

    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------

  private validateFetchSupport(): void {
    if (typeof fetch === 'undefined') {
      throw ErrorFactory.fromNodeVersionError(process.version);
    }

    if (typeof AbortController === 'undefined') {
      throw new ConnectionError(
        'AbortController is not available. This should not happen in Node.js 18+.'
      );
    }
  }
}

// ============================================================================
// HTTP Client Factory
// ============================================================================

export function createHttpClient(config: HttpConfig): HttpClient {
  return new HttpClient(config);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create default retry configuration
 */
export function createDefaultRetryConfig(): RetryConfig {
  return {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  };
}

/**
 * Build HTTP config from SDK config
 */
export function buildHttpConfig(apiKey: string, baseUrl: string, timeout: number, retryConfig: RetryConfig): HttpConfig {
  return {
    apiKey,
    baseUrl,
    timeout,
    retryConfig,
  };
}
