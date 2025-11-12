# Implementação Prática - Roadmap Técnico

## 🎯 Respondendo suas Perguntas Específicas

### 1. "Node.js Puro" - O que isso significa?

Por "Node.js puro" entendo que você quer que o SDK funcione em **qualquer ambiente Node.js** sem dependências específicas de frameworks:

```javascript
// ✅ Deve funcionar em TODOS estes cenários:

// 1. Script simples
node meu-script.js

// 2. CLI personalizada  
#!/usr/bin/env node
const nfe = require('@nfe-io/sdk');

// 3. Aplicação Express
const express = require('express');
const nfe = require('@nfe-io/sdk');

// 4. Aplicação Fastify
const fastify = require('fastify');
const nfe = require('@nfe-io/sdk');

// 5. Worker/Queue jobs (Bull, BeeQueue)
const Queue = require('bull');
const nfe = require('@nfe-io/sdk');

// 6. Serverless (Vercel, Netlify, AWS Lambda)
exports.handler = async (event) => {
  const nfe = require('@nfe-io/sdk');
  // ...
};

// 7. Desktop app (Electron)
const { app } = require('electron');
const nfe = require('@nfe-io/sdk');
```

### 2. Como garantir essa compatibilidade?

**Estratégia: Core minimalista + Adapters específicos**

```typescript
// ✅ Core SDK (sem dependências externas)
// src/core/client.ts
export class NfeClient {
  constructor(config: NfeConfig) {
    // Validar Node.js 18+ (para fetch nativo)
    this.validateEnvironment();
    
    // Usar apenas APIs nativas
    this.http = new FetchHttpClient(config);
  }
  
  private validateEnvironment() {
    // Garantir que funciona em qualquer Node.js 18+
    if (typeof fetch === 'undefined') {
      throw new Error('NFE.io SDK requires Node.js 18+ with native fetch');
    }
  }
}
```

### 3. Como funciona para MCP e n8n?

**MCP**: Model Context Protocol permite que LLMs (Claude, GPT, etc.) usem APIs através de "ferramentas"
**n8n**: Plataforma de automação visual (como Zapier, mas open-source)

Vou mostrar implementações práticas:

## 🛠️ Implementação Step-by-Step

### Fase 1: Core SDK (Funciona em Node.js puro)

```typescript
// package.json - Zero runtime dependencies
{
  "name": "@nfe-io/sdk",
  "version": "3.0.0",
  "main": "./dist/index.js",
  "type": "module",
  "engines": { "node": ">=18.0.0" },
  "dependencies": {},  // ← ZERO dependencies!
  "exports": {
    ".": "./dist/index.js",
    "./mcp": "./dist/mcp/index.js", 
    "./n8n": "./dist/n8n/index.js"
  }
}

// src/index.ts - Export principal
export { NfeClient } from './core/client.js';
export * from './core/types.js';
export * from './core/errors.js';

// src/core/client.ts - Cliente principal
import { FetchHttpClient } from './http/fetch-client.js';
import { ServiceInvoicesResource } from './resources/service-invoices.js';
import type { NfeConfig } from './types.js';

export class NfeClient {
  public serviceInvoices: ServiceInvoicesResource;
  public companies: CompaniesResource;
  // ... outros resources
  
  constructor(config: NfeConfig) {
    this.validateNodeVersion();
    
    const httpClient = new FetchHttpClient({
      baseUrl: this.getBaseUrl(config.environment),
      apiKey: config.apiKey,
      timeout: config.timeout ?? 30000
    });
    
    // Inicializar todos os resources
    this.serviceInvoices = new ServiceInvoicesResource(httpClient);
    this.companies = new CompaniesResource(httpClient);
  }
  
  private validateNodeVersion() {
    if (typeof fetch === 'undefined') {
      throw new Error(
        'NFE.io SDK v3 requires Node.js 18+ with native fetch support. ' +
        'Current Node.js version does not have fetch available.'
      );
    }
  }
  
  private getBaseUrl(env: 'production' | 'sandbox' = 'production'): string {
    return env === 'sandbox' 
      ? 'https://api-sandbox.nfe.io/v1'  // Se existir
      : 'https://api.nfe.io/v1';
  }
}

// src/core/http/fetch-client.ts - HTTP com fetch nativo
export class FetchHttpClient {
  constructor(private config: HttpConfig) {}
  
  async request<T>(method: string, path: string, data?: unknown): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    
    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: {
        'Authorization': `Basic ${Buffer.from(this.config.apiKey).toString('base64')}`,
        'Content-Type': 'application/json',
        'User-Agent': `@nfe-io/sdk@${VERSION} node/${process.version}`,
      },
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(this.config.timeout),
    });
    
    if (!response.ok) {
      throw await this.createErrorFromResponse(response);
    }
    
    // Tratar respostas especiais do NFE.io
    if (response.status === 202) {
      return {
        code: 202,
        status: 'pending',
        location: response.headers.get('location')
      } as T;
    }
    
    return await response.json();
  }
  
  private async createErrorFromResponse(response: Response) {
    const data = await response.json().catch(() => ({}));
    
    switch (response.status) {
      case 401: return new AuthenticationError('Invalid API key', data);
      case 404: return new NotFoundError('Resource not found', data);
      case 400: return new ValidationError('Invalid request', data);
      default: return new NfeError(`HTTP ${response.status}`, data);
    }
  }
}
```

