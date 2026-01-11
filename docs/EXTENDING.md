# Extending the NFE.io SDK

Guide for extending the NFE.io SDK with custom functionality, adapters, and integrations.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Creating Custom Resources](#creating-custom-resources)
- [Extending the HTTP Client](#extending-the-http-client)
- [Building Adapters](#building-adapters)
- [MCP Integration](#mcp-integration)
- [n8n Integration](#n8n-integration)
- [Best Practices](#best-practices)

## Architecture Overview

The NFE.io SDK v3 is designed with extensibility in mind:

```
nfe-io (core)
├── NfeClient          # Main client class
├── HttpClient         # HTTP layer with retry logic
├── Resources          # API resource classes
├── Types              # TypeScript definitions
└── Errors             # Error hierarchy

Your Extension
├── Adapter Layer      # Your custom adapter
├── Custom Resources   # Additional API resources
└── Utilities          # Helper functions
```

### Key Extension Points

1. **Custom Resources** - Add new API resource classes
2. **HTTP Interceptors** - Modify requests/responses
3. **Adapter Pattern** - Create platform-specific integrations
4. **Type Extensions** - Add custom types and interfaces

## Creating Custom Resources

### Basic Resource Pattern

All NFE.io resources follow a consistent pattern. Here's how to create your own:

```typescript
import { HttpClient } from 'nfe-io/core/http/client';
import type { ListResponse, PaginationOptions } from 'nfe-io';

export interface CustomEntity {
  id: string;
  name: string;
  createdAt: string;
}

export class CustomResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a new custom entity
   */
  async create(data: Partial<CustomEntity>): Promise<CustomEntity> {
    const response = await this.http.post<CustomEntity>('/custom', data);
    return response.data;
  }

  /**
   * List custom entities
   */
  async list(options?: PaginationOptions): Promise<ListResponse<CustomEntity>> {
    const response = await this.http.get<ListResponse<CustomEntity>>(
      '/custom',
      options
    );
    return response.data;
  }

  /**
   * Get a specific custom entity
   */
  async retrieve(id: string): Promise<CustomEntity> {
    const response = await this.http.get<CustomEntity>(`/custom/${id}`);
    return response.data;
  }

  /**
   * Update a custom entity
   */
  async update(id: string, data: Partial<CustomEntity>): Promise<CustomEntity> {
    const response = await this.http.put<CustomEntity>(`/custom/${id}`, data);
    return response.data;
  }

  /**
   * Delete a custom entity
   */
  async delete(id: string): Promise<void> {
    await this.http.delete(`/custom/${id}`);
  }
}
```

### Extending NfeClient

Add your custom resource to the client:

```typescript
import { NfeClient, type NfeConfig } from 'nfe-io';
import { CustomResource } from './custom-resource';

export class ExtendedNfeClient extends NfeClient {
  public readonly custom: CustomResource;

  constructor(config: NfeConfig) {
    super(config);
    
    // Initialize custom resource with the same HTTP client
    // @ts-ignore - Access protected http property
    this.custom = new CustomResource(this.http);
  }
}

// Usage
const nfe = new ExtendedNfeClient({
  apiKey: 'your-api-key'
});

const entity = await nfe.custom.create({ name: 'Test' });
```

### Company-Scoped Resources

Many NFE.io resources are scoped by company. Follow this pattern:

```typescript
export class CompanyScopedResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create entity scoped to a company
   */
  async create(
    companyId: string,
    data: Partial<CustomEntity>
  ): Promise<CustomEntity> {
    const response = await this.http.post<CustomEntity>(
      `/companies/${companyId}/custom`,
      data
    );
    return response.data;
  }

  /**
   * List entities for a company
   */
  async list(
    companyId: string,
    options?: PaginationOptions
  ): Promise<ListResponse<CustomEntity>> {
    const response = await this.http.get<ListResponse<CustomEntity>>(
      `/companies/${companyId}/custom`,
      options
    );
    return response.data;
  }

  /**
   * Get specific entity within company scope
   */
  async retrieve(
    companyId: string,
    entityId: string
  ): Promise<CustomEntity> {
    const response = await this.http.get<CustomEntity>(
      `/companies/${companyId}/custom/${entityId}`
    );
    return response.data;
  }
}
```

## Extending the HTTP Client

### Request Interceptors

Add custom logic before requests are sent:

```typescript
import { HttpClient, type HttpConfig } from 'nfe-io/core/http/client';

export class CustomHttpClient extends HttpClient {
  async request<T>(
    method: string,
    path: string,
    data?: any,
    options?: any
  ): Promise<HttpResponse<T>> {
    // Add custom headers
    options = {
      ...options,
      headers: {
        ...options?.headers,
        'X-Custom-Header': 'custom-value',
        'X-Request-ID': this.generateRequestId()
      }
    };

    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${method}] ${path}`, data);
    }

    // Call parent implementation
    return super.request<T>(method, path, data, options);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### Response Interceptors

Process responses before they're returned:

```typescript
export class CustomHttpClient extends HttpClient {
  async request<T>(
    method: string,
    path: string,
    data?: any,
    options?: any
  ): Promise<HttpResponse<T>> {
    const response = await super.request<T>(method, path, data, options);

    // Log responses
    console.log(`Response [${response.status}]:`, response.data);

    // Transform response data
    if (response.data && typeof response.data === 'object') {
      response.data = this.transformResponseData(response.data);
    }

    return response;
  }

  private transformResponseData(data: any): any {
    // Example: Convert date strings to Date objects
    if (data.createdAt && typeof data.createdAt === 'string') {
      data.createdAt = new Date(data.createdAt);
    }
    return data;
  }
}
```

### Custom Retry Logic

Implement custom retry strategies:

```typescript
export class CustomHttpClient extends HttpClient {
  protected async executeWithRetry<T>(
    fn: () => Promise<HttpResponse<T>>,
    retryConfig: RetryConfig
  ): Promise<HttpResponse<T>> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Custom retry decision logic
        if (!this.shouldRetryCustom(error, attempt, retryConfig)) {
          throw error;
        }

        // Custom delay calculation
        const delay = this.calculateCustomDelay(attempt, retryConfig);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private shouldRetryCustom(
    error: any,
    attempt: number,
    config: RetryConfig
  ): boolean {
    // Custom retry logic
    if (attempt >= config.maxRetries) {
      return false;
    }

    // Retry on specific error types
    if (error.type === 'RATE_LIMIT') {
      return true;
    }

    // Retry on network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }

    return false;
  }

  private calculateCustomDelay(
    attempt: number,
    config: RetryConfig
  ): number {
    // Exponential backoff with jitter
    const exponentialDelay = config.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, config.maxDelay);
  }
}
```

## Building Adapters

### Adapter Pattern

Create platform-specific adapters that wrap the core SDK:

```typescript
// adapter.ts
import { NfeClient, type NfeConfig, type ServiceInvoice } from 'nfe-io';

export interface AdapterConfig extends NfeConfig {
  // Platform-specific configuration
  platformId?: string;
  customSettings?: Record<string, any>;
}

export abstract class BaseAdapter {
  protected readonly client: NfeClient;

  constructor(config: AdapterConfig) {
    this.client = new NfeClient(config);
  }

  /**
   * Platform-specific initialization
   */
  abstract initialize(): Promise<void>;

  /**
   * Platform-specific cleanup
   */
  abstract cleanup(): Promise<void>;

  /**
   * Transform SDK data to platform format
   */
  abstract transformToPlatform<T>(data: T): any;

  /**
   * Transform platform data to SDK format
   */
  abstract transformFromPlatform<T>(data: any): T;
}
```

### Example: Express.js Adapter

```typescript
import express, { Request, Response } from 'express';
import { BaseAdapter, type AdapterConfig } from './adapter';
import type { ServiceInvoice } from 'nfe-io';

export class ExpressAdapter extends BaseAdapter {
  private app?: express.Application;

  async initialize(): Promise<void> {
    this.app = express();
    this.app.use(express.json());
    
    // Setup routes
    this.setupRoutes();
    
    console.log('Express adapter initialized');
  }

  async cleanup(): Promise<void> {
    // Cleanup logic
    console.log('Express adapter cleaned up');
  }

  private setupRoutes(): void {
    if (!this.app) return;

    // Create invoice endpoint
    this.app.post('/invoices', async (req: Request, res: Response) => {
      try {
        const { companyId, ...data } = req.body;
        
        const invoice = await this.client.serviceInvoices.create(
          companyId,
          data
        );
        
        res.json(this.transformToPlatform(invoice));
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // List invoices endpoint
    this.app.get('/invoices/:companyId', async (req: Request, res: Response) => {
      try {
        const { companyId } = req.params;
        const invoices = await this.client.serviceInvoices.list(companyId);
        
        res.json(this.transformToPlatform(invoices));
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  transformToPlatform<T>(data: T): any {
    // Transform SDK response to Express-friendly format
    return {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  }

  transformFromPlatform<T>(data: any): T {
    // Transform Express request to SDK format
    return data as T;
  }

  listen(port: number): void {
    if (!this.app) {
      throw new Error('Adapter not initialized');
    }
    
    this.app.listen(port, () => {
      console.log(`Express server listening on port ${port}`);
    });
  }
}

// Usage
const adapter = new ExpressAdapter({
  apiKey: process.env.NFE_API_KEY!
});

await adapter.initialize();
adapter.listen(3000);
```

## MCP Integration

Model Context Protocol integration for LLM tool usage.

### MCP Server Structure

```typescript
// mcp-server.ts
import { NfeClient } from 'nfe-io';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export class NfeMcpServer {
  private server: Server;
  private nfeClient: NfeClient;

  constructor(apiKey: string) {
    this.server = new Server(
      {
        name: 'nfe-io-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.nfeClient = new NfeClient({ apiKey });
    this.setupTools();
  }

  private setupTools(): void {
    // Register create invoice tool
    this.server.setRequestHandler(
      'tools/list',
      async () => ({
        tools: [
          {
            name: 'create_service_invoice',
            description: 'Create a new service invoice (NFS-e)',
            inputSchema: {
              type: 'object',
              properties: {
                companyId: {
                  type: 'string',
                  description: 'Company ID'
                },
                borrower: {
                  type: 'object',
                  description: 'Client information'
                },
                cityServiceCode: {
                  type: 'string',
                  description: 'City service code'
                },
                servicesAmount: {
                  type: 'number',
                  description: 'Services amount in BRL'
                }
              },
              required: ['companyId', 'borrower', 'cityServiceCode', 'servicesAmount']
            }
          },
          {
            name: 'list_service_invoices',
            description: 'List service invoices for a company',
            inputSchema: {
              type: 'object',
              properties: {
                companyId: {
                  type: 'string',
                  description: 'Company ID'
                }
              },
              required: ['companyId']
            }
          }
        ]
      })
    );

    // Handle tool calls
    this.server.setRequestHandler(
      'tools/call',
      async (request) => {
        const { name, arguments: args } = request.params;

        try {
          switch (name) {
            case 'create_service_invoice': {
              const { companyId, ...data } = args;
              const invoice = await this.nfeClient.serviceInvoices.createAndWait(
                companyId,
                data
              );
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(invoice, null, 2)
                  }
                ]
              };
            }

            case 'list_service_invoices': {
              const { companyId } = args;
              const result = await this.nfeClient.serviceInvoices.list(companyId);
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                  }
                ]
              };
            }

            default:
              throw new Error(`Unknown tool: ${name}`);
          }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error.message}`
              }
            ],
            isError: true
          };
        }
      }
    );
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('NFE.io MCP Server started');
  }
}

