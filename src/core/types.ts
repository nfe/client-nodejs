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

// ============================================================================
// Inbound NF-e Distribution Types
// ============================================================================

/**
 * Company reference in inbound document metadata
 */
export interface InboundCompany {
  /** Company ID */
  id: string;
  /** Company CNPJ */
  federalTaxNumber: string;
}

/**
 * Issuer reference in inbound document metadata
 */
export interface InboundIssuer {
  /** Issuer CNPJ */
  federalTaxNumber: string;
  /** Issuer name */
  name: string;
}

/**
 * Buyer reference in inbound document metadata
 */
export interface InboundBuyer {
  /** Buyer CNPJ/CPF */
  federalTaxNumber: string;
  /** Buyer name */
  name: string;
}

/**
 * Transportation entity reference in inbound document metadata
 */
export interface InboundTransportation {
  /** Transportation CNPJ */
  federalTaxNumber: string;
  /** Transportation name */
  name: string;
}

/**
 * Document download links
 */
export interface InboundLinks {
  /** XML download URL */
  xml: string;
  /** PDF download URL */
  pdf: string;
}

/**
 * Product invoice reference (used in webhook v2 responses)
 */
export interface InboundProductInvoice {
  /** Access key of the referenced product invoice */
  accessKey: string;
}

/**
 * Automatic manifesting configuration
 */
export interface AutomaticManifesting {
  /** Minutes to wait before automatic awareness operation */
  minutesToWaitAwarenessOperation: string;
}

/**
 * Inbound invoice metadata (webhook v1 format)
 *
 * Contains details of an NF-e or CT-e document retrieved via Distribuição DFe.
 * Corresponds to the generic endpoint `GET /{access_key}`.
 */
export interface InboundInvoiceMetadata {
  /** Document ID */
  id: string;
  /** Creation timestamp */
  createdOn: string;
  /** 44-digit access key */
  accessKey: string;
  /** Parent document access key (for events) */
  parentAccessKey: string;
  /** Company that received the document */
  company: InboundCompany;
  /** Document issuer */
  issuer: InboundIssuer;
  /** Document buyer */
  buyer: InboundBuyer;
  /** Transportation entity */
  transportation: InboundTransportation;
  /** Download links */
  links: InboundLinks;
  /** XML download URL */
  xmlUrl: string;
  /** Sender CNPJ */
  federalTaxNumberSender: string;
  /** Sender name */
  nameSender: string;
  /** Document type */
  type: string | null;
  /** NSU (Número Sequencial Único) */
  nsu: string;
  /** Parent NSU */
  nsuParent: string;
  /** NF-e number */
  nfeNumber: string;
  /** NF-e serial number */
  nfeSerialNumber: string;
  /** Issue date */
  issuedOn: string;
  /** Document description */
  description: string;
  /** Total invoice amount */
  totalInvoiceAmount: string;
  /** Operation type */
  operationType: string | null;
}

/**
 * Inbound product invoice metadata (webhook v2 format)
 *
 * Extends the base metadata with product invoice references.
 * Corresponds to the `GET /productinvoice/{access_key}` endpoint.
 */
export interface InboundProductInvoiceMetadata extends Omit<InboundInvoiceMetadata, 'nsuParent' | 'nfeSerialNumber' | 'operationType'> {
  /** Referenced product invoices */
  productInvoices: InboundProductInvoice[];
}

/**
 * Inbound NF-e distribution service settings
 *
 * Configuration for automatic NF-e search via SEFAZ Distribuição DFe.
 */
export interface InboundSettings {
  /** Starting NSU for document retrieval */
  startFromNsu: string;
  /** Starting date for document retrieval */
  startFromDate: string;
  /** SEFAZ environment (e.g., Production) */
  environmentSEFAZ: string | null;
  /** Automatic manifesting configuration */
  automaticManifesting: AutomaticManifesting;
  /** Webhook version */
  webhookVersion: string;
  /** Company ID */
  companyId: string;
  /** Service status */
  status: string | null;
  /** Creation timestamp */
  createdOn: string;
  /** Last modification timestamp */
  modifiedOn: string;
}

/**
 * Options for enabling automatic NF-e distribution fetch
 */
export interface EnableInboundOptions {
  /** Starting NSU number */
  startFromNsu?: string;
  /** Starting date (ISO 8601 format) */
  startFromDate?: string;
  /** SEFAZ environment */
  environmentSEFAZ?: string;
  /** Automatic manifesting settings */
  automaticManifesting?: AutomaticManifesting;
  /** Webhook version */
  webhookVersion?: string;
}

/**
 * Manifest event types for Manifestação do Destinatário
 *
 * - `210210` — Ciência da Operação (awareness of the operation)
 * - `210220` — Confirmação da Operação (confirmation of the operation)
 * - `210240` — Operação não Realizada (operation not performed)
 */
export type ManifestEventType = 210210 | 210220 | 210240;

// ============================================================================
// Product Invoice Query Types (consulta-nf)
// ============================================================================

// Enum string unions
// ----------------------------------------------------------------------------

/** Current status of a product invoice (NF-e) */
export type ProductInvoiceStatus = 'unknown' | 'authorized' | 'canceled';

/** Payment type indicator */
export type ProductInvoicePaymentType = 'inCash' | 'term' | 'others';

/** Operation type (incoming/outgoing) */
export type ProductInvoiceOperationType = 'incoming' | 'outgoing';

/** Destination of the operation */
export type ProductInvoiceDestination = 'international_Operation' | 'interstate_Operation' | 'internal_Operation';

/** DANFE print format */
export type ProductInvoicePrintType = 'none' | 'nFeNormalPortrait' | 'nFeNormalLandscape' | 'nFeSimplified' | 'dANFE_NFC_E' | 'dANFE_NFC_E_MSG_ELETRONICA';

/** Invoice issue type (emission contingency modes) */
export type ProductInvoiceIssueType = 'normal' | 'cONTINGENCIA_OFF_LINE_NFC_E' | 'cONTINGENCIA_SVC_RS' | 'cONTINGENCIA_SVC_AN' | 'cONTINGENCIA_FS_DA' | 'cONTINGENCIA_DPEC' | 'cONTINGENCIA_SCAN' | 'cONTINGENCIA_FS_IA';

/** Environment type */
export type ProductInvoiceEnvironmentType = 'production' | 'test';

/** Invoice purpose */
export type ProductInvoicePurposeType = 'normal' | 'complement' | 'adjustment' | 'devolution';

/** Consumer type */
export type ProductInvoiceConsumerType = 'normal' | 'finalConsumer';

/** Buyer presence indicator */
export type ProductInvoicePresenceType = 'none' | 'presence' | 'internet' | 'telephone' | 'delivery' | 'presenceOutOfStore' | 'othersNoPresente';

/** Process type for invoice emission */
export type ProductInvoiceProcessType = 'ownSoftware' | 'fiscoSingle' | 'taxPayerSingle' | 'fiscoSoftware';

/** Tax regime code */
export type ProductInvoiceTaxRegimeCode = 'national_Simple' | 'national_Simple_Brute' | 'normal_Regime';

/** Person type */
export type ProductInvoicePersonType = 'undefined' | 'naturalPerson' | 'legalEntity';

/** Payment method */
export type ProductInvoicePaymentMethod = 'cash' | 'cheque' | 'creditCard' | 'debitCard' | 'storeCredict' | 'foodVouchers' | 'mealVouchers' | 'giftVouchers' | 'fuelVouchers' | 'commercialDuplicate' | 'bankSlip' | 'unpaid' | 'others';

/** Card flag/brand */
export type ProductInvoiceCardFlag = 'visa' | 'mastercard' | 'americanExpress' | 'sorocred' | 'dinnersClub' | 'elo' | 'hipercard' | 'aura' | 'cabal' | 'outros';

/** Integration payment type */
export type ProductInvoiceIntegrationPaymentType = 'integrated' | 'notIntegrated';

// Nested types
// ----------------------------------------------------------------------------

/** City within an address */
export interface ProductInvoiceCity {
  code?: string;
  name?: string;
}

/** Address for issuer or buyer */
export interface ProductInvoiceAddress {
  phone?: string;
  state?: string;
  city?: ProductInvoiceCity;
  district?: string;
  additionalInformation?: string;
  streetSuffix?: string;
  street?: string;
  number?: string;
  postalCode?: string;
  country?: string;
}

/** Invoice issuer (emitente) */
export interface ProductInvoiceIssuer {
  federalTaxNumber?: number;
  name?: string;
  tradeName?: string;
  address?: ProductInvoiceAddress;
  stateTaxNumber?: string;
  codeTaxRegime?: ProductInvoiceTaxRegimeCode;
  cnae?: number;
  im?: string;
  iest?: number;
  type?: ProductInvoicePersonType;
}

/** Invoice buyer (destinatário) */
export interface ProductInvoiceBuyer {
  federalTaxNumber?: number;
  name?: string;
  address?: ProductInvoiceAddress;
  stateTaxNumber?: string;
  stateTaxNumberIndicator?: number;
  email?: string;
  type?: ProductInvoicePersonType;
}

/** ICMS totals */
export interface ProductInvoiceIcmsTotals {
  baseTax?: number;
  icmsAmount?: number;
  icmsExemptAmount?: number;
  stCalculationBasisAmount?: number;
  stAmount?: number;
  productAmount?: number;
  freightAmount?: number;
  insuranceAmount?: number;
  discountAmount?: number;
  iiAmount?: number;
  ipiAmount?: number;
  pisAmount?: number;
  cofinsAmount?: number;
  othersAmount?: number;
  invoiceAmount?: number;
  fcpufDestinationAmount?: number;
  icmsufDestinationAmount?: number;
  icmsufSenderAmount?: number;
  federalTaxesAmount?: number;
  fcpAmount?: number;
  fcpstAmount?: number;
  fcpstRetAmount?: number;
  ipiDevolAmount?: number;
}

/** ISSQN totals */
export interface ProductInvoiceIssqnTotals {
  totalServiceNotTaxedICMS?: number;
  baseRateISS?: number;
  totalISS?: number;
  valueServicePIS?: number;
  valueServiceCOFINS?: number;
  provisionService?: string;
  deductionReductionBC?: number;
  valueOtherRetention?: number;
  discountUnconditional?: number;
  discountConditioning?: number;
  totalRetentionISS?: number;
  codeTaxRegime?: number;
}

/** Invoice totals */
export interface ProductInvoiceTotals {
  icms?: ProductInvoiceIcmsTotals;
  issqn?: ProductInvoiceIssqnTotals;
}

