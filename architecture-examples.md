# NFE.io SDK v3 - Arquitetura Multi-Propósito

## 📁 Estrutura Proposta

```
@nfe-io/sdk/
├── src/
│   ├── core/                    # 🧠 Core SDK (Node.js puro)
│   │   ├── client.ts            # Cliente principal
│   │   ├── resources/           # Recursos NFE.io
│   │   ├── http/                # HTTP client baseado em fetch
│   │   └── types/               # TypeScript definitions
│   │
│   ├── adapters/                # 🔌 Adaptadores para diferentes contextos
│   │   ├── mcp/                 # Model Context Protocol
│   │   │   ├── client.ts        # MCP client adapter
│   │   │   └── server.ts        # MCP server adapter
│   │   │
│   │   ├── n8n/                 # n8n Integration
│   │   │   ├── base-node.ts     # Base class para n8n nodes
│   │   │   └── node-configs/    # Configurações UI n8n
│   │   │
│   │   └── cli/                 # CLI Interface
│   │       └── commands.ts      # Comandos CLI
│   │
│   └── generated/               # 🤖 Auto-generated from OpenAPI
│       ├── schema.ts
│       └── runtime.ts
│
├── packages/                    # 📦 Packages separados
│   ├── mcp-client/              # @nfe-io/mcp-client
│   ├── mcp-server/              # @nfe-io/mcp-server  
│   ├── n8n-nodes/               # @nfe-io/n8n-nodes
│   └── cli/                     # @nfe-io/cli
│
└── examples/                    # 💡 Exemplos de uso
    ├── node-pure/               # Node.js puro
    ├── mcp-integration/         # MCP examples
    └── n8n-workflow/            # n8n workflow examples
```

## 🎯 Exemplos Práticos de Uso

### 1. Node.js Puro (Scripts/CLIs)

```typescript
// exemplo-node-puro.js
import { NfeClient } from '@nfe-io/sdk';

const nfe = new NfeClient({ 
  apiKey: process.env.NFE_API_KEY,
  environment: 'production' // ou 'sandbox'
});

// Usar em script simples
async function emitirNotaFiscal() {
  try {
    const company = await nfe.companies.retrieve('company-id');
    
    const invoice = await nfe.serviceInvoices.create('company-id', {
      cityServiceCode: '2690',
      description: 'Consultoria em TI',
      servicesAmount: 1000.00,
      borrower: {
        type: 'LegalEntity',
        federalTaxNumber: 12345678000123,
        name: 'Cliente Exemplo LTDA',
        email: 'cliente@exemplo.com.br',
        address: {
          country: 'BRA',
          postalCode: '01234-567',
          street: 'Rua Exemplo, 123',
          district: 'Centro',
          city: { code: '3550308', name: 'São Paulo' },
          state: 'SP'
        }
      }
    });

    // Aguardar processamento assíncrono
    if (invoice.code === 202) {
      console.log('Nota enviada para processamento:', invoice.location);
      const finalInvoice = await nfe.serviceInvoices.pollUntilComplete(invoice.location);
      console.log('Nota processada:', finalInvoice.id);
    }
    
  } catch (error) {
    if (error.type === 'AuthenticationError') {
      console.error('Erro de autenticação - verifique sua API key');
    } else {
      console.error('Erro:', error.message);
    }
  }
}

emitirNotaFiscal();
```

### 2. Base para MCP Client/Server

```typescript
// mcp-server.ts usando @nfe-io/mcp-server
import { NfeMcpServer } from '@nfe-io/mcp-server';

const server = new NfeMcpServer({
  name: 'nfe-io-server',
  version: '1.0.0',
  nfeConfig: {
    apiKey: process.env.NFE_API_KEY,
    environment: 'sandbox'
  }
});

// Servidor MCP expõe ferramentas NFE.io para LLMs
server.addTool('create_service_invoice', {
  description: 'Criar nova nota fiscal de serviço',
  inputSchema: {
    type: 'object',
    properties: {
      companyId: { type: 'string' },
      invoiceData: { 
        type: 'object',
        properties: {
          cityServiceCode: { type: 'string' },
          description: { type: 'string' },
          servicesAmount: { type: 'number' },
          borrower: { type: 'object' }
        }
      }
    }
  },
  handler: async (params) => {
    const nfe = server.getNfeClient();
    return await nfe.serviceInvoices.create(params.companyId, params.invoiceData);
  }
});

server.start();
```

