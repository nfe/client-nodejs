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
 * LegalPeople Resource
 * Manages legal entities (pessoas jurídicas) scoped by company
 */

/**
 * LegalPeople resource for managing legal entities (pessoas jurídicas)
 * All operations are scoped by company_id
 */
declare class LegalPeopleResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * List all legal people for a company
     *
     * @param companyId - Company ID
     * @returns List of legal people
     *
     * @example
     * ```typescript
     * const result = await nfe.legalPeople.list('company-id');
     * console.log(`Found ${result.legalPeople.length} legal entities`);
     * ```
     */
    list(companyId: ResourceId): Promise<ListResponse<LegalPerson>>;
    /**
     * Create a new legal person
     *
     * @param companyId - Company ID
     * @param data - Legal person data
     * @returns Created legal person
     *
     * @example
     * ```typescript
     * const legalPerson = await nfe.legalPeople.create('company-id', {
     *   federalTaxNumber: '12345678901234',
     *   name: 'Empresa Exemplo Ltda',
     *   email: 'contato@empresa.com.br',
     *   address: {
     *     street: 'Av. Paulista, 1000',
     *     neighborhood: 'Bela Vista',
     *     city: { code: '3550308', name: 'São Paulo' },
     *     state: 'SP',
     *     postalCode: '01310-100'
     *     }
     * });
     * ```
     */
    create(companyId: ResourceId, data: Partial<LegalPerson>): Promise<LegalPerson>;
    /**
     * Retrieve a specific legal person
     *
     * @param companyId - Company ID
     * @param legalPersonId - Legal person ID
     * @returns Legal person details
     *
     * @example
     * ```typescript
     * const legalPerson = await nfe.legalPeople.retrieve(
     *   'company-id',
     *   'legal-person-id'
     * );
     * console.log(legalPerson.name);
     * ```
     */
    retrieve(companyId: ResourceId, legalPersonId: ResourceId): Promise<LegalPerson>;
    /**
     * Update a legal person
     *
     * @param companyId - Company ID
     * @param legalPersonId - Legal person ID
     * @param data - Data to update
     * @returns Updated legal person
     *
     * @example
     * ```typescript
     * const updated = await nfe.legalPeople.update(
     *   'company-id',
     *   'legal-person-id',
     *   { email: 'novo@email.com' }
     * );
     * ```
     */
    update(companyId: ResourceId, legalPersonId: ResourceId, data: Partial<LegalPerson>): Promise<LegalPerson>;
    /**
     * Delete a legal person
     *
     * @param companyId - Company ID
     * @param legalPersonId - Legal person ID
     *
     * @example
     * ```typescript
     * await nfe.legalPeople.delete('company-id', 'legal-person-id');
     * ```
     */
    delete(companyId: ResourceId, legalPersonId: ResourceId): Promise<void>;
    /**
     * Create multiple legal people in batch
     *
     * @param companyId - Company ID
     * @param data - Array of legal people data
     * @returns Array of created legal people
     *
     * @example
     * ```typescript
     * const created = await nfe.legalPeople.createBatch('company-id', [
     *   { name: 'Empresa 1', federalTaxNumber: '11111111111111', ... },
     *   { name: 'Empresa 2', federalTaxNumber: '22222222222222', ... }
     * ]);
     * ```
     */
    createBatch(companyId: ResourceId, data: Array<Partial<LegalPerson>>): Promise<LegalPerson[]>;
    /**
     * Find legal person by federal tax number (CNPJ)
     *
     * @param companyId - Company ID
     * @param federalTaxNumber - CNPJ (only numbers)
     * @returns Legal person or undefined if not found
     *
     * @example
     * ```typescript
     * const person = await nfe.legalPeople.findByTaxNumber(
     *   'company-id',
     *   '12345678901234'
     * );
     * if (person) {
     *   console.log('Found:', person.name);
     * }
     * ```
     */
    findByTaxNumber(companyId: ResourceId, federalTaxNumber: string): Promise<LegalPerson | undefined>;
}

/**
 * NaturalPeople Resource
 * Manages natural persons (pessoas físicas) scoped by company
 */

/**
 * NaturalPeople resource for managing natural persons (pessoas físicas)
 * All operations are scoped by company_id
 */