/** ICMS tax on item */
export interface ProductInvoiceItemIcms {
  origin?: string;
  cst?: string;
  baseTaxModality?: string;
  baseTax?: number;
  baseTaxSTModality?: string;
  baseTaxSTReduction?: number;
  baseTaxSTAmount?: number;
  baseTaxReduction?: number;
  stRate?: number;
  stAmount?: number;
  stMarginAmount?: number;
  csosn?: string;
  rate?: number;
  amount?: number;
  snCreditRate?: string;
  snCreditAmount?: string;
  stMarginAddedAmount?: string;
  stRetentionAmount?: string;
  baseSTRetentionAmount?: string;
  baseTaxOperationPercentual?: string;
  ufst?: string;
  amountSTUnfounded?: number;
  amountSTReason?: string;
  baseSNRetentionAmount?: string;
  snRetentionAmount?: string;
  amountOperation?: string;
  percentualDeferment?: string;
  baseDeferred?: string;
  fcpRate?: number;
  fcpAmount?: number;
  fcpstRate?: number;
  fcpstAmount?: number;
  fcpstRetRate?: number;
  fcpstRetAmount?: number;
  bcfcpstAmount?: number;
  finalConsumerRate?: number;
  bcstRetIssuerAmount?: number;
  stRetIssuerAmout?: number;
  bcstBuyerAmount?: number;
  stBuyerAmout?: number;
  substituteAmount?: number;
}

/** IPI tax on item */
export interface ProductInvoiceItemIpi {
  classification?: string;
  producerCNPJ?: string;
  stampCode?: string;
  stampQuantity?: number;
  classificationCode?: string;
  cst?: string;
  base?: string;
  rate?: number;
  unitQuantity?: number;
  unitAmount?: number;
  amount?: number;
}

/** Import tax (II) on item */
export interface ProductInvoiceItemII {
  baseTax?: string;
  customsExpenditureAmount?: string;
  amount?: number;
  iofAmount?: number;
}

/** PIS tax on item */
export interface ProductInvoiceItemPis {
  cst?: string;
  baseTax?: number;
  rate?: number;
  amount?: number;
  baseTaxProductQuantity?: number;
  productRate?: number;
}

/** COFINS tax on item */
export interface ProductInvoiceItemCofins {
  cst?: string;
  baseTax?: number;
  rate?: number;
  amount?: number;
  baseTaxProductQuantity?: number;
  productRate?: number;
}

/** ICMS destination (interestadual) on item */
export interface ProductInvoiceItemIcmsDestination {
  vBCUFDest?: number;
  pFCPUFDest?: number;
  pICMSUFDest?: number;
  pICMSInter?: number;
  pICMSInterPart?: number;
  vFCPUFDest?: number;
  vICMSUFDest?: number;
  vICMSUFRemet?: number;
  vBCFCPUFDest?: number;
}

/** Tax group on item */
export interface ProductInvoiceItemTax {
  totalTax?: number;
  icms?: ProductInvoiceItemIcms;
  ipi?: ProductInvoiceItemIpi;
  ii?: ProductInvoiceItemII;
  pis?: ProductInvoiceItemPis;
  cofins?: ProductInvoiceItemCofins;
  icmsDestination?: ProductInvoiceItemIcmsDestination;
}

/** Medicine detail on item */
export interface ProductInvoiceItemMedicine {
  maximumPrice?: number;
  anvisaCode?: string;
  batchId?: string;
  batchQuantity?: number;
  manufacturedOn?: string;
  expireOn?: string;
}

/** Fuel CIDE information */
export interface ProductInvoiceItemFuelCide {
  bc?: number;
  rate?: number;
  cideAmount?: number;
}

/** Fuel pump (encerrante) information */
export interface ProductInvoiceItemFuelPump {
  spoutNumber?: number;
  number?: number;
  tankNumber?: number;
  beginningAmount?: number;
  endAmount?: number;
}

/** Fuel detail on item */
export interface ProductInvoiceItemFuel {
  codeANP?: string;
  percentageNG?: number;
  descriptionANP?: string;
  percentageGLP?: number;
  percentageNGn?: number;
  percentageGNi?: number;
  startingAmount?: number;
  codif?: string;
  amountTemp?: number;
  stateBuyer?: string;
  cide?: ProductInvoiceItemFuelCide;
  pump?: ProductInvoiceItemFuelPump;
}

/** Invoice item (product/service) */
export interface ProductInvoiceItem {
  code?: string;
  codeGTIN?: string;
  description?: string;
  ncm?: string;
  extipi?: string;
  cfop?: number;
  unit?: string;
  quantity?: number;
  unitAmount?: number;
  totalAmount?: number;
  eanTaxableCode?: string;
  unitTax?: string;
  quantityTax?: number;
  taxUnitAmount?: number;
  freightAmount?: number;
  insuranceAmount?: number;
  discountAmount?: number;
  othersAmount?: number;
  totalIndicator?: boolean;
  cest?: string;
  tax?: ProductInvoiceItemTax;
  additionalInformation?: string;
  numberOrderBuy?: string;
  itemNumberOrderBuy?: number;
  medicineDetail?: ProductInvoiceItemMedicine;
  fuel?: ProductInvoiceItemFuel;
}

/** Transport group (transportador) */
export interface ProductInvoiceTransportGroup {
  cityName?: string;
  federalTaxNumber?: string;
  cpf?: string;
  name?: string;
  stateTaxNumber?: string;
  fullAddress?: string;
  state?: string;
  transportRetention?: string;
}

/** Transport reboque (trailer) */
export interface ProductInvoiceTransportReboque {
  plate?: string;
  uf?: string;
  rntc?: string;
  wagon?: string;
  ferry?: string;
}

/** Transport volume */
export interface ProductInvoiceTransportVolume {
  volumeQuantity?: number;
  species?: string;
  brand?: string;
  volumeNumeration?: string;
  netWeight?: number;
  grossWeight?: number;
}

/** Transport vehicle */
export interface ProductInvoiceTransportVehicle {
  plate?: string;
  state?: string;
  rntc?: string;
}

/** Transport ICMS retention */
export interface ProductInvoiceTransportRate {
  serviceAmount?: number;
  bcRetentionAmount?: number;
  icmsRetentionRate?: number;
  icmsRetentionAmount?: number;
  cfop?: number;
  cityGeneratorFactCode?: number;
}

/** Transport information */
export interface ProductInvoiceTransport {
  freightModality?: number;
  transportGroup?: ProductInvoiceTransportGroup;
  reboque?: ProductInvoiceTransportReboque;
  volume?: ProductInvoiceTransportVolume;
  transportVehicle?: ProductInvoiceTransportVehicle;
  sealNumber?: string;
  transpRate?: ProductInvoiceTransportRate;
}

/** Additional information */
export interface ProductInvoiceAdditionalInfo {
  fisco?: string;
  taxpayer?: string;
  xmlAuthorized?: number[];
  effort?: string;
  order?: string;
  contract?: string;
  taxDocumentsReference?: ProductInvoiceTaxDocumentRef[];
  taxpayerComments?: ProductInvoiceTaxpayerComment[];
  referencedProcess?: ProductInvoiceReferencedProcess[];
}

/** Tax document reference */
export interface ProductInvoiceTaxDocumentRef {
  taxCouponInformation?: {
    modelDocumentFiscal?: string;
    orderECF?: string;
    orderCountOperation?: number;
  };
  documentInvoiceReference?: {
    state?: number;
    yearMonth?: string;
    federalTaxNumber?: string;
    model?: string;
    series?: string;
    number?: string;
  };
  accessKey?: string;
}

/** Taxpayer comment */
export interface ProductInvoiceTaxpayerComment {
  field?: string;
  text?: string;
}

/** Referenced process */
export interface ProductInvoiceReferencedProcess {
  identifierConcessory?: string;
  identifierOrigin?: number;
}

/** Protocol information */
export interface ProductInvoiceProtocol {
  id?: string;
  environmentType?: ProductInvoiceEnvironmentType;
  applicationVersion?: string;
  accessKey?: string;
  receiptOn?: string;
  protocolNumber?: string;
  validatorDigit?: string;
  statusCode?: number;
  description?: string;
  signature?: string;
}

/** Payment card details */
export interface ProductInvoicePaymentCard {
  federalTaxNumber?: string;
  flag?: ProductInvoiceCardFlag;
  authorization?: string;
  integrationPaymentType?: ProductInvoiceIntegrationPaymentType;
}

/** Payment detail entry */
export interface ProductInvoicePaymentDetail {
  method?: ProductInvoicePaymentMethod;
  amount?: number;
  card?: ProductInvoicePaymentCard;
}

/** Payment group */
export interface ProductInvoicePayment {
  paymentDetail?: ProductInvoicePaymentDetail[];
  payBack?: number;
}

/** Billing bill (fatura) */
export interface ProductInvoiceBill {
  number?: string;
  originalAmount?: number;
  discountAmount?: number;
  netAmount?: number;
}

/** Billing duplicate */
export interface ProductInvoiceDuplicate {
  duplicateNumber?: string;
  expirationOn?: string;
  amount?: number;
}

/** Billing information (cobrança) */
export interface ProductInvoiceBilling {
  bill?: ProductInvoiceBill;
  duplicates?: ProductInvoiceDuplicate[];
}

/** Full product invoice details returned by SEFAZ query */
export interface ProductInvoiceDetails {
  currentStatus?: ProductInvoiceStatus;
  stateCode?: number;
  checkCode?: number;
  operationNature?: string;
  paymentType?: ProductInvoicePaymentType;
  codeModel?: number;
  serie?: number;
  number?: number;
  issuedOn?: string;
  operationOn?: string;
  operationType?: ProductInvoiceOperationType;
  destination?: ProductInvoiceDestination;
  cityCode?: number;
  printType?: ProductInvoicePrintType;
  issueType?: ProductInvoiceIssueType;
  checkCodeDigit?: number;
  environmentType?: ProductInvoiceEnvironmentType;
  purposeType?: ProductInvoicePurposeType;
  consumerType?: ProductInvoiceConsumerType;
  presenceType?: ProductInvoicePresenceType;
  processType?: ProductInvoiceProcessType;
  invoiceVersion?: string;
  xmlVersion?: string;
  contingencyOn?: string;
  contingencyJustification?: string;
  issuer?: ProductInvoiceIssuer;
  buyer?: ProductInvoiceBuyer;
  totals?: ProductInvoiceTotals;
  transport?: ProductInvoiceTransport;
  additionalInformation?: ProductInvoiceAdditionalInfo;
  protocol?: ProductInvoiceProtocol;
  items?: ProductInvoiceItem[];
  billing?: ProductInvoiceBilling;
  payment?: ProductInvoicePayment[];
}

/** Fiscal event associated with a product invoice */
export interface ProductInvoiceEvent {
  stateCode?: number;
  type?: number;
  sequence?: number;
  authorFederalTaxNumber?: string;
  id?: string;
  protocol?: number;
  authorizedOn?: string;
  description?: string;
}

/** Response from listing fiscal events for a product invoice */
export interface ProductInvoiceEventsResponse {
  events?: ProductInvoiceEvent[];
  createdOn?: string;
}

