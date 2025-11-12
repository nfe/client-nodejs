// NFE.io SDK v3 - https://nfe.io
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/core/errors/index.ts
var errors_exports = {};
__export(errors_exports, {
  APIError: () => APIError,
  AuthenticationError: () => AuthenticationError,
  BadRequestError: () => BadRequestError,
  ConfigurationError: () => ConfigurationError,
  ConflictError: () => ConflictError,
  ConnectionError: () => ConnectionError,
  ErrorFactory: () => ErrorFactory,
  ErrorTypes: () => ErrorTypes,
  InternalServerError: () => InternalServerError,
  InvoiceProcessingError: () => InvoiceProcessingError,
  NfeError: () => NfeError,
  NotFoundError: () => NotFoundError,
  PollingTimeoutError: () => PollingTimeoutError,
  RateLimitError: () => RateLimitError,
  ServerError: () => ServerError,
  TimeoutError: () => TimeoutError,
  ValidationError: () => ValidationError,
  isAuthenticationError: () => isAuthenticationError,
  isConnectionError: () => isConnectionError,
  isNfeError: () => isNfeError,
  isNotFoundError: () => isNotFoundError,
  isPollingTimeoutError: () => isPollingTimeoutError,
  isTimeoutError: () => isTimeoutError,
  isValidationError: () => isValidationError
});
function isNfeError(error) {
  return error instanceof NfeError;
}
function isAuthenticationError(error) {
  return error instanceof AuthenticationError;
}
function isValidationError(error) {
  return error instanceof ValidationError;
}
function isNotFoundError(error) {
  return error instanceof NotFoundError;
}
function isConnectionError(error) {
  return error instanceof ConnectionError;
}
function isTimeoutError(error) {
  return error instanceof TimeoutError;
}
function isPollingTimeoutError(error) {
  return error instanceof PollingTimeoutError;
}
var NfeError, AuthenticationError, ValidationError, NotFoundError, ConflictError, RateLimitError, ServerError, ConnectionError, TimeoutError, ConfigurationError, PollingTimeoutError, InvoiceProcessingError, ErrorFactory, BadRequestError, APIError, InternalServerError, ErrorTypes;
var init_errors = __esm({
  "src/core/errors/index.ts"() {
    NfeError = class extends Error {
      type = "NfeError";
      code;
      details;
      raw;
      constructor(message, details, code) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
        this.raw = details;
        Object.setPrototypeOf(this, new.target.prototype);
        if ("captureStackTrace" in Error && typeof Error.captureStackTrace === "function") {
          Error.captureStackTrace(this, this.constructor);
        }
      }
      /** Convert error to JSON for logging/debugging */
      toJSON() {
        return {
          type: this.type,
          name: this.name,
          message: this.message,
          code: this.code,
          details: this.details,
          stack: this.stack
        };
      }
    };
    AuthenticationError = class extends NfeError {
      type = "AuthenticationError";
      constructor(message = "Invalid API key or authentication failed", details) {
        super(message, details, 401);
      }
    };
    ValidationError = class extends NfeError {
      type = "ValidationError";
      constructor(message = "Invalid request data", details) {
        super(message, details, 400);
      }
    };
    NotFoundError = class extends NfeError {
      type = "NotFoundError";
      constructor(message = "Resource not found", details) {
        super(message, details, 404);
      }
    };
    ConflictError = class extends NfeError {
      type = "ConflictError";
      constructor(message = "Resource conflict", details) {
        super(message, details, 409);
      }
    };
    RateLimitError = class extends NfeError {
      type = "RateLimitError";
      constructor(message = "Rate limit exceeded", details) {
        super(message, details, 429);
      }
    };
    ServerError = class extends NfeError {
      type = "ServerError";
      constructor(message = "Internal server error", details, code = 500) {
        super(message, details, code);
      }
    };
    ConnectionError = class extends NfeError {
      type = "ConnectionError";
      constructor(message = "Connection error", details) {
        super(message, details);
      }
    };
    TimeoutError = class extends NfeError {
      type = "TimeoutError";
      constructor(message = "Request timeout", details) {
        super(message, details);
      }
    };
    ConfigurationError = class extends NfeError {
      type = "ConfigurationError";
      constructor(message = "SDK configuration error", details) {
        super(message, details);
      }
    };
    PollingTimeoutError = class extends NfeError {
      type = "PollingTimeoutError";
      constructor(message = "Polling timeout - operation still in progress", details) {
        super(message, details);
      }
    };
    InvoiceProcessingError = class extends NfeError {
      type = "InvoiceProcessingError";
      constructor(message = "Invoice processing failed", details) {
        super(message, details);
      }
    };
    ErrorFactory = class {
      /**
       * Create error from HTTP response (maintains v2 ResourceError.generate pattern)
       */
      static fromHttpResponse(status, data, message) {
        const errorMessage = message || this.getDefaultMessage(status);
        switch (status) {
          case 400:
            return new ValidationError(errorMessage, data);
          case 401:
            return new AuthenticationError(errorMessage, data);
          case 404:
            return new NotFoundError(errorMessage, data);
          case 409:
            return new ConflictError(errorMessage, data);
          case 429:
            return new RateLimitError(errorMessage, data);
          case 500:
          case 502:
          case 503:
          case 504:
            return new ServerError(errorMessage, data, status);
          default:
            if (status >= 400 && status < 500) {
              return new ValidationError(errorMessage, data);
            }
            if (status >= 500) {
              return new ServerError(errorMessage, data, status);
            }
            return new NfeError(errorMessage, data, status);
        }
      }
      /**
       * Create error from fetch/network issues
       */
      static fromNetworkError(error) {
        if (error.name === "AbortError" || error.message.includes("timeout")) {
          return new TimeoutError("Request timeout", error);
        }
        if (error.message.includes("fetch")) {
          return new ConnectionError("Network connection failed", error);
        }
        return new ConnectionError("Connection error", error);
      }
      /**
       * Create error from Node.js version check
       */
      static fromNodeVersionError(nodeVersion) {
        return new ConfigurationError(
          `NFE.io SDK v3 requires Node.js 18+ (for native fetch support). Current version: ${nodeVersion}`,
          { nodeVersion, requiredVersion: ">=18.0.0" }
        );
      }
      /**
       * Create error from missing API key
       */
      static fromMissingApiKey() {
        return new ConfigurationError(
          "API key is required. Pass it in NfeConfig or set NFE_API_KEY environment variable.",
          { configField: "apiKey" }
        );
      }
      static getDefaultMessage(status) {
        const messages = {
          400: "Invalid request data",
          401: "Invalid API key or authentication failed",
          403: "Access forbidden",
          404: "Resource not found",
          409: "Resource conflict",
          429: "Rate limit exceeded",
          500: "Internal server error",
          502: "Bad gateway",
          503: "Service unavailable",
          504: "Gateway timeout"
        };
        return messages[status] || `HTTP ${status} error`;
      }
    };
    BadRequestError = ValidationError;
    APIError = NfeError;
    InternalServerError = ServerError;
    ErrorTypes = {
      NfeError,
      AuthenticationError,
      ValidationError,
      NotFoundError,
      ConflictError,
      RateLimitError,
      ServerError,
      ConnectionError,
      TimeoutError,
      ConfigurationError,
      PollingTimeoutError,
      InvoiceProcessingError,
      // Legacy aliases
      BadRequestError,
      APIError,
      InternalServerError
    };
  }
});