declare class NaturalPeopleResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * List all natural people for a company
     *
     * @param companyId - Company ID
     * @returns List of natural people
     *
     * @example
     * ```typescript
     * const result = await nfe.naturalPeople.list('company-id');
     * console.log(`Found ${result.data.length} natural persons`);
     * ```
     */
    list(companyId: ResourceId): Promise<ListResponse<NaturalPerson>>;
    /**
     * Create a new natural person
     *
     * @param companyId - Company ID
     * @param data - Natural person data
     * @returns Created natural person
     *
     * @example
     * ```typescript
     * const naturalPerson = await nfe.naturalPeople.create('company-id', {
     *   federalTaxNumber: '12345678901',
     *   name: 'João Silva',
     *   email: 'joao@exemplo.com',
     *   address: {
     *     street: 'Rua Exemplo, 123',
     *     neighborhood: 'Centro',
     *     city: { code: '3550308', name: 'São Paulo' },
     *     state: 'SP',
     *     postalCode: '01000-000'
     *   }
     * });
     * ```
     */
    create(companyId: ResourceId, data: Partial<NaturalPerson>): Promise<NaturalPerson>;
    /**
     * Retrieve a specific natural person
     *
     * @param companyId - Company ID
     * @param naturalPersonId - Natural person ID
     * @returns Natural person details
     *
     * @example
     * ```typescript
     * const naturalPerson = await nfe.naturalPeople.retrieve(
     *   'company-id',
     *   'natural-person-id'
     * );
     * console.log(naturalPerson.name);
     * ```
     */
    retrieve(companyId: ResourceId, naturalPersonId: ResourceId): Promise<NaturalPerson>;
    /**
     * Update a natural person
     *
     * @param companyId - Company ID
     * @param naturalPersonId - Natural person ID
     * @param data - Data to update
     * @returns Updated natural person
     *
     * @example
     * ```typescript
     * const updated = await nfe.naturalPeople.update(
     *   'company-id',
     *   'natural-person-id',
     *   { email: 'novo@email.com' }
     * );
     * ```
     */
    update(companyId: ResourceId, naturalPersonId: ResourceId, data: Partial<NaturalPerson>): Promise<NaturalPerson>;
    /**
     * Delete a natural person
     *
     * @param companyId - Company ID
     * @param naturalPersonId - Natural person ID
     *
     * @example
     * ```typescript
     * await nfe.naturalPeople.delete('company-id', 'natural-person-id');
     * ```
     */
    delete(companyId: ResourceId, naturalPersonId: ResourceId): Promise<void>;
    /**
     * Create multiple natural people in batch
     *
     * @param companyId - Company ID
     * @param data - Array of natural people data
     * @returns Array of created natural people
     *
     * @example
     * ```typescript
     * const created = await nfe.naturalPeople.createBatch('company-id', [
     *   { name: 'João Silva', federalTaxNumber: '11111111111', ... },
     *   { name: 'Maria Santos', federalTaxNumber: '22222222222', ... }
     * ]);
     * ```
     */
    createBatch(companyId: ResourceId, data: Array<Partial<NaturalPerson>>): Promise<NaturalPerson[]>;
    /**
     * Find natural person by federal tax number (CPF)
     *
     * @param companyId - Company ID
     * @param federalTaxNumber - CPF (only numbers)
     * @returns Natural person or undefined if not found
     *
     * @example
     * ```typescript
     * const person = await nfe.naturalPeople.findByTaxNumber(
     *   'company-id',
     *   '12345678901'
     * );
     * if (person) {
     *   console.log('Found:', person.name);
     * }
     * ```
     */
    findByTaxNumber(companyId: ResourceId, federalTaxNumber: string): Promise<NaturalPerson | undefined>;
}

/**
 * Webhooks Resource
 * Manages webhook subscriptions for event notifications
 */

/**
 * Webhooks resource for managing event subscriptions
 * All operations are scoped by company_id
 */