// ============================================================================
// Consumer Invoice Query Types (CFe-SAT / Cupom Fiscal Eletrônico)
// ============================================================================

/** Status of a CFe-SAT consumer invoice (coupon) */
export type CouponStatus = 'Unknown' | 'Authorized' | 'Canceled' | (string & {});

/** Person type for CFe-SAT entities */
export type CouponPersonType = 'Undefined' | 'NaturalPerson' | 'LegalEntity' | (string & {});

/** Tax regime for CFe-SAT issuer */
export type CouponTaxRegime = 'National_Simple' | 'National_Simple_Brute' | 'Normal_Regime' | (string & {});

/** Payment method for CFe-SAT coupon */
export type CouponPaymentMethod =
  | 'Cash'
  | 'Cheque'
  | 'CreditCard'
  | 'DebitCard'
  | 'StoreCredict'
  | 'FoodVouchers'
  | 'MealVouchers'
  | 'GiftVouchers'
  | 'FuelVouchers'
  | 'CommercialDuplicate'
  | 'BankSlip'
  | 'BankDeposit'
  | 'InstantPayment'
  | 'WireTransfer'
  | 'Cashback'
  | 'Unpaid'
  | 'Others'
  | (string & {});

/** ISSQN tax incentive indicator */
export type CouponIssqnTaxIncentive = 'Yes' | 'No' | (string & {});

/** City reference in CFe-SAT */
export interface CouponCity {
  code?: string;
  name?: string;
}

/** Address in CFe-SAT documents */
export interface CouponAddress {
  state?: string;
  city?: CouponCity;
  district?: string;
  additionalInformation?: string;
  streetSuffix?: string;
  street?: string;
  number?: string;
  postalCode?: string;
  country?: string;
}

/** Issuer (emit) of a CFe-SAT coupon */
export interface CouponIssuer {
  federalTaxNumber?: number;
  type?: CouponPersonType;
  name?: string;
  tradeName?: string;
  address?: CouponAddress;
  stateTaxNumber?: string;
  taxRegime?: CouponTaxRegime;
  municipalTaxNumber?: string;
  iss?: string;
  avarageIndicator?: boolean;
}

/** Buyer (dest) of a CFe-SAT coupon */
export interface CouponBuyer {
  pretectedPersonalInformation?: string;
  federalTaxNumber?: number;
  name?: string;
}

/** ICMS totals for a CFe-SAT coupon */
export interface CouponIcmsTotal {
  productAmount?: number;
  discountAmount?: number;
  othersAmount?: number;
  icmsAmount?: number;
  inputDiscountAmount?: number;
  inputAdditionAmount?: number;
  pisAmount?: number;
  cofinsAmount?: number;
  pisstAmount?: number;
  cofinsstAmount?: number;
}

/** ISSQN totals for a CFe-SAT coupon */
export interface CouponIssqnTotal {
  baseAmount?: number;
  issAmount?: number;
  pisAmount?: number;
  cofinsAmount?: number;
  pisstAmount?: number;
  cofinsstAmount?: number;
}

/** Totals for a CFe-SAT coupon */
export interface CouponTotal {
  icms?: CouponIcmsTotal;
  issqn?: CouponIssqnTotal;
  totalAmount?: number;
  couponAmount?: number;
}

/** Tax base resource (used by PIS/COFINS ST) */
export interface CouponTaxBase {
  baseTax?: number;
  rate?: number;
  amount?: number;
  rateAmount?: number;
  quantity?: number;
}

/** ICMS tax data for a coupon item */
export interface CouponIcmsTax {
  origin?: string;
  cst?: string;
  csosn?: string;
  amount?: number;
  rate?: number;
}

/** PIS tax data for a coupon item */
export interface CouponPisTax {
  cst?: string;
  st?: CouponTaxBase;
  baseTax?: number;
  rate?: number;
  amount?: number;
  rateAmount?: number;
  quantity?: number;
}

/** COFINS tax data for a coupon item */
export interface CouponCofinsTax {
  cst?: string;
  st?: CouponTaxBase;
  baseTax?: number;
  rate?: number;
  amount?: number;
  rateAmount?: number;
  quantity?: number;
}

/** ISSQN tax data for a coupon item */
export interface CouponIssqnTax {
  deductionsAmount?: number;
  baseTax?: number;
  rate?: number;
  amount?: number;
  federalServiceCode?: string;
  cityServiceCode?: string;
  cityCode?: number;
  taxIncentive?: CouponIssqnTaxIncentive;
  operationNature?: string;
}

/** Tax breakdown for a coupon item */
export interface CouponItemTax {
  totalTax?: number;
  icms?: CouponIcmsTax;
  pis?: CouponPisTax;
  cofins?: CouponCofinsTax;
  issqn?: CouponIssqnTax;
}

/** Fisco observation field */
export interface CouponFiscoField {
  key?: string;
  value?: string;
}

/** Referenced tax document */
export interface CouponReferencedDocument {
  accessKey?: string;
  order?: number;
}

/** Product item in a CFe-SAT coupon */
export interface CouponItem {
  description?: string;
  quantity?: number;
  unit?: string;
  code?: string;
  codeGTIN?: string;
  ncm?: string;
  cfop?: number;
  cest?: string;
  unitAmount?: number;
  discountAmount?: number;
  othersAmount?: number;
  additionalInformation?: string;
  itemNumberOrderBuy?: number;
  netAmount?: number;
  grossAmount?: number;
  rule?: string;
  apportionmentDiscountAmount?: number;
  apportionmentAmount?: number;
  fisco?: CouponFiscoField[];
  tax?: CouponItemTax;
}

/** Payment detail in a CFe-SAT coupon */
export interface CouponPaymentDetail {
  method?: CouponPaymentMethod;
  amount?: number;
  card?: string;
}

/** Payment group for a CFe-SAT coupon */
export interface CouponPayment {
  payBack?: number;
  paymentDetails?: CouponPaymentDetail[];
}

/** Delivery information for a CFe-SAT coupon */
export interface CouponDelivery {
  address?: CouponAddress;
}

/** Additional information for a CFe-SAT coupon */
export interface CouponAdditionalInformation {
  taxpayer?: string;
  fisco?: CouponFiscoField[];
  referencedDocuments?: CouponReferencedDocument[];
}

/** CFe-SAT tax coupon (Cupom Fiscal Eletrônico) */
export interface TaxCoupon {
  currentStatus?: CouponStatus;
  number?: number;
  satSerie?: string;
  softwareVersion?: string;
  softwareFederalTaxNumber?: number;
  accessKey?: string;
  cashier?: number;
  issuedOn?: string;
  createdOn?: string;
  xmlVersion?: string;
  issuer?: CouponIssuer;
  buyer?: CouponBuyer;
  totals?: CouponTotal;
  delivery?: CouponDelivery;
  additionalInformation?: CouponAdditionalInformation;
  items?: CouponItem[];
  payment?: CouponPayment;
}

// ============================================================================
// Legal Entity Lookup Types (consulta-cnpj)
// ============================================================================

/** Valid Brazilian state abbreviations (27 UFs + EX + NA) */
export type BrazilianState =
  | 'AC' | 'AL' | 'AM' | 'AP' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO'
  | 'MA' | 'MG' | 'MS' | 'MT' | 'PA' | 'PB' | 'PE' | 'PI' | 'PR'
  | 'RJ' | 'RN' | 'RO' | 'RR' | 'RS' | 'SC' | 'SE' | 'SP' | 'TO'
  | 'EX' | 'NA';

/** Options for basic info lookup */
export interface LegalEntityBasicInfoOptions {
  /** Whether to update the address from postal service data (default: true) */
  updateAddress?: boolean;
  /** When updateAddress=false, whether to update only the city code from postal service data (default: false) */
  updateCityCode?: boolean;
}

// --- Response Wrappers ---

/** Response wrapper for CNPJ basic info lookup */
export interface LegalEntityBasicInfoResponse {
  /** Legal entity data */
  legalEntity?: LegalEntityBasicInfo;
}

/** Response wrapper for state tax info lookup */
export interface LegalEntityStateTaxResponse {
  /** Legal entity state tax data */
  legalEntity?: LegalEntityStateTaxInfo;
}

/** Response wrapper for state tax for invoice lookup */
export interface LegalEntityStateTaxForInvoiceResponse {
  /** Legal entity state tax data for invoice evaluation */
  legalEntity?: LegalEntityStateTaxForInvoiceInfo;
}

// --- Core Entity Types ---

/** Company size classification */
export type LegalEntitySize = 'Unknown' | 'ME' | 'EPP' | 'DEMAIS';

/** Company registration status */
export type LegalEntityStatus = 'Unknown' | 'Active' | 'Suspended' | 'Cancelled' | 'Unabled' | 'Null';

/** Organizational unit type */
export type LegalEntityUnit = 'Headoffice' | 'Subsidiary';

/** Tax regime code */
export type LegalEntityTaxRegime = 'Unknown' | 'SimplesNacional' | 'MEI' | 'Normal';

/** Legal nature classification */
export type LegalEntityNatureCode =
  | 'EmpresaPublica' | 'SociedadeEconomiaMista' | 'SociedadeAnonimaAberta'
  | 'SociedadeAnonimaFechada' | 'SociedadeEmpresariaLimitada'
  | 'SociedadeEmpresariaEmNomeColetivo' | 'SociedadeEmpresariaEmComanditaSimples'
  | 'SociedadeEmpresariaEmComanditaporAcoes' | 'SociedadeemContaParticipacao'
  | 'Empresario' | 'Cooperativa' | 'ConsorcioSociedades' | 'GrupoSociedades'
  | 'EmpresaDomiciliadaExterior' | 'ClubeFundoInvestimento'
  | 'SociedadeSimplesPura' | 'SociedadeSimplesLimitada'
  | 'SociedadeSimplesEmNomeColetivo' | 'SociedadeSimplesEmComanditaSimples'
  | 'EmpresaBinacional' | 'ConsorcioEmpregadores' | 'ConsorcioSimples'
  | 'EireliNaturezaEmpresaria' | 'EireliNaturezaSimples' | 'ServicoNotarial'
  | 'FundacaoPrivada' | 'ServicoSocialAutonomo' | 'CondominioEdilicio'
  | 'ComissaoConciliacaoPrevia' | 'EntidadeMediacaoArbitragem'
  | 'PartidoPolitico' | 'EntidadeSindical'
  | 'EstabelecimentoBrasilFundacaoAssociacaoEstrangeiras'
  | 'FundacaoAssociacaoDomiciliadaExterior' | 'OrganizacaoReligiosa'
  | 'ComunidadeIndigena' | 'FundoPrivado' | 'AssociacaoPrivada'
  | 'OutrasSemFimLucrativo' | 'Unknown';

/** State tax registration status */
export type LegalEntityStateTaxStatus = 'Abled' | 'Unabled' | 'Cancelled' | 'Unknown';

