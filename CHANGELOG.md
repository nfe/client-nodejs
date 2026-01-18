# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).


## [3.0.0] - 2026-01-18

### 🎉 Lançamento Oficial da Versão 3.0

**Reescrita completa do SDK NFE.io** - SDK TypeScript moderno com zero dependências em runtime e API async/await limpa e intuitiva.

### ✨ Principais Destaques

- 🎯 **TypeScript Nativo** - Segurança de tipos completa com IntelliSense rico
- 🚀 **Zero Dependências em Runtime** - Usa Fetch API nativa do Node.js 18+
- ⚡ **API Moderna Async/Await** - Sem callbacks, código mais limpo e legível
- 🔄 **Retry Automático** - Lógica de retry inteligente com exponential backoff
- 📦 **Suporte Dual ESM/CommonJS** - Funciona com ambos os sistemas de módulos
- 🧪 **Bem Testado** - Mais de 80 testes com 88% de cobertura de código
- 📖 **Documentação Completa** - JSDoc em todas as APIs públicas com exemplos

### 🆕 Adicionado

#### Recursos Principais

- **NfeClient** - Cliente principal com configuração flexível
  - Suporte a ambientes `production` e `development`
  - Configuração de timeout personalizável
  - Retry configurável com exponential backoff
  - Suporte a variáveis de ambiente (`NFE_API_KEY`)
  - Método `updateConfig()` para configuração dinâmica
  - Método `getConfig()` para consultar configuração atual
  - Método `pollUntilComplete()` para polling automático genérico
  - Método estático `isEnvironmentSupported()` para validação

#### Recursos de API Implementados

##### ServiceInvoices (Notas Fiscais de Serviço)
- ✅ `create()` - Criar nota fiscal com suporte a resposta 202 (processamento assíncrono)
- ✅ `createAndWait()` - **NOVO!** Criar e aguardar processamento automaticamente
- ✅ `list()` - Listar notas fiscais com paginação manual
- ✅ `retrieve()` - Buscar nota fiscal específica por ID
- ✅ `cancel()` - Cancelar nota fiscal emitida
- ✅ `sendEmail()` - Enviar nota fiscal por email
- ✅ `downloadPdf()` - Download do PDF da nota fiscal
- ✅ `downloadXml()` - Download do XML da nota fiscal

##### Companies (Empresas)
- ✅ `create()` - Criar nova empresa
- ✅ `list()` - Listar empresas cadastradas
- ✅ `retrieve()` - Buscar empresa específica por ID
- ✅ `update()` - Atualizar dados da empresa
- ✅ `uploadCertificate()` - Upload de certificado digital A1 com suporte a FormData

##### LegalPeople (Pessoas Jurídicas)
- ✅ `create()` - Criar pessoa jurídica
- ✅ `list()` - Listar pessoas jurídicas (scoped por company_id)
- ✅ `retrieve()` - Buscar pessoa jurídica específica
- ✅ `update()` - Atualizar dados da pessoa jurídica
- ✅ `delete()` - Deletar pessoa jurídica
- ✅ `findByTaxNumber()` - **NOVO!** Buscar pessoa jurídica por CNPJ
- ✅ `createBatch()` - **NOVO!** Criar múltiplas pessoas jurídicas em lote

##### NaturalPeople (Pessoas Físicas)
- ✅ `create()` - Criar pessoa física
- ✅ `list()` - Listar pessoas físicas (scoped por company_id)
- ✅ `retrieve()` - Buscar pessoa física específica
- ✅ `update()` - Atualizar dados da pessoa física
- ✅ `delete()` - Deletar pessoa física
- ✅ `findByTaxNumber()` - **NOVO!** Buscar pessoa física por CPF
- ✅ `createBatch()` - **NOVO!** Criar múltiplas pessoas físicas em lote

##### Webhooks
- ✅ `create()` - Criar webhook
- ✅ `list()` - Listar webhooks configurados
- ✅ `retrieve()` - Buscar webhook específico
- ✅ `update()` - Atualizar configuração do webhook
- ✅ `delete()` - Deletar webhook
- ✅ `validateSignature()` - **NOVO!** Validar assinatura de segurança do webhook

#### Sistema de Erros Robusto

Hierarquia completa de erros tipados para melhor tratamento:

- `NfeError` - Classe base de erro com estrutura consistente
- `AuthenticationError` - Erro de autenticação (401)
- `ValidationError` - Erro de validação com detalhes dos campos (400, 422)
- `NotFoundError` - Recurso não encontrado (404)
- `RateLimitError` - Limite de taxa atingido (429) com `retryAfter`
- `ServerError` - Erro no servidor (5xx)
- `ConnectionError` - Erro de conexão de rede
- `TimeoutError` - Timeout na requisição
- `ConfigurationError` - Erro de configuração do cliente
- `PollingTimeoutError` - Timeout no polling de processamento assíncrono
- `ErrorFactory` - Factory inteligente para criar erros apropriados

