/**
 * @fileoverview NFE.io SDK v3 - Main Client
 *
 * @description
 * Core client class for interacting with the NFE.io API v1.
 * Provides a modern TypeScript interface with zero runtime dependencies.
 *
 * @module @nfe-io/sdk/client
 * @author NFE.io
 * @license MIT
 */

import type {
  NfeConfig,
  RequiredNfeConfig,
  ServiceInvoice,
  PollOptions
} from './types.js';
import { HttpClient, createDefaultRetryConfig, buildHttpConfig } from './http/client.js';
import { ErrorFactory, ConfigurationError, PollingTimeoutError } from './errors/index.js';

// Resource imports
import {
  ServiceInvoicesResource,
  CompaniesResource,
  LegalPeopleResource,
  NaturalPeopleResource,
  WebhooksResource,
  AddressesResource,
  TransportationInvoicesResource,
  ADDRESS_API_BASE_URL
} from './resources/index.js';

// ============================================================================
// Constants
// ============================================================================

/** Base URL for CT-e API (Transportation Invoices) */
export const CTE_API_BASE_URL = 'https://api.nfse.io';

// ============================================================================
// Main NFE.io Client
// ============================================================================

/**
 * Main NFE.io API Client
 *
 * @description
 * Primary client class for interacting with the NFE.io API. Provides access to all
 * API resources including service invoices, companies, legal/natural people, and webhooks.
 *
 * **Features:**
 * - Zero runtime dependencies (uses native fetch)
 * - Automatic retry with exponential backoff
 * - TypeScript type safety
 * - Async invoice processing with polling utilities
 * - Environment detection and validation
 *
 * @example Basic Usage
 * ```typescript
 * import { NfeClient } from '@nfe-io/sdk';
 *
 * const nfe = new NfeClient({
 *   apiKey: 'your-api-key',
 *   environment: 'production' // or 'sandbox'
 * });
 *
 * // Create a company
 * const company = await nfe.companies.create({
 *   federalTaxNumber: '12345678000190',
 *   name: 'My Company'
 * });
 *
 * // Issue a service invoice
 * const invoice = await nfe.serviceInvoices.create(company.id, {
 *   borrower: { /* ... *\/ },
 *   cityServiceCode: '12345',
 *   servicesAmount: 1000.00
 * });
 * ```
 *
 * @example With Custom Configuration
 * ```typescript
 * const nfe = new NfeClient({
 *   apiKey: process.env.NFE_API_KEY,
 *   environment: 'production',
 *   timeout: 60000, // 60 seconds
 *   retryConfig: {
 *     maxRetries: 5,
 *     baseDelay: 1000,
 *     maxDelay: 30000
 *   }
 * });
 * ```
 *
 * @example Async Invoice Processing
 * ```typescript
 * // Method 1: Manual polling
 * const result = await nfe.serviceInvoices.create(companyId, data);
 * if (result.status === 'pending') {
 *   const invoice = await nfe.pollUntilComplete(
 *     () => nfe.serviceInvoices.retrieve(companyId, result.id)
 *   );
 * }
 *
 * // Method 2: Automatic polling (recommended)
 * const invoice = await nfe.serviceInvoices.createAndWait(companyId, data, {
 *   maxAttempts: 30,
 *   interval: 2000 // Check every 2 seconds
 * });
 * ```
 *
 * @see {@link NfeConfig} for configuration options
 * @see {@link ServiceInvoicesResource} for invoice operations
 * @see {@link CompaniesResource} for company operations
 */
export class NfeClient {
  /** @internal HTTP client for main API requests (created lazily) */
  private _http: HttpClient | undefined;

  /** @internal HTTP client for address API requests (created lazily) */
  private _addressHttp: HttpClient | undefined;

  /** @internal HTTP client for CT-e API requests (created lazily) */
  private _cteHttp: HttpClient | undefined;

  /** @internal Normalized client configuration */
  private readonly config: RequiredNfeConfig;

  /** @internal Cached resource instances */
  private _serviceInvoices: ServiceInvoicesResource | undefined;
  private _companies: CompaniesResource | undefined;
  private _legalPeople: LegalPeopleResource | undefined;
  private _naturalPeople: NaturalPeopleResource | undefined;
  private _webhooks: WebhooksResource | undefined;
  private _addresses: AddressesResource | undefined;
  private _transportationInvoices: TransportationInvoicesResource | undefined;