// src/core/http/client.ts
function createDefaultRetryConfig() {
  return {
    maxRetries: 3,
    baseDelay: 1e3,
    maxDelay: 3e4,
    backoffMultiplier: 2
  };
}
function buildHttpConfig(apiKey, baseUrl, timeout, retryConfig) {
  return {
    apiKey,
    baseUrl,
    timeout,
    retryConfig
  };
}
var HttpClient;
var init_client = __esm({
  "src/core/http/client.ts"() {
    init_errors();
    HttpClient = class {
      config;
      constructor(config) {
        this.config = config;
        this.validateFetchSupport();
      }
      // --------------------------------------------------------------------------
      // Public HTTP Methods
      // --------------------------------------------------------------------------
      async get(path, params) {
        const url = this.buildUrl(path, params);
        return this.request("GET", url);
      }
      async post(path, data) {
        const url = this.buildUrl(path);
        return this.request("POST", url, data);
      }
      async put(path, data) {
        const url = this.buildUrl(path);
        return this.request("PUT", url, data);
      }
      async delete(path) {
        const url = this.buildUrl(path);
        return this.request("DELETE", url);
      }
      // --------------------------------------------------------------------------
      // Core Request Method with Retry Logic
      // --------------------------------------------------------------------------
      async request(method, url, data) {
        const { maxRetries, baseDelay } = this.config.retryConfig;
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const response = await this.executeRequest(method, url, data);
            return response;
          } catch (error) {
            lastError = error;
            if (this.shouldNotRetry(lastError, attempt, maxRetries)) {
              throw lastError;
            }
            if (attempt < maxRetries) {
              const delay = this.calculateRetryDelay(attempt, baseDelay);
              await this.sleep(delay);
            }
          }
        }
        throw lastError || new ConnectionError("Request failed after all retries");
      }
      // --------------------------------------------------------------------------
      // Single Request Execution
      // --------------------------------------------------------------------------
      async executeRequest(method, url, data) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        try {
          const headers = this.buildHeaders(data);
          const body = this.buildBody(data);
          const response = await fetch(url, {
            method: method.toUpperCase(),
            headers,
            body,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          return await this.processResponse(response);
        } catch (error) {
          clearTimeout(timeoutId);
          if (error instanceof Error) {
            if (error.name === "AbortError") {
              throw new TimeoutError(`Request timeout after ${this.config.timeout}ms`, error);
            }
            throw ErrorFactory.fromNetworkError(error);
          }
          throw new ConnectionError("Unknown network error", error);
        }
      }
      // --------------------------------------------------------------------------
      // Response Processing
      // --------------------------------------------------------------------------
      async processResponse(response) {
        if (response.status === 202) {
          const location = response.headers.get("location");
          if (location) {
            return {
              data: {
                code: 202,
                status: "pending",
                location
              },
              status: response.status,
              headers: this.extractHeaders(response)
            };
          }
        }
        if (!response.ok) {
          await this.handleErrorResponse(response);
        }
        const data = await this.parseResponseData(response);
        return {
          data,
          status: response.status,
          headers: this.extractHeaders(response)
        };
      }
      async parseResponseData(response) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          return response.json();
        }
        if (contentType.includes("application/pdf") || contentType.includes("application/xml")) {
          const buffer = await response.arrayBuffer();
          return Buffer.from(buffer);
        }
        return response.text();
      }
      async handleErrorResponse(response) {
        let errorData;
        try {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            errorData = await response.json();
          } else {
            errorData = await response.text();
          }
        } catch {
          errorData = { status: response.status, statusText: response.statusText };
        }
        const message = this.extractErrorMessage(errorData, response.status);
        throw ErrorFactory.fromHttpResponse(response.status, errorData, message);
      }
      extractErrorMessage(data, status) {
        if (typeof data === "object" && data !== null) {
          const errorObj = data;
          if (typeof errorObj.message === "string") return errorObj.message;
          if (typeof errorObj.error === "string") return errorObj.error;
          if (typeof errorObj.detail === "string") return errorObj.detail;
          if (typeof errorObj.details === "string") return errorObj.details;
        }
        if (typeof data === "string") {
          return data;
        }
        return `HTTP ${status} error`;
      }
      // --------------------------------------------------------------------------
      // URL and Header Building
      // --------------------------------------------------------------------------
      buildUrl(path, params) {
        const baseUrl = this.config.baseUrl.replace(/\/$/, "");
        const cleanPath = path.replace(/^\//, "");
        let url = `${baseUrl}/${cleanPath}`;
        if (params && Object.keys(params).length > 0) {
          const searchParams = new URLSearchParams();
          for (const [key, value] of Object.entries(params)) {
            if (value !== void 0 && value !== null) {
              searchParams.append(key, String(value));
            }
          }
          const queryString = searchParams.toString();
          if (queryString) {
            url += `?${queryString}`;
          }
        }
        return url;
      }
      buildHeaders(data) {
        const headers = {
          "Authorization": `Basic ${Buffer.from(this.config.apiKey).toString("base64")}`,
          "Accept": "application/json",
          "User-Agent": this.getUserAgent()
        };
        if (data !== void 0 && data !== null && !this.isFormData(data)) {
          headers["Content-Type"] = "application/json";
        }
        return headers;
      }
      buildBody(data) {
        if (data === void 0 || data === null) {
          return void 0;
        }
        if (this.isFormData(data)) {
          return data;
        }
        return JSON.stringify(data);
      }
      isFormData(data) {
        return typeof FormData !== "undefined" && data instanceof FormData;
      }
      getUserAgent() {
        const nodeVersion = process.version;
        const platform = process.platform;
        const packageVersion = "3.0.0-beta.1";
        return `@nfe-io/sdk@${packageVersion} node/${nodeVersion} (${platform})`;
      }
      extractHeaders(response) {
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return headers;
      }
      // --------------------------------------------------------------------------
      // Retry Logic
      // --------------------------------------------------------------------------
      shouldNotRetry(error, attempt, maxRetries) {
        if (attempt >= maxRetries) {
          return true;
        }
        if (error instanceof RateLimitError) {
          return false;
        }
        if (error.code && error.code >= 400 && error.code < 500) {
          return error.code !== 401;
        }
        return false;
      }
      calculateRetryDelay(attempt, baseDelay) {
        const { maxDelay = 3e4, backoffMultiplier = 2 } = this.config.retryConfig;
        const exponentialDelay = baseDelay * Math.pow(backoffMultiplier, attempt);
        const jitter = Math.random() * 0.1 * exponentialDelay;
        return Math.min(exponentialDelay + jitter, maxDelay);
      }
      sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      // --------------------------------------------------------------------------
      // Validation
      // --------------------------------------------------------------------------
      validateFetchSupport() {
        if (typeof fetch === "undefined") {
          throw ErrorFactory.fromNodeVersionError(process.version);
        }
        if (typeof AbortController === "undefined") {
          throw new ConnectionError(
            "AbortController is not available. This should not happen in Node.js 18+."
          );
        }
      }
    };
  }
});

