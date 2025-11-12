/**
 * @fileoverview NFE.io SDK v3 - Official Node.js SDK for NFE.io API
 * 
 * @description
 * Modern TypeScript SDK for NFE.io API with zero runtime dependencies.
 * Compatible with Node.js 18+ and modern JavaScript runtimes.
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
 * // Create a service invoice
 * const invoice = await nfe.serviceInvoices.create('company-id', {
 *   borrower: { /* ... *\/ },
 *   cityServiceCode: '12345',
 *   servicesAmount: 1000.00
 * });
 * ```
 * 
 * @example With Polling
 * ```typescript
 * // Automatically poll until invoice is processed
 * const invoice = await nfe.serviceInvoices.createAndWait('company-id', data, {
 *   maxAttempts: 30,
 *   interval: 2000
 * });
 * ```
 * 
 * @module @nfe-io/sdk
 * @version 3.0.0-beta.1
 * @author NFE.io
 * @license MIT
 */

// ============================================================================
// Main Exports
// ============================================================================

/**
 * Core client exports
 * 
 * @see {@link NfeClient} - Main client class for NFE.io API
 * @see {@link createNfeClient} - Factory function for creating client instances
 */
export { NfeClient, createNfeClient, VERSION, SUPPORTED_NODE_VERSIONS } from './core/client.js';

/**
 * TypeScript type definitions for NFE.io API entities and configurations
 * 
 * @see {@link NfeConfig} - Client configuration options
 * @see {@link Company} - Company entity type
 * @see {@link ServiceInvoice} - Service invoice entity type
 * @see {@link LegalPerson} - Legal person (empresa) entity type
 * @see {@link NaturalPerson} - Natural person (pessoa física) entity type
 * @see {@link Webhook} - Webhook configuration type
 */
export type {
  // Configuration
  NfeConfig,
  RequiredNfeConfig,
  RetryConfig,
  
  // Entities
  Company,
  LegalPerson,
  NaturalPerson,
  ServiceInvoice,
  ServiceInvoiceData,
  ServiceInvoiceBorrower,
  ServiceInvoiceDetails,
  ServiceInvoiceStatus,
  Webhook,
  WebhookEvent,
  
  // Common types
  Address,
  City,
  EntityType,
  TaxRegime,
  SpecialTaxRegime,
  
  // HTTP and pagination
  HttpResponse,
  ListResponse,
  PageInfo,
  PaginationOptions,
  PollOptions,
  
  // Utility types
  ResourceId,
  ApiErrorResponse,
} from './core/types.js';

/**
 * Error classes and utilities for comprehensive error handling
 * 
 * @see {@link NfeError} - Base error class for all SDK errors
 * @see {@link AuthenticationError} - Thrown when API key is invalid (401)
 * @see {@link ValidationError} - Thrown when request validation fails (400, 422)
 * @see {@link NotFoundError} - Thrown when resource not found (404)
 * @see {@link RateLimitError} - Thrown when rate limit exceeded (429)
 * @see {@link ServerError} - Thrown on server errors (500, 502, 503)
 * @see {@link ConnectionError} - Thrown on network/connection failures
 * @see {@link TimeoutError} - Thrown when request times out
 * @see {@link PollingTimeoutError} - Thrown when invoice polling times out
 */
export {
  // Base error
  NfeError,
  
  // HTTP errors
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  
  // Connection errors
  ConnectionError,
  TimeoutError,
  
  // SDK errors
  ConfigurationError,
  PollingTimeoutError,
  InvoiceProcessingError,
  
  // Error factory
  ErrorFactory,
  
  // Type guards
  isNfeError,
  isAuthenticationError,
  isValidationError,
  isNotFoundError,
  isConnectionError,
  isTimeoutError,
  isPollingTimeoutError,
  
  // Legacy aliases (v2 compatibility)
  BadRequestError,
  APIError,
  InternalServerError,
  
  // Error types
  ErrorTypes,
  type ErrorType,
} from './core/errors/index.js';

// ============================================================================
// Default Export (maintains v2 compatibility)
// ============================================================================