  /**
   * Service Invoices API resource
   *
   * @description
   * Provides operations for managing service invoices (NFS-e):
   * - Create, list, retrieve, cancel service invoices
   * - Send invoices by email
   * - Download PDF and XML files
   * - Automatic polling for async invoice processing
   *
   * @see {@link ServiceInvoicesResource}
   * @throws {ConfigurationError} If API key is not configured
   *
   * @example
   * ```typescript
   * const invoice = await nfe.serviceInvoices.create(companyId, {
   *   borrower: { name: 'Client', email: 'client@example.com' },
   *   cityServiceCode: '12345',
   *   servicesAmount: 1000.00
   * });
   * ```
   */
  get serviceInvoices(): ServiceInvoicesResource {
    if (!this._serviceInvoices) {
      this._serviceInvoices = new ServiceInvoicesResource(this.getMainHttpClient());
    }
    return this._serviceInvoices;
  }

  /**
   * Companies API resource
   *
   * @description
   * Provides operations for managing companies:
   * - CRUD operations for companies
   * - Upload digital certificates (PFX/P12)
   * - Batch operations
   *
   * @see {@link CompaniesResource}
   * @throws {ConfigurationError} If API key is not configured
   *
   * @example
   * ```typescript
   * const company = await nfe.companies.create({
   *   federalTaxNumber: '12345678000190',
   *   name: 'My Company',
   *   email: 'company@example.com'
   * });
   * ```
   */
  get companies(): CompaniesResource {
    if (!this._companies) {
      this._companies = new CompaniesResource(this.getMainHttpClient());
    }
    return this._companies;
  }

  /**
   * Legal People API resource
   *
   * @description
   * Provides operations for managing legal persons (empresas/PJ):
   * - CRUD operations scoped by company
   * - CNPJ lookup and validation
   * - Batch operations
   *
   * @see {@link LegalPeopleResource}
   * @throws {ConfigurationError} If API key is not configured
   *
   * @example
   * ```typescript
   * const legalPerson = await nfe.legalPeople.create(companyId, {
   *   federalTaxNumber: '12345678000190',
   *   name: 'Legal Person Company'
   * });
   * ```
   */
  get legalPeople(): LegalPeopleResource {
    if (!this._legalPeople) {
      this._legalPeople = new LegalPeopleResource(this.getMainHttpClient());
    }
    return this._legalPeople;
  }

  /**
   * Natural People API resource
   *
   * @description
   * Provides operations for managing natural persons (pessoas físicas/PF):
   * - CRUD operations scoped by company
   * - CPF lookup and validation
   * - Batch operations
   *
   * @see {@link NaturalPeopleResource}
   * @throws {ConfigurationError} If API key is not configured
   *
   * @example
   * ```typescript
   * const naturalPerson = await nfe.naturalPeople.create(companyId, {
   *   federalTaxNumber: '12345678901',
   *   name: 'John Doe'
   * });
   * ```
   */
  get naturalPeople(): NaturalPeopleResource {
    if (!this._naturalPeople) {
      this._naturalPeople = new NaturalPeopleResource(this.getMainHttpClient());
    }
    return this._naturalPeople;
  }

  /**
   * Webhooks API resource
   *
   * @description
   * Provides operations for managing webhooks:
   * - CRUD operations for webhook configurations
   * - Webhook signature validation
   * - Test webhook delivery
   * - List available event types
   *
   * @see {@link WebhooksResource}
   * @throws {ConfigurationError} If API key is not configured
   *
   * @example
   * ```typescript
   * const webhook = await nfe.webhooks.create({
   *   url: 'https://example.com/webhook',
   *   events: ['invoice.issued', 'invoice.cancelled']
   * });
   * ```
   */
  get webhooks(): WebhooksResource {
    if (!this._webhooks) {
      this._webhooks = new WebhooksResource(this.getMainHttpClient());
    }
    return this._webhooks;
  }

