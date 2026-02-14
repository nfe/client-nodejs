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