/** Extended state tax registration status for invoice evaluation */
export type LegalEntityStateTaxForInvoiceStatus =
  | 'Abled' | 'Unabled' | 'Cancelled'
  | 'UnabledTemp' | 'UnabledNotConfirmed'
  | 'Unknown' | 'UnknownTemp' | 'UnknownNotConfirmed';

/** Fiscal document contributor status */
export type LegalEntityFiscalDocumentStatus = 'Abled' | 'Unabled' | 'Unknown';

/** Economic activity type classification */
export type LegalEntityActivityType = 'Main' | 'Secondary';

/** Phone source */
export type LegalEntityPhoneSource = 'RFB';

// --- Nested Object Types ---

/** City information */
export interface LegalEntityCity {
  /** City IBGE code */
  code?: string;
  /** City name */
  name?: string;
}

/** Address from Legal Entity API */
export interface LegalEntityAddress {
  /** State abbreviation (UF) */
  state?: string;
  /** City information */
  city?: LegalEntityCity;
  /** District / neighborhood */
  district?: string;
  /** Additional address information */
  additionalInformation?: string;
  /** Street suffix (type) */
  streetSuffix?: string;
  /** Street name */
  street?: string;
  /** Street number */
  number?: string;
  /** Minimum number range */
  numberMin?: string;
  /** Maximum number range */
  numberMax?: string;
  /** Postal code (CEP) */
  postalCode?: string;
  /** Country */
  country?: string;
}

/** Phone number */
export interface LegalEntityPhone {
  /** Area code (DDD) */
  ddd?: string;
  /** Phone number */
  number?: string;
  /** Information source */
  source?: LegalEntityPhoneSource;
}

/** Economic activity (CNAE) */
export interface LegalEntityEconomicActivity {
  /** Activity classification (Main or Secondary) */
  type?: LegalEntityActivityType;
  /** CNAE code */
  code?: number;
  /** CNAE description */
  description?: string;
}

/** Legal nature */
export interface LegalEntityNature {
  /** Legal nature code */
  code?: string;
  /** Legal nature description */
  description?: string;
}

/** Partner qualification */
export interface LegalEntityQualification {
  /** Qualification code */
  code?: string;
  /** Qualification description */
  description?: string;
}

/** Company partner */
export interface LegalEntityPartner {
  /** Partner name */
  name?: string;
  /** Partner qualification */
  qualification?: LegalEntityQualification;
}

/** Fiscal document indicator (NFe/NFSe/CTe/NFCe) */
export interface LegalEntityFiscalDocumentInfo {
  /** Contributor status */
  status?: LegalEntityFiscalDocumentStatus;
  /** Data source description */
  description?: string;
}

/** State tax registration (Inscrição Estadual) */
export interface LegalEntityStateTax {
  /** Registration status */
  status?: LegalEntityStateTaxStatus;
  /** State tax number (IE) */
  taxNumber?: string;
  /** Status date */
  statusOn?: string;
  /** Opening date */
  openedOn?: string;
  /** Closing date */
  closedOn?: string;
  /** Additional information */
  additionalInformation?: string;
  /** State code */
  code?: BrazilianState;
  /** Address */
  address?: LegalEntityAddress;
  /** Economic activities (CNAE) */
  economicActivities?: LegalEntityEconomicActivity[];
  /** NFe indicator */
  nfe?: LegalEntityFiscalDocumentInfo;
  /** NFSe indicator */
  nfse?: LegalEntityFiscalDocumentInfo;
  /** CTe indicator */
  cte?: LegalEntityFiscalDocumentInfo;
  /** NFCe indicator */
  nfce?: LegalEntityFiscalDocumentInfo;
}

/** State tax registration for invoice evaluation (extended status) */
export interface LegalEntityStateTaxForInvoice {
  /** Registration status (extended enum) */
  status?: LegalEntityStateTaxForInvoiceStatus;
  /** State tax number (IE) */
  taxNumber?: string;
  /** Status date */
  statusOn?: string;
  /** Opening date */
  openedOn?: string;
  /** Closing date */
  closedOn?: string;
  /** Additional information */
  additionalInformation?: string;
  /** State code */
  code?: BrazilianState;
  /** Address */
  address?: LegalEntityAddress;
  /** Economic activities (CNAE) */
  economicActivities?: LegalEntityEconomicActivity[];
  /** NFe indicator */
  nfe?: LegalEntityFiscalDocumentInfo;
  /** NFSe indicator */
  nfse?: LegalEntityFiscalDocumentInfo;
  /** CTe indicator */
  cte?: LegalEntityFiscalDocumentInfo;
  /** NFCe indicator */
  nfce?: LegalEntityFiscalDocumentInfo;
}

// --- Main Entity Types ---

/** Full company data from CNPJ basic info lookup */
export interface LegalEntityBasicInfo {
  /** Trade name (nome fantasia) */
  tradeName?: string;
  /** Legal name (razão social) */
  name?: string;
  /** Federal tax number (CNPJ) — numeric */
  federalTaxNumber?: number;
  /** Company size classification */
  size?: LegalEntitySize;
  /** Opening date */
  openedOn?: string;
  /** Company address */
  address?: LegalEntityAddress;
  /** Phone numbers */
  phones?: LegalEntityPhone[];
  /** Registration status date */
  statusOn?: string;
  /** Registration status */
  status?: LegalEntityStatus;
  /** Email address */
  email?: string;
  /** Responsible federal entity (EFR) */
  responsableEntity?: string;
  /** Special status */
  specialStatus?: string;
  /** Special status date */
  specialStatusOn?: string;
  /** Query date (when the data was fetched) */
  issuedOn?: string;
  /** Status reason description */
  statusReason?: string;
  /** Share capital in BRL */
  shareCapital?: number;
  /** Economic activities (CNAE) */
  economicActivities?: LegalEntityEconomicActivity[];
  /** Legal nature */
  legalNature?: LegalEntityNature;
  /** Partners and administrators */
  partners?: LegalEntityPartner[];
  /** Registration unit (city/office) */
  registrationUnit?: string;
  /** Organizational unit (headquarters/subsidiary) */
  unit?: LegalEntityUnit;
}

/** State tax information from state tax info lookup */
export interface LegalEntityStateTaxInfo {
  /** Trade name */
  tradeName?: string;
  /** Legal name */
  name?: string;
  /** Federal tax number (CNPJ) — numeric */
  federalTaxNumber?: number;
  /** Query date */
  createdOn?: string;
  /** Tax regime (CRT) */
  taxRegime?: LegalEntityTaxRegime;
  /** Legal nature code */
  legalNature?: LegalEntityNatureCode;
  /** Fiscal unit */
  fiscalUnit?: string;
  /** Registration unit */
  createdUnit?: string;
  /** Verification code */
  checkCode?: string;
  /** State tax registrations (Inscrições Estaduais) */
  stateTaxes?: LegalEntityStateTax[];
}

/** State tax information for invoice evaluation */
export interface LegalEntityStateTaxForInvoiceInfo {
  /** Trade name */
  tradeName?: string;
  /** Legal name */
  name?: string;
  /** Federal tax number (CNPJ) — numeric */
  federalTaxNumber?: number;
  /** Query date */
  createdOn?: string;
  /** Tax regime (CRT) */
  taxRegime?: LegalEntityTaxRegime;
  /** Legal nature code */
  legalNature?: LegalEntityNatureCode;
  /** Fiscal unit */
  fiscalUnit?: string;
  /** Registration unit */
  createdUnit?: string;
  /** Verification code */
  checkCode?: string;
  /** State tax registrations for invoice evaluation (extended status) */
  stateTaxes?: LegalEntityStateTaxForInvoice[];
}

// ============================================================================
// Natural Person Lookup Types (consulta-cpf)
// ============================================================================

/**
 * Known cadastral status values for CPF (situação cadastral na Receita Federal).
 * The union includes a `(string & {})` fallback to allow unknown future values
 * while still providing autocomplete for known statuses.
 */
export type NaturalPersonStatus =
  | 'Regular'
  | 'Suspensa'
  | 'Cancelada'
  | 'Titular Falecido'
  | 'Pendente de Regularização'
  | 'Nula'
  | (string & {});

/**
 * Response from the CPF cadastral status lookup endpoint.
 *
 * Returned by `GET /v1/naturalperson/status/{federalTaxNumber}/{birthDate}`
 * on `naturalperson.api.nfe.io`.
 */
export interface NaturalPersonStatusResponse {
  /** Full name of the person */
  name?: string;
  /** CPF number (digits only) */
  federalTaxNumber: string;
  /** Date of birth (ISO 8601 date-time string) */
  birthOn?: string;
  /** Cadastral status at Receita Federal */
  status?: NaturalPersonStatus;
  /** Timestamp of when the query was created (ISO 8601 date-time string) */
  createdOn?: string;
}

// ============================================================================
// Tax Calculation Types (calculo-impostos-v1)
// ============================================================================

// --- Enums ---

/**
 * Type of tax operation (incoming vs outgoing).
 *
 * - `'Outgoing'` — Saída (sale, shipment)
 * - `'Incoming'` — Entrada (purchase, receipt)
 */
export type TaxOperationType = 'Outgoing' | 'Incoming';

/**
 * Origin of the merchandise for ICMS purposes.
 *
 * Mirrors the SEFAZ origin codes (0-8).
 */
export type TaxOrigin =
  | 'National'
  | 'ForeignDirectImport'
  | 'ForeignInternalMarket'
  | 'NationalWith40To70Import'
  | 'NationalPpb'
  | 'NationalWithLess40Import'
  | 'ForeignDirectImportWithoutNationalSimilar'
  | 'ForeignInternalMarketWithoutNationalSimilar'
  | 'NationalWithGreater70Import';

/**
 * Tax regime used in the Tax Calculation Engine.
 *
 * **Note:** This differs from the service-invoice {@link TaxRegime} which uses
 * Portuguese-language values. This enum uses the PascalCase values from the
 * calculo-impostos API.
 */
export type TaxCalcTaxRegime =
  | 'NationalSimple'
  | 'RealProfit'
  | 'PresumedProfit'
  | 'NationalSimpleSublimitExceeded'
  | 'IndividualMicroEnterprise'
  | 'Exempt';

// --- Tax Component Interfaces ---

/**
 * ICMS tax component — covers ICMS, ICMS-ST, FCP, and related calculations.
 *
 * All numeric fields are represented as strings matching the API's format.
 */