  /**
   * Addresses API resource
   *
   * @description
   * Provides operations for looking up Brazilian addresses:
   * - Lookup by postal code (CEP)
   * - Search by filter
   * - Search by generic term
   *
   * **Note:** This resource uses a different API host (address.api.nfe.io).
   * Configure `dataApiKey` for a separate key, or it will fallback to `apiKey`.
   *
   * @see {@link AddressesResource}
   * @throws {ConfigurationError} If no API key is configured (dataApiKey or apiKey)
   *
   * @example
   * ```typescript
   * const result = await nfe.addresses.lookupByPostalCode('01310-100');
   * console.log(result.addresses[0].street); // 'Paulista'
   * ```
   */
  get addresses(): AddressesResource {
    if (!this._addresses) {
      this._addresses = new AddressesResource(this.getAddressHttpClient());
    }
    return this._addresses;
  }

  /**
   * Transportation Invoices (CT-e) API resource
   *
   * @description
   * Provides operations for managing CT-e (Conhecimento de Transporte Eletrônico)
   * documents via SEFAZ Distribuição DFe:
   * - Enable/disable automatic CT-e search
   * - Retrieve CT-e metadata and XML
   * - Retrieve CT-e event metadata and XML
   *
   * **Prerequisites:**
   * - Company must have a valid A1 digital certificate
   * - Webhook must be configured to receive CT-e notifications
   *
   * **Note:** This resource uses a different API host (api.nfse.io).
   * Configure `dataApiKey` for a separate key, or it will fallback to `apiKey`.
   *
   * @see {@link TransportationInvoicesResource}
   * @throws {ConfigurationError} If no API key is configured (dataApiKey or apiKey)
   *
   * @example
   * ```typescript
   * // Enable automatic CT-e search
   * await nfe.transportationInvoices.enable('company-id');
   *
   * // Retrieve CT-e metadata
   * const cte = await nfe.transportationInvoices.retrieve(
   *   'company-id',
   *   '35240112345678000190570010000001231234567890'
   * );
   * ```
   */
  get transportationInvoices(): TransportationInvoicesResource {
    if (!this._transportationInvoices) {
      this._transportationInvoices = new TransportationInvoicesResource(this.getCteHttpClient());
    }
    return this._transportationInvoices;
  }

  /**
   * Create a new NFE.io API client
   *
   * @param config - Client configuration options
   * @throws {ConfigurationError} If configuration is invalid
   * @throws {ConfigurationError} If Node.js version < 18
   * @throws {ConfigurationError} If fetch API is not available
   *
   * @example Basic
   * ```typescript
   * const nfe = new NfeClient({
   *   apiKey: 'your-api-key',
   *   environment: 'production'
   * });
   * ```
   *
   * @example With environment variable
   * ```typescript
   * // Set NFE_API_KEY environment variable
   * const nfe = new NfeClient({
   *   environment: 'production'
   * });
   * ```
   *
   * @example With custom retry config
   * ```typescript
   * const nfe = new NfeClient({
   *   apiKey: 'your-api-key',
   *   timeout: 60000,
   *   retryConfig: {
   *     maxRetries: 5,
   *     baseDelay: 1000,
   *     maxDelay: 30000
   *   }
   * });
   * ```
   *
   * @example With only data API key
   * ```typescript
   * // Only use data services (address lookup, CT-e), no main API access
   * const nfe = new NfeClient({
   *   dataApiKey: 'data-api-key'
   * });
   * await nfe.addresses.lookupByPostalCode('01310-100');
   * ```
   */
  constructor(config: NfeConfig = {}) {
    // Validate Node.js environment first
    this.validateEnvironment();

    // Validate and normalize configuration (no longer requires apiKey)
    this.config = this.validateAndNormalizeConfig(config);

    // Resources are initialized lazily via getters
  }

  // --------------------------------------------------------------------------
  // HTTP Client Management (Lazy Initialization)
  // --------------------------------------------------------------------------

  /**
   * Get or create the main API HTTP client
   * @throws {ConfigurationError} If no API key is configured
   */
  private getMainHttpClient(): HttpClient {
    if (!this._http) {
      const apiKey = this.resolveMainApiKey();
      if (!apiKey) {
        throw new ConfigurationError(
          'API key required for this resource. Set "apiKey" in config or NFE_API_KEY environment variable.'
        );
      }
      const httpConfig = buildHttpConfig(
        apiKey,
        this.config.baseUrl,
        this.config.timeout,
        this.config.retryConfig
      );
      this._http = new HttpClient(httpConfig);
    }
    return this._http;
  }

