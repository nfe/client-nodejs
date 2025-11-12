/**
 * NFE.io SDK v3 - Error Classes
 * 
 * Comprehensive error handling system that maintains compatibility
 * with v2 error types while providing modern TypeScript benefits
 */

// ============================================================================
// Base Error Class
// ============================================================================

export class NfeError extends Error {
  public readonly type: string = 'NfeError';
  public readonly code?: number | undefined;
  public readonly details?: unknown;
  public readonly raw?: unknown;

  constructor(message: string, details?: unknown, code?: number) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.raw = details;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace if available (Node.js specific)
    if ('captureStackTrace' in Error && typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, this.constructor);
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
      stack: this.stack,
    };
  }
}

// ============================================================================
// HTTP-specific Errors (maintain v2 compatibility)
// ============================================================================

export class AuthenticationError extends NfeError {
  public override readonly type = 'AuthenticationError';

  constructor(message = 'Invalid API key or authentication failed', details?: unknown) {
    super(message, details, 401);
  }
}

export class ValidationError extends NfeError {
  public override readonly type = 'ValidationError';

  constructor(message = 'Invalid request data', details?: unknown) {
    super(message, details, 400);
  }
}

export class NotFoundError extends NfeError {
  public override readonly type = 'NotFoundError';

  constructor(message = 'Resource not found', details?: unknown) {
    super(message, details, 404);
  }
}

export class ConflictError extends NfeError {
  public override readonly type = 'ConflictError';

  constructor(message = 'Resource conflict', details?: unknown) {
    super(message, details, 409);
  }
}

export class RateLimitError extends NfeError {
  public override readonly type = 'RateLimitError';

  constructor(message = 'Rate limit exceeded', details?: unknown) {
    super(message, details, 429);
  }
}

export class ServerError extends NfeError {
  public override readonly type = 'ServerError';

  constructor(message = 'Internal server error', details?: unknown, code = 500) {
    super(message, details, code);
  }
}

// ============================================================================
// Connection/Network Errors
// ============================================================================

export class ConnectionError extends NfeError {
  public override readonly type = 'ConnectionError';

  constructor(message = 'Connection error', details?: unknown) {
    super(message, details);
  }
}

export class TimeoutError extends NfeError {
  public override readonly type = 'TimeoutError';

  constructor(message = 'Request timeout', details?: unknown) {
    super(message, details);
  }
}

// ============================================================================
// SDK-specific Errors
// ============================================================================

export class ConfigurationError extends NfeError {
  public override readonly type = 'ConfigurationError';

  constructor(message = 'SDK configuration error', details?: unknown) {
    super(message, details);
  }
}

export class PollingTimeoutError extends NfeError {
  public override readonly type = 'PollingTimeoutError';

  constructor(message = 'Polling timeout - operation still in progress', details?: unknown) {
    super(message, details);
  }
}

export class InvoiceProcessingError extends NfeError {
  public override readonly type = 'InvoiceProcessingError';

  constructor(message = 'Invoice processing failed', details?: unknown) {
    super(message, details);
  }
}

// ============================================================================
// Error Factory (maintains v2 compatibility)
// ============================================================================

export class ErrorFactory {
  /**
   * Create error from HTTP response (maintains v2 ResourceError.generate pattern)
   */
  static fromHttpResponse(status: number, data?: unknown, message?: string): NfeError {
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
  static fromNetworkError(error: Error): NfeError {
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return new TimeoutError('Request timeout', error);
    }

    if (error.message.includes('fetch')) {
      return new ConnectionError('Network connection failed', error);
    }

    return new ConnectionError('Connection error', error);
  }

  /**
   * Create error from Node.js version check
   */
  static fromNodeVersionError(nodeVersion: string): ConfigurationError {
    return new ConfigurationError(
      `NFE.io SDK v3 requires Node.js 18+ (for native fetch support). Current version: ${nodeVersion}`,
      { nodeVersion, requiredVersion: '>=18.0.0' }
    );
  }

  /**
   * Create error from missing API key
   */
  static fromMissingApiKey(): ConfigurationError {
    return new ConfigurationError(
      'API key is required. Pass it in NfeConfig or set NFE_API_KEY environment variable.',
      { configField: 'apiKey' }
    );
  }

  private static getDefaultMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Invalid request data',
      401: 'Invalid API key or authentication failed',
      403: 'Access forbidden',
      404: 'Resource not found',
      409: 'Resource conflict',
      429: 'Rate limit exceeded',
      500: 'Internal server error',
      502: 'Bad gateway',
      503: 'Service unavailable',
      504: 'Gateway timeout',
    };

    return messages[status] || `HTTP ${status} error`;
  }
}

// ============================================================================
// Error Type Guards
// ============================================================================

export function isNfeError(error: unknown): error is NfeError {
  return error instanceof NfeError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isConnectionError(error: unknown): error is ConnectionError {
  return error instanceof ConnectionError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isPollingTimeoutError(error: unknown): error is PollingTimeoutError {
  return error instanceof PollingTimeoutError;
}

// ============================================================================
// Legacy Aliases (for v2 compatibility)
// ============================================================================

/** @deprecated Use ValidationError instead */
export const BadRequestError = ValidationError;

/** @deprecated Use NfeError instead */
export const APIError = NfeError;

/** @deprecated Use ServerError instead */
export const InternalServerError = ServerError;

// Export all error types
export const ErrorTypes = {
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
  InternalServerError,
} as const;

export type ErrorType = keyof typeof ErrorTypes;