### Fase 2: Adapter MCP (para LLMs)

```typescript
// src/mcp/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { NfeClient } from '../core/client.js';

export interface NfeMcpConfig {
  nfeApiKey: string;
  nfeEnvironment?: 'production' | 'sandbox';
  serverName?: string;
  serverVersion?: string;
}

export class NfeMcpServer {
  private server: Server;
  private nfeClient: NfeClient;
  
  constructor(config: NfeMcpConfig) {
    this.server = new Server(
      { 
        name: config.serverName ?? 'nfe-io-mcp-server',
        version: config.serverVersion ?? '1.0.0'
      },
      { capabilities: { tools: {} } }
    );
    
    this.nfeClient = new NfeClient({
      apiKey: config.nfeApiKey,
      environment: config.nfeEnvironment ?? 'production'
    });
    
    this.setupMcpTools();
  }
  
  private setupMcpTools() {
    // Registrar ferramenta: Criar Nota Fiscal
    this.server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'nfe_create_service_invoice') {
        const { companyId, invoiceData } = request.params.arguments as any;
        
        try {
          const result = await this.nfeClient.serviceInvoices.create(companyId, invoiceData);
          
          // Se nota em processamento assíncrono, aguardar
          if (result.code === 202) {
            const finalResult = await this.pollInvoiceCompletion(result.location);
            return {
              content: [{
                type: 'text',
                text: `✅ Nota Fiscal criada com sucesso!\\n\\n` +
                      `**ID:** ${finalResult.id}\\n` +
                      `**Número:** ${finalResult.number}\\n` +
                      `**Status:** ${finalResult.status}\\n` +
                      `**PDF:** ${finalResult.downloadUrl}`
              }]
            };
          }
          
          return {
            content: [{ type: 'text', text: `Nota criada: ${JSON.stringify(result)}` }]
          };
          
        } catch (error) {
          return {
            content: [{
              type: 'text', 
              text: `❌ Erro ao criar nota fiscal: ${error.message}`
            }]
          };
        }
      }
      
      throw new Error(`Ferramenta desconhecida: ${request.params.name}`);
    });
    
    // Listar ferramentas disponíveis para o LLM
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [{
        name: 'nfe_create_service_invoice',
        description: 'Criar uma nova nota fiscal de serviço no NFE.io',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'ID da empresa emissora (obrigatório)'
            },
            invoiceData: {
              type: 'object',
              description: 'Dados completos da nota fiscal',
              properties: {
                cityServiceCode: { 
                  type: 'string', 
                  description: 'Código do serviço municipal (ex: 2690)' 
                },
                description: { 
                  type: 'string', 
                  description: 'Descrição detalhada dos serviços prestados' 
                },
                servicesAmount: { 
                  type: 'number', 
                  description: 'Valor total em reais (ex: 1500.00)' 
                },
                borrower: {
                  type: 'object',
                  description: 'Dados do tomador do serviço',
                  properties: {
                    type: { 
                      type: 'string', 
                      enum: ['NaturalPerson', 'LegalEntity'],
                      description: 'Tipo: NaturalPerson (CPF) ou LegalEntity (CNPJ)'
                    },
                    federalTaxNumber: { 
                      type: 'number', 
                      description: 'CPF ou CNPJ (apenas números)' 
                    },
                    name: { 
                      type: 'string', 
                      description: 'Nome completo ou Razão Social' 
                    },
                    email: { 
                      type: 'string', 
                      description: 'Email para envio da nota fiscal' 
                    },
                    address: {
                      type: 'object',
                      properties: {
                        country: { type: 'string', description: 'Código do país (sempre BRA)' },
                        postalCode: { type: 'string', description: 'CEP (ex: 01234-567)' },
                        street: { type: 'string', description: 'Logradouro completo' },
                        district: { type: 'string', description: 'Bairro' },
                        city: {
                          type: 'object',
                          properties: {
                            code: { type: 'string', description: 'Código IBGE da cidade' },
                            name: { type: 'string', description: 'Nome da cidade' }
                          }
                        },
                        state: { type: 'string', description: 'Sigla do estado (SP, RJ, etc.)' }
                      }
                    }
                  }
                }
              },
              required: ['cityServiceCode', 'description', 'servicesAmount', 'borrower']
            }
          },
          required: ['companyId', 'invoiceData']
        }
      }]
    }));
  }
  
  private async pollInvoiceCompletion(location: string, maxAttempts = 30): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        // Fazer request para URL de location para verificar status
        const response = await fetch(location, {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.nfeClient.config.apiKey).toString('base64')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'completed') {
            return data;
          }
          if (data.status === 'failed') {
            throw new Error(`Invoice processing failed: ${data.error}`);
          }
        }
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
      }
    }
    
    throw new Error('Invoice processing timeout');
  }
  
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('NFE.io MCP Server started');
  }
}

// Executável do MCP Server
// bin/nfe-mcp-server.js
#!/usr/bin/env node
import { NfeMcpServer } from '@nfe-io/sdk/mcp';

const server = new NfeMcpServer({
  nfeApiKey: process.env.NFE_API_KEY,
  nfeEnvironment: process.env.NFE_ENVIRONMENT as any,
});

server.start().catch(console.error);
```