  /**
   * Get or create the Address API HTTP client
   * @throws {ConfigurationError} If no API key is configured
   */
  private getAddressHttpClient(): HttpClient {
    if (!this._addressHttp) {
      const apiKey = this.resolveDataApiKey();
      if (!apiKey) {
        throw new ConfigurationError(
          'API key required for data services. Set "dataApiKey" or "apiKey" in config, or NFE_DATA_API_KEY/NFE_API_KEY environment variable.'
        );
      }
      const httpConfig = buildHttpConfig(
        apiKey,
        ADDRESS_API_BASE_URL,
        this.config.timeout,
        this.config.retryConfig
      );
      this._addressHttp = new HttpClient(httpConfig);
    }
    return this._addressHttp;
  }

  /**
   * Resolve the main API key using fallback chain
   */
  private resolveMainApiKey(): string | undefined {
    return (
      this.config.apiKey ||
      this.getEnvironmentVariable('NFE_API_KEY')
    );
  }

  /**
   * Resolve the data API key using fallback chain
   * Order: dataApiKey → apiKey → NFE_DATA_API_KEY → NFE_API_KEY
   */
  private resolveDataApiKey(): string | undefined {
    return (
      this.config.dataApiKey ||
      this.config.apiKey ||
      this.getEnvironmentVariable('NFE_DATA_API_KEY') ||
      this.getEnvironmentVariable('NFE_API_KEY')
    );
  }

  /**
   * Get or create the CT-e API HTTP client
   * @throws {ConfigurationError} If no API key is configured
   */
  private getCteHttpClient(): HttpClient {
    if (!this._cteHttp) {
      const apiKey = this.resolveDataApiKey();
      if (!apiKey) {
        throw new ConfigurationError(
          'API key required for data services. Set "dataApiKey" or "apiKey" in config, or NFE_DATA_API_KEY/NFE_API_KEY environment variable.'
        );
      }
      const httpConfig = buildHttpConfig(
        apiKey,
        CTE_API_BASE_URL,
        this.config.timeout,
        this.config.retryConfig
      );
      this._cteHttp = new HttpClient(httpConfig);
    }
    return this._cteHttp;
  }

  // --------------------------------------------------------------------------
  // Configuration Management
  // --------------------------------------------------------------------------

  private validateAndNormalizeConfig(config: NfeConfig): RequiredNfeConfig {
    // API keys are now optional - validated lazily when resources are accessed
    const apiKey = config.apiKey?.trim() || undefined;
    const dataApiKey = config.dataApiKey?.trim() || undefined;

    // Normalize environment
    const environment = config.environment || 'production';
    if (!['production', 'development'].includes(environment)) {
      throw new ConfigurationError(
        `Invalid environment: ${environment}. Must be 'production' or 'development'.`,
        { environment }
      );
    }

    // Set defaults - ensure retryConfig has all required properties
    const defaultRetryConfig = createDefaultRetryConfig();
    const retryConfig = config.retryConfig
      ? { ...defaultRetryConfig, ...config.retryConfig }
      : defaultRetryConfig;

    const normalizedConfig: RequiredNfeConfig = {
      apiKey,
      dataApiKey,
      environment,
      baseUrl: config.baseUrl || this.getDefaultBaseUrl(),
      timeout: config.timeout || 30000,
      retryConfig,
    };

    return normalizedConfig;
  }

  private getDefaultBaseUrl(): string {
    // NFE.io API uses the same endpoint for both production and development
    // They are differentiated by the API key used, not by different URLs
    return 'https://api.nfe.io/v1';
  }

  private getEnvironmentVariable(name: string): string | undefined {
    // Safe access to process.env with fallback
    try {
      return (globalThis as any).process?.env?.[name];
    } catch {
      return undefined;
    }
  }

  // --------------------------------------------------------------------------
  // Environment Validation
  // --------------------------------------------------------------------------

