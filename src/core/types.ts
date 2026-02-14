/**
 * NFE.io SDK v3 - Core Types
 *
 * TypeScript definitions for NFE.io API v1
 *
 * This file re-exports generated types and adds SDK-specific types
 * for configuration, HTTP client, and high-level operations.
 */

// ============================================================================
// SDK-Specific Types (not in generated code)
// ============================================================================

// Configuration Types
// ----------------------------------------------------------------------------

export interface NfeConfig {
  /** NFE.io API Key for main resources (companies, invoices, etc.) */
  apiKey?: string;
  /** NFE.io API Key for data/query services: Addresses, CT-e, CNPJ, CPF (optional, falls back to apiKey) */
  dataApiKey?: string;
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

// Service Invoice Specific Types
// ----------------------------------------------------------------------------

/** Flow status for service invoice processing */
export type FlowStatus =
  | 'CancelFailed'
  | 'IssueFailed'
  | 'Issued'
  | 'Cancelled'
  | 'PullFromCityHall'
  | 'WaitingCalculateTaxes'
  | 'WaitingDefineRpsNumber'
  | 'WaitingSend'
  | 'WaitingSendCancel'
  | 'WaitingReturn'
  | 'WaitingDownload';

/** Terminal states that end async processing */
export const TERMINAL_FLOW_STATES: FlowStatus[] = [
  'Issued',
  'IssueFailed',
  'Cancelled',
  'CancelFailed',
];

/** Check if a flow status is terminal (ends processing) */
export function isTerminalFlowStatus(status: FlowStatus): boolean {
  return TERMINAL_FLOW_STATES.includes(status);
}

/** Async response with extracted invoice ID */
export interface ServiceInvoiceAsyncResponse extends AsyncResponse {
  /** Invoice ID extracted from location header */
  invoiceId: string;
}

/** Options for listing service invoices */
export interface ListServiceInvoicesOptions extends PaginationOptions {
  /** Filter by issued date start (yyyy-MM-dd) */
  issuedBegin?: string;
  /** Filter by issued date end (yyyy-MM-dd) */
  issuedEnd?: string;
  /** Filter by created date start (yyyy-MM-dd) */
  createdBegin?: string;
  /** Filter by created date end (yyyy-MM-dd) */
  createdEnd?: string;
  /** Include totals in response */
  hasTotals?: boolean;
}

/** Options for automatic polling in createAndWait */
export interface PollingOptions {
  /** Total timeout in milliseconds @default 120000 (2 minutes) */
  timeout?: number;
  /** Initial delay before first poll @default 1000 (1 second) */
  initialDelay?: number;
  /** Maximum delay between polls @default 10000 (10 seconds) */
  maxDelay?: number;
  /** Backoff multiplier for exponential backoff @default 1.5 */
  backoffFactor?: number;
  /** Callback invoked after each poll attempt */
  onPoll?: (attempt: number, flowStatus: FlowStatus) => void;
}

/** Response from sendEmail operation */
export interface SendEmailResponse {
  /** Whether email was sent successfully */
  sent: boolean;
  /** Optional message about the send operation */
  message?: string;
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
// Address Types (for Address Lookup API)
// ============================================================================

/**
 * City information with IBGE code
 */
export interface AddressCity {
  /** IBGE city code */
  code: string;
  /** City name */
  name: string;
}

/**
 * Complete address information from Correios DNE
 */
export interface Address {
  /** State abbreviation (e.g., 'SP', 'RJ') */
  state: string;
  /** City information with IBGE code */
  city: AddressCity;
  /** District/neighborhood name */
  district: string;
  /** Additional address information */
  additionalInformation: string;
  /** Street type suffix (e.g., 'Avenida', 'Rua') */
  streetSuffix: string;
  /** Street name */
  street: string;
  /** Address number */
  number: string;
  /** Minimum number in range */
  numberMin: string;
  /** Maximum number in range */
  numberMax: string;
  /** Postal code (CEP) */
  postalCode: string;
  /** Country code */
  country: string;
}

/**
 * Response from address lookup endpoints
 */
export interface AddressLookupResponse {
  /** Array of matching addresses */
  addresses: Address[];
}

/**
 * Options for address search
 */
export interface AddressSearchOptions {
  /** OData filter expression (e.g., "city eq 'São Paulo'") */
  filter?: string;
}

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

/**
 * Internal normalized configuration after processing NfeConfig.
 * API keys remain optional since validation is done lazily when resources are accessed.
 */
export interface RequiredNfeConfig {
  /** Main API key (may be undefined if only using data services) */
  apiKey: string | undefined;
  /** Data API key for query services: Addresses, CT-e, CNPJ, CPF (may be undefined, will fallback to apiKey) */
  dataApiKey: string | undefined;
  /** Environment */
  environment: 'production' | 'development';
  /** Base URL for main API */
  baseUrl: string;
  /** Request timeout */
  timeout: number;
  /** Retry configuration */
  retryConfig: Required<RetryConfig>;
}

/** Extract resource ID from response or input */
export type ResourceId = string;

/** Generic API error response */
export interface ApiErrorResponse {
  code: number;
  message: string;
  details?: unknown;
}

// ============================================================================
// Service Invoice Type Exports from Generated Schema
// ============================================================================

// Import the operations type from generated spec
import type { operations } from '../generated/nf-servico-v1.js';

// Re-export ServiceInvoice operation types for convenience
export type ServiceInvoicesGetOperation = operations['ServiceInvoices_Get'];
export type ServiceInvoicesPostOperation = operations['ServiceInvoices_Post'];
export type ServiceInvoicesGetByIdOperation = operations['ServiceInvoices_idGet'];
export type ServiceInvoicesDeleteOperation = operations['ServiceInvoices_Delete'];
export type ServiceInvoicesSendEmailOperation = operations['ServiceInvoices_SendEmail'];
export type ServiceInvoicesGetPdfOperation = operations['ServiceInvoices_GetDocumentPdf'];
export type ServiceInvoicesGetXmlOperation = operations['ServiceInvoices_GetDocumentXml'];

/**
 * Service Invoice response type (from GET operations)
 * The main type representing a Service Invoice in the system
 */
export type ServiceInvoiceData =
  NonNullable<
    NonNullable<
      ServiceInvoicesGetOperation['responses']['200']['content']['application/json']['serviceInvoices']
    >[number]
  >;

/**
 * Service Invoice creation request body
 * Type for the data sent when creating a new service invoice
 */
export type CreateServiceInvoiceData =
  ServiceInvoicesPostOperation['requestBody']['content']['application/json'];

/**
 * Service Invoice list response
 * Type for the complete list response including metadata
 */
export type ServiceInvoiceListResponse =
  ServiceInvoicesGetOperation['responses']['200']['content']['application/json'];

/**
 * Service Invoice single item response
 * Type for a single invoice retrieval
 */
export type ServiceInvoiceSingleResponse =
  ServiceInvoicesGetByIdOperation['responses']['200']['content']['application/json'];

// Backward compatibility aliases
export type { ServiceInvoiceData as ServiceInvoice };

// TODO: Add proper type exports when implementing other resources
/** Placeholder: Company type - to be properly defined when implementing Companies resource */
export type Company = {
  id?: string;
  name: string;
  federalTaxNumber: number;
  email: string;
  [key: string]: unknown;
};

/** Placeholder: Legal Person type - to be properly defined when implementing LegalPeople resource */
export type LegalPerson = {
  id?: string;
  federalTaxNumber: string;
  name: string;
  [key: string]: unknown;
};

/** Placeholder: Natural Person type - to be properly defined when implementing NaturalPeople resource */
export type NaturalPerson = {
  id?: string;
  federalTaxNumber: string;
  name: string;
  [key: string]: unknown;
};

// ============================================================================
// CT-e (Transportation Invoice) Types
// ============================================================================

// Import the components type from generated spec
import type { components as CteComponents } from '../generated/consulta-cte-v2.js';

/**
 * Transportation Invoice inbound settings
 * Configuration for automatic CT-e search via SEFAZ Distribuição DFe
 */
export type TransportationInvoiceInboundSettings =
  CteComponents['schemas']['DFe.NetCore.Domain.Resources.TransportationInvoiceInboundResource'];

/**
 * Transportation Invoice metadata
 * Metadata of a CT-e document retrieved via Distribuição DFe
 */
export type TransportationInvoiceMetadata =
  CteComponents['schemas']['DFe.NetCore.Domain.Resources.MetadataResource'];

/**
 * Options for enabling automatic CT-e search
 */
export interface EnableTransportationInvoiceOptions {
  /** Start from a specific NSU (Número Sequencial Único) */
  startFromNsu?: number;
  /** Start from a specific date (ISO 8601 format) */
  startFromDate?: string;
}

/**
 * CT-e entity status
 */
export type TransportationInvoiceEntityStatus =
  CteComponents['schemas']['DFe.NetCore.Domain.Enums.EntityStatus'];

/**
 * CT-e metadata resource type
 */
export type TransportationInvoiceMetadataType =
  CteComponents['schemas']['DFe.NetCore.Domain.Enums.MetadataResourceType'];