Todos os erros incluem:
- `message` - Mensagem descritiva
- `statusCode` - Código HTTP
- `requestId` - ID da requisição para suporte
- `details` - Detalhes adicionais
- `fields` - (ValidationError) Campos com erro

#### HTTP Client Avançado

- Fetch API nativa do Node.js 18+
- Retry automático com exponential backoff e jitter
- Suporte a timeout configurável
- Tratamento inteligente de status HTTP (202, 204, 4xx, 5xx)
- Headers customizados por requisição
- Gestão automática de autenticação (Basic Auth)

#### Sistema de Tipos Completo

- Tipos TypeScript para todas as entidades da API
- Tipos de requisição e resposta
- Tipos de configuração
- Tipos de opções de polling
- Tipos de retry config
- Exports públicos bem definidos

#### Testes Abrangentes

- **80+ testes** automatizados
- **88% de cobertura** de código
- Testes unitários para toda lógica de negócio
- Testes de integração com mocks da API
- 32 testes de tratamento de erros
- 55 testes de operações CRUD de recursos
- 13 testes de configuração do cliente
- Factories de mock para todos os tipos de recursos

#### Documentação Completa

- **README.md** - Guia de início rápido atualizado
- **MIGRATION.md** - Guia detalhado de migração v2 → v3 (677 linhas)
- **API.md** - Referência completa da API (1842 linhas)
- **CONTRIBUTING.md** - Guidelines para contribuição
- **CHANGELOG.md** - Histórico de mudanças (este arquivo)
- **RELEASE_NOTES_v3.md** - Release notes completo em português
- JSDoc completo em todas as APIs públicas
- 10+ exemplos práticos em `examples/`

#### Exemplos Práticos

Novos exemplos prontos para uso na pasta `examples/`:

- `basic-usage-esm.js` - Uso básico com ESM
- `basic-usage-cjs.cjs` - Uso básico com CommonJS
- `basic-usage.ts` - Uso básico com TypeScript
- `service-invoice-complete.js` - Fluxo completo de emissão de nota fiscal
- `real-world-invoice.js` - Exemplo real de emissão de nota
- `real-world-list-invoices.js` - Listagem com paginação
- `real-world-manage-people.js` - Gestão de pessoas (legal e natural)
- `real-world-webhooks.js` - Configuração e validação de webhooks
- `all-resources-demo.js` - Demonstração de todos os recursos
- `jsdoc-intellisense-demo.ts` - Demonstração do IntelliSense
- `setup.js` - Script de configuração interativa
- `test-connection.js` - Script de teste de conexão

Scripts NPM para exemplos:
```bash
npm run examples:setup  # Configurar credenciais
npm run examples:test   # Testar conexão
npm run examples        # Executar todos exemplos
```

#### Melhorias de Developer Experience

- **IntelliSense Rico** - Autocompletar completo com documentação inline
- **Type Safety** - Validação de tipos em tempo de desenvolvimento
- **Mensagens de Erro Descritivas** - Erros com contexto completo
- **Validação de Ambiente** - Método `isEnvironmentSupported()`
- **Configuração Flexível** - Múltiplas opções de configuração
- **Exports Organizados** - Exports públicos bem definidos

### 🔄 Mudanças (Breaking Changes)

#### Requisitos do Sistema

- **Node.js:** Aumentado de >= 12.0.0 para >= 18.0.0 (necessário para Fetch API nativo)
- **TypeScript:** Recomendado >= 5.0 para aproveitar tipos completos

#### Inicialização do Cliente

**Antes (v2):**
```javascript
var nfe = require('nfe-io')('api-key');
```

**Agora (v3):**
```javascript
// CommonJS
const { NfeClient } = require('nfe-io');
const nfe = new NfeClient({ apiKey: 'api-key' });

// ESM
import { NfeClient } from 'nfe-io';
const nfe = new NfeClient({ apiKey: 'api-key' });
```

#### API de Callbacks Removida

**Antes (v2):**
```javascript
nfe.serviceInvoices.create('company-id', data, function(err, invoice) {
  if (err) return console.error(err);
  console.log(invoice);
});
```

**Agora (v3 - Async/Await):**
```javascript
try {
  const invoice = await nfe.serviceInvoices.create('company-id', data);
  console.log(invoice);
} catch (error) {
  console.error(error);
}
```

#### Tratamento de Erros

**Antes (v2):**
```javascript
if (err.type === 'AuthenticationError') {
  // tratar erro
}
```

**Agora (v3 - Classes de Erro):**
```javascript
import { AuthenticationError } from 'nfe-io';

if (error instanceof AuthenticationError) {
  // tratar erro
}
```

#### Configuração

**Antes (v2):**
```javascript
var nfe = require('nfe-io')('api-key');
nfe.setTimeout(60000);
```