// Run server
const apiKey = process.env.NFE_API_KEY;
if (!apiKey) {
  throw new Error('NFE_API_KEY environment variable required');
}

const server = new NfeMcpServer(apiKey);
server.start();
```

## n8n Integration

Create custom n8n nodes for NFE.io operations.

### n8n Node Structure

```typescript
// NfeIo.node.ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NfeClient } from 'nfe-io';

export class NfeIo implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NFE.io',
    name: 'nfeIo',
    icon: 'file:nfeio.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with NFE.io API',
    defaults: {
      name: 'NFE.io',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'nfeIoApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Service Invoice',
            value: 'serviceInvoice',
          },
          {
            name: 'Company',
            value: 'company',
          },
        ],
        default: 'serviceInvoice',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['serviceInvoice'],
          },
        },
        options: [
          {
            name: 'Create',
            value: 'create',
            description: 'Create a service invoice',
            action: 'Create a service invoice',
          },
          {
            name: 'Get',
            value: 'get',
            description: 'Get a service invoice',
            action: 'Get a service invoice',
          },
          {
            name: 'List',
            value: 'list',
            description: 'List service invoices',
            action: 'List service invoices',
          },
        ],
        default: 'create',
      },
      // Add more fields...
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    
    const credentials = await this.getCredentials('nfeIoApi');
    const nfeClient = new NfeClient({
      apiKey: credentials.apiKey as string,
    });

    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        if (resource === 'serviceInvoice') {
          if (operation === 'create') {
            const companyId = this.getNodeParameter('companyId', i) as string;
            const data = this.getNodeParameter('data', i) as any;
            
            const invoice = await nfeClient.serviceInvoices.createAndWait(
              companyId,
              data
            );
            
            returnData.push({
              json: invoice,
              pairedItem: { item: i },
            });
          } else if (operation === 'list') {
            const companyId = this.getNodeParameter('companyId', i) as string;
            
            const result = await nfeClient.serviceInvoices.list(companyId);
            
            returnData.push({
              json: result,
              pairedItem: { item: i },
            });
          }
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: error.message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
```

## Best Practices

### 1. Type Safety

Always use TypeScript types:

```typescript
import type {
  ServiceInvoice,
  ServiceInvoiceData,
  Company
} from 'nfe-io';

// Good
async function createInvoice(
  companyId: string,
  data: ServiceInvoiceData
): Promise<ServiceInvoice> {
  return nfe.serviceInvoices.create(companyId, data);
}

// Bad
async function createInvoice(companyId: any, data: any): Promise<any> {
  return nfe.serviceInvoices.create(companyId, data);
}
```

### 2. Error Handling

Handle errors appropriately:

```typescript
import { AuthenticationError, ValidationError } from 'nfe-io';

try {
  await nfe.serviceInvoices.create(companyId, data);
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle auth error
    console.error('Authentication failed');
  } else if (error instanceof ValidationError) {
    // Handle validation error
    console.error('Validation failed:', error.details);
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

### 3. Resource Cleanup

Always cleanup resources:

```typescript
class MyAdapter extends BaseAdapter {
  private resources: any[] = [];

  async initialize(): Promise<void> {
    // Setup resources
    this.resources = await this.setupResources();
  }

  async cleanup(): Promise<void> {
    // Cleanup all resources
    await Promise.all(
      this.resources.map(r => r.cleanup())
    );
    this.resources = [];
  }
}
```

### 4. Configuration Validation

Validate configuration early:

```typescript
import { validateApiKeyFormat } from 'nfe-io';

function createAdapter(config: AdapterConfig) {
  // Validate API key
  const validation = validateApiKeyFormat(config.apiKey);
  if (!validation.valid) {
    throw new Error(`Invalid API key: ${validation.issues.join(', ')}`);
  }

  // Check environment support
  const support = isEnvironmentSupported();
  if (!support.supported) {
    throw new Error(`Environment not supported: ${support.issues.join(', ')}`);
  }

  return new MyAdapter(config);
}
```

### 5. Documentation

Document your extensions:

```typescript
/**
 * Custom adapter for Platform X
 * 
 * @example
 * ```typescript
 * const adapter = new PlatformXAdapter({
 *   apiKey: 'your-api-key',
 *   platformId: 'platform-x-id'
 * });
 * 
 * await adapter.initialize();
 * const result = await adapter.processInvoice(data);
 * await adapter.cleanup();
 * ```
 */
export class PlatformXAdapter extends BaseAdapter {
  // Implementation...
}
```

## Additional Resources

- [Core SDK API Reference](./API.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [NFE.io API Documentation](https://nfe.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

For extension development questions:

1. Check the [API Reference](./API.md)
2. Review example integrations in `examples/`
3. Open an issue on [GitHub](https://github.com/nfe/client-nodejs/issues)