```typescript
// mcp-client.ts usando @nfe-io/mcp-client  
import { NfeMcpClient } from '@nfe-io/mcp-client';

const client = new NfeMcpClient({
  serverEndpoint: 'stdio://nfe-io-server'
});

// Cliente MCP para usar em aplicações que precisam de NFE.io via MCP
async function usarMcpClient() {
  await client.connect();
  
  const tools = await client.listTools();
  console.log('Ferramentas disponíveis:', tools);
  
  const result = await client.callTool('create_service_invoice', {
    companyId: 'my-company-id',
    invoiceData: {
      cityServiceCode: '2690',
      description: 'Serviço via MCP',
      servicesAmount: 500.00,
      borrower: { /* dados do tomador */ }
    }
  });
  
  console.log('Nota criada via MCP:', result);
}
```

### 3. Base para n8n Nodes

```typescript
// n8n-service-invoice-node.ts usando @nfe-io/n8n-nodes
import { NfeBaseNode } from '@nfe-io/n8n-nodes';
import { IExecuteFunctions, INodeType, INodeTypeDescription } from 'n8n-workflow';

export class ServiceInvoiceNode extends NfeBaseNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NFE.io Service Invoice',
    name: 'nfeServiceInvoice', 
    group: ['transform'],
    version: 1,
    description: 'Criar e gerenciar notas fiscais de serviço via NFE.io',
    defaults: {
      name: 'NFE.io Service Invoice',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'nfeApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          { name: 'Create', value: 'create' },
          { name: 'Retrieve', value: 'retrieve' },
          { name: 'Cancel', value: 'cancel' },
          { name: 'Send Email', value: 'sendEmail' },
        ],
        default: 'create',
      },
      {
        displayName: 'Company ID',
        name: 'companyId',
        type: 'string',
        required: true,
        default: '',
      },
      // ... mais propriedades baseadas na operação
    ],
  };

  async execute(this: IExecuteFunctions) {
    const items = this.getInputData();
    const operation = this.getNodeParameter('operation', 0) as string;
    const companyId = this.getNodeParameter('companyId', 0) as string;
    
    // Usar o cliente NFE.io via adapter n8n
    const nfeClient = this.getNfeClient();
    
    const returnData = [];
    
    for (let i = 0; i < items.length; i++) {
      try {
        let result;
        
        switch (operation) {
          case 'create':
            const invoiceData = this.getNodeParameter('invoiceData', i) as any;
            result = await nfeClient.serviceInvoices.create(companyId, invoiceData);
            break;
            
          case 'retrieve':
            const invoiceId = this.getNodeParameter('invoiceId', i) as string;
            result = await nfeClient.serviceInvoices.retrieve(companyId, invoiceId);
            break;
            
          // ... outras operações
        }
        
        returnData.push({ json: result });
        
      } catch (error) {
        // Tratamento de erro específico do n8n
        this.handleNfeError(error, i);
      }
    }
    
    return [returnData];
  }
}
```

## 🔧 Implementação da Arquitetura Core

### Core Client (Funciona em Node.js puro)