// src/core/resources/service-invoices.ts
var ServiceInvoicesResource;
var init_service_invoices = __esm({
  "src/core/resources/service-invoices.ts"() {
    init_errors();
    ServiceInvoicesResource = class {
      constructor(http) {
        this.http = http;
      }
      // --------------------------------------------------------------------------
      // Core CRUD Operations
      // --------------------------------------------------------------------------
      /**
       * Create a new service invoice
       * Returns 202 + location for async processing (NFE.io pattern)
       */
      async create(companyId, data) {
        const path = `/companies/${companyId}/serviceinvoices`;
        const response = await this.http.post(path, data);
        return response.data;
      }
      /**
       * List service invoices for a company
       */
      async list(companyId, options = {}) {
        const path = `/companies/${companyId}/serviceinvoices`;
        const response = await this.http.get(path, options);
        return response.data;
      }
      /**
       * Retrieve a specific service invoice
       */
      async retrieve(companyId, invoiceId) {
        const path = `/companies/${companyId}/serviceinvoices/${invoiceId}`;
        const response = await this.http.get(path);
        return response.data;
      }
      /**
       * Cancel a service invoice
       */
      async cancel(companyId, invoiceId) {
        const path = `/companies/${companyId}/serviceinvoices/${invoiceId}`;
        const response = await this.http.delete(path);
        return response.data;
      }
      // --------------------------------------------------------------------------
      // Email Operations
      // --------------------------------------------------------------------------
      /**
       * Send invoice via email
       */
      async sendEmail(companyId, invoiceId) {
        const path = `/companies/${companyId}/serviceinvoices/${invoiceId}/sendemail`;
        const response = await this.http.put(path);
        return response.data;
      }
      // --------------------------------------------------------------------------
      // File Downloads
      // --------------------------------------------------------------------------
      /**
       * Download invoice PDF
       */
      async downloadPdf(companyId, invoiceId) {
        let path;
        if (invoiceId) {
          path = `/companies/${companyId}/serviceinvoices/${invoiceId}/pdf`;
        } else {
          path = `/companies/${companyId}/serviceinvoices/pdf`;
        }
        const response = await this.http.get(path);
        return response.data;
      }
      /**
       * Download invoice XML
       */
      async downloadXml(companyId, invoiceId) {
        let path;
        if (invoiceId) {
          path = `/companies/${companyId}/serviceinvoices/${invoiceId}/xml`;
        } else {
          path = `/companies/${companyId}/serviceinvoices/xml`;
        }
        const response = await this.http.get(path);
        return response.data;
      }
      // --------------------------------------------------------------------------
      // High-level Convenience Methods
      // --------------------------------------------------------------------------
      /**
       * Create invoice and wait for completion (handles async processing)
       */
      async createAndWait(companyId, data, options = {}) {
        const { maxAttempts = 30, intervalMs = 2e3, timeoutMs = 6e4 } = options;
        const createResult = await this.create(companyId, data);
        if ("id" in createResult && createResult.id) {
          return createResult;
        }
        const asyncResult = createResult;
        if (asyncResult.code !== 202 || !asyncResult.location) {
          throw new InvoiceProcessingError(
            "Unexpected response from invoice creation",
            createResult
          );
        }
        return this.pollInvoiceCompletion(asyncResult.location, {
          maxAttempts,
          intervalMs,
          timeoutMs
        });
      }
      /**
       * Get invoice status (high-level wrapper)
       */
      async getStatus(companyId, invoiceId) {
        const invoice = await this.retrieve(companyId, invoiceId);
        return {
          status: invoice.status,
          invoice,
          isComplete: ["issued", "completed"].includes(invoice.status),
          isFailed: ["failed", "cancelled", "error"].includes(invoice.status)
        };
      }
      /**
       * Bulk operations: Create multiple invoices
       */
      async createBatch(companyId, invoices, options = {}) {
        const { waitForCompletion = false, maxConcurrent = 5 } = options;
        const results = [];
        for (let i = 0; i < invoices.length; i += maxConcurrent) {
          const batch = invoices.slice(i, i + maxConcurrent);
          const batchPromises = batch.map(async (invoiceData) => {
            if (waitForCompletion) {
              return this.createAndWait(companyId, invoiceData);
            } else {
              return this.create(companyId, invoiceData);
            }
          });
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);
        }
        return results;
      }
      // --------------------------------------------------------------------------
      // Private Helper Methods
      // --------------------------------------------------------------------------
      async pollInvoiceCompletion(locationUrl, options) {
        const { maxAttempts, intervalMs, timeoutMs } = options;
        const startTime = Date.now();
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (Date.now() - startTime > timeoutMs) {
            throw new InvoiceProcessingError(
              `Invoice processing timeout after ${timeoutMs}ms`,
              { locationUrl, attempt, timeoutMs }
            );
          }
          if (attempt > 0) {
            await this.sleep(intervalMs);
          }
          try {
            const path = this.extractPathFromLocationUrl(locationUrl);
            const response = await this.http.get(path);
            const invoice = response.data;
            if (this.isInvoiceComplete(invoice)) {
              return invoice;
            }
            if (this.isInvoiceFailed(invoice)) {
              throw new InvoiceProcessingError(
                `Invoice processing failed: ${invoice.status}`,
                invoice
              );
            }
          } catch (error) {
            if (attempt === maxAttempts - 1) {
              throw new InvoiceProcessingError(
                "Failed to poll invoice completion",
                { error, locationUrl, attempt }
              );
            }
          }
        }
        throw new InvoiceProcessingError(
          `Invoice processing timeout after ${maxAttempts} polling attempts`,
          { locationUrl, maxAttempts, intervalMs }
        );
      }
      extractPathFromLocationUrl(url) {
        try {
          const urlObj = new URL(url);
          return urlObj.pathname + urlObj.search;
        } catch {
          return url.startsWith("/") ? url : `/${url}`;
        }
      }
      isInvoiceComplete(invoice) {
        return ["issued", "completed"].includes(invoice.status);
      }
      isInvoiceFailed(invoice) {
        return ["failed", "cancelled", "error"].includes(invoice.status);
      }
      sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
    };
  }
});

