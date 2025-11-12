# Exemplos Específicos - MCP e n8n Integration

## 🤖 Model Context Protocol (MCP) - Detalhamento

### Por que MCP é importante para NFE.io?
O MCP permite que LLMs (Claude, GPT, etc.) usem o NFE.io diretamente através de ferramentas estruturadas, criando um "assistente fiscal" que pode:
- Emitir notas fiscais conversacionalmente 
- Consultar status de notas
- Baixar PDFs/XMLs
- Validar dados fiscais

### Exemplo MCP Server Completo

```typescript
// packages/mcp-server/src/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { NfeClient } from '@nfe-io/sdk';

interface NfeMcpServerConfig {
  name: string;
  version: string;
  nfeConfig: {
    apiKey: string;
    environment: 'production' | 'sandbox';
  };
}

export class NfeMcpServer {
  private server: Server;
  private nfeClient: NfeClient;
  
  constructor(private config: NfeMcpServerConfig) {
    this.server = new Server(
      { name: config.name, version: config.version },
      { capabilities: { tools: {} } }
    );
    
    this.nfeClient = new NfeClient(config.nfeConfig);
    this.setupTools();
  }
  
  private setupTools() {
    // Ferramenta: Criar Nota Fiscal
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      
      switch (name) {
        case 'create_service_invoice': {
          try {
            const result = await this.nfeClient.serviceInvoices.create(
              args.companyId,
              args.invoiceData
            );
            
            // Se assíncrono, aguardar processamento
            if (result.code === 202) {
              const finalResult = await this.nfeClient.pollUntilComplete(result.location);
              return {
                content: [{
                  type: 'text',
                  text: `✅ Nota fiscal criada com sucesso!
                  
**Detalhes:**
- ID: ${finalResult.id}
- Número: ${finalResult.number}  
- Status: ${finalResult.status}
- PDF: ${finalResult.pdfUrl}

A nota foi processada e está disponível para download.`
                }]
              };
            }
            
            return {
              content: [{
                type: 'text', 
                text: `✅ Nota fiscal criada: ${result.id}`
              }]
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
        
        case 'get_invoice_status': {
          try {
            const invoice = await this.nfeClient.serviceInvoices.retrieve(
              args.companyId,
              args.invoiceId
            );
            
            return {
              content: [{
                type: 'text',
                text: `📊 Status da Nota Fiscal ${args.invoiceId}:

**Informações:**
- Número: ${invoice.number}
- Status: ${invoice.status}
- Valor: R$ ${invoice.servicesAmount}
- Tomador: ${invoice.borrower.name}
- Emissão: ${new Date(invoice.createdOn).toLocaleString('pt-BR')}

**Links:**
- PDF: ${invoice.pdfUrl || 'Não disponível'}
- XML: ${invoice.xmlUrl || 'Não disponível'}`
              }]
            };
            
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `❌ Erro ao consultar nota: ${error.message}`
              }]
            };
          }
        }
        
        case 'download_invoice_pdf': {
          try {
            const pdfBuffer = await this.nfeClient.serviceInvoices.downloadPdf(
              args.companyId,
              args.invoiceId
            );
            
            // Salvar PDF localmente para o usuário
            const fs = await import('fs/promises');
            const filename = `nota-fiscal-${args.invoiceId}.pdf`;
            await fs.writeFile(filename, pdfBuffer);
            
            return {
              content: [{
                type: 'text',
                text: `📄 PDF da nota fiscal baixado com sucesso!
                