**Agora (v3):**
```javascript
const nfe = new NfeClient({
  apiKey: 'api-key',
  timeout: 60000,
  environment: 'production',
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000
  }
});

// Ou atualizar dinamicamente
nfe.updateConfig({ timeout: 90000 });
```

#### Nomes de Métodos

Todos os métodos mantêm a mesma assinatura básica, mas agora retornam Promises:

| Recurso | Método | v2 | v3 | Mudanças |
|---------|--------|----|----|----------|
| ServiceInvoices | `create()` | ✅ | ✅ | Agora async/await |
| ServiceInvoices | `createAndWait()` | ❌ | ✅ | **NOVO!** Polling automático |
| ServiceInvoices | `list()` | ✅ | ✅ | Agora async/await |
| ServiceInvoices | `retrieve()` | ✅ | ✅ | Agora async/await |
| ServiceInvoices | `cancel()` | ✅ | ✅ | Agora async/await |
| ServiceInvoices | `sendEmail()` | ✅ | ✅ | Agora async/await |
| ServiceInvoices | `downloadPdf()` | ✅ | ✅ | Retorna Buffer |
| ServiceInvoices | `downloadXml()` | ✅ | ✅ | Retorna string |
| Companies | `uploadCertificate()` | ✅ | ✅ | Suporte FormData melhorado |
| LegalPeople | `findByTaxNumber()` | ❌ | ✅ | **NOVO!** |
| LegalPeople | `createBatch()` | ❌ | ✅ | **NOVO!** |
| NaturalPeople | `findByTaxNumber()` | ❌ | ✅ | **NOVO!** |
| NaturalPeople | `createBatch()` | ❌ | ✅ | **NOVO!** |
| Webhooks | `validateSignature()` | ❌ | ✅ | **NOVO!** |

### ❌ Removido

#### Dependências

- **when@3.1.0** - Substituído por promises nativas do JavaScript
- **Todas as dependências em runtime** - Agora zero dependencies

#### API Legada

- **Suporte a callbacks** - Removido em favor de async/await
- **API de promises via when.js** - Substituído por promises nativas
- **Suporte ao Node.js < 18** - Requer Node.js 18+ para Fetch API nativo

### 🐛 Corrigido

- Retry logic agora trata corretamente erros 4xx (não retenta)
- Tipos TypeScript completos para todas as respostas da API
- Mensagens de erro mais descritivas com contexto da requisição
- Race conditions no processamento assíncrono de notas fiscais
- Validação de configuração mais robusta
- Tratamento adequado de status HTTP 202 (accepted)
- Tratamento adequado de status HTTP 204 (no content)

### 🔒 Segurança

- Atualizado para TypeScript 5.3+ (última versão estável)
- Zero dependências em runtime = superfície de ataque reduzida
- Nenhuma dependência com vulnerabilidades conhecidas (CVE)
- Validação de entrada via tipos TypeScript
- Suporte a validação de assinatura de webhooks

### 📊 Performance

- ~30% mais rápido que v2 em operações comuns
- Tamanho do bundle reduzido de ~50KB para ~30KB
- Zero overhead de dependências externas
- Fetch API nativo otimizado

### 📚 Migração

Para migrar da v2 para v3, consulte:
- **Guia completo:** [MIGRATION.md](./MIGRATION.md)
- **Release notes:** [RELEASE_NOTES_v3.md](./RELEASE_NOTES_v3.md)

**Checklist rápido:**
1. ✅ Atualizar Node.js para >= 18.0.0
2. ✅ Instalar versão 3: `npm install nfe-io@3`
3. ✅ Atualizar imports/requires
4. ✅ Converter callbacks para async/await
5. ✅ Atualizar tratamento de erros para classes
6. ✅ Testar completamente sua aplicação

---

## [2.0.0] - Versão Legada (Anterior)

SDK JavaScript legado com API baseada em callbacks.

### Recursos da v2

- Companies CRUD
- ServiceInvoices operations
- LegalPeople CRUD
- NaturalPeople CRUD
- Webhooks CRUD
- API dual Promise + callback via biblioteca `when`

### Problemas Conhecidos da v2

- Dependências desatualizadas (`when@3.1.0`)
- API baseada em callbacks (menos intuitiva)
- Sem suporte a TypeScript
- Sem mecanismo de retry integrado
- Polling manual necessário para operações assíncronas
- Sem testes automatizados

---

## Suporte

- 📧 Email: suporte@nfe.io
- 📖 Documentação: https://nfe.io/docs/
- 🐛 Issues: https://github.com/nfe/client-nodejs/issues
- 💬 Discussões: https://github.com/nfe/client-nodejs/discussions

---

## Links

[Unreleased]: https://github.com/nfe/client-nodejs/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/nfe/client-nodejs/releases/tag/v3.0.0
[2.0.0]: https://github.com/nfe/client-nodejs/releases/tag/v2.0.0