  private validateEnvironment(): void {
    // Check Node.js version (should support fetch natively)
    this.validateNodeVersion();

    // Check fetch availability
    if (typeof fetch === 'undefined') {
      throw ErrorFactory.fromNodeVersionError(this.getNodeVersion());
    }
  }

  private validateNodeVersion(): void {
    const nodeVersion = this.getNodeVersion();
    const majorVersion = this.extractMajorVersion(nodeVersion);

    if (majorVersion < 18) {
      throw ErrorFactory.fromNodeVersionError(nodeVersion);
    }
  }

  private getNodeVersion(): string {
    try {
      return (globalThis as any).process?.version || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private extractMajorVersion(version: string): number {
    const match = version.match(/^v?(\d+)\./);
    return match ? parseInt(match[1]!, 10) : 0;
  }

  // --------------------------------------------------------------------------
  // Public Utility Methods
  // --------------------------------------------------------------------------

  /**
   * Update client configuration dynamically
   *
   * @param newConfig - Partial configuration to merge with existing config
   * @throws {ConfigurationError} If new configuration is invalid
   *
   * @example
   * ```typescript
   * const nfe = new NfeClient({ apiKey: 'old-key' });
   *
   * // Switch to sandbox environment
   * nfe.updateConfig({ environment: 'sandbox' });
   *
   * // Update timeout
   * nfe.updateConfig({ timeout: 60000 });
   * ```
   */
  public updateConfig(newConfig: Partial<NfeConfig>): void {
    // Normalize the new configuration with current values as defaults
    const normalizedConfig = this.validateAndNormalizeConfig({
      ...newConfig,
      // Use current values as fallbacks for unspecified fields
      environment: newConfig.environment ?? this.config.environment,
      baseUrl: newConfig.baseUrl ?? this.config.baseUrl,
      timeout: newConfig.timeout ?? this.config.timeout,
      retryConfig: newConfig.retryConfig ?? this.config.retryConfig,
    });

    // Override API keys if they were in current config but not in newConfig
    if (normalizedConfig.apiKey === undefined && this.config.apiKey !== undefined && newConfig.apiKey === undefined) {
      normalizedConfig.apiKey = this.config.apiKey;
    }
    if (normalizedConfig.dataApiKey === undefined && this.config.dataApiKey !== undefined && newConfig.dataApiKey === undefined) {
      normalizedConfig.dataApiKey = this.config.dataApiKey;
    }

    // Update internal config
    Object.assign(this.config, normalizedConfig);

    // Clear cached HTTP clients and resources so they're recreated with new config
    this._http = undefined;
    this._addressHttp = undefined;
    this._cteHttp = undefined;
    this._serviceInvoices = undefined;
    this._companies = undefined;
    this._legalPeople = undefined;
    this._naturalPeople = undefined;
    this._webhooks = undefined;
    this._addresses = undefined;
    this._transportationInvoices = undefined;
  }

  /**
   * Set request timeout in milliseconds
   *
   * @param timeout - Request timeout in milliseconds
   *
   * @description
   * Maintains v2 API compatibility. Equivalent to `updateConfig({ timeout })`.
   *
   * @example
   * ```typescript
   * nfe.setTimeout(60000); // 60 seconds
   * ```
   */
  public setTimeout(timeout: number): void {
    this.updateConfig({ timeout });
  }

  /**
   * Set or update API key
   *
   * @param apiKey - New API key to use for authentication
   *
   * @description
   * Maintains v2 API compatibility. Equivalent to `updateConfig({ apiKey })`.
   *
   * @example
   * ```typescript
   * nfe.setApiKey('new-api-key');
   * ```
   */
  public setApiKey(apiKey: string): void {
    this.updateConfig({ apiKey });
  }

  /**
   * Get current client configuration
   *
   * @returns Readonly copy of current configuration
   *
   * @example
   * ```typescript
   * const config = nfe.getConfig();
   * console.log('Environment:', config.environment);
   * console.log('Base URL:', config.baseUrl);
   * console.log('Timeout:', config.timeout);
   * ```
   */
  public getConfig(): Readonly<RequiredNfeConfig> {
    return { ...this.config };
  }

  // --------------------------------------------------------------------------
  // Polling Utility (for async invoice processing)
  // --------------------------------------------------------------------------

  /**
   * Poll a resource until it completes or times out
   *
   * @template T - Type of the resource being polled
   * @param locationUrl - URL or path to poll
   * @param options - Polling configuration
   * @returns Promise that resolves when resource is complete
   * @throws {PollingTimeoutError} If polling exceeds maxAttempts
   *
   * @description
   * Critical utility for NFE.io's async invoice processing. When creating a service
   * invoice, the API returns a 202 response with a location URL. This method polls
   * that URL until the invoice is fully processed or the polling times out.
   *
   * @example Basic usage
   * ```typescript
   * const result = await nfe.serviceInvoices.create(companyId, data);
   *
   * if (result.status === 'pending') {
   *   const invoice = await nfe.pollUntilComplete(result.location);
   *   console.log('Invoice issued:', invoice.number);
   * }
   * ```
   *
   * @example With custom polling options
   * ```typescript
   * const invoice = await nfe.pollUntilComplete(locationUrl, {
   *   maxAttempts: 60,  // Poll up to 60 times
   *   intervalMs: 3000  // Wait 3 seconds between attempts
   * });
   * ```
   *
   * @example Using createAndWait (recommended)
   * ```typescript
   * // Instead of manual polling, use the convenience method:
   * const invoice = await nfe.serviceInvoices.createAndWait(companyId, data, {
   *   maxAttempts: 30,
   *   interval: 2000
   * });
   * ```
   *
   * @see {@link PollOptions} for configuration options
   * @see {@link ServiceInvoicesResource.createAndWait} for automated polling
   */
  public async pollUntilComplete<T = ServiceInvoice>(
    locationUrl: string,
    options: PollOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 30,
      intervalMs = 2000
    } = options;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Wait before polling (except first attempt)
      if (attempt > 0) {
        await this.sleep(intervalMs);
      }

      try {
        // Extract path from full URL for HTTP client
        const path = this.extractPathFromUrl(locationUrl);
        const response = await this.getMainHttpClient().get<any>(path);

        // Check completion status
        if (this.isCompleteResponse(response.data)) {
          return response.data as T;
        }

        if (this.isFailedResponse(response.data)) {
          throw new PollingTimeoutError(
            `Resource processing failed: ${response.data.error || 'Unknown error'}`,
            response.data
          );
        }

        // Continue polling if still in progress

      } catch (error) {
        // If it's the last attempt, throw the error
        if (attempt === maxAttempts - 1) {
          throw error;
        }

        // For other attempts, continue polling (might be temporary network issue)
      }
    }

    throw new PollingTimeoutError(
      `Polling timeout after ${maxAttempts} attempts. Resource may still be processing.`,
      { maxAttempts, intervalMs }
    );
  }