export interface TaxIcms {
  /** Origem da mercadoria */
  orig?: string;
  /** Tributação do ICMS (CST) */
  cst?: string;
  /** Código de Situação da Operação – Simples Nacional (CSOSN) */
  csosn?: string;
  /** Modalidade de determinação da BC do ICMS */
  modBC?: string;
  /** Valor da BC do ICMS */
  vBC?: string;
  /** Percentual da Redução de BC */
  pRedBC?: string;
  /** Código do benefício fiscal relacionado a redução de base */
  cBenefRBC?: string;
  /** Alíquota do imposto */
  pICMS?: string;
  /** Valor do ICMS */
  vICMS?: string;
  /** Valor do ICMS da Operação */
  vICMSOp?: string;
  /** Modalidade de determinação da BC do ICMS ST */
  modBCST?: string;
  /** Valor da BC do ICMS ST */
  vBCST?: string;
  /** Percentual da Redução de BC do ICMS ST */
  pRedBCST?: string;
  /** Alíquota do imposto do ICMS ST */
  pICMSST?: string;
  /** Valor do ICMS ST */
  vICMSST?: string;
  /** Percentual da margem de valor Adicionado do ICMS ST */
  pMVAST?: string;
  /** Alíquota suportada pelo Consumidor Final */
  pST?: string;
  /** Valor da BC do ICMS ST retido */
  vBCSTRet?: string;
  /** Valor do ICMS ST retido */
  vICMSSTRet?: string;
  /** Valor da Base de Cálculo do FCP */
  vBCFCP?: string;
  /** Percentual do ICMS relativo ao Fundo de Combate à Pobreza (FCP) */
  pFCP?: string;
  /** Valor do Fundo de Combate à Pobreza (FCP) */
  vFCP?: string;
  /** Valor da Base de Cálculo do FCP retido por Substituição Tributária */
  vBCFCPST?: string;
  /** Percentual do FCP retido por Substituição Tributária */
  pFCPST?: string;
  /** Valor do FCP retido por Substituição Tributária */
  vFCPST?: string;
  /** Valor da Base de Cálculo do FCP retido anteriormente */
  vBCFCPSTRet?: string;
  /** Percentual do FCP retido anteriormente por Substituição Tributária */
  pFCPSTRet?: string;
  /** Valor do FCP retido por Substituição Tributária (retained) */
  vFCPSTRet?: string;
  /** Valor da base de cálculo efetiva */
  vBCEfet?: string;
  /** Percentual de redução da base de cálculo efetiva */
  pRedBCEfet?: string;
  /** Alíquota do ICMS efetiva */
  pICMSEfet?: string;
  /** Valor do ICMS efetivo */
  vICMSEfet?: string;
  /** Percentual do diferimento */
  pDif?: string;
  /** Valor do ICMS diferido */
  vICMSDif?: string;
  /** Valor do ICMS próprio do Substituto */
  vICMSSubstituto?: string;
  /** Alíquota aplicável de cálculo do crédito (Simples Nacional) */
  pCredSN?: string;
  /** Valor crédito do ICMS (Simples Nacional, LC 123 art. 23) */
  vCredICMSSN?: string;
  /** Percentual do diferimento do FCP */
  pFCPDif?: string;
  /** Valor do FCP diferido */
  vFCPDif?: string;
  /** Valor efetivo do FCP */
  vFCPEfet?: string;
  /** Valor do ICMS desonerado */
  vICMSDeson?: string;
  /** Motivo da desoneração do ICMS */
  motDesICMS?: string;
  /** Valor do ICMS-ST desonerado */
  vICMSSTDeson?: string;
  /** Motivo da desoneração do ICMS-ST */
  motDesICMSST?: string;
  /** Indica se o valor do ICMS desonerado deduz do valor do item */
  indDeduzDeson?: string;
}

/**
 * ICMS interestadual (DIFAL / UF Destination) tax component.
 */
export interface TaxIcmsUfDest {
  /** Valor da BC do ICMS na UF de destino */
  vBCUFDest?: string;
  /** Valor da BC FCP na UF de destino */
  vBCFCPUFDest?: string;
  /** Percentual do FCP na UF de destino */
  pFCPUFDest?: string;
  /** Alíquota interna da UF de destino */
  pICMSUFDest?: string;
  /** Alíquota interestadual das UF envolvidas */
  pICMSInter?: string;
  /** Percentual provisório de partilha do ICMS Interestadual */
  pICMSInterPart?: string;
  /** Valor do FCP na UF de destino */
  vFCPUFDest?: string;
  /** Valor do ICMS Interestadual para a UF de destino */
  vICMSUFDest?: string;
  /** Valor do ICMS Interestadual para a UF do remetente */
  vICMSUFRemet?: string;
}

/**
 * PIS tax component.
 */
export interface TaxPis {
  /** Código de Situação Tributária do PIS */
  cst?: string;
  /** Valor da Base de Cálculo do PIS */
  vBC?: string;
  /** Alíquota do PIS (em percentual) */
  pPIS?: string;
  /** Valor do PIS */
  vPIS?: string;
  /** Quantidade Vendida */
  qBCProd?: string;
  /** Alíquota do PIS (em reais) */
  vAliqProd?: string;
}

/**
 * COFINS tax component.
 */
export interface TaxCofins {
  /** Código de Situação Tributária da COFINS */
  cst?: string;
  /** Valor da Base de Cálculo do COFINS */
  vBC?: string;
  /** Alíquota do COFINS (em percentual) */
  pCOFINS?: string;
  /** Valor do COFINS */
  vCOFINS?: string;
  /** Quantidade Vendida */
  qBCProd?: string;
  /** Alíquota do COFINS (em reais) */
  vAliqProd?: string;
}

/**
 * IPI tax component.
 */
export interface TaxIpi {
  /** Código de Enquadramento Legal do IPI */
  cEnq?: string;
  /** Código da situação tributária do IPI */
  cst?: string;
  /** Valor da BC do IPI */
  vBC?: string;
  /** Alíquota do IPI */
  pIPI?: string;
  /** Quantidade total na unidade padrão para tributação */
  qUnid?: string;
  /** Valor por Unidade Tributável */
  vUnid?: string;
  /** Valor do IPI */
  vIPI?: string;
}

/**
 * Import Tax (II) component.
 */
export interface TaxIi {
  /** Valor BC do Imposto de Importação */
  vBC?: string;
  /** Valor despesas aduaneiras */
  vDespAdu?: string;
  /** Valor Imposto de Importação */
  vII?: string;
  /** Valor Imposto sobre Operações Financeiras */
  vIOF?: string;
  /** Valor dos encargos cambiais */
  vEncCamb?: string;
  /** Alíquota do Simples Nacional aplicável */
  pCredSN?: string;
  /** Valor crédito do ICMS (Simples Nacional) */
  vCredICMSSN?: string;
  /** Ativação do cálculo do custo de aquisição (0=Inativo, 1=Ativo) */
  infCustoAquis?: string;
}

// --- Request Interfaces ---

/**
 * Issuer data for the tax calculation request.
 */
export interface CalculateRequestIssuer {
  /** Tax regime of the issuer */
  taxRegime: TaxCalcTaxRegime;
  /** Default tax profile for the issuer */
  taxProfile?: string;
  /** State of the issuer */
  state: BrazilianState;
}

/**
 * Recipient data for the tax calculation request.
 */
export interface CalculateRequestRecipient {
  /** Tax regime of the recipient (optional) */
  taxRegime?: TaxCalcTaxRegime;
  /** Default tax profile for the recipient */
  taxProfile?: string;
  /** State of the recipient */
  state: BrazilianState;
}

/**
 * A single item (product) in the tax calculation request.
 */
export interface CalculateItemRequest {
  /** Unique item identifier */
  id: string;
  /** Internal code for operation nature determination (1–9999) */
  operationCode: number;
  /** Acquisition purpose code */
  acquisitionPurpose?: string;
  /** Issuer tax profile for this specific item */
  issuerTaxProfile?: string;
  /** Recipient tax profile for this specific item */
  recipientTaxProfile?: string;
  /** Product SKU */
  sku?: string;
  /** NCM code (Nomenclatura Comum do Mercosul, up to 8 digits) */
  ncm?: string;
  /** CEST code (Código Especificador da Substituição Tributária, 7 digits) */
  cest?: string;
  /** Fiscal benefit code */
  benefit?: string;
  /** EX TIPI code (1–3 chars) */
  exTipi?: string;
  /** Origin of the merchandise */
  origin: TaxOrigin;
  /** Global Trade Item Number */
  gtin?: string;
  /** Taxable quantity */
  quantity: number;
  /** Taxable unit amount */
  unitAmount: number;
  /** Freight amount */
  freightAmount?: number;
  /** Insurance amount */
  insuranceAmount?: number;
  /** Discount amount */
  discountAmount?: number;
  /** Other accessory expenses */
  othersAmount?: number;
  /** ICMS input overrides (for import tax scenarios) */
  icms?: TaxIcms;
  /** Import tax input overrides */
  ii?: TaxIi;
}

/**
 * Tax calculation request payload.
 *
 * Submit to `POST /tax-rules/{tenantId}/engine/calculate` to compute all
 * applicable Brazilian taxes (ICMS, ICMS-ST, PIS, COFINS, IPI, II) for
 * the given operation context and product items.
 *
 * @example
 * ```typescript
 * const request: CalculateRequest = {
 *   operationType: 'Outgoing',
 *   issuer: { state: 'SP', taxRegime: 'RealProfit' },
 *   recipient: { state: 'RJ' },
 *   items: [{
 *     id: '1',
 *     operationCode: 121,
 *     origin: 'National',
 *     quantity: 10,
 *     unitAmount: 100.00,
 *     ncm: '61091000'
 *   }]
 * };
 * ```
 */
export interface CalculateRequest {
  /** Product collection identifier */
  collectionId?: string;
  /** Issuer (seller/shipper) fiscal data */
  issuer: CalculateRequestIssuer;
  /** Recipient (buyer/receiver) fiscal data */
  recipient: CalculateRequestRecipient;
  /** Type of operation */
  operationType: TaxOperationType;
  /** List of products/items to calculate taxes for */
  items: CalculateItemRequest[];
  /** Whether this is a product registration request (vs invoice issuance) */
  isProductRegistration?: boolean;
}

// --- Response Interfaces ---

/**
 * A single item in the tax calculation response with full tax breakdown.
 */
export interface CalculateItemResponse {
  /** Item identifier (matches the request item id) */
  id?: string;
  /** CFOP — Código Fiscal de Operações e Prestações */
  cfop?: number;
  /** CEST code */
  cest?: string;
  /** Fiscal benefit code */
  benefit?: string;
  /** ICMS tax breakdown */
  icms?: TaxIcms;
  /** ICMS interestadual (DIFAL / UF destination) breakdown */
  icmsUfDest?: TaxIcmsUfDest;
  /** PIS tax breakdown */
  pis?: TaxPis;
  /** COFINS tax breakdown */
  cofins?: TaxCofins;
  /** IPI tax breakdown */
  ipi?: TaxIpi;
  /** Import tax (II) breakdown */
  ii?: TaxIi;
  /** Additional product information */
  additionalInformation?: string;
  /** Timestamp of the last rule modification (ISO 8601) */
  lastModified?: string;
  /** Registered product ID */
  productId?: string;
}