/**
 * Default export for CommonJS compatibility
 * 
 * @description
 * Allows both ES modules and CommonJS usage:
 * 
 * @example ES Modules
 * ```typescript
 * import { NfeClient } from '@nfe-io/sdk';
 * const nfe = new NfeClient({ apiKey: 'xxx' });
 * ```
 * 
 * @example ES Modules (default import)
 * ```typescript
 * import nfeFactory from '@nfe-io/sdk';
 * const nfe = nfeFactory({ apiKey: 'xxx' });
 * ```
 * 
 * @example CommonJS
 * ```javascript
 * const { NfeClient } = require('@nfe-io/sdk');
 * const nfe = new NfeClient({ apiKey: 'xxx' });
 * ```
 * 
 * @example CommonJS (default require)
 * ```javascript
 * const nfeFactory = require('@nfe-io/sdk').default;
 * const nfe = nfeFactory({ apiKey: 'xxx' });
 * ```
 */
import nfeFactory from './core/client.js';
export default nfeFactory;

// ============================================================================
// Package Information
// ============================================================================

/**
 * NPM package name
 * @constant
 */
export const PACKAGE_NAME = '@nfe-io/sdk';

/**
 * Current SDK version
 * @constant
 */
export const PACKAGE_VERSION = '3.0.0-beta.1';

/**
 * NFE.io API version supported by this SDK
 * @constant
 */
export const API_VERSION = 'v1';

/**
 * GitHub repository URL
 * @constant
 */
export const REPOSITORY_URL = 'https://github.com/nfe/client-nodejs';

/**
 * Official NFE.io API documentation URL
 * @constant
 */
export const DOCUMENTATION_URL = 'https://nfe.io/docs';

// ============================================================================
// Environment Detection & Utilities
// ============================================================================

/**
 * Check if the current environment supports NFE.io SDK v3 requirements
 * 
 * @description
 * Validates that the runtime environment has all necessary features:
 * - Node.js 18+ (for native fetch support)
 * - Fetch API availability
 * - AbortController availability
 * 
 * @returns Object containing support status and detected issues
 * 
 * @example
 * ```typescript
 * const check = isEnvironmentSupported();
 * if (!check.supported) {
 *   console.error('Environment issues:', check.issues);
 *   console.error('Node version:', check.nodeVersion);
 * }
 * ```
 */
export function isEnvironmentSupported(): {
  /** Whether all requirements are met */
  supported: boolean;
  /** Detected Node.js version (e.g., "v18.17.0") */
  nodeVersion?: string;
  /** Whether Fetch API is available */
  hasFetch: boolean;
  /** Whether AbortController is available */
  hasAbortController: boolean;
  /** List of detected compatibility issues */
  issues: string[];
} {
  const issues: string[] = [];
  let nodeVersion: string | undefined;
  
  // Check Node.js version
  try {
    nodeVersion = (globalThis as any).process?.version;
    if (nodeVersion) {
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]!);
      if (majorVersion < 18) {
        issues.push(`Node.js ${majorVersion} is not supported. Requires Node.js 18+.`);
      }
    }
  } catch {
    issues.push('Unable to detect Node.js version');
  }
  
  // Check fetch support
  const hasFetch = typeof fetch !== 'undefined';
  if (!hasFetch) {
    issues.push('Fetch API not available');
  }
  
  // Check AbortController support
  const hasAbortController = typeof AbortController !== 'undefined';
  if (!hasAbortController) {
    issues.push('AbortController not available');
  }
  
  const result: {
    supported: boolean;
    nodeVersion?: string;
    hasFetch: boolean;
    hasAbortController: boolean;
    issues: string[];
  } = {
    supported: issues.length === 0,
    hasFetch,
    hasAbortController,
    issues,
  };
  
  if (nodeVersion) {
    result.nodeVersion = nodeVersion;
  }
  
  return result;
}

/**
 * Get comprehensive SDK runtime information
 * 
 * @description
 * Returns detailed information about the current runtime environment,
 * useful for debugging and support.
 * 
 * @returns Object containing SDK and runtime environment information
 * 
 * @example
 * ```typescript
 * const info = getRuntimeInfo();
 * console.log('SDK Version:', info.sdkVersion);
 * console.log('Node Version:', info.nodeVersion);
 * console.log('Platform:', info.platform);
 * console.log('Environment:', info.environment);
 * ```
 */