  private extractPathFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      // If URL parsing fails, assume it's already a path
      return url.startsWith('/') ? url : `/${url}`;
    }
  }

  private isCompleteResponse(data: any): boolean {
    return data && (
      data.status === 'completed' ||
      data.status === 'issued' ||
      (data.id && data.number && !data.status) // NFE.io completed invoices might not have explicit status
    );
  }

  private isFailedResponse(data: any): boolean {
    return data && (
      data.status === 'failed' ||
      data.status === 'error' ||
      data.error
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --------------------------------------------------------------------------
  // Health Check & Debug
  // --------------------------------------------------------------------------

  /**
   * Check if the client is properly configured and can reach the NFE.io API
   *
   * @returns Health check result with status and optional error details
   *
   * @description
   * Performs a simple API request to verify connectivity and authentication.
   * Useful for debugging connection issues or validating client configuration.
   *
   * @example
   * ```typescript
   * const health = await nfe.healthCheck();
   *
   * if (health.status === 'ok') {
   *   console.log('API connection successful!');
   * } else {
   *   console.error('API connection failed:', health.details);
   * }
   * ```
   *
   * @example In application startup
   * ```typescript
   * async function initializeApp() {
   *   const nfe = new NfeClient({ apiKey: process.env.NFE_API_KEY });
   *
   *   const health = await nfe.healthCheck();
   *   if (health.status !== 'ok') {
   *     throw new Error(`NFE.io API is not reachable: ${health.details?.error}`);
   *   }
   *
   *   console.log('NFE.io SDK initialized successfully');
   * }
   * ```
   */
  public async healthCheck(): Promise<{ status: 'ok' | 'error', details?: any }> {
    try {
      // Try to make a simple request (get companies list with pageCount=1)
      await this.getMainHttpClient().get('/companies', { pageCount: 1 });
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'error',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          config: {
            baseUrl: this.config.baseUrl,
            environment: this.config.environment,
            hasApiKey: !!this.config.apiKey,
          }
        }
      };
    }
  }

  /**
   * Get client information for debugging and diagnostics
   *
   * @returns Client diagnostic information
   *
   * @description
   * Returns comprehensive information about the current SDK instance,
   * useful for bug reports and troubleshooting.
   *
   * @example
   * ```typescript
   * const info = nfe.getClientInfo();
   * console.log('SDK Version:', info.version);
   * console.log('Node Version:', info.nodeVersion);
   * console.log('Environment:', info.environment);
   * console.log('Base URL:', info.baseUrl);
   * ```
   *
   * @example In error reporting
   * ```typescript
   * try {
   *   await nfe.serviceInvoices.create(companyId, data);
   * } catch (error) {
   *   const info = nfe.getClientInfo();
   *   console.error('Error context:', {
   *     error: error.message,
   *     sdkInfo: info
   *   });
   * }
   * ```
   */
  public getClientInfo(): {
    version: string;
    nodeVersion: string;
    environment: string;
    baseUrl: string;
    hasApiKey: boolean;
  } {
    return {
      version: '3.0.0-beta.1', // TODO: Read from package.json
      nodeVersion: this.getNodeVersion(),
      environment: this.config.environment,
      baseUrl: this.config.baseUrl,
      hasApiKey: !!this.config.apiKey,
    };
  }
}