Arquivo salvo como: ${filename}
Tamanho: ${(pdfBuffer.length / 1024).toFixed(2)} KB`
              }]
            };
            
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `❌ Erro ao baixar PDF: ${error.message}`
              }]
            };
          }
        }
        
        default:
          throw new Error(`Ferramenta desconhecida: ${name}`);
      }
    });
    
    // Listar ferramentas disponíveis
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'create_service_invoice',
            description: 'Criar uma nova nota fiscal de serviço',
            inputSchema: {
              type: 'object',
              properties: {
                companyId: {
                  type: 'string',
                  description: 'ID da empresa emissora'
                },
                invoiceData: {
                  type: 'object',
                  description: 'Dados da nota fiscal',
                  properties: {
                    cityServiceCode: { type: 'string', description: 'Código do serviço municipal' },
                    description: { type: 'string', description: 'Descrição dos serviços' },
                    servicesAmount: { type: 'number', description: 'Valor total dos serviços' },
                    borrower: {
                      type: 'object',
                      description: 'Dados do tomador do serviço',
                      properties: {
                        type: { type: 'string', enum: ['NaturalPerson', 'LegalEntity'] },
                        federalTaxNumber: { type: 'number', description: 'CPF ou CNPJ' },
                        name: { type: 'string', description: 'Nome ou Razão Social' },
                        email: { type: 'string', description: 'Email para envio da nota' },
                        address: {
                          type: 'object',
                          properties: {
                            country: { type: 'string', description: 'Código do país (BRA)' },
                            postalCode: { type: 'string', description: 'CEP' },
                            street: { type: 'string', description: 'Logradouro' },
                            district: { type: 'string', description: 'Bairro' },
                            city: {
                              type: 'object',
                              properties: {
                                code: { type: 'string', description: 'Código IBGE da cidade' },
                                name: { type: 'string', description: 'Nome da cidade' }
                              }
                            },
                            state: { type: 'string', description: 'Sigla do estado' }
                          }
                        }
                      }
                    }
                  }
                }
              },
              required: ['companyId', 'invoiceData']
            }
          },
          {
            name: 'get_invoice_status',
            description: 'Consultar status de uma nota fiscal',
            inputSchema: {
              type: 'object',
              properties: {
                companyId: { type: 'string', description: 'ID da empresa' },
                invoiceId: { type: 'string', description: 'ID da nota fiscal' }
              },
              required: ['companyId', 'invoiceId']
            }
          },
          {
            name: 'download_invoice_pdf',
            description: 'Baixar PDF de uma nota fiscal',
            inputSchema: {
              type: 'object', 
              properties: {
                companyId: { type: 'string', description: 'ID da empresa' },
                invoiceId: { type: 'string', description: 'ID da nota fiscal' }
              },
              required: ['companyId', 'invoiceId']
            }
          }
        ]
      };
    });
  }
  
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Uso do servidor MCP
const server = new NfeMcpServer({
  name: 'nfe-io-server',
  version: '1.0.0',
  nfeConfig: {
    apiKey: process.env.NFE_API_KEY!,
    environment: 'sandbox'
  }
});

server.start().catch(console.error);
```

### Como usar o MCP Server

```bash
# 1. Instalar o MCP server
npm install -g @nfe-io/mcp-server

# 2. Configurar no Claude Desktop (config.json)
{
  "mcpServers": {
    "nfe-io": {
      "command": "nfe-io-mcp-server",
      "env": {
        "NFE_API_KEY": "sua-api-key-aqui"
      }
    }
  }
}

# 3. Usar no Claude
# "Crie uma nota fiscal de R$ 1.500 para o cliente XYZ LTDA, CNPJ 12.345.678/0001-90"
```

## 🔧 n8n Integration - Detalhamento

### Por que n8n é importante para NFE.io?
n8n permite automatizar processos fiscais através de workflows visuais:
- Emitir notas automaticamente quando venda é concluída
- Integrar com CRMs (HubSpot, Pipedrive) 
- Enviar notas por email/WhatsApp
- Sincronizar com sistemas contábeis

### Exemplo n8n Node Completo