/**
 * Tax calculation response containing per-item tax breakdowns.
 */
export interface CalculateResponse {
  /** Calculated items with full tax data */
  items?: CalculateItemResponse[];
}

// --- Tax Codes Types ---

/**
 * A single tax code entry (operation code, acquisition purpose, or tax profile).
 */
export interface TaxCode {
  /** The code identifier */
  code?: string;
  /** Human-readable description */
  description?: string;
}

/**
 * Paginated response for tax code listings.
 */
export interface TaxCodePaginatedResponse {
  /** List of tax code entries */
  items?: TaxCode[];
  /** Current page number (1-based) */
  currentPage?: number;
  /** Total number of pages */
  totalPages?: number;
  /** Total count of entries */
  totalCount?: number;
}

/**
 * Options for listing tax codes (pagination).
 *
 * Uses the API's native pagination model (`pageIndex`/`pageCount`),
 * which differs from the OData-style `$skip`/`$top` used by other resources.
 */
export interface TaxCodeListOptions {
  /** Page index (1-based, default: 1) */
  pageIndex?: number;
  /** Number of items per page (default: 50) */
  pageCount?: number;
}

// ============================================================================
// Product Invoice (NF-e Issuance) Types — nf-produto-v2
// ============================================================================

// Enum types (string literal unions)
// ----------------------------------------------------------------------------

/** Environment type for NF-e product invoice operations */
export type NfeEnvironmentType = 'None' | 'Production' | 'Test';

/** Status of a product invoice (NF-e) in the issuance lifecycle */
export type NfeInvoiceStatus =
  | 'None'
  | 'Created'
  | 'Processing'
  | 'Issued'
  | 'IssuedContingency'
  | 'Cancelled'
  | 'Disabled'
  | 'IssueDenied'
  | 'Error';

/** Brazilian state code (UF) */
export type NfeStateCode =
  | 'NA' | 'RO' | 'AC' | 'AM' | 'RR' | 'PA' | 'AP' | 'TO'
  | 'MA' | 'PI' | 'CE' | 'RN' | 'PB' | 'PE' | 'AL' | 'SE' | 'BA'
  | 'MG' | 'ES' | 'RJ' | 'SP' | 'PR' | 'SC' | 'RS'
  | 'MS' | 'MT' | 'GO' | 'DF' | 'EX';

/** Operation type (incoming/outgoing) for NF-e */
export type NfeOperationType = 'Outgoing' | 'Incoming';

/** Purpose of the NF-e invoice */
export type NfePurposeType = 'None' | 'Normal' | 'Complement' | 'Adjustment' | 'Devolution';

/** Payment method for NF-e */
export type NfePaymentMethod =
  | 'Cash' | 'Cheque' | 'CreditCard' | 'DebitCard'
  | 'StoreCredict' | 'FoodVouchers' | 'MealVouchers' | 'GiftVouchers'
  | 'FuelVouchers' | 'BankBill' | 'BankDeposit' | 'InstantPayment'
  | 'WireTransfer' | 'Cashback' | 'WithoutPayment' | 'Others';

/** Shipping modality for NF-e transport */
export type NfeShippingModality =
  | 'ByIssuer' | 'ByReceiver' | 'ByThirdParties'
  | 'OwnBySender' | 'OwnByBuyer' | 'Free';

/** Consumer presence indicator for NF-e */
export type NfeConsumerPresenceType =
  | 'None' | 'Presence' | 'Internet' | 'Telephone'
  | 'Delivery' | 'OthersNonPresenceOperation';

/** DANFE print format */
export type NfePrintType =
  | 'None' | 'NFeNormalPortrait' | 'NFeNormalLandscape'
  | 'NFeSimplified' | 'DANFE_NFC_E' | 'DANFE_NFC_E_MSG_ELETRONICA';

/** Person type */
export type NfePersonType = 'Undefined' | 'NaturalPerson' | 'LegalEntity' | 'Company' | 'Customer';

/** Destination of the operation */
export type NfeDestination =
  | 'None' | 'Internal_Operation' | 'Interstate_Operation' | 'International_Operation';

/** Consumer type indicator */
export type NfeConsumerType = 'FinalConsumer' | 'Normal';

/** Payment type (cash or term) */
export type NfePaymentType = 'InCash' | 'Term';

/** Receiver state tax indicator */
export type NfeReceiverStateTaxIndicator = 'None' | 'TaxPayer' | 'Exempt' | 'NonTaxPayer';

/** Card flag/brand for payment */
export type NfeFlagCard =
  | 'None' | 'Visa' | 'Mastercard' | 'AmericanExpress' | 'Sorocred'
  | 'DinersClub' | 'Elo' | 'Hipercard' | 'Aura' | 'Cabal' | 'Alelo'
  | 'BanesCard' | 'CalCard' | 'Credz' | 'Discover' | 'GoodCard'
  | 'GreenCard' | 'Hiper' | 'JCB' | 'Mais' | 'MaxVan' | 'Policard'
  | 'RedeCompras' | 'Sodexo' | 'ValeCard' | 'Verocheque' | 'VR'
  | 'Ticket' | 'Other';

/** Integration payment type */
export type NfeIntegrationPaymentType = 'Integrated' | 'NotIntegrated';

/** Intermediation type */
export type NfeIntermediationType = 'None' | 'ByOwn' | 'ImportOnBehalf' | 'ByOrder';

/** Tax regime */
export type NfeTaxRegime =
  | 'None' | 'LucroReal' | 'LucroPresumido' | 'SimplesNacional'
  | 'SimplesNacionalExcessoSublimite' | 'MicroempreendedorIndividual' | 'Isento';

/** Special tax regime */
export type NfeSpecialTaxRegime =
  | 'Nenhum' | 'MicroempresaMunicipal' | 'Estimativa'
  | 'SociedadeDeProfissionais' | 'Cooperativa' | 'MicroempreendedorIndividual'
  | 'MicroempresarioEmpresaPequenoPorte' | 'Automatico';

/** State tax processing authorizer */
export type NfeStateTaxProcessingAuthorizer = 'Normal' | 'EPEC';

/** Flow status for file operations */
export type NfeFlowStatus = string;

// Request/Response types — Product Invoices
// ----------------------------------------------------------------------------

/** Address in NF-e context */
export interface NfeAddress {
  /** Street name */
  street?: string;
  /** Street number */
  number?: string;
  /** Additional info (complement) */
  district?: string;
  /** City */
  city?: NfeCity;
  /** State code */
  state?: NfeStateCode;
  /** Postal code (CEP) */
  postalCode?: string;
  /** Country code */
  countryCode?: string;
  /** Country name */
  country?: string;
  /** Additional info */
  additionalInformation?: string;
  [key: string]: unknown;
}

/** City reference */
export interface NfeCity {
  /** IBGE city code */
  code?: string;
  /** City name */
  name?: string;
}

/** Buyer/recipient information for NF-e */
export interface NfeProductInvoiceBuyer {
  /** Buyer name */
  name?: string;
  /** CNPJ or CPF (numeric) */
  federalTaxNumber?: number;
  /** Email */
  email?: string;
  /** Buyer address */
  address?: NfeAddress;
  /** Person type */
  type?: NfePersonType;
  /** State tax number (IE) */
  stateTaxNumber?: string;
  /** State tax indicator */
  stateTaxNumberIndicator?: NfeReceiverStateTaxIndicator;
  /** Trade name */
  tradeName?: string;
  /** ISUF (SUFRAMA registration) */
  isuf?: string;
  [key: string]: unknown;
}

/** Card payment details */
export interface NfeCardResource {
  /** Card flag/brand */
  flagCard?: NfeFlagCard;
  /** Integration type */
  integrationType?: NfeIntegrationPaymentType;
  /** Authorization number */
  authorizationNumber?: string;
  /** Card number */
  cardNumber?: string;
  [key: string]: unknown;
}

/** Payment detail entry */
export interface NfePaymentDetail {
  /** Payment method */
  method?: NfePaymentMethod;
  /** Payment method description */
  methodDescription?: string;
  /** Payment type (cash/term) */
  paymentType?: NfePaymentType;
  /** Payment amount */
  amount?: number;
  /** Card information */
  card?: NfeCardResource;
  /** Payment date */
  paymentDate?: string;
  /** CNPJ transacional do pagamento */
  federalTaxNumberPag?: string;
  /** UF do CNPJ do pagamento */
  statePag?: string;
  [key: string]: unknown;
}

/** Payment group with details and change */
export interface NfePaymentResource {
  /** Payment details */
  paymentDetail?: NfePaymentDetail[];
  /** Change amount (troco) */
  payBack?: number;
}

/** Billing information (cobrança) */
export interface NfeBillingResource {
  /** Invoice reference */
  invoice?: NfeBillingInvoice;
  /** Duplicates (parcelas) */
  duplicates?: NfeDuplicateResource[];
}

/** Billing invoice reference */
export interface NfeBillingInvoice {
  /** Invoice number */
  number?: string;
  /** Original amount */
  originalAmount?: number;
  /** Discount amount */
  discountAmount?: number;
  /** Net amount */
  netAmount?: number;
  [key: string]: unknown;
}

/** Billing duplicate (parcela) */
export interface NfeDuplicateResource {
  /** Duplicate number */
  number?: string;
  /** Expiration date */
  expirationOn?: string;
  /** Amount */
  amount?: number;
}

/** ICMS tax information for an item */
export interface NfeIcmsTaxResource {
  /** Origin of goods */
  origin?: string;
  /** CST (Código de Situação Tributária) */
  cst?: string;
  /** CSOSN (Código de Situação da Operação – Simples Nacional) */
  csosn?: string;
  /** Tax base amount */
  baseTax?: number;
  /** Tax rate (%) */
  rate?: number;
  /** Tax amount */
  amount?: number;
  /** Modality of ICMS base calculation */
  modality?: number;
  /** ICMS ST base amount */
  baseTaxST?: number;
  /** ICMS ST rate */
  rateST?: number;
  /** ICMS ST amount */
  amountST?: number;
  [key: string]: unknown;
}

/** IPI tax information */
export interface NfeIpiTaxResource {
  /** CST */
  cst?: string;
  /** Tax base */
  baseTax?: number;
  /** Rate */
  rate?: number;
  /** Amount */
  amount?: number;
  /** IPI enquadramento code */
  ipiCode?: string;
  [key: string]: unknown;
}

/** PIS tax information */
export interface NfePisTaxResource {
  /** CST */
  cst?: string;
  /** Tax base */
  baseTax?: number;
  /** Rate */
  rate?: number;
  /** Amount */
  amount?: number;
  /** Product quantity base */
  baseTaxProductQuantity?: number;
  /** Product rate (in reais) */
  productRate?: number;
}

