/**
 * NFE.io SDK v3 - Main Client
 * 
 * Modern TypeScript client for NFE.io API with zero runtime dependencies
 * Compatible with Node.js 18+ and any JavaScript environment
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
import { ServiceInvoicesResource, CompaniesResource } from './resources/index.js';

// ============================================================================
// Main NFE.io Client
// ============================================================================

export class NfeClient {
  private readonly http: HttpClient;
  private readonly config: RequiredNfeConfig;

  // Public resource interfaces (maintain v2 naming convention)
  public readonly serviceInvoices: ServiceInvoicesResource;
  public readonly companies: CompaniesResource;
  // public readonly legalPeople: LegalPeopleResource;
  // public readonly naturalPeople: NaturalPeopleResource;
  // public readonly webhooks: WebhooksResource;

  constructor(config: NfeConfig) {
    // Validate and normalize configuration
    this.config = this.validateAndNormalizeConfig(config);
    
    // Validate Node.js environment
    this.validateEnvironment();
    
    // Create HTTP client
    const httpConfig = buildHttpConfig(
      this.config.apiKey,
      this.getBaseUrl(),
      this.config.timeout,
      this.config.retryConfig
    );
    this.http = new HttpClient(httpConfig);

    // Initialize resources
    this.serviceInvoices = new ServiceInvoicesResource(this.http);
    this.companies = new CompaniesResource(this.http);
    // this.legalPeople = new LegalPeopleResource(this.http);
    // this.naturalPeople = new NaturalPeopleResource(this.http);
    // this.webhooks = new WebhooksResource(this.http);
  }

  // --------------------------------------------------------------------------
  // Configuration Management
  // --------------------------------------------------------------------------

  private validateAndNormalizeConfig(config: NfeConfig): RequiredNfeConfig {
    if (!config.apiKey) {
      // Try to get from environment variable
      const envApiKey = this.getEnvironmentVariable('NFE_API_KEY');
      if (!envApiKey) {
        throw ErrorFactory.fromMissingApiKey();
      }
      config.apiKey = envApiKey;
    }

    // Normalize environment
    const environment = config.environment || 'production';
    if (!['production', 'sandbox'].includes(environment)) {
      throw new ConfigurationError(
        `Invalid environment: ${environment}. Must be 'production' or 'sandbox'.`,
        { environment }
      );
    }

    // Set defaults
    const normalizedConfig: RequiredNfeConfig = {
      apiKey: config.apiKey,
      environment,
      baseUrl: config.baseUrl || this.getDefaultBaseUrl(environment),
      timeout: config.timeout || 30000,
      retryConfig: config.retryConfig || createDefaultRetryConfig(),
    };

    return normalizedConfig;
  }

  private getDefaultBaseUrl(environment: 'production' | 'sandbox'): string {
    const baseUrls = {
      production: 'https://api.nfe.io/v1',
      sandbox: 'https://api-sandbox.nfe.io/v1', // Adjust if sandbox exists
    };
    return baseUrls[environment];
  }

  private getBaseUrl(): string {
    return this.config.baseUrl;
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
   * Update client configuration
   */
  public updateConfig(newConfig: Partial<NfeConfig>): void {
    const mergedConfig = { ...this.config, ...newConfig };
    const normalizedConfig = this.validateAndNormalizeConfig(mergedConfig);
    
    // Update internal config
    Object.assign(this.config, normalizedConfig);
    
    // Recreate HTTP client with new config
    const httpConfig = buildHttpConfig(
      this.config.apiKey,
      this.getBaseUrl(),
      this.config.timeout,
      this.config.retryConfig
    );
    Object.assign(this.http, new HttpClient(httpConfig));
  }

  /**
   * Set timeout for requests (maintains v2 compatibility)
   */
  public setTimeout(timeout: number): void {
    this.updateConfig({ timeout });
  }

  /**
   * Set API key (maintains v2 compatibility)
   */
  public setApiKey(apiKey: string): void {
    this.updateConfig({ apiKey });
  }

  /**
   * Get current configuration (readonly)
   */
  public getConfig(): Readonly<RequiredNfeConfig> {
    return { ...this.config };
  }

  // --------------------------------------------------------------------------
  // Polling Utility (for async invoice processing)
  // --------------------------------------------------------------------------

  /**
   * Poll a resource until completion or timeout
   * This is critical for NFE.io's async invoice processing (202 responses)
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
        const response = await this.http.get<any>(path);
        
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
   * Check if the client is properly configured and can reach the API
   */
  public async healthCheck(): Promise<{ status: 'ok' | 'error', details?: any }> {
    try {
      // Try to make a simple request (get companies list with pageCount=1)
      await this.http.get('/companies', { pageCount: 1 });
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
   * Get client information for debugging
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
 * Create NFE.io client instance (maintains v2 compatibility)
 * @param apiKey API key or full config object
 * @param version Ignored in v3 (maintained for compatibility)
 */
export function createNfeClient(apiKey: string | NfeConfig, _version?: string): NfeClient {
  const config = typeof apiKey === 'string' ? { apiKey } : apiKey;
  return new NfeClient(config);
}

/**
 * Default export factory function (maintains v2 compatibility)
 */
export default function nfe(apiKey: string | NfeConfig, _version?: string): NfeClient {
  return createNfeClient(apiKey, _version);
}

// ============================================================================
// Version Constants
// ============================================================================

export const VERSION = '3.0.0-beta.1';
export const SUPPORTED_NODE_VERSIONS = '>=18.0.0';
export const DEFAULT_TIMEOUT = 30000;
export const DEFAULT_RETRY_ATTEMPTS = 3;