```typescript
// src/core/client.ts
export class NfeClient {
  private http: HttpClient;
  private config: NfeConfig;
  
  // Resources - acessíveis em qualquer contexto
  public companies: CompaniesResource;
  public serviceInvoices: ServiceInvoicesResource;
  public legalPeople: LegalPeopleResource;
  public naturalPeople: NaturalPeopleResource;
  public webhooks: WebhooksResource;
  
  constructor(config: NfeConfig) {
    this.validateNodeVersion(); // Garante Node 18+
    this.config = this.normalizeConfig(config);
    this.http = new HttpClient(this.config);
    
    // Inicializar resources
    this.companies = new CompaniesResource(this.http);
    this.serviceInvoices = new ServiceInvoicesResource(this.http);
    // ...
  }
  
  private validateNodeVersion() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      throw new Error('NFE.io SDK v3 requires Node.js 18+ (for native fetch support)');
    }
  }
  
  // Método para aguardar processamento assíncrono
  async pollUntilComplete(locationUrl: string, options?: PollOptions): Promise<ServiceInvoice> {
    const maxAttempts = options?.maxAttempts ?? 30;
    const intervalMs = options?.intervalMs ?? 2000;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      
      try {
        const result = await this.http.get(locationUrl);
        if (result.status === 'completed') {
          return result.data as ServiceInvoice;
        }
        if (result.status === 'failed') {
          throw new NfeError('Invoice processing failed', result.error);
        }
      } catch (error) {
        if (attempt === maxAttempts - 1) throw error;
      }
    }
    
    throw new NfeError('Polling timeout - invoice still processing');
  }
}

// src/core/http/client.ts - HTTP baseado em fetch nativo
export class HttpClient {
  constructor(private config: NfeConfig) {}
  
  async request<T>(method: string, path: string, data?: any): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers = {
      'Authorization': `Basic ${Buffer.from(this.config.apiKey).toString('base64')}`,
      'Content-Type': 'application/json',
      'User-Agent': `nfe-io-sdk-v3/${VERSION} Node.js/${process.version}`,
    };
    
    // Usar fetch nativo do Node 18+
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(this.config.timeout ?? 30000),
    });
    
    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }
    
    // Tratar respostas assíncronas especiais do NFE.io
    if (response.status === 202) {
      return {
        code: 202,
        status: 'pending',
        location: response.headers.get('location')
      } as T;
    }
    
    return await response.json();
  }
  
  private async handleErrorResponse(response: Response): Promise<NfeError> {
    const errorData = await response.json().catch(() => ({}));
    
    switch (response.status) {
      case 401:
        return new AuthenticationError('Invalid API key', errorData);
      case 404:
        return new NotFoundError('Resource not found', errorData);
      case 400:
        return new ValidationError('Invalid request data', errorData);
      default:
        return new NfeError(`HTTP ${response.status}`, errorData);
    }
  }
}
```

### Configuração para diferentes ambientes

```typescript 
// src/core/config.ts
export interface NfeConfig {
  apiKey: string;
  environment?: 'production' | 'sandbox';
  timeout?: number;
  baseUrl?: string;  // Permite override completo se necessário
  retryConfig?: RetryConfig;
}

export function normalizeConfig(config: NfeConfig): Required<NfeConfig> {
  const baseUrls = {
    production: 'https://api.nfe.io/v1',
    sandbox: 'https://api-sandbox.nfe.io/v1', // se existir
  };
  
  return {
    ...config,
    environment: config.environment ?? 'production',
    timeout: config.timeout ?? 30000,
    baseUrl: config.baseUrl ?? baseUrls[config.environment ?? 'production'],
    retryConfig: config.retryConfig ?? { maxRetries: 3, baseDelay: 1000 }
  };
}
```

## 📦 Package.json Structure

```json
{
  "name": "@nfe-io/sdk",
  "version": "3.0.0",
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  },
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./mcp": {
      "import": "./dist/adapters/mcp/index.js",
      "types": "./dist/adapters/mcp/index.d.ts"
    },
    "./n8n": {
      "import": "./dist/adapters/n8n/index.js", 
      "types": "./dist/adapters/n8n/index.d.ts"
    }
  },
  "dependencies": {},
  "peerDependencies": {
    "n8n-workflow": "^1.0.0"
  },
  "peerDependenciesMeta": {
    "n8n-workflow": {
      "optional": true
    }
  }
}
```

Esta arquitetura garante:
✅ **Node.js puro**: Core SDK sem dependências externas  
✅ **Base MCP**: Adapters específicos para MCP client/server  
✅ **Base n8n**: Adapters e classes base para nodes n8n  
✅ **Reutilização**: Core compartilhado entre todos os casos de uso  
✅ **Tipagem forte**: TypeScript em toda stack  
✅ **Zero deps**: Apenas fetch nativo e APIs Node.js built-in  