/** COFINS tax information */
export interface NfeCofinsTaxResource {
  /** CST */
  cst?: string;
  /** Tax base */
  baseTax?: number;
  /** Rate */
  rate?: number;
  /** Amount */
  amount?: number;
  /** Product quantity base */
  baseTaxProductQuantity?: number;
  /** Product rate (in reais) */
  productRate?: number;
}

/** II (Import tax) information */
export interface NfeIiTaxResource {
  /** Tax base */
  baseTax?: number;
  /** Custom expenses */
  customExpenses?: number;
  /** IOF amount */
  iofAmount?: number;
  /** II amount */
  amount?: number;
}

/** ICMS UF Destination tax (partilha) */
export interface NfeIcmsUfDestinationTaxResource {
  /** Base tax amount */
  baseTax?: number;
  /** FCP rate */
  fcpRate?: number;
  /** Rate */
  rate?: number;
  /** Interestadual rate */
  interestadualRate?: number;
  /** Provisorio rate */
  provisorioRate?: number;
  /** FCP amount */
  fcpAmount?: number;
  /** Destination amount */
  destinationAmount?: number;
  /** Origin amount */
  originAmount?: number;
  [key: string]: unknown;
}

/** Tax information for an invoice item */
export interface NfeInvoiceItemTax {
  /** Total approximate tax value */
  totalTax?: number;
  /** ICMS tax */
  icms?: NfeIcmsTaxResource;
  /** IPI tax */
  ipi?: NfeIpiTaxResource;
  /** II (import) tax */
  ii?: NfeIiTaxResource;
  /** PIS tax */
  pis?: NfePisTaxResource;
  /** COFINS tax */
  cofins?: NfeCofinsTaxResource;
  /** ICMS UF destination */
  icmsDestination?: NfeIcmsUfDestinationTaxResource;
}

/** Tax determination resource for automatic tax calculation */
export interface NfeTaxDeterminationResource {
  /** Operation code for tax determination */
  operationCode?: number;
  /** Issuer tax profile */
  issuerTaxProfile?: string;
  /** Buyer tax profile */
  buyerTaxProfile?: string;
  /** Origin */
  origin?: string;
  /** Acquisition purpose */
  acquisitionPurpose?: string;
}

/** Invoice item (product/service detail) */
export interface NfeInvoiceItemResource {
  /** Product/service code */
  code?: string;
  /** GTIN barcode */
  codeGTIN?: string;
  /** Product/service description */
  description?: string;
  /** NCM code */
  ncm?: string;
  /** NVE codes */
  nve?: string[];
  /** EXTIPI code */
  extipi?: string;
  /** CFOP code */
  cfop?: number;
  /** Commercial unit */
  unit?: string;
  /** Commercial quantity */
  quantity?: number;
  /** Unit amount */
  unitAmount?: number;
  /** Total amount */
  totalAmount?: number;
  /** Tax GTIN */
  codeTaxGTIN?: string;
  /** Tax unit */
  unitTax?: string;
  /** Tax quantity */
  quantityTax?: number;
  /** Tax unit amount */
  taxUnitAmount?: number;
  /** Freight amount */
  freightAmount?: number;
  /** Insurance amount */
  insuranceAmount?: number;
  /** Discount amount */
  discountAmount?: number;
  /** Other expenses */
  othersAmount?: number;
  /** Indicates if value enters total */
  totalIndicator?: boolean;
  /** CEST code */
  cest?: string;
  /** Tax details */
  tax?: NfeInvoiceItemTax;
  /** Additional product information */
  additionalInformation?: string;
  /** Purchase order number */
  numberOrderBuy?: string;
  /** Purchase order item number */
  itemNumberOrderBuy?: number;
  /** FCI number */
  importControlSheetNumber?: string;
  /** Fuel details */
  fuelDetail?: Record<string, unknown>;
  /** Benefit code */
  benefit?: string;
  /** Import declarations */
  importDeclarations?: Record<string, unknown>[];
  /** Export details */
  exportDetails?: Record<string, unknown>[];
  /** Tax determination */
  taxDetermination?: NfeTaxDeterminationResource;
  [key: string]: unknown;
}

/** Transport information for NF-e */
export interface NfeTransportInformation {
  /** Shipping modality */
  shippingModality?: NfeShippingModality;
  /** Transport group (carrier info) */
  transportGroup?: NfeTransportGroupResource;
  /** Volumes */
  volumes?: NfeVolumeResource[];
  [key: string]: unknown;
}

/** Transport group/carrier resource */
export interface NfeTransportGroupResource {
  /** Carrier name */
  name?: string;
  /** CNPJ or CPF */
  federalTaxNumber?: string;
  /** State tax number (IE) */
  stateTaxNumber?: string;
  /** Address (full) */
  address?: string;
  /** City name */
  city?: string;
  /** State code */
  state?: string;
  /** Vehicle plate */
  vehiclePlate?: string;
  /** Vehicle UF */
  vehicleUf?: string;
  /** Vehicle RNTC */
  vehicleRntc?: string;
  [key: string]: unknown;
}

/** Volume resource for transport */
export interface NfeVolumeResource {
  /** Quantity */
  quantity?: number;
  /** Species */
  species?: string;
  /** Brand */
  brand?: string;
  /** Numbering */
  numbering?: string;
  /** Net weight */
  netWeight?: number;
  /** Gross weight */
  grossWeight?: number;
  /** Seal numbers */
  seals?: string[];
  [key: string]: unknown;
}

/** Additional information for the invoice */
export interface NfeAdditionalInformation {
  /** Additional info for tax authority (infAdFisco) */
  taxAdministration?: string;
  /** Complementary info for taxpayer (infCpl) */
  taxpayer?: string;
  /** Referenced processes */
  referencedProcess?: Record<string, unknown>[];
  [key: string]: unknown;
}

