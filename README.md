# NFE.io SDK para Node.js (v3)

[![npm version](https://img.shields.io/npm/v/nfe-io.svg)](https://www.npmjs.com/package/nfe-io)
[![Node.js Version](https://img.shields.io/node/v/nfe-io.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SDK Oficial NFE.io para Node.js 22+** - SDK TypeScript moderno para emissão de notas fiscais de serviço eletrônicas (NFS-e).

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

#### 📍 Endereços (`nfe.addresses`)

Consultar endereços brasileiros por CEP ou termo de busca:

```typescript
// Buscar endereço por CEP
const endereco = await nfe.addresses.lookupByPostalCode('01310-100');
console.log(endereco.street);   // 'Avenida Paulista'
console.log(endereco.city.name); // 'São Paulo'
console.log(endereco.state);     // 'SP'

// Buscar por termo (nome de rua, bairro, etc.)
const resultado = await nfe.addresses.lookupByTerm('Paulista');
for (const end of resultado.addresses) {
  console.log(`${end.postalCode}: ${end.street}, ${end.city.name}`);
}

// Buscar com filtro OData
const filtrado = await nfe.addresses.search({
  filter: "city.name eq 'São Paulo'"
});
```

> **Nota:** A API de Endereços usa um host separado (`address.api.nfe.io`). Você pode configurar uma chave API específica com `dataApiKey`, ou o SDK usará `apiKey` como fallback.

#### 🚚 Notas de Transporte - CT-e (`nfe.transportationInvoices`)

Consultar CT-e (Conhecimento de Transporte Eletrônico) via Distribuição DFe:

```typescript
// Ativar busca automática de CT-e para uma empresa
const settings = await nfe.transportationInvoices.enable('empresa-id');
console.log('Status:', settings.status);
console.log('Iniciando do NSU:', settings.startFromNsu);

// Ativar a partir de um NSU específico
const settings = await nfe.transportationInvoices.enable('empresa-id', {
  startFromNsu: 12345
});

// Ativar a partir de uma data específica
const settings = await nfe.transportationInvoices.enable('empresa-id', {
  startFromDate: '2024-01-01T00:00:00Z'
});

// Verificar configurações atuais
const config = await nfe.transportationInvoices.getSettings('empresa-id');
console.log('Busca ativa:', config.status);

// Desativar busca automática
await nfe.transportationInvoices.disable('empresa-id');

// Consultar CT-e por chave de acesso (44 dígitos)
const cte = await nfe.transportationInvoices.retrieve(
  'empresa-id',
  '35240112345678000190570010000001231234567890'
);
console.log('Remetente:', cte.nameSender);
console.log('Valor:', cte.totalInvoiceAmount);
console.log('Emissão:', cte.issuedOn);

// Baixar XML do CT-e
const xml = await nfe.transportationInvoices.downloadXml(
  'empresa-id',
  '35240112345678000190570010000001231234567890'
);
fs.writeFileSync('cte.xml', xml);

// Consultar evento do CT-e
const evento = await nfe.transportationInvoices.getEvent(
  'empresa-id',
  '35240112345678000190570010000001231234567890',
  'chave-evento'
);

// Baixar XML do evento
const eventoXml = await nfe.transportationInvoices.downloadEventXml(
  'empresa-id',
  '35240112345678000190570010000001231234567890',
  'chave-evento'
);
```

> **Nota:** A API de CT-e usa um host separado (`api.nfse.io`). Você pode configurar uma chave API específica com `dataApiKey`, ou o SDK usará `apiKey` como fallback.

**Pré-requisitos:**
- Empresa deve estar cadastrada com certificado digital A1 válido
- Webhook deve estar configurado para receber notificações de CT-e

#### 📥 NF-e de Entrada - Distribuição (`nfe.inboundProductInvoices`)

Consultar NF-e (Nota Fiscal Eletrônica de Produto) recebidas via Distribuição NF-e:

```typescript
// Ativar busca automática de NF-e para uma empresa
const settings = await nfe.inboundProductInvoices.enableAutoFetch('empresa-id', {
  environmentSEFAZ: 'Production',
  webhookVersion: '2',
});
console.log('Status:', settings.status);

// Ativar a partir de um NSU específico
const settings = await nfe.inboundProductInvoices.enableAutoFetch('empresa-id', {
  startFromNsu: '999999',
  environmentSEFAZ: 'Production',
});

// Verificar configurações atuais
const config = await nfe.inboundProductInvoices.getSettings('empresa-id');
console.log('Busca ativa:', config.status);

// Desativar busca automática
await nfe.inboundProductInvoices.disableAutoFetch('empresa-id');

// Consultar NF-e por chave de acesso - formato webhook v2 (recomendado)
const nfe_doc = await nfe.inboundProductInvoices.getProductInvoiceDetails(
  'empresa-id',
  '35240112345678000190550010000001231234567890'
);
console.log('Emissor:', nfe_doc.issuer?.name);
console.log('Valor:', nfe_doc.totalInvoiceAmount);

// Baixar XML da NF-e
const xml = await nfe.inboundProductInvoices.getXml(
  'empresa-id',
  '35240112345678000190550010000001231234567890'
);
fs.writeFileSync('nfe.xml', xml);

// Baixar PDF (DANFE)
const pdf = await nfe.inboundProductInvoices.getPdf(
  'empresa-id',
  '35240112345678000190550010000001231234567890'
);

// Enviar manifestação (Ciência da Operação por padrão)
await nfe.inboundProductInvoices.manifest(
  'empresa-id',
  '35240112345678000190550010000001231234567890'
);

// Manifestar com evento específico
await nfe.inboundProductInvoices.manifest(
  'empresa-id',
  '35240112345678000190550010000001231234567890',
  210220 // Confirmação da Operação
);

// Consultar evento da NF-e
const evento = await nfe.inboundProductInvoices.getEventDetails(
  'empresa-id',
  '35240112345678000190550010000001231234567890',
  'chave-evento'
);

// Baixar XML do evento
const eventoXml = await nfe.inboundProductInvoices.getEventXml(
  'empresa-id',
  '35240112345678000190550010000001231234567890',
  'chave-evento'
);

// Reprocessar webhook
await nfe.inboundProductInvoices.reprocessWebhook('empresa-id', '35240...');
```

> **Nota:** A API de NF-e Distribuição usa um host separado (`api.nfse.io`). Você pode configurar uma chave API específica com `dataApiKey`, ou o SDK usará `apiKey` como fallback.

**Pré-requisitos:**
- Empresa deve estar cadastrada com certificado digital A1 válido
- Webhook deve estar configurado para receber notificações de NF-e

**Tipos de Manifestação:**

| Código | Evento |
|--------|--------|
| `210210` | Ciência da Operação (padrão) |
| `210220` | Confirmação da Operação |
| `210240` | Operação não Realizada |

#### 📦 NF-e de Produto - Emissão (`nfe.productInvoices`)

Ciclo completo de gestão de NF-e (Nota Fiscal Eletrônica de Produto) — emissão, listagem, consulta, cancelamento, carta de correção (CC-e), inutilização e download de arquivos (PDF/XML):

```typescript
// Emitir NF-e (assíncrono — retorna 202)
const result = await nfe.productInvoices.create('empresa-id', {
  operationNature: 'Venda de mercadoria',
  operationType: 'Outgoing',
  buyer: { name: 'Empresa LTDA', federalTaxNumber: 12345678000190 },
  items: [{ code: 'PROD-001', description: 'Produto X', quantity: 1, unitAmount: 100 }],
  payment: [{ paymentDetail: [{ method: 'Cash', amount: 100 }] }],
});

// Listar NF-e (environment é obrigatório)
const invoices = await nfe.productInvoices.list('empresa-id', {
  environment: 'Production',
  limit: 10,
});

// Consultar NF-e por ID
const invoice = await nfe.productInvoices.retrieve('empresa-id', 'invoice-id');

// Cancelar NF-e (assíncrono)
await nfe.productInvoices.cancel('empresa-id', 'invoice-id', 'Motivo do cancelamento');

// Download de PDF e XML
const pdf = await nfe.productInvoices.downloadPdf('empresa-id', 'invoice-id');
const xml = await nfe.productInvoices.downloadXml('empresa-id', 'invoice-id');

// Carta de correção (CC-e) — razão de 15 a 1.000 caracteres
await nfe.productInvoices.sendCorrectionLetter('empresa-id', 'invoice-id',
  'Correcao do endereco do destinatario conforme novo cadastro');

// Inutilizar faixa de numeração
await nfe.productInvoices.disableRange('empresa-id', {
  environment: 'Production',
  serie: 1,
  state: 'SP',
  beginNumber: 100,
  lastNumber: 110,
});
```

> **Nota:** Operações de emissão, cancelamento, CC-e e inutilização são assíncronas — retornam 202/204. Conclusão é notificada via webhooks.

#### 🏛️ Inscrições Estaduais (`nfe.stateTaxes`)

CRUD de inscrições estaduais (IE) — configuração necessária para emissão de NF-e de produto:

```typescript
// Listar inscrições estaduais
const taxes = await nfe.stateTaxes.list('empresa-id');

// Criar inscrição estadual
const tax = await nfe.stateTaxes.create('empresa-id', {
  taxNumber: '123456789',
  serie: 1,
  number: 1,
  code: 'sP',
  environmentType: 'production',
  type: 'nFe',
});

// Consultar, atualizar e excluir
const retrieved = await nfe.stateTaxes.retrieve('empresa-id', 'state-tax-id');
await nfe.stateTaxes.update('empresa-id', 'state-tax-id', { serie: 2 });
await nfe.stateTaxes.delete('empresa-id', 'state-tax-id');
```

> **Nota:** Usa o host `api.nfse.io`. Configure `dataApiKey` para chave separada, ou o SDK usará `apiKey` como fallback.

#### 🔍 Consulta de NF-e por Chave de Acesso (`nfe.productInvoiceQuery`)

Consultar NF-e (Nota Fiscal Eletrônica de Produto) diretamente na SEFAZ por chave de acesso. Recurso somente leitura sem necessidade de escopo de empresa:

```typescript
// Consultar dados completos da NF-e
const invoice = await nfe.productInvoiceQuery.retrieve(
  '35240112345678000190550010000001231234567890'
);
console.log('Status:', invoice.currentStatus);
console.log('Emissor:', invoice.issuer?.name);
console.log('Valor:', invoice.totals?.icms?.invoiceAmount);

// Baixar DANFE (PDF)
const pdf = await nfe.productInvoiceQuery.downloadPdf(
  '35240112345678000190550010000001231234567890'
);
fs.writeFileSync('danfe.pdf', pdf);

// Baixar XML da NF-e
const xml = await nfe.productInvoiceQuery.downloadXml(
  '35240112345678000190550010000001231234567890'
);
fs.writeFileSync('nfe.xml', xml);

// Listar eventos fiscais (cancelamentos, correções, manifestações)
const result = await nfe.productInvoiceQuery.listEvents(
  '35240112345678000190550010000001231234567890'
);
for (const event of result.events ?? []) {
  console.log(event.description, event.authorizedOn);
}
```

> **Nota:** A API de Consulta NF-e usa um host separado (`nfe.api.nfe.io`). Você pode configurar uma chave API específica com `dataApiKey`, ou o SDK usará `apiKey` como fallback.

#### 🧾 Consulta de Cupom Fiscal Eletrônico - CFe-SAT (`nfe.consumerInvoiceQuery`)

Consultar CFe-SAT (Cupom Fiscal Eletrônico) por chave de acesso. Recurso somente leitura sem necessidade de escopo de empresa:

```typescript
// Consultar dados completos do cupom fiscal
const coupon = await nfe.consumerInvoiceQuery.retrieve(
  '35240112345678000190590000000012341234567890'
);
console.log('Status:', coupon.currentStatus);   // 'Authorized'
console.log('Emissor:', coupon.issuer?.name);
console.log('Valor:', coupon.totals?.couponAmount);

// Baixar XML do CFe
const xml = await nfe.consumerInvoiceQuery.downloadXml(
  '35240112345678000190590000000012341234567890'
);
fs.writeFileSync('cfe.xml', xml);
```

> **Nota:** A API de Consulta CFe-SAT usa o mesmo host (`nfe.api.nfe.io`) e chave de API que a consulta de NF-e.

#### 🏢 Consulta CNPJ / Pessoa Jurídica (`nfe.legalEntityLookup`)

Consultar dados cadastrais de empresas brasileiras (CNPJ) na Receita Federal e nas SEFAZs estaduais:

```typescript
// Consulta básica por CNPJ (aceita com ou sem pontuação)
const result = await nfe.legalEntityLookup.getBasicInfo('12.345.678/0001-90');
console.log('Razão Social:', result.legalEntity?.name);
console.log('Nome Fantasia:', result.legalEntity?.tradeName);
console.log('Status:', result.legalEntity?.status);        // 'Active'
console.log('Porte:', result.legalEntity?.size);            // 'ME', 'EPP', etc.
console.log('Cidade:', result.legalEntity?.address?.city?.name);

// Consulta com opções
const result = await nfe.legalEntityLookup.getBasicInfo('12345678000190', {
  updateAddress: false,    // Não atualizar endereço via Correios
  updateCityCode: true,    // Atualizar código IBGE da cidade
});

// Consultar Inscrição Estadual (IE) por estado
const ieSP = await nfe.legalEntityLookup.getStateTaxInfo('SP', '12345678000190');
for (const tax of ieSP.legalEntity?.stateTaxes ?? []) {
  console.log(`IE: ${tax.taxNumber} - Status: ${tax.status}`);
  console.log(`  NFe: ${tax.nfe?.status}, CTe: ${tax.cte?.status}`);
}

// Avaliar IE para emissão de nota fiscal
const invoice = await nfe.legalEntityLookup.getStateTaxForInvoice('MG', '12345678000190');
for (const tax of invoice.legalEntity?.stateTaxes ?? []) {
  if (tax.status === 'Abled') {
    console.log(`Pode emitir com IE: ${tax.taxNumber}`);
  }
}

// Obter melhor IE sugerida para emissão
const sugestao = await nfe.legalEntityLookup.getSuggestedStateTaxForInvoice('SP', '12345678000190');
const melhorIE = sugestao.legalEntity?.stateTaxes?.[0];
console.log('IE recomendada:', melhorIE?.taxNumber);
```

> **Nota:** A API de Consulta CNPJ usa um host separado (`legalentity.api.nfe.io`). Você pode configurar uma chave API específica com `dataApiKey`, ou o SDK usará `apiKey` como fallback.

#### 👤 Consulta CPF / Pessoa Física (`nfe.naturalPersonLookup`)

Consultar a situação cadastral de CPF (pessoa física) na Receita Federal:

```typescript
// Consulta com CPF e data de nascimento
const result = await nfe.naturalPersonLookup.getStatus('123.456.789-01', '1990-01-15');
console.log('Nome:', result.name);      // 'JOÃO DA SILVA'
console.log('Status:', result.status);  // 'Regular'

// Também aceita Date object
const result = await nfe.naturalPersonLookup.getStatus('12345678901', new Date(1990, 0, 15));
console.log('Situação Cadastral:', result.status);
```

> **Nota:** A API de Consulta CPF usa um host separado (`naturalperson.api.nfe.io`). Você pode configurar uma chave API específica com `dataApiKey`, ou o SDK usará `apiKey` como fallback.

#### 🧮 Cálculo de Impostos (`nfe.taxCalculation`)

Calcular todos os tributos aplicáveis (ICMS, ICMS-ST, PIS, COFINS, IPI, II) para operações com produtos usando o Motor de Cálculo de Tributos:

```typescript
// Calcular impostos de uma operação de venda
const resultado = await nfe.taxCalculation.calculate('tenant-id', {
  operationType: 'Outgoing',
  issuer: { state: 'SP', taxRegime: 'RealProfit' },
  recipient: { state: 'RJ' },
  items: [{
    id: 'item-1',
    operationCode: 121,
    origin: 'National',
    ncm: '61091000',
    quantity: 10,
    unitAmount: 100.00
  }]
});

for (const item of resultado.items ?? []) {
  console.log(`Item ${item.id}: CFOP ${item.cfop}`);
  console.log(`  ICMS: CST=${item.icms?.cst}, valor=${item.icms?.vICMS}`);
  console.log(`  PIS: CST=${item.pis?.cst}, valor=${item.pis?.vPIS}`);
  console.log(`  COFINS: CST=${item.cofins?.cst}, valor=${item.cofins?.vCOFINS}`);
}
```

> **Nota:** A API de Cálculo de Impostos usa o host `api.nfse.io`. Configure `dataApiKey` para uma chave específica, ou o SDK usará `apiKey` como fallback.

#### 📋 Códigos Auxiliares de Impostos (`nfe.taxCodes`)

Consultar tabelas de referência necessárias para o cálculo de impostos:

```typescript
// Listar códigos de operação (natureza de operação)
const codigos = await nfe.taxCodes.listOperationCodes({ pageIndex: 1, pageCount: 20 });
for (const cod of codigos.items ?? []) {
  console.log(`${cod.code} - ${cod.description}`);
}

// Listar finalidades de aquisição
const finalidades = await nfe.taxCodes.listAcquisitionPurposes();

// Listar perfis fiscais do emissor
const perfisEmissor = await nfe.taxCodes.listIssuerTaxProfiles();

// Listar perfis fiscais do destinatário
const perfisDestinatario = await nfe.taxCodes.listRecipientTaxProfiles();
```

> **Nota:** Todas as listagens suportam paginação via `pageIndex` (1-based) e `pageCount` (padrão: 50).

---

### Opções de Configuração

```typescript
const nfe = new NfeClient({
  // Chave API principal do NFE.io (operações com documentos fiscais)
  apiKey: 'sua-chave-api',
  
  // Opcional: Chave API para serviços de consulta (Endereços, CT-e, CNPJ, CPF)
  // Se não fornecida, usa apiKey como fallback
  dataApiKey: 'sua-chave-data-api',
  
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

#### Variáveis de Ambiente

O SDK suporta as seguintes variáveis de ambiente:

| Variável | Descrição |
|----------|-----------|
| `NFE_API_KEY` | Chave API principal (fallback para `apiKey`) |
| `NFE_DATA_API_KEY` | Chave API para serviços de consulta (fallback para `dataApiKey`) |

```bash
# Configurar via ambiente
export NFE_API_KEY="sua-chave-api"
export NFE_DATA_API_KEY="sua-chave-data"

# Usar SDK sem passar chaves no código
const nfe = new NfeClient({});
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

O SDK gera tipos TypeScript automaticamente a partir de especificações OpenAPI. As specs são mantidas manualmente em `openapi/spec/`:

```bash
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
# → Executa: validate:spec → generate → typecheck → tsdown
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

## 📄 Licença

MIT © [NFE.io](https://nfe.io)

## 🆘 Suporte

- 📧 Email: suporte@nfe.io
- 📖 Documentação: https://nfe.io/docs/
- 🐛 Issues: https://github.com/nfe/client-nodejs/issues

---

**Feito com ❤️ pela equipe NFE.io**
