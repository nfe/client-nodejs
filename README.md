# NFE.io SDK para Node.js (v3)

[![npm version](https://img.shields.io/npm/v/nfe-io.svg)](https://www.npmjs.com/package/nfe-io)
[![Node.js Version](https://img.shields.io/node/v/nfe-io.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SDK Oficial NFE.io para Node.js 18+** - SDK TypeScript moderno para emissão de notas fiscais de serviço eletrônicas (NFS-e).

> ✨ **Versão 3.0** - Reescrita completa com TypeScript, zero dependências em runtime e API moderna async/await.

## 📋 Índice

- [Recursos](#-recursos)
- [Instalação](#-instalação)
- [Início Rápido](#-início-rápido)
- [Documentação](#-documentação)
- [Migração da v2](#-migração-da-v2)
- [Exemplos](#-exemplos)
- [Referência da API](#-referência-da-api)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

## ✨ Recursos

- 🎯 **TypeScript Moderno** - Segurança de tipos completa com TypeScript 5.3+
- 🚀 **Zero Dependências** - Usa API fetch nativa do Node.js (Node 18+)
- ⚡ **Async/Await** - API limpa baseada em promises
- 🔄 **Retry Automático** - Lógica de retry com exponential backoff integrada
- 📦 **ESM & CommonJS** - Funciona com ambos os sistemas de módulos
- 🧪 **Bem Testado** - Mais de 80 testes com 88% de cobertura
- 📖 **JSDoc Completo** - Documentação completa da API
- 🛡️ **Tratamento de Erros** - Classes de erro tipadas para melhor tratamento

## 📦 Instalação

**Requisitos:**
- Node.js >= 18.0.0
- TypeScript >= 5.0 (se usar TypeScript)

```bash
npm install nfe-io
```

ou

```bash
yarn add nfe-io
```

ou

```bash
pnpm add nfe-io
```

## 🚀 Início Rápido

### ⚡ Setup Rápido para Testes

```bash
# 1. Clone e instale
git clone https://github.com/nfe/client-nodejs.git
cd client-nodejs
npm install

# 2. Configure suas credenciais (interativo)
npm run examples:setup

# 3. Teste a conexão
npm run examples:test

# 4. Execute os exemplos
npm run examples
```

### 📦 Instalação em Projeto Novo

```bash
npm install nfe-io
```

### Uso Básico (ESM)

```typescript
import { NfeClient } from 'nfe-io';

// Inicializar o cliente
const nfe = new NfeClient({
  apiKey: 'sua-chave-api',
  environment: 'production' // ou 'development'
});

// Criar uma empresa
const empresa = await nfe.companies.create({
  federalTaxNumber: '12345678000190',
  name: 'Minha Empresa Ltda',
  email: 'empresa@exemplo.com.br',
  taxRegime: 1, // Simples Nacional
  address: {
    country: 'BRA',
    postalCode: '01310-100',
    street: 'Av. Paulista',
    number: '1578',
    city: { code: '3550308', name: 'São Paulo' },
    state: 'SP'
  }
});

// Emitir uma nota fiscal de serviço
const notaFiscal = await nfe.serviceInvoices.create(empresa.id, {
  cityServiceCode: '01234',
  description: 'Serviços de desenvolvimento web',
  servicesAmount: 1000.00,
  borrower: {
    type: 'LegalEntity',
    federalTaxNumber: 12345678000190,
    name: 'Empresa Cliente',
    email: 'cliente@exemplo.com.br',
    address: {
      country: 'BRA',
      postalCode: '01310-100',
      street: 'Av. Paulista',
      number: '1000',
      city: { code: '3550308', name: 'São Paulo' },
      state: 'SP'
    }
  }
});

console.log(`Nota fiscal criada: ${notaFiscal.number}`);
```

### Uso com CommonJS

```javascript
const { NfeClient } = require('nfe-io');

const nfe = new NfeClient({
  apiKey: process.env.NFE_API_KEY,
  environment: 'production'
});

// Mesma API que ESM
```

## 📚 Documentação

### Recursos da API

O SDK fornece os seguintes recursos:

#### 🧾 Notas Fiscais de Serviço (`nfe.serviceInvoices`)

Gerenciar NFS-e (Nota Fiscal de Serviço Eletrônica):

```typescript
// ⭐ RECOMENDADO: Criar e aguardar conclusão (lida com processamento assíncrono)
const notaFiscal = await nfe.serviceInvoices.createAndWait(empresaId, {
  borrower: {
    federalTaxNumber: 12345678901,
    name: 'João da Silva',
    email: 'joao@example.com',
  },
  cityServiceCode: '10677',
  description: 'Serviços de consultoria',
  servicesAmount: 1500.00,
}, {
  pollingInterval: 2000,  // Verificar a cada 2 segundos
  maxWaitTime: 60000,     // Aguardar até 60 segundos
});

console.log(`✅ Nota fiscal emitida: ${notaFiscal.number}`);

// Criar nota fiscal manualmente (retorna 201 imediato ou 202 async)
const result = await nfe.serviceInvoices.create(empresaId, dadosNota);

// Verificar se é síncrono (201) ou assíncrono (202)
if ('id' in result) {
  // Síncrono - nota emitida imediatamente
  console.log('Nota emitida:', result.number);
} else {
  // Assíncrono - requer polling
  console.log('Processando:', result.flowStatus);
  // Use createAndWait() ou pollUntilComplete() em vez disso
}

// Listar notas fiscais com filtros
const notas = await nfe.serviceInvoices.list(empresaId, {
  pageCount: 50,
  pageIndex: 0,
  searchPeriod: {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
});

// Buscar nota fiscal específica
const nota = await nfe.serviceInvoices.retrieve(empresaId, notaFiscalId);

// Verificar status de processamento
const status = await nfe.serviceInvoices.getStatus(empresaId, notaFiscalId);
console.log(`Status: ${status.status}, Completo: ${status.isComplete}`);

// Cancelar nota fiscal
const notaCancelada = await nfe.serviceInvoices.cancel(empresaId, notaFiscalId);

// Enviar nota fiscal por email
await nfe.serviceInvoices.sendEmail(empresaId, notaFiscalId, {
  emails: ['cliente@example.com', 'financeiro@example.com'],
});

// Baixar PDF (single ou bulk)
const pdfBuffer = await nfe.serviceInvoices.downloadPdf(empresaId, notaFiscalId);
fs.writeFileSync('nota.pdf', pdfBuffer);

// Baixar todas as notas como ZIP
const zipBuffer = await nfe.serviceInvoices.downloadPdf(empresaId);
fs.writeFileSync('todas-notas.zip', zipBuffer);

// Baixar XML
const xmlBuffer = await nfe.serviceInvoices.downloadXml(empresaId, notaFiscalId);
fs.writeFileSync('nota.xml', xmlBuffer);

// Criar múltiplas notas em lote (batch)
const notasData = [/* ... array de dados de notas ... */];
const notas = await nfe.serviceInvoices.createBatch(empresaId, notasData, {
  waitForComplete: true,  // Aguardar todas completarem
  maxConcurrent: 5,       // Processar 5 por vez
});

console.log(`✅ ${notas.length} notas fiscais criadas em lote`);
```

**Recursos Avançados:**

- ⏱️ **Polling Automático**: `createAndWait()` lida automaticamente com processamento assíncrono
- 📦 **Criação em Lote**: `createBatch()` cria múltiplas notas com controle de concorrência
- 📥 **Downloads Bulk**: Baixe todas as notas como ZIP (PDF ou XML)
- 🔍 **Verificação de Status**: `getStatus()` verifica se nota completou processamento
- 🎯 **Discriminated Unions**: TypeScript detecta automaticamente tipo de resposta (201 vs 202)

---

#### 🏢 Empresas (`nfe.companies`)

Gerenciar empresas na sua conta:

```typescript
// Criar empresa
const empresa = await nfe.companies.create({
  federalTaxNumber: '12345678000190',
  name: 'Nome da Empresa',
  // ... outros campos
});

// Listar todas as empresas
const empresas = await nfe.companies.list();

// Buscar empresa específica
const empresa = await nfe.companies.retrieve(empresaId);

// Atualizar empresa
const atualizada = await nfe.companies.update(empresaId, {
  email: 'novoemail@empresa.com.br'
});

// Upload de certificado digital
await nfe.companies.uploadCertificate(empresaId, {
  file: certificadoBuffer,
  password: 'senha-certificado'
});
```

#### 👔 Pessoas Jurídicas (`nfe.legalPeople`)

Gerenciar pessoas jurídicas (empresas/negócios):

```typescript
// Criar pessoa jurídica
const pessoa = await nfe.legalPeople.create(empresaId, {
  federalTaxNumber: '12345678000190',
  name: 'Nome da Empresa',
  email: 'empresa@exemplo.com.br',
  address: { /* ... */ }
});

// Listar todas as pessoas jurídicas
const pessoas = await nfe.legalPeople.list(empresaId);

// Buscar por CNPJ
const pessoa = await nfe.legalPeople.findByTaxNumber(empresaId, '12345678000190');
```

#### 👤 Pessoas Físicas (`nfe.naturalPeople`)

Gerenciar pessoas físicas (indivíduos):

```typescript
// Criar pessoa física
const pessoa = await nfe.naturalPeople.create(empresaId, {
  federalTaxNumber: 12345678901,
  name: 'João da Silva',
  email: 'joao@exemplo.com.br',
  address: { /* ... */ }
});

// Buscar por CPF
const pessoa = await nfe.naturalPeople.findByTaxNumber(empresaId, '12345678901');
```

#### 🔗 Webhooks (`nfe.webhooks`)

Gerenciar configurações de webhook:

```typescript
// Criar webhook
const webhook = await nfe.webhooks.create(empresaId, {
  url: 'https://meuapp.com.br/webhooks/nfe',
  events: ['invoice.issued', 'invoice.cancelled'],
  active: true
});

// Listar webhooks
const webhooks = await nfe.webhooks.list(empresaId);

// Atualizar webhook
await nfe.webhooks.update(empresaId, webhookId, {
  events: ['invoice.issued']
});

// Validar assinatura do webhook
const ehValido = nfe.webhooks.validateSignature(
  payload,
  assinatura,
  segredo
);
```

### Opções de Configuração

```typescript
const nfe = new NfeClient({
  // Obrigatório: Sua chave API do NFE.io
  apiKey: 'sua-chave-api',
  
  // Opcional: Ambiente (padrão: 'production')
  environment: 'production', // ou 'sandbox'
  
  // Opcional: URL base customizada (sobrescreve environment)
  baseUrl: 'https://api-customizada.nfe.io/v1',
  
  // Opcional: Timeout de requisição em milissegundos (padrão: 30000)
  timeout: 60000,
  
  // Opcional: Configuração de retry
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }
});
```

### Tratamento de Erros

O SDK fornece classes de erro tipadas:

```typescript
import { 
  NfeError, 
  AuthenticationError, 
  ValidationError,
  NotFoundError,
  RateLimitError 
} from 'nfe-io';

try {
  const notaFiscal = await nfe.serviceInvoices.create(empresaId, dados);
} catch (erro) {
  if (erro instanceof AuthenticationError) {
    console.error('Chave API inválida:', erro.message);
  } else if (erro instanceof ValidationError) {
    console.error('Dados inválidos:', erro.details);
  } else if (erro instanceof NotFoundError) {
    console.error('Recurso não encontrado:', erro.message);
  } else if (erro instanceof RateLimitError) {
    console.error('Limite de requisições excedido, tente novamente em:', erro.retryAfter);
  } else if (erro instanceof NfeError) {
    console.error('Erro da API:', erro.code, erro.message);
  } else {
    console.error('Erro inesperado:', erro);
  }
}
```

## 🔄 Migração da v2

Veja [MIGRATION.md](./MIGRATION.md) para um guia completo de migração.

**Principais Mudanças:**

```javascript
// v2 (callbacks + promises)
var nfe = require('nfe-io')('chave-api');
nfe.serviceInvoices.create('id-empresa', dados, function(err, notaFiscal) {
  if (err) return console.error(err);
  console.log(notaFiscal);
});

// v3 (async/await + TypeScript)
import { NfeClient } from 'nfe-io';
const nfe = new NfeClient({ apiKey: 'chave-api' });

try {
  const notaFiscal = await nfe.serviceInvoices.create('id-empresa', dados);
  console.log(notaFiscal);
} catch (erro) {
  console.error(erro);
}
```

## 📝 Exemplos

### ⚡ Exemplos Práticos Prontos para Uso

O diretório [`examples/`](./examples/) contém exemplos completos que você pode executar com suas credenciais:

```bash
# Modo interativo com menu
npm run examples

# Ou diretamente
node examples/run-examples.js
```

**Exemplos disponíveis**:
1. 📊 **Listar Notas Fiscais** - Consulte notas existentes (comece por aqui!)
2. 👥 **Gerenciar Pessoas** - CRUD de clientes (pessoas físicas/jurídicas)
3. 🧾 **Emitir Nota Fiscal** - Fluxo completo: criar → enviar email → baixar PDF/XML
4. 🔔 **Configurar Webhooks** - Receba notificações de eventos

Veja [`examples/README.md`](./examples/README.md) para documentação completa.

---

### Fluxo Completo de Emissão de Nota Fiscal

```typescript
import { NfeClient } from 'nfe-io';

const nfe = new NfeClient({
  apiKey: process.env.NFE_API_KEY!,
  environment: 'production'
});

async function emitirNotaFiscal() {
  // 1. Buscar ou criar empresa
  const empresas = await nfe.companies.list();
  const empresa = empresas.data[0];
  
  // 2. Criar nota fiscal com polling automático
  const notaFiscal = await nfe.serviceInvoices.createAndWait(empresa.id, {
    cityServiceCode: '01234',
    description: 'Consultoria em TI',
    servicesAmount: 5000.00,
    borrower: {
      type: 'LegalEntity',
      federalTaxNumber: 12345678000190,
      name: 'Cliente Exemplo Ltda',
      email: 'contato@cliente.com.br',
      address: {
        country: 'BRA',
        postalCode: '01310-100',
        street: 'Av. Paulista',
        number: '1000',
        city: { code: '3550308', name: 'São Paulo' },
        state: 'SP'
      }
    }
  }, {
    maxAttempts: 30,
    intervalMs: 2000
  });
  
  console.log(`✅ Nota fiscal emitida: ${notaFiscal.number}`);
  
  // 3. Enviar por email
  await nfe.serviceInvoices.sendEmail(empresa.id, notaFiscal.id);
  console.log('📧 Email enviado');
  
  // 4. Baixar PDF
  const pdf = await nfe.serviceInvoices.downloadPdf(empresa.id, notaFiscal.id);
  await fs.promises.writeFile(`nota-fiscal-${notaFiscal.number}.pdf`, pdf);
  console.log('💾 PDF salvo');
}

emitirNotaFiscal().catch(console.error);
```

### Configuração de Webhook

```typescript
// Configurar webhook para receber eventos de notas fiscais
const webhook = await nfe.webhooks.create(empresaId, {
  url: 'https://meuapp.com.br/api/webhooks/nfe',
  events: [
    'invoice.issued',
    'invoice.cancelled',
    'invoice.error'
  ],
  active: true
});

// No seu endpoint de webhook
app.post('/api/webhooks/nfe', (req, res) => {
  const assinatura = req.headers['x-nfe-signature'];
  const ehValido = nfe.webhooks.validateSignature(
    req.body,
    assinatura,
    process.env.WEBHOOK_SECRET
  );
  
  if (!ehValido) {
    return res.status(401).send('Assinatura inválida');
  }
  
  const { event, data } = req.body;
  
  if (event === 'invoice.issued') {
    console.log('Nota fiscal emitida:', data.id);
  }
  
  res.status(200).send('OK');
});
```

### Criação de Notas Fiscais em Lote

```typescript
async function emitirNotasEmLote(empresaId: string, notasFiscais: DadosNota[]) {
  const resultados = await Promise.allSettled(
    notasFiscais.map(dados => 
      nfe.serviceInvoices.createAndWait(empresaId, dados)
    )
  );
  
  const sucesso = resultados.filter(r => r.status === 'fulfilled');
  const falha = resultados.filter(r => r.status === 'rejected');
  
  console.log(`✅ ${sucesso.length} notas fiscais emitidas`);
  console.log(`❌ ${falha.length} notas fiscais falharam`);
  
  return { sucesso, falha };
}
```

## 🏗️ Referência da API

Documentação completa da API disponível em:
- [Documentação TypeDoc](https://nfe.github.io/client-nodejs/) *(em breve)*
- [Documentação Oficial da API](https://nfe.io/docs/nota-fiscal-servico/integracao-nfs-e/)
- [Referência da API REST](https://nfe.io/doc/rest-api/nfe-v1/)

## 🧪 Desenvolvimento & Testes

### Executando Testes

```bash
# Executar todos os testes (unit + integration)
npm test

# Executar apenas testes unitários
npm run test:unit

# Executar apenas testes de integração (requer chave API)
npm run test:integration

# Executar com cobertura
npm run test:coverage

# Executar com UI
npm run test:ui
```

### Testes de Integração

Os testes de integração validam contra a **API real do NFE.io**:

```bash
# Definir sua chave API de desenvolvimento/teste
export NFE_API_KEY="sua-chave-api-desenvolvimento"
export NFE_TEST_ENVIRONMENT="development"
export RUN_INTEGRATION_TESTS="true"

# Executar testes de integração
npm run test:integration
```

Veja [tests/integration/README.md](./tests/integration/README.md) para documentação detalhada.

**Nota**: Testes de integração fazem chamadas reais à API e podem gerar custos dependendo do seu plano.

### Geração de Tipos OpenAPI

O SDK gera tipos TypeScript automaticamente a partir de especificações OpenAPI:

```bash
# Baixar specs mais recentes da API (se disponível)
npm run download:spec

# Validar todas as specs OpenAPI
npm run validate:spec

# Gerar tipos TypeScript a partir das specs
npm run generate

# Modo watch - regenerar automaticamente ao modificar specs
npm run generate:watch
```

**Localização das specs**: `openapi/spec/*.yaml`  
**Tipos gerados**: `src/generated/*.ts`  
**Configuração**: `openapi/generator-config.yaml`

O processo de build valida automaticamente as specs e gera tipos antes da compilação:

```bash
npm run build
# → Executa: validate:spec → generate → typecheck → tsup
```

**Nota**: Arquivos gerados não devem ser editados manualmente. Edite as specs OpenAPI e regenere.

Para orientações de migração, veja [docs/MIGRATION-TO-GENERATED-TYPES.md](./docs/MIGRATION-TO-GENERATED-TYPES.md).

### Verificação de Tipos

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, veja [CONTRIBUTING.md](./CONTRIBUTING.md) para orientações.

### Extensões Oficiais

O SDK foi projetado para ser extensível. Extensões oficiais:

- **[@nfe-io/mcp-server](https://github.com/nfe/mcp-server)** - Servidor Model Context Protocol para integração com LLMs
- **[@nfe-io/n8n-nodes](https://github.com/nfe/n8n-nodes)** - Nós de automação de workflow n8n

## 📄 Licença

MIT © [NFE.io](https://nfe.io)

## 🆘 Suporte

- 📧 Email: suporte@nfe.io
- 📖 Documentação: https://nfe.io/docs/
- 🐛 Issues: https://github.com/nfe/client-nodejs/issues

## 🗺️ Roadmap

- [x] Validação de spec OpenAPI e geração de tipos
- [ ] Helpers para rate limiting
- [ ] Helpers para paginação
- [ ] Interceptors de request/response
- [ ] Estratégias de retry customizadas
- [ ] Suporte para navegadores (via bundlers)

---

**Feito com ❤️ pela equipe NFE.io**