```typescript  
// packages/n8n-nodes/src/nodes/ServiceInvoice.node.ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import { NfeClient } from '@nfe-io/sdk';

export class ServiceInvoiceNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NFE.io Service Invoice',
    name: 'nfeServiceInvoice',
    icon: 'file:nfeio.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Trabalhar com notas fiscais de serviço via NFE.io',
    defaults: {
      name: 'NFE.io Service Invoice',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'nfeioApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Create',
            value: 'create',
            description: 'Criar nova nota fiscal',
            action: 'Criar uma nota fiscal',
          },
          {
            name: 'Get',
            value: 'get',
            description: 'Obter nota fiscal existente',
            action: 'Obter uma nota fiscal',
          },
          {
            name: 'Cancel',
            value: 'cancel', 
            description: 'Cancelar nota fiscal',
            action: 'Cancelar uma nota fiscal',
          },
          {
            name: 'Send Email',
            value: 'sendEmail',
            description: 'Enviar nota por email',
            action: 'Enviar nota por email',
          },
          {
            name: 'Download PDF',
            value: 'downloadPdf',
            description: 'Baixar PDF da nota',
            action: 'Baixar PDF da nota',
          },
        ],
        default: 'create',
      },
      
      // Campos para operação CREATE
      {
        displayName: 'Company ID',
        name: 'companyId',
        type: 'string',
        required: true,
        default: '',
        description: 'ID da empresa emissora (obrigatório)',
      },
      {
        displayName: 'Service Code',
        name: 'cityServiceCode',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['create'],
          },
        },
        default: '',
        description: 'Código do serviço conforme tabela municipal',
        required: true,
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['create'],
          },
        },
        default: '',
        description: 'Descrição detalhada dos serviços prestados',
        required: true,
      },
      {
        displayName: 'Services Amount',
        name: 'servicesAmount',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['create'],
          },
        },
        default: 0,
        description: 'Valor total dos serviços em reais',
        required: true,
      },
      
      // Dados do Tomador
      {
        displayName: 'Borrower Type',
        name: 'borrowerType',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['create'],
          },
        },
        options: [
          {
            name: 'Natural Person (CPF)',
            value: 'NaturalPerson',
          },
          {
            name: 'Legal Entity (CNPJ)',
            value: 'LegalEntity',
          },
        ],
        default: 'LegalEntity',
        required: true,
      },
      {
        displayName: 'Borrower Tax Number',
        name: 'borrowerTaxNumber',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['create'],
          },
        },
        default: 0,
        description: 'CPF ou CNPJ do tomador (apenas números)',
        required: true,
      },
      {
        displayName: 'Borrower Name',
        name: 'borrowerName',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['create'],
          },
        },
        default: '',
        description: 'Nome completo ou Razão Social',
        required: true,
      },
      {
        displayName: 'Borrower Email',
        name: 'borrowerEmail',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['create'],
          },
        },
        default: '',
        description: 'Email para envio da nota fiscal',
        required: true,
      },
      
      // Endereço do Tomador
      {
        displayName: 'Address',
        name: 'address',
        type: 'collection',
        displayOptions: {
          show: {
            operation: ['create'],
          },
        },
        default: {},
        options: [
          {
            displayName: 'Postal Code',
            name: 'postalCode',
            type: 'string',
            default: '',
            description: 'CEP (formato: 12345-678)',
          },
          {
            displayName: 'Street',
            name: 'street',
            type: 'string',
            default: '',
            description: 'Logradouro completo',
          },
          {
            displayName: 'Number',
            name: 'number',
            type: 'string',
            default: '',
            description: 'Número ou "S/N"',
          },
          {
            displayName: 'District',
            name: 'district',
            type: 'string',
            default: '',
            description: 'Bairro',
          },
          {
            displayName: 'City Code',
            name: 'cityCode',
            type: 'string',
            default: '',
            description: 'Código IBGE da cidade',
          },
          {
            displayName: 'City Name',
            name: 'cityName',
            type: 'string',
            default: '',
            description: 'Nome da cidade',
          },
          {
            displayName: 'State',
            name: 'state',
            type: 'string',
            default: '',
            description: 'Sigla do estado (SP, RJ, etc.)',
          },
        ],
      },
      
      // Campos para outras operações
      {
        displayName: 'Invoice ID',
        name: 'invoiceId',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['get', 'cancel', 'sendEmail', 'downloadPdf'],
          },
        },
        default: '',
        description: 'ID da nota fiscal',
        required: true,
      },
      
      // Opções avançadas
      {
        displayName: 'Additional Options',
        name: 'additionalOptions',
        type: 'collection',
        default: {},
        options: [
          {
            displayName: 'Wait for Processing',
            name: 'waitForProcessing',
            type: 'boolean',
            displayOptions: {
              show: {
                '/operation': ['create'],
              },
            },
            default: true,
            description: 'Aguardar o processamento assíncrono da nota (recomendado)',
          },
          {
            displayName: 'Timeout (seconds)',
            name: 'timeout',
            type: 'number',
            displayOptions: {
              show: {
                waitForProcessing: [true],
              },
            },
            default: 60,
            description: 'Tempo limite para aguardar processamento',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    
    const operation = this.getNodeParameter('operation', 0) as string;
    
    // Obter credenciais
    const credentials = await this.getCredentials('nfeioApi');
    const nfeClient = new NfeClient({
      apiKey: credentials.apiKey as string,
      environment: credentials.environment as any || 'production',
    });

    for (let i = 0; i < items.length; i++) {
      try {
        const companyId = this.getNodeParameter('companyId', i) as string;
        let result: any;

        switch (operation) {
          case 'create': {
            // Construir dados da nota fiscal
            const invoiceData = {
              cityServiceCode: this.getNodeParameter('cityServiceCode', i) as string,
              description: this.getNodeParameter('description', i) as string,
              servicesAmount: this.getNodeParameter('servicesAmount', i) as number,
              borrower: {
                type: this.getNodeParameter('borrowerType', i) as string,
                federalTaxNumber: this.getNodeParameter('borrowerTaxNumber', i) as number,
                name: this.getNodeParameter('borrowerName', i) as string,
                email: this.getNodeParameter('borrowerEmail', i) as string,
                address: {
                  country: 'BRA',
                  ...this.getNodeParameter('address', i) as any,
                  city: {
                    code: this.getNodeParameter('address.cityCode', i) as string,
                    name: this.getNodeParameter('address.cityName', i) as string,
                  },
                },
              },
            };
            
            result = await nfeClient.serviceInvoices.create(companyId, invoiceData);
            
            // Aguardar processamento se solicitado
            const additionalOptions = this.getNodeParameter('additionalOptions', i) as any;
            if (additionalOptions.waitForProcessing !== false && result.code === 202) {
              const timeout = (additionalOptions.timeout || 60) * 1000;
              result = await nfeClient.pollUntilComplete(result.location, {
                maxAttempts: Math.ceil(timeout / 2000),
                intervalMs: 2000,
              });
            }
            
            break;
          }
          
          case 'get': {
            const invoiceId = this.getNodeParameter('invoiceId', i) as string;
            result = await nfeClient.serviceInvoices.retrieve(companyId, invoiceId);
            break;
          }
          
          case 'cancel': {
            const invoiceId = this.getNodeParameter('invoiceId', i) as string;
            result = await nfeClient.serviceInvoices.cancel(companyId, invoiceId);
            break;
          }
          
          case 'sendEmail': {
            const invoiceId = this.getNodeParameter('invoiceId', i) as string;
            result = await nfeClient.serviceInvoices.sendEmail(companyId, invoiceId);
            break;
          }
          
          case 'downloadPdf': {
            const invoiceId = this.getNodeParameter('invoiceId', i) as string;
            const pdfBuffer = await nfeClient.serviceInvoices.downloadPdf(companyId, invoiceId);
            
            result = {
              invoiceId,
              pdfSize: pdfBuffer.length,
              pdfData: pdfBuffer.toString('base64'), // Para usar em outros nodes
            };
            break;
          }
          
          default:
            throw new NodeOperationError(this.getNode(), `Operação desconhecida: ${operation}`);
        }

        returnData.push({
          json: {
            operation,
            success: true,
            ...result,
          },
          binary: operation === 'downloadPdf' ? {
            data: {
              data: result.pdfData,
              mimeType: 'application/pdf',
              fileName: `nota-fiscal-${result.invoiceId}.pdf`,
            },
          } : undefined,
        });

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              operation,
              success: false,
              error: error.message,
            },
          });
          continue;
        }
        throw new NodeOperationError(this.getNode(), error.message);
      }
    }

    return [returnData];
  }
}
```