### Fase 3: Adapter n8n (para Automação)

```typescript
// src/n8n/base-node.ts
import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { NfeClient } from '../core/client.js';

export abstract class NfeBaseNode {
  protected getNfeClient(context: IExecuteFunctions): NfeClient {
    const credentials = context.getCredentials('nfeioApi');
    
    return new NfeClient({
      apiKey: credentials.apiKey as string,
      environment: (credentials.environment as any) ?? 'production',
      timeout: 30000
    });
  }
  
  protected handleNfeError(error: any, itemIndex: number, context: IExecuteFunctions): never {
    let message = error.message || 'Unknown error';
    
    // Adicionar contexto específico do NFE.io
    if (error.type === 'AuthenticationError') {
      message = 'Invalid NFE.io API key. Please check your credentials.';
    } else if (error.type === 'ValidationError') {
      message = `Invalid request data: ${error.message}`;
    } else if (error.type === 'NotFoundError') {
      message = `Resource not found: ${error.message}`;
    }
    
    throw new NodeOperationError(context.getNode(), message, { itemIndex });
  }
  
  protected async waitForInvoiceProcessing(
    nfeClient: NfeClient, 
    location: string, 
    timeoutSeconds = 120
  ): Promise<any> {
    const maxAttempts = Math.ceil(timeoutSeconds / 2);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        // Implementar polling usando o cliente NFE.io
        const result = await nfeClient.pollUntilComplete(location, {
          maxAttempts: 1,  // Apenas uma tentativa por ciclo
          intervalMs: 0     // Sem delay adicional
        });
        
        return result;
        
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw new Error(`Invoice processing timeout after ${timeoutSeconds} seconds`);
        }
        // Continue tentando
      }
    }
  }
}

// src/n8n/nodes/service-invoice.node.ts
import { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NfeBaseNode } from '../base-node.js';

export class ServiceInvoiceNode extends NfeBaseNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NFE.io Service Invoice',
    name: 'nfeServiceInvoice',
    icon: 'file:nfeio.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Create and manage service invoices using NFE.io API',
    defaults: { name: 'NFE.io Service Invoice' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'nfeioApi', required: true }],
    properties: [
      // ... propriedades do node (definidas anteriormente)
    ]
  };
  
  async execute(context: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = context.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = context.getNodeParameter('operation', 0) as string;
    
    const nfeClient = this.getNfeClient(context);
    
    for (let i = 0; i < items.length; i++) {
      try {
        const companyId = context.getNodeParameter('companyId', i) as string;
        let result: any;
        
        switch (operation) {
          case 'create': {
            const invoiceData = this.buildInvoiceData(context, i);
            result = await nfeClient.serviceInvoices.create(companyId, invoiceData);
            
            // Aguardar processamento se necessário
            const shouldWait = context.getNodeParameter('additionalOptions.waitForProcessing', i, true) as boolean;
            if (shouldWait && result.code === 202) {
              const timeout = context.getNodeParameter('additionalOptions.timeout', i, 60) as number;
              result = await this.waitForInvoiceProcessing(nfeClient, result.location, timeout);
            }
            break;
          }
          
          case 'get': {
            const invoiceId = context.getNodeParameter('invoiceId', i) as string;
            result = await nfeClient.serviceInvoices.retrieve(companyId, invoiceId);
            break;
          }
          
          case 'downloadPdf': {
            const invoiceId = context.getNodeParameter('invoiceId', i) as string;
            const pdfBuffer = await nfeClient.serviceInvoices.downloadPdf(companyId, invoiceId);
            
            result = { invoiceId, pdfSize: pdfBuffer.length };
            
            // Adicionar PDF como binary data para outros nodes
            returnData.push({
              json: result,
              binary: {
                data: {
                  data: pdfBuffer.toString('base64'),
                  mimeType: 'application/pdf',
                  fileName: `nota-fiscal-${invoiceId}.pdf`
                }
              }
            });
            continue;
          }
          
          // ... outras operações
        }
        
        returnData.push({ json: { operation, success: true, ...result } });
        
      } catch (error) {
        if (context.continueOnFail()) {
          returnData.push({
            json: { operation, success: false, error: error.message }
          });
          continue;
        }
        
        this.handleNfeError(error, i, context);
      }
    }
    
    return [returnData];
  }
  
  private buildInvoiceData(context: IExecuteFunctions, itemIndex: number) {
    const address = context.getNodeParameter('address', itemIndex) as any;
    
    return {
      cityServiceCode: context.getNodeParameter('cityServiceCode', itemIndex) as string,
      description: context.getNodeParameter('description', itemIndex) as string,
      servicesAmount: context.getNodeParameter('servicesAmount', itemIndex) as number,
      borrower: {
        type: context.getNodeParameter('borrowerType', itemIndex) as string,
        federalTaxNumber: context.getNodeParameter('borrowerTaxNumber', itemIndex) as number,
        name: context.getNodeParameter('borrowerName', itemIndex) as string,
        email: context.getNodeParameter('borrowerEmail', itemIndex) as string,
        address: {
          country: 'BRA',
          postalCode: address.postalCode,
          street: address.street,
          number: address.number || 'S/N',
          district: address.district,
          city: {
            code: address.cityCode,
            name: address.cityName
          },
          state: address.state
        }
      }
    };
  }
}
```

