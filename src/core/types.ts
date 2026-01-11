/**
 * NFE.io SDK v3 - Core Types
 *
 * TypeScript definitions for NFE.io API v1
 *
 * This file re-exports generated types and adds SDK-specific types
 * for configuration, HTTP client, and high-level operations.
 */

// ============================================================================
// Generated Types (from OpenAPI specs)
// ============================================================================

export type {
  // Main entity types
  ServiceInvoice,
  Company,
  LegalPerson,
  NaturalPerson,
} from '../generated/index.js';

// Type aliases for convenience
export type { ServiceInvoice as ServiceInvoiceData } from '../generated/index.js';
export type { Company as CompanyData } from '../generated/index.js';
export type { LegalPerson as LegalPersonData } from '../generated/index.js';
export type { NaturalPerson as NaturalPersonData } from '../generated/index.js';

// ============================================================================
// SDK-Specific Types (not in generated code)
// ============================================================================

// Configuration Types
// ----------------------------------------------------------------------------

export interface NfeConfig {
  /** NFE.io API Key (required) */
  apiKey: string;
  /** Environment to use (both use same endpoint, differentiated by API key) */
  environment?: 'production' | 'development';
  /** Custom base URL (overrides environment) */
  baseUrl?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retryConfig?: RetryConfig;
}

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay between retries in milliseconds */
  baseDelay: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay?: number;
  /** Backoff multiplier */
  backoffMultiplier?: number;
}

// HTTP Types
// ----------------------------------------------------------------------------

export interface HttpConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryConfig: RetryConfig;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface AsyncResponse {
  code: 202;
  status: 'pending';
  location: string;
}

// Backward Compatibility Type Aliases
// ----------------------------------------------------------------------------

/** Additional invoice details (withholdings, deductions) */
export type ServiceInvoiceDetails = {
  issWithheld?: number;
  pisWithheld?: number;
  cofinsWithheld?: number;
  csllWithheld?: number;
  irrfWithheld?: number;
  inssWithheld?: number;
  deductions?: number;
  additionalInformation?: string;
};

// Entity Type Aliases (from generated enums)
// ----------------------------------------------------------------------------

export type EntityType = 'Undefined' | 'NaturalPerson' | 'LegalEntity';
export type TaxRegime = 'Isento' | 'MicroempreendedorIndividual' | 'SimplesNacional' | 'LucroPresumido' | 'LucroReal';
export type SpecialTaxRegime = 'Automatico' | 'Nenhum' | 'MicroempresaMunicipal' | 'Estimativa' | 'SociedadeDeProfissionais' | 'Cooperativa' | 'MicroempreendedorIndividual' | 'MicroempresarioEmpresaPequenoPorte';







// ============================================================================
// Webhook Types
// ============================================================================

export interface Webhook {
  /** Webhook ID */
  id?: string;
  /** Target URL */
  url: string;
  /** Webhook events */
  events: WebhookEvent[];
  /** Is active */
  active?: boolean;
  /** Secret for signature validation */
  secret?: string;
  /** Creation timestamp */
  createdOn?: string;
  /** Last update timestamp */
  modifiedOn?: string;
}

export type WebhookEvent = 'invoice.created' | 'invoice.issued' | 'invoice.cancelled' | 'invoice.failed';

// ============================================================================
// API Response Types
// ============================================================================

export interface ListResponse<T> {
  /** Response data array */
  data: T[];
  /** Total count (if available) */
  totalCount?: number;
  /** Page information */
  page?: PageInfo;
}

export interface PageInfo {
  /** Current page index */
  pageIndex: number;
  /** Items per page */
  pageCount: number;
  /** Has next page */
  hasNext?: boolean;
  /** Has previous page */
  hasPrevious?: boolean;
}

export interface PaginationOptions extends Record<string, unknown> {
  /** Page index (0-based) */
  pageIndex?: number;
  /** Items per page */
  pageCount?: number;
}

// ============================================================================
// Polling Types
// ============================================================================

export interface PollOptions {
  /** Maximum number of polling attempts */
  maxAttempts?: number;
  /** Interval between attempts in milliseconds */
  intervalMs?: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type RequiredNfeConfig = Required<NfeConfig>;

/** Extract resource ID from response or input */
export type ResourceId = string;

/** Generic API error response */
export interface ApiErrorResponse {
  code: number;
  message: string;
  details?: unknown;
}