// src/core/resources/companies.ts
var CompaniesResource;
var init_companies = __esm({
  "src/core/resources/companies.ts"() {
    CompaniesResource = class {
      constructor(http) {
        this.http = http;
      }
      // --------------------------------------------------------------------------
      // Core CRUD Operations
      // --------------------------------------------------------------------------
      /**
       * Create a new company
       */
      async create(data) {
        const path = "/companies";
        const response = await this.http.post(path, data);
        return response.data;
      }
      /**
       * List companies
       */
      async list(options = {}) {
        const path = "/companies";
        const response = await this.http.get(path, options);
        return response.data;
      }
      /**
       * Retrieve a specific company
       */
      async retrieve(companyId) {
        const path = `/companies/${companyId}`;
        const response = await this.http.get(path);
        return response.data;
      }
      /**
       * Update a company
       */
      async update(companyId, data) {
        const path = `/companies/${companyId}`;
        const response = await this.http.put(path, data);
        return response.data;
      }
      /**
       * Delete a company (named 'remove' to avoid JS keyword conflict)
       */
      async remove(companyId) {
        const path = `/companies/${companyId}`;
        const response = await this.http.delete(path);
        return response.data;
      }
      // --------------------------------------------------------------------------
      // Certificate Management
      // --------------------------------------------------------------------------
      /**
       * Upload digital certificate for a company
       * Handles FormData for file upload
       */
      async uploadCertificate(companyId, certificateData) {
        const path = `/companies/${companyId}/certificate`;
        const formData = this.createFormData();
        if (certificateData.filename) {
          formData.append("certificate", certificateData.file, certificateData.filename);
        } else {
          formData.append("certificate", certificateData.file);
        }
        formData.append("password", certificateData.password);
        const response = await this.http.post(
          path,
          formData
        );
        return response.data;
      }
      /**
       * Get certificate status for a company
       */
      async getCertificateStatus(companyId) {
        const path = `/companies/${companyId}/certificate`;
        const response = await this.http.get(path);
        return response.data;
      }
      // --------------------------------------------------------------------------
      // High-level Convenience Methods
      // --------------------------------------------------------------------------
      /**
       * Find company by CNPJ/CPF
       */
      async findByTaxNumber(taxNumber) {
        const companies = await this.list({ pageCount: 100 });
        return companies.data.find(
          (company) => company.federalTaxNumber === taxNumber
        ) || null;
      }
      /**
       * Get companies with active certificates
       */
      async getCompaniesWithCertificates() {
        const companies = await this.list({ pageCount: 100 });
        const companiesWithCerts = [];
        for (const company of companies.data) {
          try {
            const certStatus = await this.getCertificateStatus(company.id);
            if (certStatus.hasCertificate && certStatus.isValid) {
              companiesWithCerts.push(company);
            }
          } catch {
            continue;
          }
        }
        return companiesWithCerts;
      }
      /**
       * Bulk create companies
       */
      async createBatch(companies, options = {}) {
        const { maxConcurrent = 3, continueOnError = true } = options;
        const results = [];
        for (let i = 0; i < companies.length; i += maxConcurrent) {
          const batch = companies.slice(i, i + maxConcurrent);
          const batchPromises = batch.map(async (companyData) => {
            try {
              return await this.create(companyData);
            } catch (error) {
              if (continueOnError) {
                return {
                  error: error instanceof Error ? error.message : "Unknown error",
                  data: companyData
                };
              } else {
                throw error;
              }
            }
          });
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);
        }
        return results;
      }
      // --------------------------------------------------------------------------
      // Private Helper Methods  
      // --------------------------------------------------------------------------
      createFormData() {
        if (typeof FormData !== "undefined") {
          return new FormData();
        } else {
          throw new Error("FormData is not available in this environment");
        }
      }
    };
  }
});

