'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
  APIError: () => exports.APIError,
  AuthenticationError: () => exports.AuthenticationError,
  BadRequestError: () => exports.BadRequestError,
  ConfigurationError: () => exports.ConfigurationError,
  ConflictError: () => exports.ConflictError,
  ConnectionError: () => exports.ConnectionError,
  ErrorFactory: () => exports.ErrorFactory,
  ErrorTypes: () => exports.ErrorTypes,
  InternalServerError: () => exports.InternalServerError,
  InvoiceProcessingError: () => exports.InvoiceProcessingError,
  NfeError: () => exports.NfeError,
  NotFoundError: () => exports.NotFoundError,
  PollingTimeoutError: () => exports.PollingTimeoutError,
  RateLimitError: () => exports.RateLimitError,
  ServerError: () => exports.ServerError,
  TimeoutError: () => exports.TimeoutError,
  ValidationError: () => exports.ValidationError,
  isAuthenticationError: () => isAuthenticationError,
  isConnectionError: () => isConnectionError,
  isNfeError: () => isNfeError,
  isNotFoundError: () => isNotFoundError,
  isPollingTimeoutError: () => isPollingTimeoutError,
  isTimeoutError: () => isTimeoutError,
  isValidationError: () => isValidationError
});
function isNfeError(error) {
  return error instanceof exports.NfeError;
}
function isAuthenticationError(error) {
  return error instanceof exports.AuthenticationError;
}
function isValidationError(error) {
  return error instanceof exports.ValidationError;
}
function isNotFoundError(error) {
  return error instanceof exports.NotFoundError;
}
function isConnectionError(error) {
  return error instanceof exports.ConnectionError;
}
function isTimeoutError(error) {
  return error instanceof exports.TimeoutError;
}
function isPollingTimeoutError(error) {
  return error instanceof exports.PollingTimeoutError;
}
exports.NfeError = void 0; exports.AuthenticationError = void 0; exports.ValidationError = void 0; exports.NotFoundError = void 0; exports.ConflictError = void 0; exports.RateLimitError = void 0; exports.ServerError = void 0; exports.ConnectionError = void 0; exports.TimeoutError = void 0; exports.ConfigurationError = void 0; exports.PollingTimeoutError = void 0; exports.InvoiceProcessingError = void 0; exports.ErrorFactory = void 0; exports.BadRequestError = void 0; exports.APIError = void 0; exports.InternalServerError = void 0; exports.ErrorTypes = void 0;
var init_errors = __esm({
  "src/core/errors/index.ts"() {
    exports.NfeError = class extends Error {
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
    exports.AuthenticationError = class extends exports.NfeError {
      type = "AuthenticationError";
      constructor(message = "Invalid API key or authentication failed", details) {
        super(message, details, 401);
      }
    };
    exports.ValidationError = class extends exports.NfeError {
      type = "ValidationError";
      constructor(message = "Invalid request data", details) {
        super(message, details, 400);
      }
    };
    exports.NotFoundError = class extends exports.NfeError {
      type = "NotFoundError";
      constructor(message = "Resource not found", details) {
        super(message, details, 404);
      }
    };
    exports.ConflictError = class extends exports.NfeError {
      type = "ConflictError";
      constructor(message = "Resource conflict", details) {
        super(message, details, 409);
      }
    };
    exports.RateLimitError = class extends exports.NfeError {
      type = "RateLimitError";
      constructor(message = "Rate limit exceeded", details) {
        super(message, details, 429);
      }
    };
    exports.ServerError = class extends exports.NfeError {
      type = "ServerError";
      constructor(message = "Internal server error", details, code = 500) {
        super(message, details, code);
      }
    };
    exports.ConnectionError = class extends exports.NfeError {
      type = "ConnectionError";
      constructor(message = "Connection error", details) {
        super(message, details);
      }
    };
    exports.TimeoutError = class extends exports.NfeError {
      type = "TimeoutError";
      constructor(message = "Request timeout", details) {
        super(message, details);
      }
    };
    exports.ConfigurationError = class extends exports.NfeError {
      type = "ConfigurationError";
      constructor(message = "SDK configuration error", details) {
        super(message, details);
      }
    };
    exports.PollingTimeoutError = class extends exports.NfeError {
      type = "PollingTimeoutError";
      constructor(message = "Polling timeout - operation still in progress", details) {
        super(message, details);
      }
    };
    exports.InvoiceProcessingError = class extends exports.NfeError {
      type = "InvoiceProcessingError";
      constructor(message = "Invoice processing failed", details) {
        super(message, details);
      }
    };
    exports.ErrorFactory = class {
      /**
       * Create error from HTTP response (maintains v2 ResourceError.generate pattern)
       */
      static fromHttpResponse(status, data, message) {
        const errorMessage = message || this.getDefaultMessage(status);
        switch (status) {
          case 400:
            return new exports.ValidationError(errorMessage, data);
          case 401:
            return new exports.AuthenticationError(errorMessage, data);
          case 404:
            return new exports.NotFoundError(errorMessage, data);
          case 409:
            return new exports.ConflictError(errorMessage, data);
          case 429:
            return new exports.RateLimitError(errorMessage, data);
          case 500:
          case 502:
          case 503:
          case 504:
            return new exports.ServerError(errorMessage, data, status);
          default:
            if (status >= 400 && status < 500) {
              return new exports.ValidationError(errorMessage, data);
            }
            if (status >= 500) {
              return new exports.ServerError(errorMessage, data, status);
            }
            return new exports.NfeError(errorMessage, data, status);
        }
      }
      /**
       * Create error from fetch/network issues
       */
      static fromNetworkError(error) {
        if (error.name === "AbortError" || error.message.includes("timeout")) {
          return new exports.TimeoutError("Request timeout", error);
        }
        if (error.message.includes("fetch")) {
          return new exports.ConnectionError("Network connection failed", error);
        }
        return new exports.ConnectionError("Connection error", error);
      }
      /**
       * Create error from Node.js version check
       */
      static fromNodeVersionError(nodeVersion) {
        return new exports.ConfigurationError(
          `NFE.io SDK v3 requires Node.js 18+ (for native fetch support). Current version: ${nodeVersion}`,
          { nodeVersion, requiredVersion: ">=18.0.0" }
        );
      }
      /**
       * Create error from missing API key
       */
      static fromMissingApiKey() {
        return new exports.ConfigurationError(
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
    exports.BadRequestError = exports.ValidationError;
    exports.APIError = exports.NfeError;
    exports.InternalServerError = exports.ServerError;
    exports.ErrorTypes = {
      NfeError: exports.NfeError,
      AuthenticationError: exports.AuthenticationError,
      ValidationError: exports.ValidationError,
      NotFoundError: exports.NotFoundError,
      ConflictError: exports.ConflictError,
      RateLimitError: exports.RateLimitError,
      ServerError: exports.ServerError,
      ConnectionError: exports.ConnectionError,
      TimeoutError: exports.TimeoutError,
      ConfigurationError: exports.ConfigurationError,
      PollingTimeoutError: exports.PollingTimeoutError,
      InvoiceProcessingError: exports.InvoiceProcessingError,
      // Legacy aliases
      BadRequestError: exports.BadRequestError,
      APIError: exports.APIError,
      InternalServerError: exports.InternalServerError
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
        throw lastError || new exports.ConnectionError("Request failed after all retries");
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
              throw new exports.TimeoutError(`Request timeout after ${this.config.timeout}ms`, error);
            }
            throw exports.ErrorFactory.fromNetworkError(error);
          }
          throw new exports.ConnectionError("Unknown network error", error);
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
        throw exports.ErrorFactory.fromHttpResponse(response.status, errorData, message);
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
        if (error instanceof exports.RateLimitError) {
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
          throw exports.ErrorFactory.fromNodeVersionError(process.version);
        }
        if (typeof AbortController === "undefined") {
          throw new exports.ConnectionError(
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
          throw new exports.InvoiceProcessingError(
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
            throw new exports.InvoiceProcessingError(
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
              throw new exports.InvoiceProcessingError(
                `Invoice processing failed: ${invoice.status}`,
                invoice
              );
            }
          } catch (error) {
            if (attempt === maxAttempts - 1) {
              throw new exports.InvoiceProcessingError(
                "Failed to poll invoice completion",
                { error, locationUrl, attempt }
              );
            }
          }
        }
        throw new exports.InvoiceProcessingError(
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

// src/core/resources/legal-people.ts
var LegalPeopleResource;
var init_legal_people = __esm({
  "src/core/resources/legal-people.ts"() {
    LegalPeopleResource = class {
      constructor(http) {
        this.http = http;
      }
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
      async list(companyId) {
        const path = `/companies/${companyId}/legalpeople`;
        const response = await this.http.get(path);
        return response.data;
      }
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
      async create(companyId, data) {
        const path = `/companies/${companyId}/legalpeople`;
        const response = await this.http.post(path, data);
        return response.data;
      }
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
      async retrieve(companyId, legalPersonId) {
        const path = `/companies/${companyId}/legalpeople/${legalPersonId}`;
        const response = await this.http.get(path);
        return response.data;
      }
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
      async update(companyId, legalPersonId, data) {
        const path = `/companies/${companyId}/legalpeople/${legalPersonId}`;
        const response = await this.http.put(path, data);
        return response.data;
      }
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
      async delete(companyId, legalPersonId) {
        const path = `/companies/${companyId}/legalpeople/${legalPersonId}`;
        await this.http.delete(path);
      }
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
      async createBatch(companyId, data) {
        const promises = data.map((person) => this.create(companyId, person));
        return Promise.all(promises);
      }
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
      async findByTaxNumber(companyId, federalTaxNumber) {
        const result = await this.list(companyId);
        return result.data?.find(
          (person) => person.federalTaxNumber?.toString() === federalTaxNumber
        );
      }
    };
  }
});

// src/core/resources/natural-people.ts
var NaturalPeopleResource;
var init_natural_people = __esm({
  "src/core/resources/natural-people.ts"() {
    NaturalPeopleResource = class {
      constructor(http) {
        this.http = http;
      }
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
      async list(companyId) {
        const path = `/companies/${companyId}/naturalpeople`;
        const response = await this.http.get(path);
        return response.data;
      }
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
      async create(companyId, data) {
        const path = `/companies/${companyId}/naturalpeople`;
        const response = await this.http.post(path, data);
        return response.data;
      }
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
      async retrieve(companyId, naturalPersonId) {
        const path = `/companies/${companyId}/naturalpeople/${naturalPersonId}`;
        const response = await this.http.get(path);
        return response.data;
      }
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
      async update(companyId, naturalPersonId, data) {
        const path = `/companies/${companyId}/naturalpeople/${naturalPersonId}`;
        const response = await this.http.put(path, data);
        return response.data;
      }
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
      async delete(companyId, naturalPersonId) {
        const path = `/companies/${companyId}/naturalpeople/${naturalPersonId}`;
        await this.http.delete(path);
      }
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
      async createBatch(companyId, data) {
        const promises = data.map((person) => this.create(companyId, person));
        return Promise.all(promises);
      }
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
      async findByTaxNumber(companyId, federalTaxNumber) {
        const result = await this.list(companyId);
        return result.data?.find(
          (person) => person.federalTaxNumber?.toString() === federalTaxNumber
        );
      }
    };
  }
});

// src/core/resources/webhooks.ts
var WebhooksResource;
var init_webhooks = __esm({
  "src/core/resources/webhooks.ts"() {
    WebhooksResource = class {
      constructor(http) {
        this.http = http;
      }
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
      async list(companyId) {
        const path = `/companies/${companyId}/webhooks`;
        const response = await this.http.get(path);
        return response.data;
      }
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
      async create(companyId, data) {
        const path = `/companies/${companyId}/webhooks`;
        const response = await this.http.post(path, data);
        return response.data;
      }
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
      async retrieve(companyId, webhookId) {
        const path = `/companies/${companyId}/webhooks/${webhookId}`;
        const response = await this.http.get(path);
        return response.data;
      }
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
      async update(companyId, webhookId, data) {
        const path = `/companies/${companyId}/webhooks/${webhookId}`;
        const response = await this.http.put(path, data);
        return response.data;
      }
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
      async delete(companyId, webhookId) {
        const path = `/companies/${companyId}/webhooks/${webhookId}`;
        await this.http.delete(path);
      }
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
      validateSignature(payload, signature, secret) {
        try {
          const crypto = globalThis.require?.("crypto");
          if (!crypto) {
            throw new Error("crypto module not available");
          }
          const hmac = crypto.createHmac("sha256", secret);
          hmac.update(payload);
          const expectedSignature = hmac.digest("hex");
          return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
          );
        } catch (error) {
          console.error("Error validating webhook signature:", error);
          return false;
        }
      }
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
      async test(companyId, webhookId) {
        const path = `/companies/${companyId}/webhooks/${webhookId}/test`;
        const response = await this.http.post(
          path,
          {}
        );
        return response.data;
      }
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
      getAvailableEvents() {
        return [
          "invoice.issued",
          "invoice.cancelled",
          "invoice.failed",
          "invoice.processing",
          "company.created",
          "company.updated",
          "company.deleted"
        ];
      }
    };
  }
});

// src/core/resources/index.ts
var init_resources = __esm({
  "src/core/resources/index.ts"() {
    init_service_invoices();
    init_companies();
    init_legal_people();
    init_natural_people();
    init_webhooks();
  }
});

// src/core/client.ts
var client_exports = {};
__export(client_exports, {
  DEFAULT_RETRY_ATTEMPTS: () => DEFAULT_RETRY_ATTEMPTS,
  DEFAULT_TIMEOUT: () => DEFAULT_TIMEOUT,
  NfeClient: () => exports.NfeClient,
  SUPPORTED_NODE_VERSIONS: () => exports.SUPPORTED_NODE_VERSIONS,
  VERSION: () => exports.VERSION,
  createNfeClient: () => createNfeClient,
  default: () => nfe
});
function createNfeClient(apiKey, _version) {
  const config = typeof apiKey === "string" ? { apiKey } : apiKey;
  return new exports.NfeClient(config);
}
function nfe(apiKey, _version) {
  return createNfeClient(apiKey);
}
exports.NfeClient = void 0; exports.VERSION = void 0; exports.SUPPORTED_NODE_VERSIONS = void 0; var DEFAULT_TIMEOUT, DEFAULT_RETRY_ATTEMPTS;
var init_client2 = __esm({
  "src/core/client.ts"() {
    init_client();
    init_errors();
    init_resources();
    exports.NfeClient = class {
      /** @internal HTTP client for making API requests */
      http;
      /** @internal Normalized client configuration */
      config;
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
      serviceInvoices;
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
      companies;
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
      legalPeople;
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
      naturalPeople;
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
      webhooks;
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
        this.legalPeople = new LegalPeopleResource(this.http);
        this.naturalPeople = new NaturalPeopleResource(this.http);
        this.webhooks = new WebhooksResource(this.http);
      }
      // --------------------------------------------------------------------------
      // Configuration Management
      // --------------------------------------------------------------------------
      validateAndNormalizeConfig(config) {
        if (!config.apiKey) {
          const envApiKey = this.getEnvironmentVariable("NFE_API_KEY");
          if (!envApiKey) {
            throw exports.ErrorFactory.fromMissingApiKey();
          }
          config.apiKey = envApiKey;
        }
        const environment = config.environment || "production";
        if (!["production", "sandbox"].includes(environment)) {
          throw new exports.ConfigurationError(
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
          throw exports.ErrorFactory.fromNodeVersionError(this.getNodeVersion());
        }
      }
      validateNodeVersion() {
        const nodeVersion = this.getNodeVersion();
        const majorVersion = this.extractMajorVersion(nodeVersion);
        if (majorVersion < 18) {
          throw exports.ErrorFactory.fromNodeVersionError(nodeVersion);
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
      setTimeout(timeout) {
        this.updateConfig({ timeout });
      }
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
      setApiKey(apiKey) {
        this.updateConfig({ apiKey });
      }
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
      getConfig() {
        return { ...this.config };
      }
      // --------------------------------------------------------------------------
      // Polling Utility (for async invoice processing)
      // --------------------------------------------------------------------------
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
              throw new exports.PollingTimeoutError(
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
        throw new exports.PollingTimeoutError(
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
    exports.VERSION = "3.0.0-beta.1";
    exports.SUPPORTED_NODE_VERSIONS = ">=18.0.0";
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

exports.API_VERSION = API_VERSION;
exports.DOCUMENTATION_URL = DOCUMENTATION_URL;
exports.PACKAGE_NAME = PACKAGE_NAME;
exports.PACKAGE_VERSION = PACKAGE_VERSION;
exports.REPOSITORY_URL = REPOSITORY_URL;
exports.createClientFromEnv = createClientFromEnv;
exports.createNfeClient = createNfeClient;
exports.default = index_default;
exports.getRuntimeInfo = getRuntimeInfo;
exports.isAuthenticationError = isAuthenticationError;
exports.isConnectionError = isConnectionError;
exports.isEnvironmentSupported = isEnvironmentSupported;
exports.isNfeError = isNfeError;
exports.isNotFoundError = isNotFoundError;
exports.isPollingTimeoutError = isPollingTimeoutError;
exports.isTimeoutError = isTimeoutError;
exports.isValidationError = isValidationError;
exports.validateApiKeyFormat = validateApiKeyFormat;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map