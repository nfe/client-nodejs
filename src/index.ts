/**
 * NFE.io SDK v3 - Main Entry Point
 * 
 * Modern TypeScript SDK for NFE.io API with zero runtime dependencies
 * Compatible with Node.js 18+ and any JavaScript runtime
 */

// ============================================================================
// Main Exports
// ============================================================================

// Core client
export { NfeClient, createNfeClient, VERSION, SUPPORTED_NODE_VERSIONS } from './core/client.js';

// Types
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

// Error classes
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

// Allow both ES modules and CommonJS usage:
// import nfe from '@nfe-io/sdk'
// const nfe = require('@nfe-io/sdk')
import nfeFactory from './core/client.js';
export default nfeFactory;

// ============================================================================
// Package Information
// ============================================================================

export const PACKAGE_NAME = '@nfe-io/sdk';
export const PACKAGE_VERSION = '3.0.0-beta.1';
export const API_VERSION = 'v1';
export const REPOSITORY_URL = 'https://github.com/nfe/client-nodejs';
export const DOCUMENTATION_URL = 'https://nfe.io/docs';

// ============================================================================
// Environment Detection & Utilities
// ============================================================================

/**
 * Check if the current environment supports NFE.io SDK v3
 */
export function isEnvironmentSupported(): {
  supported: boolean;
  nodeVersion?: string;
  hasFetch: boolean;
  hasAbortController: boolean;
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
 * Get SDK runtime information
 */
export function getRuntimeInfo(): {
  sdkVersion: string;
  nodeVersion: string;
  platform: string;
  arch: string;
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
 * Quick start: Create client from environment variable
 * Reads NFE_API_KEY from environment variables
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
 * Quick start: Validate API key format
 */
export function validateApiKeyFormat(apiKey: string): {
  valid: boolean;
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