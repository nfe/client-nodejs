# NFE.io SDK v3 🚀

> Official TypeScript SDK for NFE.io API - Zero dependencies, Node.js 18+

[![npm version](https://img.shields.io/npm/v/@nfe-io/sdk)](https://www.npmjs.com/package/@nfe-io/sdk)
[![Build Status](https://img.shields.io/github/actions/workflow/status/nfe/client-nodejs/ci.yml?branch=main)](https://github.com/nfe/client-nodejs/actions)
[![Coverage](https://img.shields.io/codecov/c/github/nfe/client-nodejs)](https://codecov.io/gh/nfe/client-nodejs)
[![License](https://img.shields.io/github/license/nfe/client-nodejs)](./LICENSE)

**Modern TypeScript SDK** para emissão de Notas Fiscais de Serviço (NFS-e) via [NFE.io](https://nfe.io).

---

## ✨ Features

- ✅ **Zero runtime dependencies** - Bundle size mínimo
- ✅ **TypeScript nativo** - Types completos e inference perfeita
- ✅ **Node.js 18+** - Fetch API nativa, sem bibliotecas HTTP
- ✅ **ESM + CommonJS** - Suporta ambos os formatos
- ✅ **Async/await** - API moderna e intuitiva
- ✅ **Retry automático** - Exponential backoff configurável
- ✅ **Polling inteligente** - Para processamento assíncrono de notas
- ✅ **Error handling** - Hierarquia de erros tipada

---

## 📦 Instalação

```bash
npm install @nfe-io/sdk
```

**Requisitos**: Node.js >= 18.0.0

---

## 🚀 Quick Start

### ESM (Recomendado)

```typescript
import { createNfeClient } from '@nfe-io/sdk';

// Criar cliente
const nfe = createNfeClient({
  apiKey: 'sua-api-key',
  environment: 'production' // ou 'sandbox'
});

// Listar empresas
const companies = await nfe.companies.list();
console.log(`Você tem ${companies.companies.length} empresa(s)`);

// Emitir nota fiscal
const invoice = await nfe.serviceInvoices.createAndWait(
  'company-id',
  {
    cityServiceCode: '2690',
    description: 'Desenvolvimento de software',
    servicesAmount: 1500.00,
    borrower: {
      federalTaxNumber: '12345678901',
      name: 'Cliente Exemplo',
      email: 'cliente@exemplo.com',
      address: {
        street: 'Rua Exemplo, 123',
        neighborhood: 'Centro',
        city: { code: '3550308', name: 'São Paulo' },
        state: 'SP',
        postalCode: '01000-000'
      }
    }
  }
);

console.log(`Nota emitida: ${invoice.number}`);
```

### CommonJS

```javascript
const { createNfeClient } = require('@nfe-io/sdk');

const nfe = createNfeClient({ apiKey: 'sua-api-key' });

// Mesmo código acima funciona!
```

---

## 📚 Documentação

### Recursos Disponíveis

#### 🏢 Companies (Empresas)
```typescript
// Listar empresas
const companies = await nfe.companies.list();

// Criar empresa
const company = await nfe.companies.create({
  name: 'Minha Empresa',
  federalTaxNumber: '12345678901234',
  email: 'contato@empresa.com',
  // ... outros dados
});

// Buscar por ID
const company = await nfe.companies.retrieve('company-id');

// Atualizar
await nfe.companies.update('company-id', { name: 'Novo Nome' });

// Upload de certificado digital
await nfe.companies.uploadCertificate('company-id', {
  file: certificateBuffer,
  password: 'senha-do-certificado'
});
```

#### 📄 Service Invoices (Notas Fiscais)
```typescript
// Criar nota (processamento assíncrono)
const invoice = await nfe.serviceInvoices.create('company-id', {
  cityServiceCode: '2690',
  description: 'Serviços de consultoria',
  servicesAmount: 1000.00,
  borrower: { /* dados do tomador */ }
});

// Criar E aguardar processamento (recomendado)
const invoice = await nfe.serviceInvoices.createAndWait(
  'company-id',
  invoiceData,
  { 
    maxAttempts: 10,  // Máximo de tentativas de polling
    interval: 2000    // Intervalo entre tentativas (ms)
  }
);

// Listar notas
const invoices = await nfe.serviceInvoices.list('company-id', {
  pageSize: 50
});

// Buscar nota específica
const invoice = await nfe.serviceInvoices.retrieve(
  'company-id',
  'invoice-id'
);

// Cancelar nota
await nfe.serviceInvoices.cancel('company-id', 'invoice-id');

// Enviar por email
await nfe.serviceInvoices.sendEmail('company-id', 'invoice-id', {
  emails: ['cliente@exemplo.com']
});

// Download de PDF
const pdf = await nfe.serviceInvoices.downloadPdf(
  'company-id',
  'invoice-id'
);

// Download de XML
const xml = await nfe.serviceInvoices.downloadXml(
  'company-id',
  'invoice-id'
);
```

#### 👤 Legal People & Natural People (Pessoas Jurídicas e Físicas)
```typescript
// Pessoas Jurídicas
const legalPeople = await nfe.legalPeople.list('company-id');
const person = await nfe.legalPeople.create('company-id', { /* ... */ });

// Pessoas Físicas
const naturalPeople = await nfe.naturalPeople.list('company-id');
const person = await nfe.naturalPeople.create('company-id', { /* ... */ });
```

#### 🔔 Webhooks
```typescript
// Listar webhooks
const webhooks = await nfe.webhooks.list('company-id');

// Criar webhook
const webhook = await nfe.webhooks.create('company-id', {
  url: 'https://seu-site.com/webhook',
  events: ['invoice.issued', 'invoice.cancelled']
});

// Deletar webhook
await nfe.webhooks.delete('company-id', 'webhook-id');
```

---

## 🔧 Configuração Avançada

### Configurações do Cliente

```typescript
const nfe = createNfeClient({
  // API key (obrigatório)
  apiKey: 'sua-api-key',
  
  // Ambiente
  environment: 'production', // ou 'sandbox'
  
  // Timeout das requisições (ms)
  timeout: 30000,
  
  // Configuração de retry
  retryConfig: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000
  }
});
```

### Variáveis de Ambiente

```bash
# Criar cliente a partir de variável de ambiente
export NFE_API_KEY=sua-api-key

# No código
import { createClientFromEnv } from '@nfe-io/sdk';
const nfe = createClientFromEnv('production');
```

---

## 🔐 Tratamento de Erros

```typescript
import { 
  NfeError,
  AuthenticationError,
  ValidationError,
  NotFoundError
} from '@nfe-io/sdk';

try {
  const invoice = await nfe.serviceInvoices.create('company-id', data);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('API key inválida');
  } else if (error instanceof ValidationError) {
    console.error('Dados inválidos:', error.details);
  } else if (error instanceof NotFoundError) {
    console.error('Recurso não encontrado');
  } else if (error instanceof NfeError) {
    console.error('Erro na API:', error.message);
  }
}
```

---

## 🧪 Ambiente de Testes (Sandbox)

```typescript
const nfe = createNfeClient({
  apiKey: 'sua-sandbox-key',
  environment: 'sandbox'
});

// Todos os métodos funcionam da mesma forma
// Mas as notas não são enviadas para a prefeitura
```

---

## 🔌 Extensões e Integrações

O SDK foi projetado para ser extensível. Extensões oficiais:

### [@nfe-io/mcp-server](https://github.com/nfe/mcp-server)
**Model Context Protocol Server para integração com LLMs**

Permite que Claude, GPT e outros LLMs emitam notas fiscais via conversação natural.

```bash
npm install @nfe-io/mcp-server
```

### [@nfe-io/n8n-nodes](https://github.com/nfe/n8n-nodes)
**Custom nodes n8n para automação de workflows**

Automatize a emissão de notas fiscais em workflows n8n.

```bash
# Via n8n community nodes
```

### Criando Sua Própria Extensão

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para guidelines sobre como criar extensões.

---

## 📖 Mais Recursos

- **[Documentação Oficial da API](https://nfe.io/docs/)**
- **[Referência da API REST](https://nfe.io/doc/rest-api/nfe-v1/)**
- **[Exemplos Completos](./examples/)**
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Como contribuir
- **[CHANGELOG.md](./CHANGELOG.md)** - Histórico de mudanças

---

## 🔄 Migrando da v2

Se você está usando a versão v2 do SDK, confira nosso [Guia de Migração](./docs/MIGRATION.md).

**Principais mudanças:**
- ✅ TypeScript nativo (vs JavaScript)
- ✅ Async/await (vs callbacks + promises)
- ✅ Fetch API (vs http/https)
- ✅ Zero dependencies (vs `when@3.1.0`)
- ✅ ESM + CommonJS (vs CommonJS only)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para guidelines.

---

## 📜 Licença

MIT © [NFE.io](https://nfe.io)

---

## 💬 Suporte

- **Issues**: [GitHub Issues](https://github.com/nfe/client-nodejs/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nfe/client-nodejs/discussions)
- **Email**: suporte@nfe.io

---

**Feito com ❤️ pela equipe NFE.io**