declare class WebhooksResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * List all webhooks for a company
     *
     * @param companyId - Company ID
     * @returns List of webhooks
     *
     * @example
     * ```typescript
     * const result = await nfe.webhooks.list('company-id');
     * console.log(`You have ${result.data.length} webhooks configured`);
     * ```
     */
    list(companyId: ResourceId): Promise<ListResponse<Webhook>>;
    /**
     * Create a new webhook subscription
     *
     * @param companyId - Company ID
     * @param data - Webhook configuration
     * @returns Created webhook
     *
     * @example
     * ```typescript
     * const webhook = await nfe.webhooks.create('company-id', {
     *   url: 'https://seu-site.com/webhook/nfe',
     *   events: ['invoice.issued', 'invoice.cancelled'],
     *   secret: 'sua-chave-secreta-opcional'
     * });
     * ```
     */
    create(companyId: ResourceId, data: Partial<Webhook>): Promise<Webhook>;
    /**
     * Retrieve a specific webhook
     *
     * @param companyId - Company ID
     * @param webhookId - Webhook ID
     * @returns Webhook details
     *
     * @example
     * ```typescript
     * const webhook = await nfe.webhooks.retrieve('company-id', 'webhook-id');
     * console.log('Webhook URL:', webhook.url);
     * ```
     */
    retrieve(companyId: ResourceId, webhookId: ResourceId): Promise<Webhook>;
    /**
     * Update a webhook
     *
     * @param companyId - Company ID
     * @param webhookId - Webhook ID
     * @param data - Data to update
     * @returns Updated webhook
     *
     * @example
     * ```typescript
     * const updated = await nfe.webhooks.update(
     *   'company-id',
     *   'webhook-id',
     *   { events: ['invoice.issued', 'invoice.cancelled', 'invoice.failed'] }
     * );
     * ```
     */
    update(companyId: ResourceId, webhookId: ResourceId, data: Partial<Webhook>): Promise<Webhook>;
    /**
     * Delete a webhook
     *
     * @param companyId - Company ID
     * @param webhookId - Webhook ID
     *
     * @example
     * ```typescript
     * await nfe.webhooks.delete('company-id', 'webhook-id');
     * console.log('Webhook deleted');
     * ```
     */
    delete(companyId: ResourceId, webhookId: ResourceId): Promise<void>;
    /**
     * Validate webhook signature
     *
     * Verifies that a webhook request came from NFE.io by validating its signature.
     * This should be used to ensure webhook security.
     *
     * @param payload - Raw webhook payload (as string)
     * @param signature - Signature from X-NFE-Signature header
     * @param secret - Your webhook secret
     * @returns True if signature is valid
     *
     * @example
     * ```typescript
     * // In your webhook endpoint:
     * app.post('/webhook/nfe', async (req, res) => {
     *   const signature = req.headers['x-nfe-signature'];
     *   const payload = JSON.stringify(req.body);
     *
     *   const isValid = nfe.webhooks.validateSignature(
     *     payload,
     *     signature,
     *     'sua-chave-secreta'
     *   );
     *
     *   if (!isValid) {
     *     return res.status(401).send('Invalid signature');
     *   }
     *
     *   // Process webhook...
     * });
     * ```
     */
    validateSignature(payload: string, signature: string, secret: string): boolean;
    /**
     * Test webhook delivery
     *
     * Sends a test event to the webhook URL to verify it's working
     *
     * @param companyId - Company ID
     * @param webhookId - Webhook ID
     * @returns Test result
     *
     * @example
     * ```typescript
     * const result = await nfe.webhooks.test('company-id', 'webhook-id');
     * if (result.success) {
     *   console.log('Webhook is working!');
     * }
     * ```
     */
    test(companyId: ResourceId, webhookId: ResourceId): Promise<{
        success: boolean;
        message?: string;
    }>;
    /**
     * Get available webhook events
     *
     * Returns a list of all available webhook event types
     *
     * @returns List of available events
     *
     * @example
     * ```typescript
     * const events = nfe.webhooks.getAvailableEvents();
     * console.log('Available events:', events);
     * ```
     */
    getAvailableEvents(): WebhookEvent[];
}

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
declare class NfeClient {
    /** @internal HTTP client for making API requests */
    private readonly http;
    /** @internal Normalized client configuration */
    private readonly config;
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
    readonly serviceInvoices: ServiceInvoicesResource;
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
    readonly companies: CompaniesResource;
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
     *
     * @example
     * ```typescript
     * const legalPerson = await nfe.legalPeople.create(companyId, {
     *   federalTaxNumber: '12345678000190',
     *   name: 'Legal Person Company'
     * });
     * ```
     */
    readonly legalPeople: LegalPeopleResource;
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
     *
     * @example
     * ```typescript
     * const naturalPerson = await nfe.naturalPeople.create(companyId, {
     *   federalTaxNumber: '12345678901',
     *   name: 'John Doe'
     * });
     * ```
     */
    readonly naturalPeople: NaturalPeopleResource;
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
     *
     * @example
     * ```typescript
     * const webhook = await nfe.webhooks.create({
     *   url: 'https://example.com/webhook',
     *   events: ['invoice.issued', 'invoice.cancelled']
     * });
     * ```
     */
    readonly webhooks: WebhooksResource;
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
     */
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
    updateConfig(newConfig: Partial<NfeConfig>): void;
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
    setTimeout(timeout: number): void;
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
    setApiKey(apiKey: string): void;
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
    getConfig(): Readonly<RequiredNfeConfig>;
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
    pollUntilComplete<T = ServiceInvoice>(locationUrl: string, options?: PollOptions): Promise<T>;
    private extractPathFromUrl;
    private isCompleteResponse;
    private isFailedResponse;
    private sleep;
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
    healthCheck(): Promise<{
        status: 'ok' | 'error';
        details?: any;
    }>;
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
    getClientInfo(): {
        version: string;
        nodeVersion: string;
        environment: string;
        baseUrl: string;
        hasApiKey: boolean;
    };
}
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
declare function createNfeClient(apiKey: string | NfeConfig): NfeClient;
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
declare function nfe(apiKey: string | NfeConfig): NfeClient;
/**
 * Current SDK version
 * @constant
 */
