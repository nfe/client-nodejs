import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient, createDefaultRetryConfig, buildHttpConfig } from '../../src/core/http/client';
import type { HttpConfig } from '../../src/core/types';
import { TEST_API_KEY } from '../setup';

// Helper to create mock Headers object
function createMockHeaders(entries: [string, string][]): any {
  const map = new Map(entries.map(([k, v]) => [k.toLowerCase(), v]));
  return {
    get: (key: string) => map.get(key.toLowerCase()) || null,
    has: (key: string) => map.has(key.toLowerCase()),
    entries: () => map.entries(),
    keys: () => map.keys(),
    values: () => map.values(),
    forEach: (callback: (value: string, key: string) => void) => {
      map.forEach((value, key) => callback(value, key));
    },
  };
}

// Helper to create mock error Response
function createMockErrorResponse(status: number, statusText: string, errorData: any): any {
  return {
    ok: false,
    status,
    statusText,
    headers: createMockHeaders([['content-type', 'application/json']]),
    json: async () => errorData,
    text: async () => JSON.stringify(errorData),
  };
}

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let fetchMock: ReturnType<typeof vi.fn>;
  let config: HttpConfig;

  beforeEach(() => {
    config = buildHttpConfig(
      TEST_API_KEY,
      'https://api.nfe.io/v1',
      10000,
      { maxRetries: 3, baseDelay: 10, maxDelay: 100 } // Delays curtos para testes rápidos
    );

    httpClient = new HttpClient(config);

    // Mock global fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET Requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: '123', name: 'Test Company' };
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: createMockHeaders([['content-type', 'application/json']]),
        json: async () => mockData,
      });

      const response = await httpClient.get<typeof mockData>('/companies');

      expect(response.data).toEqual(mockData);
      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.nfe.io/v1/companies',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should include query parameters in GET request', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: createMockHeaders([['content-type', 'application/json']]),
        json: async () => ([]),
      });

      await httpClient.get('/companies', { page: 1, limit: 10 });

      const url = fetchMock.mock.calls[0][0];
      expect(url).toContain('page=1');
      expect(url).toContain('limit=10');
    });

    it('should omit undefined query parameters', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: createMockHeaders([['content-type', 'application/json']]),
        json: async () => ([]),
      });

      await httpClient.get('/companies', {
        page: 1,
        filter: undefined,
        limit: null as any,
      });

      const url = fetchMock.mock.calls[0][0];
      expect(url).toContain('page=1');
      expect(url).not.toContain('filter');
      expect(url).not.toContain('limit');
    });
  });

  describe('POST Requests', () => {
    it('should make successful POST request with JSON body', async () => {
      const requestBody = { name: 'New Company', email: 'test@example.com' };
      const responseBody = { id: '456', ...requestBody };

      fetchMock.mockResolvedValue({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: createMockHeaders([['content-type', 'application/json']]),
        json: async () => responseBody,
      });

      const response = await httpClient.post<typeof responseBody>('/companies', requestBody);

      expect(response.data).toEqual(responseBody);
      expect(response.status).toBe(201);

      const requestOptions = fetchMock.mock.calls[0][1];
      expect(requestOptions.method).toBe('POST');
      expect(requestOptions.body).toBe(JSON.stringify(requestBody));
      expect(requestOptions.headers['Content-Type']).toBe('application/json');
    });

    it('should handle 202 Accepted with location header', async () => {
      const location = '/companies/123/serviceinvoices/456';
      fetchMock.mockResolvedValue({
        ok: true,
        status: 202,
        statusText: 'Accepted',
        headers: new Map([
          ['location', location],
          ['content-type', 'application/json'],
        ]),
        json: async () => ({}),
      });

      const response = await httpClient.post('/serviceinvoices', { data: 'test' });

      expect(response.status).toBe(202);
      expect(response.data).toMatchObject({
        code: 202,
        status: 'pending',
        location,
      });
    });
  });

  describe('PUT Requests', () => {
    it('should make successful PUT request', async () => {
      const updateData = { name: 'Updated Company' };
      const responseBody = { id: '123', ...updateData };

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: createMockHeaders([['content-type', 'application/json']]),
        json: async () => responseBody,
      });

      const response = await httpClient.put('/companies/123', updateData);

      expect(response.data).toEqual(responseBody);
      expect(fetchMock.mock.calls[0][1].method).toBe('PUT');
    });
  });

  describe('DELETE Requests', () => {
    it('should make successful DELETE request', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Map(),
        text: async () => '',
      });

      const response = await httpClient.delete('/companies/123');

      expect(response.status).toBe(204);
      expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
    });
  });

  describe('Authentication', () => {
it.skip('should include Basic Auth header', async () => {
      // TODO: Fix mock to properly access Headers object
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: createMockHeaders([['content-type', 'application/json']]),
        json: async () => ({}),
      });

      await httpClient.get('/test');

      const fetchCall = fetchMock.mock.calls[0];
      const requestInit = fetchCall[1] as RequestInit;
      const headers = requestInit.headers as Headers;

      // Get Authorization header (Headers is a Map-like object)
      const authHeader = headers?.get?.('Authorization') || (headers as any)?.['Authorization'];
      expect(authHeader).toBe(TEST_API_KEY);
    });

    it('should throw AuthenticationError on 401', async () => {
      fetchMock.mockResolvedValue(
        createMockErrorResponse(401, 'Unauthorized', { error: 'Invalid API key' })
      );

      // 401 errors should not retry
      await expect(httpClient.get('/test')).rejects.toMatchObject({
        name: 'AuthenticationError',
        code: 401,
      });

      // Verify no retries happened
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should throw ValidationError on 400', async () => {
      fetchMock.mockResolvedValue(
        createMockErrorResponse(400, 'Bad Request', {
          error: 'Validation failed',
          details: { field: 'required' },
        })
      );

      // 400 errors should not retry
      await expect(httpClient.get('/test')).rejects.toMatchObject({
        name: 'ValidationError',
        code: 400,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError on 404', async () => {
      fetchMock.mockResolvedValue(
        createMockErrorResponse(404, 'Not Found', { error: 'Resource not found' })
      );

      // 404 errors should not retry
      await expect(httpClient.get('/test')).rejects.toMatchObject({
        name: 'NotFoundError',
        code: 404,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should throw RateLimitError on 429 after retries', async () => {
      // Always return 429
      const errorResponse = createMockErrorResponse(429, 'Too Many Requests', { error: 'Rate limit exceeded' });
      // Add retry-after header
      errorResponse.headers.get = (key: string) => {
        if (key.toLowerCase() === 'retry-after') return '60';
        if (key.toLowerCase() === 'content-type') return 'application/json';
        return null;
      };
      fetchMock.mockResolvedValue(errorResponse);

      const promise = httpClient.get('/test');

      // Should fail after max retries
      await expect(promise).rejects.toMatchObject({
        name: 'RateLimitError',
        code: 429,
      });

      // Should have tried 4 times (1 initial + 3 retries)
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('should throw ServerError on 500 after retries', async () => {
      // Always return 500
      fetchMock.mockResolvedValue(
        createMockErrorResponse(500, 'Internal Server Error', { error: 'Server error' })
      );

      const promise = httpClient.get('/test');

      // Should fail after max retries
      await expect(promise).rejects.toMatchObject({
        name: 'ServerError',
        code: 500,
      });

      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('should throw ConnectionError on network failure after retries', async () => {
      // Always fail with network error
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      const promise = httpClient.get('/test');

      // Should fail after max retries
      await expect(promise).rejects.toMatchObject({
        name: 'ConnectionError',
      });

      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('should throw TimeoutError on abort after retries', async () => {
      // Always fail with abort error
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      fetchMock.mockRejectedValue(abortError);

      const promise = httpClient.get('/test');

      // Should fail after max retries
      await expect(promise).rejects.toMatchObject({
        name: 'TimeoutError',
      });

      expect(fetchMock).toHaveBeenCalledTimes(4);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on 503 Service Unavailable', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          headers: createMockHeaders([['content-type', 'application/json']]),
          json: async () => ({ error: 'Temporarily unavailable' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          headers: createMockHeaders([['content-type', 'application/json']]),
          json: async () => ({ error: 'Temporarily unavailable' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: createMockHeaders([['content-type', 'application/json']]),
          json: async () => ({ success: true }),
        });

      const promise = httpClient.get<{ success: boolean }>('/test');

      const response = await promise;

      expect(response.data).toEqual({ success: true });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should retry on network errors', async () => {
      fetchMock
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: createMockHeaders([['content-type', 'application/json']]),
          json: async () => ({ success: true }),
        });

      const promise = httpClient.get<{ success: boolean }>('/test');

      const response = await promise;

      expect(response.data).toEqual({ success: true });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should not retry on 400 Bad Request', async () => {
      fetchMock.mockResolvedValue(
        createMockErrorResponse(400, 'Bad Request', { error: 'Invalid input' })
      );

      const promise = httpClient.get('/test');

      await expect(promise).rejects.toThrow();
      expect(fetchMock).toHaveBeenCalledTimes(1); // No retries
    });

    it('should respect maxRetries limit', async () => {
      fetchMock.mockResolvedValue(
        createMockErrorResponse(503, 'Service Unavailable', { error: 'Unavailable' })
      );

      const promise = httpClient.get('/test');

      await expect(promise).rejects.toThrow();
      // Initial request + 3 retries = 4 total
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('should retry rate limit errors', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Map([
            ['content-type', 'application/json'],
            ['retry-after', '1'],
          ]),
          json: async () => ({ error: 'Rate limited' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: createMockHeaders([['content-type', 'application/json']]),
          json: async () => ({ success: true }),
        });

      const promise = httpClient.get<{ success: boolean }>('/test');

      const response = await promise;
      expect(response.data).toEqual({ success: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('URL Construction', () => {
    it('should handle leading slashes in paths', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: createMockHeaders([['content-type', 'application/json']]),
        json: async () => ({}),
      });

      await httpClient.get('/companies');
      expect(fetchMock.mock.calls[0][0]).toBe('https://api.nfe.io/v1/companies');

      await httpClient.get('companies');
      expect(fetchMock.mock.calls[1][0]).toBe('https://api.nfe.io/v1/companies');
    });

    it('should handle trailing slashes in baseUrl', () => {
      const configWithTrailingSlash = buildHttpConfig(
        TEST_API_KEY,
        'https://api.nfe.io/v1/',
        10000,
        createDefaultRetryConfig()
      );
      const clientWithTrailingSlash = new HttpClient(configWithTrailingSlash);

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: createMockHeaders([['content-type', 'application/json']]),
        json: async () => ({}),
      });

      clientWithTrailingSlash.get('/companies');

      // Should not have double slashes
      expect(fetchMock.mock.calls[0][0]).toBe('https://api.nfe.io/v1/companies');
    });
  });

  describe('Response Parsing', () => {
    it('should parse JSON responses', async () => {
      const jsonData = { id: '123', name: 'Test' };
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: createMockHeaders([['content-type', 'application/json']]),
        json: async () => jsonData,
      });

      const response = await httpClient.get<typeof jsonData>('/test');
      expect(response.data).toEqual(jsonData);
    });

    it('should parse text responses', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: createMockHeaders([['content-type', 'text/plain']]),
        text: async () => 'Plain text response',
      });

      const response = await httpClient.get<string>('/test');
      expect(response.data).toBe('Plain text response');
    });

    it('should handle PDF responses as Buffer', async () => {
      const pdfContent = 'PDF binary content';
      const arrayBuffer = new TextEncoder().encode(pdfContent).buffer;

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: createMockHeaders([['content-type', 'application/pdf']]),
        arrayBuffer: async () => arrayBuffer,
      });

      const response = await httpClient.get<Buffer>('/invoice.pdf');

      expect(Buffer.isBuffer(response.data)).toBe(true);
      expect(response.data.toString()).toBe(pdfContent);
    });

    it('should handle XML responses as Buffer', async () => {
      const xmlContent = '<xml>content</xml>';
      const arrayBuffer = new TextEncoder().encode(xmlContent).buffer;

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: createMockHeaders([['content-type', 'application/xml']]),
        arrayBuffer: async () => arrayBuffer,
      });

      const response = await httpClient.get<Buffer>('/invoice.xml');

      expect(Buffer.isBuffer(response.data)).toBe(true);
      expect(response.data.toString()).toBe(xmlContent);
    });
  });

  describe('Headers', () => {
    it('should include User-Agent header', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: createMockHeaders([['content-type', 'application/json']]),
        json: async () => ({}),
      });

      await httpClient.get('/test');

      const userAgent = fetchMock.mock.calls[0][1].headers['User-Agent'];
      expect(userAgent).toContain('@nfe-io/sdk');
      expect(userAgent).toContain('node/');
    });

    it('should include Accept header', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: createMockHeaders([['content-type', 'application/json']]),
        json: async () => ({}),
      });

      await httpClient.get('/test');

      const acceptHeader = fetchMock.mock.calls[0][1].headers['Accept'];
      expect(acceptHeader).toBe('application/json');
    });

    it('should include Content-Type for POST with JSON', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 201,
        headers: createMockHeaders([['content-type', 'application/json']]),
        json: async () => ({}),
      });

      await httpClient.post('/test', { data: 'value' });

      const contentType = fetchMock.mock.calls[0][1].headers['Content-Type'];
      expect(contentType).toBe('application/json');
    });

    it('should extract response headers', async () => {
      const headers = new Map([
        ['content-type', 'application/json'],
        ['x-request-id', '123456'],
        ['x-rate-limit-remaining', '100'],
      ]);

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers,
        json: async () => ({}),
      });

      const response = await httpClient.get('/test');

      expect(response.headers).toEqual({
        'content-type': 'application/json',
        'x-request-id': '123456',
        'x-rate-limit-remaining': '100',
      });
    });
  });

  describe('Utility Functions', () => {
    it('should create default retry config', () => {
      const retryConfig = createDefaultRetryConfig();

      expect(retryConfig).toEqual({
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
      });
    });

    it('should build HTTP config', () => {
      const retryConfig = createDefaultRetryConfig();
      const httpConfig = buildHttpConfig(
        'test-key',
        'https://api.test.com',
        5000,
        retryConfig
      );

      expect(httpConfig).toEqual({
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        timeout: 5000,
        retryConfig,
      });
    });
  });

  describe('Fetch Support Validation', () => {
    it('should throw error if fetch is not available', () => {
      const originalFetch = global.fetch;
      (global as any).fetch = undefined;

      expect(() => {
        new HttpClient(config);
      }).toThrow();

      global.fetch = originalFetch;
    });
  });
});