### Exemplo de Workflow n8n

```json
{
  "name": "Automação NFE.io - Venda Concluída",
  "nodes": [
    {
      "parameters": {},
      "name": "Webhook - Nova Venda",
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300]
    },
    {
      "parameters": {
        "operation": "create",
        "companyId": "{{ $('Webhook - Nova Venda').first().json.companyId }}",
        "cityServiceCode": "2690",
        "description": "{{ $('Webhook - Nova Venda').first().json.serviceDescription }}",
        "servicesAmount": "{{ $('Webhook - Nova Venda').first().json.amount }}",
        "borrowerType": "LegalEntity",
        "borrowerTaxNumber": "{{ $('Webhook - Nova Venda').first().json.client.cnpj }}",
        "borrowerName": "{{ $('Webhook - Nova Venda').first().json.client.name }}",
        "borrowerEmail": "{{ $('Webhook - Nova Venda').first().json.client.email }}",
        "address": {
          "postalCode": "{{ $('Webhook - Nova Venda').first().json.client.address.cep }}",
          "street": "{{ $('Webhook - Nova Venda').first().json.client.address.street }}",
          "district": "{{ $('Webhook - Nova Venda').first().json.client.address.district }}",
          "cityCode": "{{ $('Webhook - Nova Venda').first().json.client.address.cityCode }}",
          "cityName": "{{ $('Webhook - Nova Venda').first().json.client.address.cityName }}",
          "state": "{{ $('Webhook - Nova Venda').first().json.client.address.state }}"
        },
        "additionalOptions": {
          "waitForProcessing": true,
          "timeout": 120
        }
      },
      "name": "Criar Nota Fiscal",
      "type": "@nfe-io/n8n-nodes.nfeServiceInvoice",
      "position": [460, 300]
    },
    {
      "parameters": {
        "fromEmail": "noreply@empresa.com.br",
        "toEmail": "{{ $('Webhook - Nova Venda').first().json.client.email }}",
        "subject": "Sua Nota Fiscal - Pedido #{{ $('Webhook - Nova Venda').first().json.orderId }}",
        "text": "Sua nota fiscal foi emitida com sucesso!\n\nNúmero: {{ $('Criar Nota Fiscal').first().json.number }}\nValor: R$ {{ $('Criar Nota Fiscal').first().json.servicesAmount }}\n\nEm anexo você encontra o PDF da nota fiscal.",
        "attachments": "={{ $('Criar Nota Fiscal').first().binary.data }}"
      },
      "name": "Enviar Email com NF",
      "type": "n8n-nodes-base.emailSend",
      "position": [680, 300]
    }
  ],
  "connections": {
    "Webhook - Nova Venda": {
      "main": [
        [
          {
            "node": "Criar Nota Fiscal",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Criar Nota Fiscal": {
      "main": [
        [
          {
            "node": "Enviar Email com NF", 
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 🎯 Resumo dos Benefícios

### ✅ Node.js Puro
```javascript
// Funciona em qualquer ambiente Node.js 18+
const { NfeClient } = require('@nfe-io/sdk');
const nfe = new NfeClient({ apiKey: 'xxx' });
await nfe.serviceInvoices.create('company', data);
```

### ✅ MCP Integration  
```bash
# LLMs podem usar NFE.io conversacionalmente
"Crie uma nota fiscal de R$ 1000 para João Silva, CPF 123.456.789-00"
```

### ✅ n8n Integration
```json
// Workflows visuais para automação fiscal
Webhook → NFE.io Create → Email Send → Slack Notify
```

### ✅ Zero Dependencies
- Apenas fetch nativo (Node 18+)
- TypeScript puro 
- Compatível com qualquer runtime Node.js

Esta arquitetura atende todos os seus requisitos mantendo máxima flexibilidade! 