// src/core/resources/index.ts
var init_resources = __esm({
  "src/core/resources/index.ts"() {
    init_service_invoices();
    init_companies();
  }
});

// src/core/client.ts
var client_exports = {};
__export(client_exports, {
  DEFAULT_RETRY_ATTEMPTS: () => DEFAULT_RETRY_ATTEMPTS,
  DEFAULT_TIMEOUT: () => DEFAULT_TIMEOUT,
  NfeClient: () => NfeClient,
  SUPPORTED_NODE_VERSIONS: () => SUPPORTED_NODE_VERSIONS,
  VERSION: () => VERSION,
  createNfeClient: () => createNfeClient,
  default: () => nfe
});
function createNfeClient(apiKey, _version) {
  const config = typeof apiKey === "string" ? { apiKey } : apiKey;
  return new NfeClient(config);
}
function nfe(apiKey, _version) {
  return createNfeClient(apiKey);
}
var NfeClient, VERSION, SUPPORTED_NODE_VERSIONS, DEFAULT_TIMEOUT, DEFAULT_RETRY_ATTEMPTS;
var init_client2 = __esm({
  "src/core/client.ts"() {
    init_client();
    init_errors();
    init_resources();
    NfeClient = class {
      http;
      config;
      // Public resource interfaces (maintain v2 naming convention)
      serviceInvoices;
      companies;
      // public readonly legalPeople: LegalPeopleResource;
      // public readonly naturalPeople: NaturalPeopleResource;
      // public readonly webhooks: WebhooksResource;
      constructor(config) {
        this.config = this.validateAndNormalizeConfig(config);
        this.validateEnvironment();
        const httpConfig = buildHttpConfig(
          this.config.apiKey,
          this.getBaseUrl(),
          this.config.timeout,
          this.config.retryConfig
        );
        this.http = new HttpClient(httpConfig);
        this.serviceInvoices = new ServiceInvoicesResource(this.http);
        this.companies = new CompaniesResource(this.http);
      }
      // --------------------------------------------------------------------------
      // Configuration Management
      // --------------------------------------------------------------------------
      validateAndNormalizeConfig(config) {
        if (!config.apiKey) {
          const envApiKey = this.getEnvironmentVariable("NFE_API_KEY");
          if (!envApiKey) {
            throw ErrorFactory.fromMissingApiKey();
          }
          config.apiKey = envApiKey;
        }
        const environment = config.environment || "production";
        if (!["production", "sandbox"].includes(environment)) {
          throw new ConfigurationError(
            `Invalid environment: ${environment}. Must be 'production' or 'sandbox'.`,
            { environment }
          );
        }
        const normalizedConfig = {
          apiKey: config.apiKey,
          environment,
          baseUrl: config.baseUrl || this.getDefaultBaseUrl(environment),
          timeout: config.timeout || 3e4,
          retryConfig: config.retryConfig || createDefaultRetryConfig()
        };
        return normalizedConfig;
      }
      getDefaultBaseUrl(environment) {
        const baseUrls = {
          production: "https://api.nfe.io/v1",
          sandbox: "https://api-sandbox.nfe.io/v1"
          // Adjust if sandbox exists
        };
        return baseUrls[environment];
      }
      getBaseUrl() {
        return this.config.baseUrl;
      }
      getEnvironmentVariable(name) {
        try {
          return globalThis.process?.env?.[name];
        } catch {
          return void 0;
        }
      }
      // --------------------------------------------------------------------------
      // Environment Validation
      // --------------------------------------------------------------------------
      validateEnvironment() {
        this.validateNodeVersion();
        if (typeof fetch === "undefined") {
          throw ErrorFactory.fromNodeVersionError(this.getNodeVersion());
        }
      }
      validateNodeVersion() {
        const nodeVersion = this.getNodeVersion();
        const majorVersion = this.extractMajorVersion(nodeVersion);
        if (majorVersion < 18) {
          throw ErrorFactory.fromNodeVersionError(nodeVersion);
        }
      }
      getNodeVersion() {
        try {
          return globalThis.process?.version || "unknown";
        } catch {
          return "unknown";
        }
      }
      extractMajorVersion(version) {
        const match = version.match(/^v?(\d+)\./);
        return match ? parseInt(match[1], 10) : 0;
      }
      // --------------------------------------------------------------------------
      // Public Utility Methods
      // --------------------------------------------------------------------------
      /**
       * Update client configuration
       */
      updateConfig(newConfig) {
        const mergedConfig = { ...this.config, ...newConfig };
        const normalizedConfig = this.validateAndNormalizeConfig(mergedConfig);
        Object.assign(this.config, normalizedConfig);
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
      setTimeout(timeout) {
        this.updateConfig({ timeout });
      }
      /**
       * Set API key (maintains v2 compatibility)
       */
      setApiKey(apiKey) {
        this.updateConfig({ apiKey });
      }
      /**
       * Get current configuration (readonly)
       */
      getConfig() {
        return { ...this.config };
      }
      // --------------------------------------------------------------------------
      // Polling Utility (for async invoice processing)
      // --------------------------------------------------------------------------
      /**
       * Poll a resource until completion or timeout
       * This is critical for NFE.io's async invoice processing (202 responses)
       */
      async pollUntilComplete(locationUrl, options = {}) {
        const {
          maxAttempts = 30,
          intervalMs = 2e3
        } = options;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (attempt > 0) {
            await this.sleep(intervalMs);
          }
          try {
            const path = this.extractPathFromUrl(locationUrl);
            const response = await this.http.get(path);
            if (this.isCompleteResponse(response.data)) {
              return response.data;
            }
            if (this.isFailedResponse(response.data)) {
              throw new PollingTimeoutError(
                `Resource processing failed: ${response.data.error || "Unknown error"}`,
                response.data
              );
            }
          } catch (error) {
            if (attempt === maxAttempts - 1) {
              throw error;
            }
          }
        }
        throw new PollingTimeoutError(
          `Polling timeout after ${maxAttempts} attempts. Resource may still be processing.`,
          { maxAttempts, intervalMs }
        );
      }
      extractPathFromUrl(url) {
        try {
          const urlObj = new URL(url);
          return urlObj.pathname + urlObj.search;
        } catch {
          return url.startsWith("/") ? url : `/${url}`;
        }
      }
      isCompleteResponse(data) {
        return data && (data.status === "completed" || data.status === "issued" || data.id && data.number && !data.status);
      }
      isFailedResponse(data) {
        return data && (data.status === "failed" || data.status === "error" || data.error);
      }
      sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      // --------------------------------------------------------------------------
      // Health Check & Debug
      // --------------------------------------------------------------------------
      /**
       * Check if the client is properly configured and can reach the API
       */
      async healthCheck() {
        try {
          await this.http.get("/companies", { pageCount: 1 });
          return { status: "ok" };
        } catch (error) {
          return {
            status: "error",
            details: {
              error: error instanceof Error ? error.message : "Unknown error",
              config: {
                baseUrl: this.config.baseUrl,
                environment: this.config.environment,
                hasApiKey: !!this.config.apiKey
              }
            }
          };
        }
      }
      /**
       * Get client information for debugging
       */
      getClientInfo() {
        return {
          version: "3.0.0-beta.1",
          // TODO: Read from package.json
          nodeVersion: this.getNodeVersion(),
          environment: this.config.environment,
          baseUrl: this.config.baseUrl,
          hasApiKey: !!this.config.apiKey
        };
      }
    };
    VERSION = "3.0.0-beta.1";
    SUPPORTED_NODE_VERSIONS = ">=18.0.0";
    DEFAULT_TIMEOUT = 3e4;
    DEFAULT_RETRY_ATTEMPTS = 3;
  }
});