declare const VERSION = "3.0.0-beta.1";
/**
 * Supported Node.js version range (semver format)
 * @constant
 */
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
/**
 * Core client exports
 *
 * @see {@link NfeClient} - Main client class for NFE.io API
 * @see {@link createNfeClient} - Factory function for creating client instances
 */

/**
 * NPM package name
 * @constant
 */
declare const PACKAGE_NAME = "@nfe-io/sdk";
/**
 * Current SDK version
 * @constant
 */
declare const PACKAGE_VERSION = "3.0.0-beta.1";
/**
 * NFE.io API version supported by this SDK
 * @constant
 */
declare const API_VERSION = "v1";
/**
 * GitHub repository URL
 * @constant
 */
declare const REPOSITORY_URL = "https://github.com/nfe/client-nodejs";
/**
 * Official NFE.io API documentation URL
 * @constant
 */
declare const DOCUMENTATION_URL = "https://nfe.io/docs";
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
declare function isEnvironmentSupported(): {
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
};
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
declare function getRuntimeInfo(): {
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
};
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
declare function createClientFromEnv(environment?: 'production' | 'sandbox'): any;
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
declare function validateApiKeyFormat(apiKey: string): {
    /** Whether the API key passes basic validation */
    valid: boolean;
    /** List of validation issues found */
    issues: string[];
};

export { APIError, API_VERSION, type Address, type ApiErrorResponse, AuthenticationError, BadRequestError, type City, type Company, ConfigurationError, ConflictError, ConnectionError, DOCUMENTATION_URL, type EntityType, ErrorFactory, type ErrorType, ErrorTypes, type HttpResponse, InternalServerError, InvoiceProcessingError, type LegalPerson, type ListResponse, type NaturalPerson, NfeClient, type NfeConfig, NfeError, NotFoundError, PACKAGE_NAME, PACKAGE_VERSION, type PageInfo, type PaginationOptions, type PollOptions, PollingTimeoutError, REPOSITORY_URL, RateLimitError, type RequiredNfeConfig, type ResourceId, type RetryConfig, SUPPORTED_NODE_VERSIONS, ServerError, type ServiceInvoice, type ServiceInvoiceBorrower, type ServiceInvoiceData, type ServiceInvoiceDetails, type ServiceInvoiceStatus, type SpecialTaxRegime, type TaxRegime, TimeoutError, VERSION, ValidationError, type Webhook, type WebhookEvent, createClientFromEnv, createNfeClient, nfe as default, getRuntimeInfo, isAuthenticationError, isConnectionError, isEnvironmentSupported, isNfeError, isNotFoundError, isPollingTimeoutError, isTimeoutError, isValidationError, validateApiKeyFormat };
