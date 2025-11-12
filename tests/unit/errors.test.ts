/**
 * Unit tests for error handling system
 */

import { describe, it, expect } from 'vitest';
import {
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
  ErrorFactory,
  isNfeError,
  isAuthenticationError,
  isValidationError,
  isNotFoundError,
  isConnectionError,
  isTimeoutError,
  isPollingTimeoutError,
  ErrorTypes,
  BadRequestError,
  APIError,
  InternalServerError,
} from '../../src/core/errors/index.js';

describe('Error System', () => {
  describe('NfeError Base Class', () => {
    it('should create error with message', () => {
      const error = new NfeError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NfeError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('NfeError');
    });

    it('should have stack trace', () => {
      const error = new NfeError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('NfeError');
    });
  });

  describe('HTTP Errors', () => {
    it('should create AuthenticationError', () => {
      const error = new AuthenticationError('Invalid API key');
      expect(error).toBeInstanceOf(NfeError);
      expect(error.name).toBe('AuthenticationError');
      expect(error.message).toBe('Invalid API key');
    });

    it('should create ValidationError', () => {
      const details = { errors: [{ field: 'email' }] };
      const error = new ValidationError('Validation failed', details);
      expect(error.name).toBe('ValidationError');
      expect(error.details).toEqual(details);
    });

    it('should create NotFoundError', () => {
      const error = new NotFoundError('Resource not found');
      expect(error.name).toBe('NotFoundError');
    });

    it('should create RateLimitError', () => {
      const error = new RateLimitError('Rate limit exceeded');
      expect(error.name).toBe('RateLimitError');
    });

    it('should create ServerError', () => {
      const error = new ServerError('Internal server error');
      expect(error.name).toBe('ServerError');
    });
  });

  describe('Connection Errors', () => {
    it('should create ConnectionError', () => {
      const error = new ConnectionError('Connection failed');
      expect(error.name).toBe('ConnectionError');
    });

    it('should create TimeoutError', () => {
      const error = new TimeoutError('Request timeout');
      expect(error.name).toBe('TimeoutError');
    });
  });

  describe('SDK Errors', () => {
    it('should create ConfigurationError', () => {
      const error = new ConfigurationError('Invalid configuration');
      expect(error.name).toBe('ConfigurationError');
    });

    it('should create PollingTimeoutError', () => {
      const error = new PollingTimeoutError('Polling timeout');
      expect(error.name).toBe('PollingTimeoutError');
    });

    it('should create InvoiceProcessingError', () => {
      const error = new InvoiceProcessingError('Invoice processing failed');
      expect(error.name).toBe('InvoiceProcessingError');
    });
  });

  describe('ErrorFactory', () => {
    it('should create AuthenticationError from HTTP 401', () => {
      const error = ErrorFactory.fromHttpResponse(401);
      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it('should create ValidationError from HTTP 400', () => {
      const error = ErrorFactory.fromHttpResponse(400);
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('should create NotFoundError from HTTP 404', () => {
      const error = ErrorFactory.fromHttpResponse(404);
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should create RateLimitError from HTTP 429', () => {
      const error = ErrorFactory.fromHttpResponse(429);
      expect(error).toBeInstanceOf(RateLimitError);
    });

    it('should create ServerError from HTTP 500', () => {
      const error = ErrorFactory.fromHttpResponse(500);
      expect(error).toBeInstanceOf(ServerError);
    });

    it('should create error from missing API key', () => {
      const error = ErrorFactory.fromMissingApiKey();
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.message).toContain('API key');
    });

    it('should create error from invalid Node version', () => {
      const error = ErrorFactory.fromNodeVersionError('v16.0.0');
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.message).toContain('Node.js');
    });

    it('should create ConnectionError from network error', () => {
      const networkError = new Error('Network error');
      const error = ErrorFactory.fromNetworkError(networkError);
      expect(error).toBeInstanceOf(ConnectionError);
    });

    it('should create TimeoutError from AbortError', () => {
      const abortError = new Error('Abort');
      abortError.name = 'AbortError';
      const error = ErrorFactory.fromNetworkError(abortError);
      expect(error).toBeInstanceOf(TimeoutError);
    });
  });

  describe('Type Guards', () => {
    it('isNfeError should identify NfeError instances', () => {
      expect(isNfeError(new NfeError('Test'))).toBe(true);
      expect(isNfeError(new Error('Test'))).toBe(false);
      expect(isNfeError(null)).toBe(false);
    });

    it('isAuthenticationError should identify AuthenticationError', () => {
      expect(isAuthenticationError(new AuthenticationError('Test'))).toBe(true);
      expect(isAuthenticationError(new NfeError('Test'))).toBe(false);
    });

    it('isValidationError should identify ValidationError', () => {
      expect(isValidationError(new ValidationError('Test'))).toBe(true);
      expect(isValidationError(new NfeError('Test'))).toBe(false);
    });

    it('isNotFoundError should identify NotFoundError', () => {
      expect(isNotFoundError(new NotFoundError('Test'))).toBe(true);
      expect(isNotFoundError(new NfeError('Test'))).toBe(false);
    });

    it('isConnectionError should identify ConnectionError', () => {
      expect(isConnectionError(new ConnectionError('Test'))).toBe(true);
      expect(isConnectionError(new NfeError('Test'))).toBe(false);
    });

    it('isTimeoutError should identify TimeoutError', () => {
      expect(isTimeoutError(new TimeoutError('Test'))).toBe(true);
      expect(isTimeoutError(new NfeError('Test'))).toBe(false);
    });

    it('isPollingTimeoutError should identify PollingTimeoutError', () => {
      expect(isPollingTimeoutError(new PollingTimeoutError('Test'))).toBe(true);
      expect(isPollingTimeoutError(new NfeError('Test'))).toBe(false);
    });
  });

  describe('Legacy Aliases', () => {
    it('BadRequestError should be ValidationError', () => {
      expect(BadRequestError).toBe(ValidationError);
    });

    it('APIError should be NfeError', () => {
      expect(APIError).toBe(NfeError);
    });

    it('InternalServerError should be ServerError', () => {
      expect(InternalServerError).toBe(ServerError);
    });
  });

  describe('ErrorTypes object', () => {
    it('should export all error classes', () => {
      expect(ErrorTypes.NfeError).toBe(NfeError);
      expect(ErrorTypes.AuthenticationError).toBe(AuthenticationError);
      expect(ErrorTypes.ValidationError).toBe(ValidationError);
      expect(ErrorTypes.NotFoundError).toBe(NotFoundError);
      expect(ErrorTypes.ServerError).toBe(ServerError);
      expect(ErrorTypes.ConnectionError).toBe(ConnectionError);
      expect(ErrorTypes.TimeoutError).toBe(TimeoutError);
      expect(ErrorTypes.ConfigurationError).toBe(ConfigurationError);
      expect(ErrorTypes.PollingTimeoutError).toBe(PollingTimeoutError);
      expect(ErrorTypes.InvoiceProcessingError).toBe(InvoiceProcessingError);
    });
  });
});
