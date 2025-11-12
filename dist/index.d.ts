/**
 * NFE.io SDK v3 - Core Types
 *
 * TypeScript definitions for NFE.io API v1
 * Based on current v2 SDK and OpenAPI specs
 */
interface NfeConfig {
    /** NFE.io API Key (required) */
    apiKey: string;
    /** Environment to use */
    environment?: 'production' | 'sandbox';
    /** Custom base URL (overrides environment) */
    baseUrl?: string;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Retry configuration */
    retryConfig?: RetryConfig;
}
interface RetryConfig {
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Base delay between retries in milliseconds */
    baseDelay: number;
    /** Maximum delay between retries in milliseconds */
    maxDelay?: number;
    /** Backoff multiplier */
    backoffMultiplier?: number;
}
interface HttpConfig {
    baseUrl: string;
    apiKey: string;
    timeout: number;
    retryConfig: RetryConfig;
}
interface HttpResponse<T = unknown> {
    data: T;
    status: number;
    headers: Record<string, string>;
}
interface AsyncResponse {
    code: 202;
    status: 'pending';
    location: string;
}
interface Address {
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
interface City {
    /** IBGE city code */
    code: string;
    /** City name */
    name: string;
}
type EntityType = 'NaturalPerson' | 'LegalEntity';
type TaxRegime = 'Isento' | 'MicroempreendedorIndividual' | 'SimplesNacional' | 'LucroPresumido' | 'LucroReal';
type SpecialTaxRegime = 'Automatico' | 'Nenhum' | 'MicroempresaMunicipal' | 'Estimativa' | 'SociedadeDeProfissionais' | 'Cooperativa' | 'MicroempreendedorIndividual' | 'MicroempresarioEmpresaPequenoPorte';
interface Company {
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
interface LegalPerson {
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
interface NaturalPerson {
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
interface ServiceInvoiceData {
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
interface ServiceInvoiceBorrower {
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
interface ServiceInvoiceDetails {
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
interface ServiceInvoice {
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
type ServiceInvoiceStatus = 'pending' | 'processing' | 'issued' | 'cancelled' | 'failed';
interface Webhook {
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
type WebhookEvent = 'invoice.created' | 'invoice.issued' | 'invoice.cancelled' | 'invoice.failed';
interface ListResponse<T> {
    /** Response data array */
    data: T[];
    /** Total count (if available) */
    totalCount?: number;
    /** Page information */
    page?: PageInfo;
}
interface PageInfo {
    /** Current page index */
    pageIndex: number;
    /** Items per page */
    pageCount: number;
    /** Has next page */
    hasNext?: boolean;
    /** Has previous page */
    hasPrevious?: boolean;
}
interface PaginationOptions extends Record<string, unknown> {
    /** Page index (0-based) */
    pageIndex?: number;
    /** Items per page */
    pageCount?: number;
}
interface PollOptions {
    /** Maximum number of polling attempts */
    maxAttempts?: number;
    /** Interval between attempts in milliseconds */
    intervalMs?: number;
}
type RequiredNfeConfig = Required<NfeConfig>;
/** Extract resource ID from response or input */
type ResourceId = string;
/** Generic API error response */
interface ApiErrorResponse {
    code: number;
    message: string;
    details?: unknown;
}

/**
 * NFE.io SDK v3 - HTTP Client with Fetch API
 *
 * Modern HTTP client using native fetch (Node.js 18+)
 * Zero external dependencies with automatic retries and proper error handling
 */

declare class HttpClient {
    private readonly config;
    constructor(config: HttpConfig);
    get<T = unknown>(path: string, params?: Record<string, unknown>): Promise<HttpResponse<T>>;
    post<T = unknown>(path: string, data?: unknown): Promise<HttpResponse<T>>;
    put<T = unknown>(path: string, data?: unknown): Promise<HttpResponse<T>>;
    delete<T = unknown>(path: string): Promise<HttpResponse<T>>;
    private request;
    private executeRequest;
    private processResponse;
    private parseResponseData;
    private handleErrorResponse;
    private extractErrorMessage;
    private buildUrl;
    private buildHeaders;
    private buildBody;
    private isFormData;
    private getUserAgent;
    private extractHeaders;
    private shouldNotRetry;
    private calculateRetryDelay;
    private sleep;
    private validateFetchSupport;
}

/**
 * NFE.io SDK v3 - Service Invoices Resource
 *
 * Handles service invoice operations (NFS-e)
 * This is the core functionality of NFE.io API
 */

declare class ServiceInvoicesResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Create a new service invoice
     * Returns 202 + location for async processing (NFE.io pattern)
     */
    create(companyId: string, data: ServiceInvoiceData): Promise<ServiceInvoice | AsyncResponse>;
    /**
     * List service invoices for a company
     */
    list(companyId: string, options?: PaginationOptions): Promise<ListResponse<ServiceInvoice>>;
    /**
     * Retrieve a specific service invoice
     */
    retrieve(companyId: string, invoiceId: string): Promise<ServiceInvoice>;
    /**
     * Cancel a service invoice
     */
    cancel(companyId: string, invoiceId: string): Promise<ServiceInvoice>;
    /**
     * Send invoice via email
     */
    sendEmail(companyId: string, invoiceId: string): Promise<{
        sent: boolean;
        message?: string;
    }>;
    /**
     * Download invoice PDF
     */
    downloadPdf(companyId: string, invoiceId?: string): Promise<any>;
    /**
     * Download invoice XML
     */
    downloadXml(companyId: string, invoiceId?: string): Promise<any>;
    /**
     * Create invoice and wait for completion (handles async processing)
     */
    createAndWait(companyId: string, data: ServiceInvoiceData, options?: {
        maxAttempts?: number;
        intervalMs?: number;
        timeoutMs?: number;
    }): Promise<ServiceInvoice>;
    /**
     * Get invoice status (high-level wrapper)
     */
    getStatus(companyId: string, invoiceId: string): Promise<{
        status: string;
        invoice: ServiceInvoice;
        isComplete: boolean;
        isFailed: boolean;
    }>;
    /**
     * Bulk operations: Create multiple invoices
     */
    createBatch(companyId: string, invoices: ServiceInvoiceData[], options?: {
        waitForCompletion?: boolean;
        maxConcurrent?: number;
    }): Promise<Array<ServiceInvoice | AsyncResponse>>;
    private pollInvoiceCompletion;
    private extractPathFromLocationUrl;
    private isInvoiceComplete;
    private isInvoiceFailed;
    private sleep;
}

/**
 * NFE.io SDK v3 - Companies Resource
 *
 * Handles company operations and certificate management
 */

declare class CompaniesResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Create a new company
     */
    create(data: Omit<Company, 'id' | 'createdOn' | 'modifiedOn'>): Promise<Company>;
    /**
     * List companies
     */
    list(options?: PaginationOptions): Promise<ListResponse<Company>>;
    /**
     * Retrieve a specific company
     */
    retrieve(companyId: string): Promise<Company>;
    /**
     * Update a company
     */
    update(companyId: string, data: Partial<Company>): Promise<Company>;
    /**
     * Delete a company (named 'remove' to avoid JS keyword conflict)
     */
    remove(companyId: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
    /**
     * Upload digital certificate for a company
     * Handles FormData for file upload
     */
    uploadCertificate(companyId: string, certificateData: {
        /** Certificate file (Buffer or Blob) */
        file: any;
        /** Certificate password */
        password: string;
        /** Optional filename */
        filename?: string;
    }): Promise<{
        uploaded: boolean;
        message?: string;
    }>;
    /**
     * Get certificate status for a company
     */
    getCertificateStatus(companyId: string): Promise<{
        hasCertificate: boolean;
        expiresOn?: string;
        isValid?: boolean;
        details?: any;
    }>;
    /**
     * Find company by CNPJ/CPF
     */
    findByTaxNumber(taxNumber: number): Promise<Company | null>;
    /**
     * Get companies with active certificates
     */
    getCompaniesWithCertificates(): Promise<Company[]>;
    /**
     * Bulk create companies
     */
    createBatch(companies: Array<Omit<Company, 'id' | 'createdOn' | 'modifiedOn'>>, options?: {
        maxConcurrent?: number;
        continueOnError?: boolean;
    }): Promise<Array<Company | {
        error: string;
        data: any;
    }>>;
    private createFormData;
}

/**
 * NFE.io SDK v3 - Main Client
 *
 * Modern TypeScript client for NFE.io API with zero runtime dependencies
 * Compatible with Node.js 18+ and any JavaScript environment
 */

declare class NfeClient {
    private readonly http;
    private readonly config;
    readonly serviceInvoices: ServiceInvoicesResource;
    readonly companies: CompaniesResource;
    constructor(config: NfeConfig);
    private validateAndNormalizeConfig;
    private getDefaultBaseUrl;
    private getBaseUrl;
    private getEnvironmentVariable;
    private validateEnvironment;
    private validateNodeVersion;
    private getNodeVersion;
    private extractMajorVersion;
    /**
     * Update client configuration
     */
    updateConfig(newConfig: Partial<NfeConfig>): void;
    /**
     * Set timeout for requests (maintains v2 compatibility)
     */
    setTimeout(timeout: number): void;
    /**
     * Set API key (maintains v2 compatibility)
     */
    setApiKey(apiKey: string): void;
    /**
     * Get current configuration (readonly)
     */
    getConfig(): Readonly<RequiredNfeConfig>;
    /**
     * Poll a resource until completion or timeout
     * This is critical for NFE.io's async invoice processing (202 responses)
     */
    pollUntilComplete<T = ServiceInvoice>(locationUrl: string, options?: PollOptions): Promise<T>;
    private extractPathFromUrl;
    private isCompleteResponse;
    private isFailedResponse;
    private sleep;
    /**
     * Check if the client is properly configured and can reach the API
     */
    healthCheck(): Promise<{
        status: 'ok' | 'error';
        details?: any;
    }>;
    /**
     * Get client information for debugging
     */
    getClientInfo(): {
        version: string;
        nodeVersion: string;
        environment: string;
        baseUrl: string;
        hasApiKey: boolean;
    };
}
/**
 * Create NFE.io client instance (maintains v2 compatibility)
 * @param apiKey API key or full config object
 * @param version Ignored in v3 (maintained for compatibility)
 */
declare function createNfeClient(apiKey: string | NfeConfig, _version?: string): NfeClient;
/**
 * Default export factory function (maintains v2 compatibility)
 */
declare function nfe(apiKey: string | NfeConfig, _version?: string): NfeClient;
declare const VERSION = "3.0.0-beta.1";
declare const SUPPORTED_NODE_VERSIONS = ">=18.0.0";

/**
 * NFE.io SDK v3 - Error Classes
 *
 * Comprehensive error handling system that maintains compatibility
 * with v2 error types while providing modern TypeScript benefits
 */
declare class NfeError extends Error {
    readonly type: string;
    readonly code?: number | undefined;
    readonly details?: unknown;
    readonly raw?: unknown;
    constructor(message: string, details?: unknown, code?: number);
    /** Convert error to JSON for logging/debugging */
    toJSON(): {
        type: string;
        name: string;
        message: string;
        code: number | undefined;
        details: unknown;
        stack: string | undefined;
    };
}
declare class AuthenticationError extends NfeError {
    readonly type = "AuthenticationError";
    constructor(message?: string, details?: unknown);
}
declare class ValidationError extends NfeError {
    readonly type = "ValidationError";
    constructor(message?: string, details?: unknown);
}
declare class NotFoundError extends NfeError {
    readonly type = "NotFoundError";
    constructor(message?: string, details?: unknown);
}
declare class ConflictError extends NfeError {
    readonly type = "ConflictError";
    constructor(message?: string, details?: unknown);
}
declare class RateLimitError extends NfeError {
    readonly type = "RateLimitError";
    constructor(message?: string, details?: unknown);
}
declare class ServerError extends NfeError {
    readonly type = "ServerError";
    constructor(message?: string, details?: unknown, code?: number);
}
declare class ConnectionError extends NfeError {
    readonly type = "ConnectionError";
    constructor(message?: string, details?: unknown);
}
declare class TimeoutError extends NfeError {
    readonly type = "TimeoutError";
    constructor(message?: string, details?: unknown);
}
declare class ConfigurationError extends NfeError {
    readonly type = "ConfigurationError";
    constructor(message?: string, details?: unknown);
}
declare class PollingTimeoutError extends NfeError {
    readonly type = "PollingTimeoutError";
    constructor(message?: string, details?: unknown);
}
declare class InvoiceProcessingError extends NfeError {
    readonly type = "InvoiceProcessingError";
    constructor(message?: string, details?: unknown);
}
declare class ErrorFactory {
    /**
     * Create error from HTTP response (maintains v2 ResourceError.generate pattern)
     */
    static fromHttpResponse(status: number, data?: unknown, message?: string): NfeError;
    /**
     * Create error from fetch/network issues
     */
    static fromNetworkError(error: Error): NfeError;
    /**
     * Create error from Node.js version check
     */
    static fromNodeVersionError(nodeVersion: string): ConfigurationError;
    /**
     * Create error from missing API key
     */
    static fromMissingApiKey(): ConfigurationError;
    private static getDefaultMessage;
}
declare function isNfeError(error: unknown): error is NfeError;
declare function isAuthenticationError(error: unknown): error is AuthenticationError;
declare function isValidationError(error: unknown): error is ValidationError;
declare function isNotFoundError(error: unknown): error is NotFoundError;
declare function isConnectionError(error: unknown): error is ConnectionError;
declare function isTimeoutError(error: unknown): error is TimeoutError;
declare function isPollingTimeoutError(error: unknown): error is PollingTimeoutError;
/** @deprecated Use ValidationError instead */
declare const BadRequestError: typeof ValidationError;
/** @deprecated Use NfeError instead */
declare const APIError: typeof NfeError;
/** @deprecated Use ServerError instead */
declare const InternalServerError: typeof ServerError;
declare const ErrorTypes: {
    readonly NfeError: typeof NfeError;
    readonly AuthenticationError: typeof AuthenticationError;
    readonly ValidationError: typeof ValidationError;
    readonly NotFoundError: typeof NotFoundError;
    readonly ConflictError: typeof ConflictError;
    readonly RateLimitError: typeof RateLimitError;
    readonly ServerError: typeof ServerError;
    readonly ConnectionError: typeof ConnectionError;
    readonly TimeoutError: typeof TimeoutError;
    readonly ConfigurationError: typeof ConfigurationError;
    readonly PollingTimeoutError: typeof PollingTimeoutError;
    readonly InvoiceProcessingError: typeof InvoiceProcessingError;
    readonly BadRequestError: typeof ValidationError;
    readonly APIError: typeof NfeError;
    readonly InternalServerError: typeof ServerError;
};
type ErrorType = keyof typeof ErrorTypes;

/**
 * NFE.io SDK v3 - Main Entry Point
 *
 * Modern TypeScript SDK for NFE.io API with zero runtime dependencies
 * Compatible with Node.js 18+ and any JavaScript runtime
 */

declare const PACKAGE_NAME = "@nfe-io/sdk";
declare const PACKAGE_VERSION = "3.0.0-beta.1";
declare const API_VERSION = "v1";
declare const REPOSITORY_URL = "https://github.com/nfe/client-nodejs";
declare const DOCUMENTATION_URL = "https://nfe.io/docs";
/**
 * Check if the current environment supports NFE.io SDK v3
 */
declare function isEnvironmentSupported(): {
    supported: boolean;
    nodeVersion?: string;
    hasFetch: boolean;
    hasAbortController: boolean;
    issues: string[];
};
/**
 * Get SDK runtime information
 */
declare function getRuntimeInfo(): {
    sdkVersion: string;
    nodeVersion: string;
    platform: string;
    arch: string;
    environment: 'node' | 'browser' | 'unknown';
};
/**
 * Quick start: Create client from environment variable
 * Reads NFE_API_KEY from environment variables
 */
declare function createClientFromEnv(environment?: 'production' | 'sandbox'): any;
/**
 * Quick start: Validate API key format
 */
declare function validateApiKeyFormat(apiKey: string): {
    valid: boolean;
    issues: string[];
};

export { APIError, API_VERSION, type Address, type ApiErrorResponse, AuthenticationError, BadRequestError, type City, type Company, ConfigurationError, ConflictError, ConnectionError, DOCUMENTATION_URL, type EntityType, ErrorFactory, type ErrorType, ErrorTypes, type HttpResponse, InternalServerError, InvoiceProcessingError, type LegalPerson, type ListResponse, type NaturalPerson, NfeClient, type NfeConfig, NfeError, NotFoundError, PACKAGE_NAME, PACKAGE_VERSION, type PageInfo, type PaginationOptions, type PollOptions, PollingTimeoutError, REPOSITORY_URL, RateLimitError, type RequiredNfeConfig, type ResourceId, type RetryConfig, SUPPORTED_NODE_VERSIONS, ServerError, type ServiceInvoice, type ServiceInvoiceBorrower, type ServiceInvoiceData, type ServiceInvoiceDetails, type ServiceInvoiceStatus, type SpecialTaxRegime, type TaxRegime, TimeoutError, VERSION, ValidationError, type Webhook, type WebhookEvent, createClientFromEnv, createNfeClient, nfe as default, getRuntimeInfo, isAuthenticationError, isConnectionError, isEnvironmentSupported, isNfeError, isNotFoundError, isPollingTimeoutError, isTimeoutError, isValidationError, validateApiKeyFormat };