// ============================================================================
// Factory Functions (maintain v2 compatibility)
// ============================================================================

/**
 * Create NFE.io client instance using factory function
 *
 * @param apiKey - API key string or full configuration object
 * @param _version - API version (ignored in v3, maintained for v2 compatibility)
 * @returns Configured NfeClient instance
 *
 * @description
 * Factory function for creating NFE.io client instances. Maintains v2 API compatibility
 * while providing modern TypeScript support.
 *
 * @example String API key
 * ```typescript
 * const nfe = createNfeClient('your-api-key');
 * ```
 *
 * @example Configuration object
 * ```typescript
 * const nfe = createNfeClient({
 *   apiKey: 'your-api-key',
 *   environment: 'sandbox',
 *   timeout: 60000
 * });
 * ```
 *
 * @example v2 compatibility
 * ```typescript
 * // v2 style (still works)
 * const nfe = createNfeClient('your-api-key');
 * ```
 */
export function createNfeClient(apiKey: string | NfeConfig): NfeClient {
  const config = typeof apiKey === 'string' ? { apiKey } : apiKey;
  return new NfeClient(config);
}

/**
 * Default export factory function for CommonJS compatibility
 *
 * @param apiKey - API key string or full configuration object
 * @returns Configured NfeClient instance
 *
 * @description
 * Default export maintains v2 API compatibility for CommonJS users.
 * Equivalent to `createNfeClient()`.
 *
 * @example ES Modules
 * ```typescript
 * import nfe from '@nfe-io/sdk';
 * const client = nfe('your-api-key');
 * ```
 *
 * @example CommonJS
 * ```javascript
 * const nfe = require('@nfe-io/sdk').default;
 * const client = nfe('your-api-key');
 * ```
 */
export default function nfe(apiKey: string | NfeConfig): NfeClient {
  return createNfeClient(apiKey);
}

// ============================================================================
// Version Constants
// ============================================================================

/**
 * Current SDK version
 * @constant
 */
export const VERSION = '3.0.0-beta.1';

/**
 * Supported Node.js version range (semver format)
 * @constant
 */
export const SUPPORTED_NODE_VERSIONS = '>=18.0.0';

/**
 * Default request timeout in milliseconds
 * @constant
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * Default number of retry attempts for failed requests
 * @constant
 */
export const DEFAULT_RETRY_ATTEMPTS = 3;
