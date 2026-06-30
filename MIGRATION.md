# Guia de Migração

## v4 → v5

A v5 é a primeira release de **funcionalidades** desde a v3 (a v4 foi apenas o bump para
Node 22). Ela traz muitos recursos novos — todos **aditivos** — e um conjunto pequeno de
correções de contrato que são tecnicamente _breaking_.

```bash
npm install nfe-io@^5
```

> **Na prática, a maioria dos projetos não precisa mudar nada.** As quebras abaixo são em
> superfícies que já estavam quebradas (métodos que só lançavam 404, retornos que vinham
> `undefined`). Se você usa essas APIs, ajuste conforme a seguir.

### 1. `addresses.lookupByPostalCode()` retorna um `Address`

Antes devolvia um envelope tipado como `{ addresses: Address[] }` (mas a API real retorna
um único endereço, então `result.addresses` vinha `undefined`). Agora retorna o `Address`
direto.

```ts
// Antes (v4) — não funcionava como documentado
const result = await nfe.addresses.lookupByPostalCode('01310-100');
const street = result.addresses[0].street; // undefined

// Agora (v5)
const address = await nfe.addresses.lookupByPostalCode('01310-100');
const street = address.street; // 'Paulista'
```

### 2. `addresses.search()` e `addresses.lookupByTerm()` foram removidos

Os endpoints (`/v2/addresses` e `/v2/addresses/{term}`) respondem **404** no host real —
os métodos só lançavam `NotFoundError`. Use `lookupByPostalCode()`. O tipo
`AddressSearchOptions` foi removido e `AddressLookupResponse` agora descreve o envelope
real (`{ address: Address }`).

> Busca de endereço por texto livre só volta se/quando o backend expuser um endpoint real
> — aí como adição não-breaking.

### 3. `serviceInvoices.cancel()` retorna uma união discriminada

O cancelamento de NFS-e é **assíncrono** (HTTP 202 + `Location`). Antes, `cancel()`
retornava um stub de polling tipado como `ServiceInvoiceData` (então `cancelled.id` /
`cancelled.flowStatus` vinham `undefined`). Agora retorna `CancelInvoiceResponse`.

```ts
// Antes (v4)
const cancelled = await nfe.serviceInvoices.cancel(companyId, invoiceId);
console.log(cancelled.flowStatus); // undefined

// Agora (v5) — união discriminada (espelha create())
const result = await nfe.serviceInvoices.cancel(companyId, invoiceId);
if (result.status === 'async') {
  console.log(result.response.invoiceId);
}

// ou bloqueie até concluir:
const invoice = await nfe.serviceInvoices.cancelAndWait(companyId, invoiceId);
console.log(invoice.flowStatus); // 'Cancelled'
```

### 4. `CertificateValidator.validate()` não fabrica mais `metadata`