/** Export hint and details */
export interface NfeExportResource {
  /** State that generated the invoice */
  exportState?: NfeStateCode;
  /** Export location municipio */
  exportLocation?: string;
  /** Export hint details */
  hint?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Issuer from request (issuer overrides) */
export interface NfeIssuerFromRequest {
  /** IE do Substituto Tributário (IEST) */
  stStateTaxNumber?: string;
}

/** Transaction intermediate resource */
export interface NfeIntermediateResource {
  /** CNPJ of intermediary */
  federalTaxNumber?: number;
  /** Identifier at intermediary */
  identifier?: string;
}

/** Delivery information */
export interface NfeDeliveryInformation {
  /** Account ID */
  accountId?: string;
  /** Entity ID */
  id?: string;
  /** Name */
  name?: string;
  /** CNPJ or CPF */
  federalTaxNumber?: number;
  /** Email */
  email?: string;
  /** Address */
  address?: NfeAddress;
  /** Person type */
  type?: NfePersonType;
  /** State tax number */
  stateTaxNumber?: string;
  [key: string]: unknown;
}

/** Withdrawal information */
export interface NfeWithdrawalInformation {
  /** Account ID */
  accountId?: string;
  /** Entity ID */
  id?: string;
  /** Name */
  name?: string;
  /** CNPJ or CPF */
  federalTaxNumber?: number;
  /** Email */
  email?: string;
  /** Address */
  address?: NfeAddress;
  /** Person type */
  type?: NfePersonType;
  /** State tax number */
  stateTaxNumber?: string;
  [key: string]: unknown;
}

/** Totals (request — partial totals sent on issue) */
export interface NfeTotals {
  /** ICMS total */
  icms?: Record<string, unknown>;
  /** ISSQN total */
  issqn?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Total resource (response — full totals from API) */
export interface NfeTotalResource {
  /** ICMS total */
  icms?: Record<string, unknown>;
  /** ISSQN total */
  issqn?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Authorization details */
export interface NfeAuthorizationResource {
  /** Protocol number */
  protocol?: string;
  /** Authorization date */
  sentOn?: string;
  /** Authorization status */
  status?: string;
  /** Access key (44 digits) */
  accessKey?: string;
  /** Reason */
  reason?: string;
  [key: string]: unknown;
}

/** Contingency details */
export interface NfeContingencyDetails {
  /** Authorizer used */
  authorizer?: NfeStateTaxProcessingAuthorizer;
  /** Start time */
  startedOn?: string;
  /** Reason for contingency */
  reason?: string;
}

/** Activity/event resource */
export interface NfeActivityResource {
  /** Event type */
  type?: string;
  /** Event type description */
  typeDescription?: string;
  /** Sequence number */
  sequence?: number;
  /** Event creation date */
  createdOn?: string;
  /** Event data */
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Events base resource */
export interface NfeInvoiceEventsBase {
  /** List of events */
  events?: NfeActivityResource[];
  /** Whether more events exist */
  hasMore?: boolean;
}

/**
 * Data for issuing a product invoice (NF-e).
 * Corresponds to `ProductInvoiceQueueIssueResource` in the OpenAPI spec.
 */
export interface NfeProductInvoiceIssueData {
  /** Invoice ID (optional, auto-generated) */
  id?: string;
  /** Invoice serie number */
  serie?: number;
  /** Invoice number */
  number?: number;
  /** Operation date/time (UTC ISO 8601) */
  operationOn?: string;
  /** Operation nature description (natOp) */
  operationNature?: string;
  /** Operation type */
  operationType?: NfeOperationType;
  /** Destination */
  destination?: NfeDestination;
  /** DANFE print type */
  printType?: NfePrintType;
  /** Purpose type */
  purposeType?: NfePurposeType;
  /** Consumer type */
  consumerType?: NfeConsumerType;
  /** Consumer presence type */
  presenceType?: NfeConsumerPresenceType;
  /** Contingency date/time */
  contingencyOn?: string;
  /** Contingency justification */
  contingencyJustification?: string;
  /** Buyer information */
  buyer?: NfeProductInvoiceBuyer;
  /** Transport information */
  transport?: NfeTransportInformation;
  /** Additional information */
  additionalInformation?: NfeAdditionalInformation;
  /** Export information */
  export?: NfeExportResource;
  /** Invoice items (products/services) */
  items?: NfeInvoiceItemResource[];
  /** Billing information */
  billing?: NfeBillingResource;
  /** Issuer overrides */
  issuer?: NfeIssuerFromRequest;
  /** Transaction intermediate */
  transactionIntermediate?: NfeIntermediateResource;
  /** Delivery information */
  delivery?: NfeDeliveryInformation;
  /** Withdrawal information */
  withdrawal?: NfeWithdrawalInformation;
  /** Payment groups */
  payment?: NfePaymentResource[];
  /** Totals */
  totals?: NfeTotals;
  [key: string]: unknown;
}

/** Issuer resource (in responses) */
export interface NfeIssuerResource {
  /** Account ID */
  accountId?: string;
  /** Issuer entity ID */
  id?: string;
  /** Name or company name */
  name?: string;
  /** CNPJ or CPF */
  federalTaxNumber?: number;
  /** Email */
  email?: string;
  /** Address */
  address?: NfeAddress;
  /** Person type */
  type?: NfePersonType;
  /** Trade name */
  tradeName?: string;
  /** Opening date */
  openningDate?: string;
  /** Tax regime */
  taxRegime?: NfeTaxRegime;
  /** Special tax regime */
  specialTaxRegime?: NfeSpecialTaxRegime;
  /** Regional tax number (IE) */
  regionalTaxNumber?: number;
  /** Municipal tax number (IM) */
  municipalTaxNumber?: string;
  /** State tax number for ST */
  stStateTaxNumber?: string;
  [key: string]: unknown;
}

/**
 * Full product invoice (NF-e) response.
 * Corresponds to `InvoiceResource` in the OpenAPI spec.
 */
export interface NfeProductInvoice {
  /** Invoice ID */
  id?: string;
  /** Serie number */
  serie?: number;
  /** Invoice number */
  number?: number;
  /** Invoice status */
  status?: NfeInvoiceStatus;
  /** Authorization details */
  authorization?: NfeAuthorizationResource;
  /** Contingency details */
  contingencyDetails?: NfeContingencyDetails;
  /** Operation nature */
  operationNature?: string;
  /** Creation date */
  createdOn?: string;
  /** Modification date */
  modifiedOn?: string;
  /** Operation date */
  operationOn?: string;
  /** Operation type */
  operationType?: NfeOperationType;
  /** Environment type */
  environmentType?: NfeEnvironmentType;
  /** Purpose type */
  purposeType?: NfePurposeType;
  /** Issuer */
  issuer?: NfeIssuerResource;
  /** Buyer */
  buyer?: NfeProductInvoiceBuyer;
  /** Totals */
  totals?: NfeTotalResource;
  /** Transport information */
  transport?: NfeTransportInformation;
  /** Additional information */
  additionalInformation?: NfeAdditionalInformation;
  /** Export information */
  export?: NfeExportResource;
  /** Billing */
  billing?: NfeBillingResource;
  /** Payment groups */
  payment?: NfePaymentResource[];
  /** Transaction intermediate */
  transactionIntermediate?: NfeIntermediateResource;
  /** Delivery information */
  delivery?: NfeDeliveryInformation;
  /** Withdrawal information */
  withdrawal?: NfeWithdrawalInformation;
  /** Last events */
  lastEvents?: NfeInvoiceEventsBase;
  [key: string]: unknown;
}

/** Product invoice without events (used in list responses) */
export interface NfeProductInvoiceWithoutEvents {
  /** Invoice ID */
  id?: string;
  /** Serie number */
  serie?: number;
  /** Invoice number */
  number?: number;
  /** Invoice status */
  status?: NfeInvoiceStatus;
  /** Authorization details */
  authorization?: NfeAuthorizationResource;
  /** Contingency details */
  contingencyDetails?: NfeContingencyDetails;
  /** Operation nature */
  operationNature?: string;
  /** Creation date */
  createdOn?: string;
  /** Modification date */
  modifiedOn?: string;
  /** Operation date */
  operationOn?: string;
  /** Operation type */
  operationType?: NfeOperationType;
  /** Environment type */
  environmentType?: NfeEnvironmentType;
  /** Purpose type */
  purposeType?: NfePurposeType;
  /** Issuer */
  issuer?: NfeIssuerResource;
  /** Buyer */
  buyer?: NfeProductInvoiceBuyer;
  /** Totals */
  totals?: NfeTotalResource;
  /** Transport information */
  transport?: NfeTransportInformation;
  /** Additional information */
  additionalInformation?: NfeAdditionalInformation;
  /** Export information */
  export?: NfeExportResource;
  /** Billing */
  billing?: NfeBillingResource;
  /** Payment groups */
  payment?: NfePaymentResource[];
  /** Transaction intermediate */
  transactionIntermediate?: NfeIntermediateResource;
  /** Delivery information */
  delivery?: NfeDeliveryInformation;
  /** Withdrawal information */
  withdrawal?: NfeWithdrawalInformation;
  [key: string]: unknown;
}

/** Options for listing product invoices (cursor-based pagination) */
export interface NfeProductInvoiceListOptions {
  /** Environment (required) */
  environment: NfeEnvironmentType;
  /** Cursor: start after this ID */
  startingAfter?: string;
  /** Cursor: end before this ID */
  endingBefore?: string;
  /** Number of results per page (default: 10) */
  limit?: number;
  /** ElasticSearch query string */
  q?: string;
}

/** Paginated list of product invoices */
export interface NfeProductInvoiceListResponse {
  /** List of invoices (without events) */
  productInvoices?: NfeProductInvoiceWithoutEvents[];
  /** Whether more results exist */
  hasMore?: boolean;
}

/** Paginated list of invoice items */
export interface NfeInvoiceItemsResponse {
  /** Account ID */
  accountId?: string;
  /** Company ID */
  companyId?: string;
  /** Invoice ID */
  id?: string;
  /** Invoice items */
  items?: NfeInvoiceItemResource[];
  /** Whether more items exist */
  hasMore?: boolean;
}

/** Paginated list of invoice events */
export interface NfeProductInvoiceEventsResponse {
  /** Invoice ID */
  id?: string;
  /** Account ID */
  accountId?: string;
  /** Company ID */
  companyId?: string;
  /** List of events */
  events?: NfeActivityResource[];
  /** Whether more events exist */
  hasMore?: boolean;
}

/** Options for listing items/events (cursor pagination) */
export interface NfeProductInvoiceSubListOptions {
  /** Number of results per page (default: 10) */
  limit?: number;
  /** Cursor: start after (default: 0) */
  startingAfter?: number | string;
}

/** File resource (PDF/XML download response) */
export interface NfeFileResource {
  /** Absolute URI to the file */
  uri?: string;
}

/** Request cancellation response */
export interface NfeRequestCancellationResource {
  /** Account ID */
  accountId?: string;
  /** Company ID */
  companyId?: string;
  /** Product invoice ID */
  productInvoiceId?: string;
  /** Reason for cancellation */
  reason?: string;
}

/** Disablement request data */
export interface NfeDisablementData {
  /** Environment */
  environment: NfeEnvironmentType;
  /** Serie number */
  serie: number;
  /** State code */
  state: NfeStateCode;
  /** Beginning invoice number */
  beginNumber: number;
  /** Last invoice number (same as beginNumber for a single number) */
  lastNumber: number;
  /** Reason for disablement */
  reason?: string;
}

/** Disablement response */
export interface NfeDisablementResource {
  /** Environment */
  environment?: NfeEnvironmentType;
  /** Serie */
  serie?: number;
  /** State code */
  state?: NfeStateCode;
  /** Beginning number */
  beginNumber?: number;
  /** Last number */
  lastNumber?: number;
  /** Reason */
  reason?: string;
}

// ============================================================================
// State Tax (Inscrição Estadual) Types — nf-produto-v2
// ============================================================================

/** State tax type (emission type) */
export type NfeStateTaxType = 'default' | 'nFe' | 'nFCe';

/** State tax environment type */
export type NfeStateTaxEnvironmentType = 'none' | 'production' | 'test';

/** State tax status */
export type NfeStateTaxStatus = 'inactive' | 'none' | 'active';

/** State tax state code (lowercase as in API) */
export type NfeStateTaxStateCode =
  | 'rO' | 'aC' | 'aM' | 'rR' | 'pA' | 'aP' | 'tO'
  | 'mA' | 'pI' | 'cE' | 'rN' | 'pB' | 'pE' | 'aL' | 'sE' | 'bA'
  | 'mG' | 'eS' | 'rJ' | 'sP' | 'pR' | 'sC' | 'rS'
  | 'mS' | 'mT' | 'gO' | 'dF' | 'eX' | 'nA';

/** State tax special tax regime (lowercase as in API) */
export type NfeStateTaxSpecialTaxRegime =
  | 'automatico' | 'nenhum' | 'microempresaMunicipal' | 'estimativa'
  | 'sociedadeDeProfissionais' | 'cooperativa' | 'microempreendedorIndividual'
  | 'microempresarioEmpresaPequenoPorte';

/** Security credential for NFCe */
export interface NfeSecurityCredential {
  /** Credential ID */
  id?: number;
  /** Security code */
  code?: string;
}

/** Full state tax record (response) */
export interface NfeStateTax {
  /** State tax ID */
  id?: string;
  /** Company ID */
  companyId?: string;
  /** Account ID */
  accountId?: string;
  /** State code */
  code?: NfeStateTaxStateCode;
  /** Environment type */
  environmentType?: NfeStateTaxEnvironmentType;
  /** State tax number (IE) */
  taxNumber?: string;
  /** Serie for emission */
  serie?: number;
  /** Number for emission */
  number?: number;
  /** Status */
  status?: NfeStateTaxStatus;
  /** Special tax regime */
  specialTaxRegime?: NfeStateTaxSpecialTaxRegime;
  /** Security credential (for NFCe) */
  securityCredential?: NfeSecurityCredential;
  /** Emission type */
  type?: NfeStateTaxType;
  /** All series for this state tax */
  series?: number[];
  /** Batch ID */
  batchId?: number;
  /** Creation date */
  createdOn?: string;
  /** Modification date */
  modifiedOn?: string;
}

/** Data for creating a state tax registration */
export interface NfeStateTaxCreateData {
  /** State tax number (IE) — required */
  taxNumber: string;
  /** Serie for emission — required */
  serie: number;
  /** Number for emission — required */
  number: number;
  /** State code */
  code?: NfeStateTaxStateCode;
  /** Environment type */
  environmentType?: NfeStateTaxEnvironmentType;
  /** Special tax regime */
  specialTaxRegime?: NfeStateTaxSpecialTaxRegime;
  /** Security credential (for NFCe) */
  securityCredential?: NfeSecurityCredential;
  /** Emission type */
  type?: NfeStateTaxType;
}

/** Data for updating a state tax registration */
export interface NfeStateTaxUpdateData {
  /** State tax number (IE) */
  taxNumber?: string;
  /** Serie for emission */
  serie?: number;
  /** Number for emission */
  number?: number;
  /** State code */
  code?: NfeStateTaxStateCode;
  /** Environment type */
  environmentType?: NfeStateTaxEnvironmentType;
  /** Special tax regime */
  specialTaxRegime?: NfeStateTaxSpecialTaxRegime;
  /** Security credential (for NFCe) */
  securityCredential?: NfeSecurityCredential;
  /** Emission type */
  type?: NfeStateTaxType;
}

/** Paginated list of state tax registrations */
export interface NfeStateTaxListResponse {
  /** List of state taxes */
  stateTaxes?: NfeStateTax[];
}

/** Options for listing state taxes (cursor pagination) */
export interface NfeStateTaxListOptions {
  /** Cursor: start after this ID */
  startingAfter?: string;
  /** Cursor: end before this ID */
  endingBefore?: string;
  /** Number of results per page (default: 10) */
  limit?: number;
}