export function getRuntimeInfo(): {
  /** Current SDK version */
  sdkVersion: string;
  /** Node.js version (e.g., "v18.17.0") */
  nodeVersion: string;
  /** Operating system platform (e.g., "linux", "darwin", "win32") */
  platform: string;
  /** CPU architecture (e.g., "x64", "arm64") */
  arch: string;
  /** Runtime environment type */
  environment: 'node' | 'browser' | 'unknown';
} {
  let nodeVersion = 'unknown';
  let platform = 'unknown';
  let arch = 'unknown';
  let environment: 'node' | 'browser' | 'unknown' = 'unknown';
  
  try {
    const process = (globalThis as any).process;
    if (process) {
      nodeVersion = process.version || 'unknown';
      platform = process.platform || 'unknown';
      arch = process.arch || 'unknown';
      environment = 'node';
    } else if (typeof window !== 'undefined') {
      environment = 'browser';
      platform = navigator.platform || 'unknown';
    }
  } catch {
    // Safe fallback
  }
  
  return {
    sdkVersion: PACKAGE_VERSION,
    nodeVersion,
    platform,
    arch,
    environment,
  };
}

// ============================================================================
// Quick Start Helpers
// ============================================================================

/**
 * Create NFE.io client from environment variable
 * 
 * @description
 * Convenience function that reads API key from NFE_API_KEY environment variable.
 * Useful for serverless functions and quick prototyping.
 * 
 * @param environment - Target environment ('production' or 'sandbox')
 * @returns Configured NfeClient instance
 * @throws {ConfigurationError} If NFE_API_KEY environment variable is not set
 * 
 * @example
 * ```typescript
 * // Set environment variable: NFE_API_KEY=your-api-key
 * const nfe = createClientFromEnv('production');
 * 
 * // Use the client normally
 * const companies = await nfe.companies.list();
 * ```
 * 
 * @example Docker/Kubernetes
 * ```yaml
 * env:
 *   - name: NFE_API_KEY
 *     valueFrom:
 *       secretKeyRef:
 *         name: nfe-credentials
 *         key: api-key
 * ```
 */
export function createClientFromEnv(environment?: 'production' | 'sandbox') {
  const apiKey = (globalThis as any).process?.env?.NFE_API_KEY;
  if (!apiKey) {
    const { ConfigurationError } = require('./core/errors');
    throw new ConfigurationError(
      'NFE_API_KEY environment variable is required when using createClientFromEnv()'
    );
  }
  
  const { NfeClient } = require('./core/client');
  return new NfeClient({ 
    apiKey, 
    environment: environment || 'production' 
  });
}

/**
 * Validate NFE.io API key format
 * 
 * @description
 * Performs basic validation on API key format before attempting to use it.
 * Helps catch common mistakes like missing keys or keys with whitespace.
 * 
 * @param apiKey - The API key to validate
 * @returns Validation result with any detected issues
 * 
 * @example
 * ```typescript
 * const result = validateApiKeyFormat('my-api-key');
 * if (!result.valid) {
 *   console.error('API key issues:', result.issues);
 *   // ["API key appears to be too short"]
 * }
 * ```
 * 
 * @example Integration with client
 * ```typescript
 * const apiKey = process.env.NFE_API_KEY;
 * const validation = validateApiKeyFormat(apiKey);
 * 
 * if (!validation.valid) {
 *   throw new Error(`Invalid API key: ${validation.issues.join(', ')}`);
 * }
 * 
 * const nfe = new NfeClient({ apiKey });
 * ```
 */
export function validateApiKeyFormat(apiKey: string): {
  /** Whether the API key passes basic validation */
  valid: boolean;
  /** List of validation issues found */
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!apiKey) {
    issues.push('API key is required');
  } else {
    if (apiKey.length < 10) {
      issues.push('API key appears to be too short');
    }
    
    if (apiKey.includes(' ')) {
      issues.push('API key should not contain spaces');
    }
    
    // Add more validation rules as needed
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}