O pré-flight local valida apenas o **formato** (buffer, senha presente, magic bytes
PKCS#12). Não retorna mais `subject`/`issuer`/`validade` inventados — esses dados são
verificados no servidor durante o upload do certificado. Se você lia `result.metadata`,
ele agora é ausente no pré-flight.

### Novidades (aditivas, sem ação necessária)

- Emissão RTC (Reforma Tributária): `nfe.serviceInvoicesRtc`, `nfe.productInvoicesRtc`
- NFC-e: `nfe.consumerInvoices`
- Inscrições municipais: `nfe.municipalTaxes`
- Certificados por thumbprint: `nfe.certificates`
- Notificações: `nfe.notifications`
- Webhooks de conta + `fetchEventTypes()`
- `companies.exists()`, `serviceInvoices.retrieveByExternalId()`, `serviceInvoices.cancelAndWait()`, `stateTaxes.switchAuthorizer()`
- `Company` enriquecido com campos do spec (opcionais)

---

## v3 → v4

A v4.0.0 **não contém mudanças de API** — todo código escrito para a v3 funciona sem alterações.

O único requisito novo é **Node.js >= 22** (Node 18 e 20 atingiram fim de vida):

```bash
node --version  # deve ser >= 22
npm install nfe-io@^4
```

Se você ainda precisa de Node 18/20, permaneça no `nfe-io@^3.2`.

Internamente, a v4 moderniza o toolchain de build (tsup → tsdown/Rolldown, vitest 4) e corrige alertas de segurança em dependências de desenvolvimento — nada disso afeta o código consumidor.

---

# Guia de Migração: v2 → v3

Este guia ajuda você a migrar do SDK NFE.io v2.x para v3.0.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Mudanças Incompatíveis](#mudanças-incompatíveis)
- [Migração Passo a Passo](#migração-passo-a-passo)
- [Mudanças na API](#mudanças-na-api)
- [Exemplos de Código](#exemplos-de-código)
- [Perguntas Frequentes](#perguntas-frequentes)

## Visão Geral

### O que há de Novo na v3?

✨ **Principais Melhorias:**
- **TypeScript Nativo** - Segurança de tipos completa e suporte a IntelliSense
- **Async/Await Moderno** - Sem callbacks, API limpa baseada em promises
- **Zero Dependências** - Usa Fetch API nativa do Node.js (Node 18+)
- **Melhor Tratamento de Erros** - Classes de erro tipadas com informações detalhadas
- **Retry Automático** - Lógica de retry com exponential backoff integrada
- **ESM & CommonJS** - Funciona com ambos os sistemas de módulos
- **OpenAPI Types** - Tipos gerados automaticamente das especificações da API

⚠️ **Requisitos:**
- **Node.js >= 18.0.0** (anteriormente v12 na v2)
- **Mudanças incompatíveis na API** (veja abaixo)

### Cronograma de Migração

**Abordagem recomendada:**
1. ✅ Atualize para Node.js 18+ se necessário
2. ✅ Instale v3 ao lado da v2 (mesmo nome de pacote)
3. ✅ Migre um recurso por vez
4. ✅ Atualize os testes
5. ✅ Remova dependência da v2

## Mudanças Incompatíveis

### 1. Nome do Pacote (INALTERADO)

```bash
# v2 e v3 usam o mesmo nome
npm install nfe-io
```

### 2. Sintaxe de Import/Require

```javascript
// v2
var nfe = require('nfe-io')('sua-api-key');

// v3 (ESM)
import { NfeClient } from 'nfe-io';
const nfe = new NfeClient({ apiKey: 'sua-api-key' });

// v3 (CommonJS)
const { NfeClient } = require('nfe-io');
const nfe = new NfeClient({ apiKey: 'sua-api-key' });
```

### 3. Configuração

```javascript
// v2
var nfe = require('nfe-io')('api-key');
nfe.setTimeout(60000);

// v3
const nfe = new NfeClient({
  apiKey: 'api-key',
  timeout: 60000,
  environment: 'production', // ou 'development'
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000
  }
});
```

### 4. Callbacks → Async/Await

```javascript
// v2 (callbacks)
nfe.serviceInvoices.create('company-id', data, function(err, invoice) {
  if (err) return console.error(err);
  console.log(invoice);
});

// v2 (promises)
nfe.serviceInvoices.create('company-id', data)
  .then(invoice => console.log(invoice))
  .catch(err => console.error(err));

// v3 (async/await - RECOMENDADO)
try {
  const invoice = await nfe.serviceInvoices.create('company-id', data);
  console.log(invoice);
} catch (error) {
  console.error(error);
}
```

### 5. Tratamento de Erros

```javascript
// v2
nfe.serviceInvoices.create('company-id', data, function(err, invoice) {
  if (err) {
    if (err.type === 'AuthenticationError') {
      // tratar erro de autenticação
    }
  }
});

// v3
import { AuthenticationError, ValidationError } from 'nfe-io';

try {
  const invoice = await nfe.serviceInvoices.create('company-id', data);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('API key inválida');
  } else if (error instanceof ValidationError) {
    console.error('Dados inválidos:', error.details);
  }
}
```

### 6. Formato de Resposta

```javascript
// v2 - Retorno direto dos dados
const invoice = await nfe.serviceInvoices.retrieve('company-id', 'invoice-id');
console.log(invoice.number);

// v3 - Igual! (sem mudanças)
const invoice = await nfe.serviceInvoices.retrieve('company-id', 'invoice-id');
console.log(invoice.number);
```

### 7. Mudanças nos Nomes dos Métodos

| Método v2 | Método v3 | Notas |
|-----------|-----------|-------|
| `create()` | `create()` | ✅ Igual |
| `list()` | `list()` | ✅ Igual |
| `retrieve()` | `retrieve()` | ✅ Igual |
| `update()` | `update()` | ✅ Igual |
| `delete()` | `delete()` / `remove()` | ⚠️ `remove()` em Companies |
| `sendEmail()` | `sendEmail()` | ✅ Igual |
| `downloadPdf()` | `downloadPdf()` | ✅ Igual |
| `downloadXml()` | `downloadXml()` | ✅ Igual |
| N/A | `createAndWait()` | 🆕 Novo! Polling automático |
| N/A | `listAll()` | 🆕 Paginação automática |
| N/A | `findByTaxNumber()` | 🆕 Busca por CNPJ/CPF |

## Migração Passo a Passo

### Passo 1: Instalar v3

```bash
# Instalar novo pacote (v2 fica instalada por enquanto)
npm install nfe-io@3.0.0

# Verificar versão do Node.js
node --version  # Deve ser >= 18.0.0
```

### Passo 2: Atualizar Imports

```diff
- var nfe = require('nfe-io')('api-key');
+ const { NfeClient } = require('nfe-io');
+ const nfe = new NfeClient({ apiKey: 'api-key' });
```

Ou com ES Modules:

```diff
+ import { NfeClient } from 'nfe-io';
+ const nfe = new NfeClient({ apiKey: 'api-key' });
```

### Passo 3: Converter Callbacks para Async/Await

```diff
- nfe.serviceInvoices.create('company-id', data, function(err, invoice) {
-   if (err) return console.error(err);
-   console.log(invoice);
- });

+ async function criarNotaFiscal() {
+   try {
+     const invoice = await nfe.serviceInvoices.create('company-id', data);
+     console.log(invoice);
+   } catch (error) {
+     console.error(error);
+   }
+ }
+ criarNotaFiscal();
```

### Passo 4: Atualizar Tratamento de Erros

```diff
+ import { 
+   NfeError,
+   AuthenticationError, 
+   ValidationError,
+   NotFoundError 
+ } from 'nfe-io';

  try {
    const invoice = await nfe.serviceInvoices.create('company-id', data);
  } catch (error) {
-   if (error.type === 'AuthenticationError') {
+   if (error instanceof AuthenticationError) {
      console.error('Autenticação falhou');
    }
-   if (error.type === 'ValidationError') {
+   if (error instanceof ValidationError) {
      console.error('Dados inválidos:', error.details);
    }
  }
```

### Passo 5: Atualizar TypeScript (se aplicável)

```typescript
// Adicionar tipos ao seu código
import { NfeClient, ServiceInvoice, Company } from 'nfe-io';

const nfe = new NfeClient({ apiKey: 'api-key' });

async function getInvoice(
  companyId: string, 
  invoiceId: string
): Promise<ServiceInvoice> {
  return await nfe.serviceInvoices.retrieve(companyId, invoiceId);
}
```

### Passo 6: Remover v2

```bash
# Após todo código migrado e testado
# Não há necessidade de desinstalar se estiver na mesma major version
# Apenas atualize suas importações e uso do código
```

## Mudanças na API

### Notas Fiscais de Serviço (Service Invoices)

```javascript
// v2
nfe.serviceInvoices.create('company-id', invoiceData, callback);
nfe.serviceInvoices.list('company-id', callback);
nfe.serviceInvoices.retrieve('company-id', 'invoice-id', callback);
nfe.serviceInvoices.cancel('company-id', 'invoice-id', callback);
nfe.serviceInvoices.sendEmail('company-id', 'invoice-id', callback);
nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id', callback);
nfe.serviceInvoices.downloadXml('company-id', 'invoice-id', callback);

// v3
await nfe.serviceInvoices.create('company-id', invoiceData);
await nfe.serviceInvoices.list('company-id', { pageCount: 50, pageIndex: 0 });
await nfe.serviceInvoices.retrieve('company-id', 'invoice-id');
await nfe.serviceInvoices.cancel('company-id', 'invoice-id');
await nfe.serviceInvoices.sendEmail('company-id', 'invoice-id');
await nfe.serviceInvoices.downloadPdf('company-id', 'invoice-id');
await nfe.serviceInvoices.downloadXml('company-id', 'invoice-id');

// 🆕 Novo na v3: Polling automático para processamento assíncrono
await nfe.serviceInvoices.createAndWait('company-id', invoiceData, {
  maxAttempts: 30,
  intervalMs: 2000
});
```

### Empresas (Companies)

```javascript
// v2
nfe.companies.create(companyData, callback);
nfe.companies.list(callback);
nfe.companies.retrieve('company-id', callback);
nfe.companies.update('company-id', updates, callback);
nfe.companies.uploadCertificate('company-id', fileData, password, callback);

// v3 - CRUD Básico (mesmo padrão, agora async)
await nfe.companies.create(companyData);
await nfe.companies.list({ pageCount: 20, pageIndex: 0 });
await nfe.companies.retrieve('company-id');
await nfe.companies.update('company-id', updates);
await nfe.companies.remove('company-id'); // Renomeado de 'delete'

// v3 - Gerenciamento de Certificados (aprimorado)
await nfe.companies.uploadCertificate('company-id', {
  file: fileBuffer,
  password: 'senha-certificado',
  filename: 'certificate.pfx' // Opcional
});

// 🆕 Novo na v3: Utilitários de certificado
const validation = await nfe.companies.validateCertificate(certBuffer, 'senha');
const status = await nfe.companies.getCertificateStatus('company-id');
const warning = await nfe.companies.checkCertificateExpiration('company-id', 30);

// 🆕 Novo na v3: Helpers de paginação
const allCompanies = await nfe.companies.listAll(); // Paginação automática
for await (const company of nfe.companies.listIterator()) {
  // Streaming eficiente de memória
}

// 🆕 Novo na v3: Métodos de busca
const company = await nfe.companies.findByTaxNumber(12345678000190); // CNPJ
const matches = await nfe.companies.findByName('Acme'); // Por nome
const withCerts = await nfe.companies.getCompaniesWithCertificates();
const expiring = await nfe.companies.getCompaniesWithExpiringCertificates(30);
```

**Principais Mudanças:**
- ✅ `delete()` → `remove()` (evita palavra reservada JavaScript)
- ✅ `uploadCertificate()` agora recebe objeto com `{ file, password, filename? }`
- 🆕 Validação de certificado antes do upload
- 🆕 Monitoramento de expiração de certificados
- 🆕 Busca por CNPJ/CPF ou nome
- 🆕 Paginação automática com `listAll()` e `listIterator()`

### Pessoas Jurídicas e Físicas (Legal People & Natural People)

```javascript
// v2
nfe.legalPeople.create('company-id', personData, callback);
nfe.legalPeople.list('company-id', callback);
nfe.legalPeople.retrieve('company-id', 'person-id', callback);
nfe.legalPeople.update('company-id', 'person-id', updates, callback);
nfe.legalPeople.delete('company-id', 'person-id', callback);

// v3 (mesmo padrão, apenas async)
await nfe.legalPeople.create('company-id', personData);
await nfe.legalPeople.list('company-id');
await nfe.legalPeople.retrieve('company-id', 'person-id');
await nfe.legalPeople.update('company-id', 'person-id', updates);
await nfe.legalPeople.delete('company-id', 'person-id');

// Mesmo para pessoas físicas
await nfe.naturalPeople.create('company-id', personData);
await nfe.naturalPeople.list('company-id');
await nfe.naturalPeople.retrieve('company-id', 'person-id');
await nfe.naturalPeople.update('company-id', 'person-id', updates);
await nfe.naturalPeople.delete('company-id', 'person-id');
```

**Mudanças:**
- ✅ Validação automática de CNPJ (pessoas jurídicas)
- ✅ Validação automática de CPF (pessoas físicas)
- ✅ Mesma interface async/await para ambos os recursos

### Webhooks

```javascript
// v2
nfe.webhooks.create(webhookData, callback);
nfe.webhooks.list(callback);
nfe.webhooks.retrieve('webhook-id', callback);
nfe.webhooks.update('webhook-id', updates, callback);
nfe.webhooks.delete('webhook-id', callback);

// v3
await nfe.webhooks.create('company-id', webhookData);
await nfe.webhooks.list('company-id');
await nfe.webhooks.retrieve('company-id', 'webhook-id');
await nfe.webhooks.update('company-id', 'webhook-id', updates);
await nfe.webhooks.delete('company-id', 'webhook-id');
```

## Exemplos de Código

### Antes & Depois: Fluxo Completo de Emissão de Nota Fiscal

**Código v2:**

```javascript
var nfe = require('nfe-io')('api-key');

function emitirNotaFiscal(companyId, invoiceData, callback) {
  nfe.serviceInvoices.create(companyId, invoiceData, function(err, invoice) {
    if (err) return callback(err);
    
    if (invoice.code === 202) {
      // Poll manual
      var checkInterval = setInterval(function() {
        nfe.serviceInvoices.retrieve(companyId, invoice.id, function(err, result) {
          if (err) {
            clearInterval(checkInterval);
            return callback(err);
          }
          
          if (result.status === 'issued') {
            clearInterval(checkInterval);
            
            // Enviar email
            nfe.serviceInvoices.sendEmail(companyId, result.id, function(err) {
              if (err) return callback(err);
              callback(null, result);
            });
          }
        });
      }, 2000);
    } else {
      // Enviar email
      nfe.serviceInvoices.sendEmail(companyId, invoice.id, function(err) {
        if (err) return callback(err);
        callback(null, invoice);
      });
    }
  });
}

emitirNotaFiscal('company-id', invoiceData, function(err, invoice) {
  if (err) return console.error(err);
  console.log('Nota fiscal emitida:', invoice.number);
});
```

**Código v3:**

```javascript
import { NfeClient } from 'nfe-io';

const nfe = new NfeClient({ apiKey: 'api-key' });

async function emitirNotaFiscal(companyId, invoiceData) {
  // Automaticamente faz polling e envia email
  const invoice = await nfe.serviceInvoices.createAndWait(
    companyId, 
    invoiceData,
    { maxAttempts: 30, intervalMs: 2000 }
  );
  
  await nfe.serviceInvoices.sendEmail(companyId, invoice.id);
  
  return invoice;
}

// Uso
try {
  const invoice = await emitirNotaFiscal('company-id', invoiceData);
  console.log('Nota fiscal emitida:', invoice.number);
} catch (error) {
  console.error('Falha ao emitir nota fiscal:', error);
}
```

### Antes & Depois: Tratamento de Erros

**Código v2:**

```javascript
nfe.serviceInvoices.create('company-id', data, function(err, invoice) {
  if (err) {
    if (err.type === 'AuthenticationError') {
      console.error('API key inválida');
    } else if (err.type === 'BadRequestError') {
      console.error('Dados inválidos:', err.message);
    } else {
      console.error('Erro desconhecido:', err);
    }
    return;
  }
  
  console.log('Sucesso:', invoice);
});
```

**Código v3:**

```javascript
import { 
  AuthenticationError, 
  ValidationError,
  RateLimitError 
} from 'nfe-io';

try {
  const invoice = await nfe.serviceInvoices.create('company-id', data);
  console.log('Sucesso:', invoice);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('API key inválida');
  } else if (error instanceof ValidationError) {
    console.error('Dados inválidos:', error.details);
  } else if (error instanceof RateLimitError) {
    console.error('Limite de taxa atingido, tentar após:', error.retryAfter);
  } else {
    console.error('Erro desconhecido:', error);
  }
}
```

### Antes & Depois: Operações em Lote

**Código v2:**

```javascript
var async = require('async');

async.mapLimit(invoices, 5, function(invoiceData, callback) {
  nfe.serviceInvoices.create('company-id', invoiceData, callback);
}, function(err, results) {
  if (err) return console.error(err);
  console.log('Criados:', results.length);
});
```

**Código v3:**

```javascript
// Não precisa de dependências externas!
async function criarEmLote(companyId, invoices) {
  const results = await Promise.allSettled(
    invoices.map(data => 
      nfe.serviceInvoices.create(companyId, data)
    )
  );
  
  const succeeded = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');
  
  console.log(`✅ ${succeeded.length} com sucesso`);
  console.log(`❌ ${failed.length} falharam`);
  
  return { succeeded, failed };
}
```

### Migração de Gerenciamento de Certificados

O gerenciamento de certificados no v3 foi significativamente aprimorado:

**Abordagem v2:**
```javascript
// v2: Upload e esperar que funcione
const fs = require('fs');
const certBuffer = fs.readFileSync('./certificate.pfx');

nfe.companies.uploadCertificate('company-id', certBuffer, 'senha', (err, result) => {
  if (err) {
    console.error('Upload falhou:', err);
    return;
  }
  console.log('Certificado carregado');
});
```

**Abordagem v3 (com validação):**
```javascript
// v3: Validar antes do upload
import { readFile } from 'fs/promises';
import { CertificateValidator } from 'nfe-io';

const certBuffer = await readFile('./certificate.pfx');

// 1. Verificar formato do arquivo
if (!CertificateValidator.isSupportedFormat('certificate.pfx')) {
  throw new Error('Apenas arquivos .pfx e .p12 são suportados');
}

// 2. Validar certificado
const validation = await nfe.companies.validateCertificate(certBuffer, 'senha');
if (!validation.valid) {
  throw new Error(`Certificado inválido: ${validation.error}`);
}

console.log('Certificado expira em:', validation.metadata?.validTo);

// 3. Upload (também valida automaticamente)
const result = await nfe.companies.uploadCertificate('company-id', {
  file: certBuffer,
  password: 'senha',
  filename: 'certificate.pfx'
});

console.log(result.message);
```

**Monitoramento v3:**
```javascript
// Configurar monitoramento de certificados expirando
async function verificarCertificados() {
  const expirando = await nfe.companies.getCompaniesWithExpiringCertificates(30);
  
  for (const company of expirando) {
    const alerta = await nfe.companies.checkCertificateExpiration(company.id, 30);
    
    if (alerta) {
      console.warn(`⚠️  ${company.name}`);
      console.warn(`   Certificado expira em ${alerta.daysRemaining} dias`);
      console.warn(`   Data de expiração: ${alerta.expiresOn.toLocaleDateString()}`);
      
      // Enviar alerta ao administrador
      await enviarAlertaAdmin({
        empresa: company.name,
        diasRestantes: alerta.daysRemaining
      });
    }
  }
}

// Executar diariamente
setInterval(verificarCertificados, 24 * 60 * 60 * 1000);
```

## Perguntas Frequentes (FAQ)

### P: Posso usar v2 e v3 juntos durante a migração?

**R:** Sim! Eles usam nomes de pacote diferentes (`nfe-io` v2 vs `nfe-io` v3), mas você pode identificá-los pela versão.

```javascript
// v2 (versão 2.x.x)
const nfeV2 = require('nfe-io')('api-key');

// v3 (versão 3.x.x)
const { NfeClient } = require('nfe-io');
const nfeV3 = new NfeClient({ apiKey: 'api-key' });
```

### P: Preciso alterar minha API key?

**R:** Não! Sua API key existente funciona tanto com v2 quanto com v3.

### P: E se eu ainda estiver no Node.js 16?

**R:** Você deve atualizar para Node.js 18+ para usar v3. Considere:
- Atualizar Node.js (recomendado)
- Permanecer no v2 até poder atualizar
- Usar Node Version Manager (nvm) para testar v3

### P: Há mudanças no formato de dados?

**R:** Não! Os formatos de request/response da API são os mesmos. Apenas a interface do SDK mudou.

### P: O que acontece com meu código v2 após a migração?

**R:** Mantenha-o até que você tenha migrado e testado completamente. Depois, atualize para a versão 3.x.x.

### P: Há diferença de desempenho?

**R:** Sim! v3 é mais rápido:
- Sem dependências externas = inicialização mais rápida
- Fetch API nativo = melhor desempenho
- Retry integrado = maior confiabilidade

### P: Posso usar v3 com JavaScript (não TypeScript)?

**R:** Com certeza! Os tipos TypeScript são opcionais. v3 funciona perfeitamente com JavaScript puro.

### P: E quanto à compatibilidade com versões anteriores?

**R:** v3 **não é** compatível com v2. Por isso usamos controle de versão semântico. Siga este guia para migrar.

## Precisa de Ajuda?

- 📖 [Documentação Completa](https://nfe.io/docs/)
- 🐛 [Reportar Problemas](https://github.com/nfe/client-nodejs/issues)
- 📧 [Suporte por Email](mailto:suporte@nfe.io)

---

**Boa migração! 🚀**