// src/index.ts
init_client2();
init_errors();
init_client2();
var index_default = nfe;
var PACKAGE_NAME = "@nfe-io/sdk";
var PACKAGE_VERSION = "3.0.0-beta.1";
var API_VERSION = "v1";
var REPOSITORY_URL = "https://github.com/nfe/client-nodejs";
var DOCUMENTATION_URL = "https://nfe.io/docs";
function isEnvironmentSupported() {
  const issues = [];
  let nodeVersion;
  try {
    nodeVersion = globalThis.process?.version;
    if (nodeVersion) {
      const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);
      if (majorVersion < 18) {
        issues.push(`Node.js ${majorVersion} is not supported. Requires Node.js 18+.`);
      }
    }
  } catch {
    issues.push("Unable to detect Node.js version");
  }
  const hasFetch = typeof fetch !== "undefined";
  if (!hasFetch) {
    issues.push("Fetch API not available");
  }
  const hasAbortController = typeof AbortController !== "undefined";
  if (!hasAbortController) {
    issues.push("AbortController not available");
  }
  const result = {
    supported: issues.length === 0,
    hasFetch,
    hasAbortController,
    issues
  };
  if (nodeVersion) {
    result.nodeVersion = nodeVersion;
  }
  return result;
}
function getRuntimeInfo() {
  let nodeVersion = "unknown";
  let platform = "unknown";
  let arch = "unknown";
  let environment = "unknown";
  try {
    const process2 = globalThis.process;
    if (process2) {
      nodeVersion = process2.version || "unknown";
      platform = process2.platform || "unknown";
      arch = process2.arch || "unknown";
      environment = "node";
    } else if (typeof window !== "undefined") {
      environment = "browser";
      platform = navigator.platform || "unknown";
    }
  } catch {
  }
  return {
    sdkVersion: PACKAGE_VERSION,
    nodeVersion,
    platform,
    arch,
    environment
  };
}
function createClientFromEnv(environment) {
  const apiKey = globalThis.process?.env?.NFE_API_KEY;
  if (!apiKey) {
    const { ConfigurationError: ConfigurationError2 } = (init_errors(), __toCommonJS(errors_exports));
    throw new ConfigurationError2(
      "NFE_API_KEY environment variable is required when using createClientFromEnv()"
    );
  }
  const { NfeClient: NfeClient2 } = (init_client2(), __toCommonJS(client_exports));
  return new NfeClient2({
    apiKey,
    environment: environment || "production"
  });
}
function validateApiKeyFormat(apiKey) {
  const issues = [];
  if (!apiKey) {
    issues.push("API key is required");
  } else {
    if (apiKey.length < 10) {
      issues.push("API key appears to be too short");
    }
    if (apiKey.includes(" ")) {
      issues.push("API key should not contain spaces");
    }
  }
  return {
    valid: issues.length === 0,
    issues
  };
}

export { APIError, API_VERSION, AuthenticationError, BadRequestError, ConfigurationError, ConflictError, ConnectionError, DOCUMENTATION_URL, ErrorFactory, ErrorTypes, InternalServerError, InvoiceProcessingError, NfeClient, NfeError, NotFoundError, PACKAGE_NAME, PACKAGE_VERSION, PollingTimeoutError, REPOSITORY_URL, RateLimitError, SUPPORTED_NODE_VERSIONS, ServerError, TimeoutError, VERSION, ValidationError, createClientFromEnv, createNfeClient, index_default as default, getRuntimeInfo, isAuthenticationError, isConnectionError, isEnvironmentSupported, isNfeError, isNotFoundError, isPollingTimeoutError, isTimeoutError, isValidationError, validateApiKeyFormat };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map