/**
 * NFE.io SDK v3 - Core Types
 *
 * TypeScript definitions for NFE.io API v1
 * Based on current v2 SDK and OpenAPI specs
 */

// ============================================================================
// Configuration Types
// ============================================================================

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

// ============================================================================
// HTTP Types
// ============================================================================

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

// ============================================================================
// Address Types
// ============================================================================

export interface Address {
  /** Country code (always 'BRA' for Brazil) */
  country: string;
  /** Postal code (CEP) */
  postalCode?: string;
  /** Street address */
  street: string;
  /** Address number */
  number?: string;
  /** Additional information (complement) */
  additionalInformation?: string;
  /** District/neighborhood */
  district?: string;
  /** City information */
  city?: City;
  /** State abbreviation */
  state?: string;
}

export interface City {
  /** IBGE city code */
  code: string;
  /** City name */
  name: string;
}

// ============================================================================
// Entity Types (Companies, People)
// ============================================================================

export type EntityType = 'NaturalPerson' | 'LegalEntity';
export type TaxRegime = 'Isento' | 'MicroempreendedorIndividual' | 'SimplesNacional' | 'LucroPresumido' | 'LucroReal';
export type SpecialTaxRegime = 'Automatico' | 'Nenhum' | 'MicroempresaMunicipal' | 'Estimativa' | 'SociedadeDeProfissionais' | 'Cooperativa' | 'MicroempreendedorIndividual' | 'MicroempresarioEmpresaPequenoPorte';

export interface Company {
  /** Company ID */
  id?: string;
  /** Company name / Razão Social */
  name: string;
  /** Trade name / Nome fantasia */
  tradeName?: string;
  /** Federal tax number (CNPJ/CPF) */
  federalTaxNumber: number;
  /** Municipal tax number (CCM) */
  municipalTaxNumber?: string;
  /** Email address */
  email?: string;
  /** Opening date */
  openingDate?: string;
  /** Tax regime */
  taxRegime: TaxRegime;
  /** Special tax regime */
  specialTaxRegime?: SpecialTaxRegime;
  /** Legal nature */
  legalNature?: string;
  /** Company address */
  address: Address;
  /** Creation timestamp */
  createdOn?: string;
  /** Last update timestamp */
  modifiedOn?: string;
}

export interface LegalPerson {
  /** Person ID */
  id?: string;
  /** Company ID (scope) */
  companyId?: string;
  /** Company name / Razão Social */
  name: string;
  /** Trade name / Nome fantasia */
  tradeName?: string;
  /** Federal tax number (CNPJ) */
  federalTaxNumber: number;
  /** Municipal tax number */
  municipalTaxNumber?: string;
  /** Email address */
  email?: string;
  /** Address */
  address: Address;
  /** Creation timestamp */
  createdOn?: string;
  /** Last update timestamp */
  modifiedOn?: string;
}

export interface NaturalPerson {
  /** Person ID */
  id?: string;
  /** Company ID (scope) */
  companyId?: string;
  /** Full name */
  name: string;
  /** Federal tax number (CPF) */
  federalTaxNumber: number;
  /** Email address */
  email?: string;
  /** Address */
  address: Address;
  /** Creation timestamp */
  createdOn?: string;
  /** Last update timestamp */
  modifiedOn?: string;
}

// ============================================================================
// Service Invoice Types
// ============================================================================

export interface ServiceInvoiceData {
  /** Municipal service code */
  cityServiceCode: string;
  /** Service description */
  description: string;
  /** Total services amount */
  servicesAmount: number;
  /** Borrower (recipient) information */
  borrower: ServiceInvoiceBorrower;
  /** Additional invoice details */
  details?: ServiceInvoiceDetails;
}

export interface ServiceInvoiceBorrower {
  /** Borrower type */
  type: EntityType;
  /** Federal tax number (CPF/CNPJ) */
  federalTaxNumber: number;
  /** Full name or company name */
  name: string;
  /** Email for invoice delivery */
  email: string;
  /** Borrower address */
  address: Address;
}

export interface ServiceInvoiceDetails {
  /** ISS withholding */
  issWithheld?: number;
  /** PIS withholding */
  pisWithheld?: number;
  /** COFINS withholding */
  cofinsWithheld?: number;
  /** CSLL withholding */
  csllWithheld?: number;
  /** IRRF withholding */
  irrfWithheld?: number;
  /** INSS withholding */
  inssWithheld?: number;
  /** Deductions */
  deductions?: number;
  /** Additional information */
  additionalInformation?: string;
}

export interface ServiceInvoice {
  /** Invoice ID */
  id: string;
  /** Company ID */
  companyId: string;
  /** Invoice number */
  number?: string;
  /** Verification code */
  verificationCode?: string;
  /** Invoice status */
  status: ServiceInvoiceStatus;
  /** Municipal service code */
  cityServiceCode: string;
  /** Service description */
  description: string;
  /** Total services amount */
  servicesAmount: number;
  /** Borrower information */
  borrower: ServiceInvoiceBorrower;
  /** Invoice details */
  details?: ServiceInvoiceDetails;
  /** PDF download URL */
  pdfUrl?: string;
  /** XML download URL */
  xmlUrl?: string;
  /** Creation timestamp */
  createdOn: string;
  /** Last update timestamp */
  modifiedOn?: string;
  /** Issue date */
  issuedOn?: string;
}

export type ServiceInvoiceStatus = 'pending' | 'processing' | 'issued' | 'cancelled' | 'failed';

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