## 🎯 Como usar cada cenário

### 1. Node.js Puro - Script simples
```bash
npm install @nfe-io/sdk
```

```javascript
// emitir-nf.js
import { NfeClient } from '@nfe-io/sdk';

const nfe = new NfeClient({ 
  apiKey: process.env.NFE_API_KEY,
  environment: 'production'  
});

const invoice = await nfe.serviceInvoices.create('company-id', {
  cityServiceCode: '2690',
  description: 'Consultoria TI',
  servicesAmount: 1500.00,
  borrower: {
    type: 'LegalEntity',
    federalTaxNumber: 12345678000123,
    name: 'Cliente LTDA',
    email: 'cliente@exemplo.com',
    address: {
      country: 'BRA',
      postalCode: '01234-567',
      street: 'Rua ABC, 123',
      district: 'Centro',
      city: { code: '3550308', name: 'São Paulo' },
      state: 'SP'
    }
  }
});

console.log('Nota criada:', invoice.id);
```

### 2. MCP Server para LLMs
```bash
npm install -g @nfe-io/mcp-server
export NFE_API_KEY="your-api-key"
nfe-mcp-server
```

No Claude Desktop:
```json
{
  "mcpServers": {
    "nfe-io": {
      "command": "nfe-mcp-server",
      "env": { "NFE_API_KEY": "your-key" }
    }
  }
}
```

### 3. n8n Nodes
```bash
npm install @nfe-io/n8n-nodes
```

No n8n: Instalar community node → `@nfe-io/n8n-nodes`

## ✅ Próximos Passos Recomendados

1. **Implementar Core SDK** primeiro (funciona em Node.js puro)
2. **Testar em diferentes ambientes** (scripts, Express, serverless)  
3. **Criar adapter MCP** para integração com LLMs
4. **Desenvolver nodes n8n** para automação visual
5. **Publicar packages separados** mas interoperáveis

Essa arquitetura garante máxima flexibilidade mantendo tudo interoperável! O que você acha dessa abordagem?