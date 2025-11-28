<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# 📋 AGENTS.md - Diretrizes Essenciais para Modernização do SDK NFE.io

> **Meta**: Modernizar completamente o SDK NFE.io de JavaScript/callbacks para TypeScript moderno com geração automática a partir de OpenAPI, mantendo compatibilidade funcional.

---

## 🎯 Contexto do Projeto

### Estado Atual (v2.0.0)
- **Tecnologia**: JavaScript ES5/ES6, callbacks + promises via biblioteca `when`
- **Node.js**: >= v12.0.0
- **Estrutura**: Manual baseada em `BaseResource.extend()` pattern
- **Dependências**: `when@3.1.0` (desatualizado)
- **API**: REST API v1 - `api.nfe.io/v1/`
- **Recursos disponíveis**:
  - Companies (CRUD + upload certificate)
  - ServiceInvoices (create, list, retrieve, cancel, sendemail, downloadPdf, downloadXml)
  - LegalPeople (CRUD - scoped por company_id)
  - NaturalPeople (CRUD - scoped por company_id)
  - Webhooks (CRUD)

### Estado Desejado (v3.0.0)
- **Tecnologia**: TypeScript 5.3+, async/await nativo, Fetch API
- **Node.js**: >= 18.0.0 (suporte nativo a Fetch)
- **Estrutura**: Código auto-gerado do OpenAPI + camada DX handwritten
- **Dependências**: Zero runtime dependencies (apenas devDependencies)
- **Qualidade**: Testes completos, CI/CD, documentação auto-gerada

---

## 🚨 REGRAS CRÍTICAS - LEIA PRIMEIRO

### ❌ NUNCA FAÇA ISSO:
1. **Nunca edite código em `src/generated/`** - É auto-gerado e será sobrescrito
2. **Nunca remova backward compatibility** sem documentar no CHANGELOG
3. **Nunca commite sem rodar**: `npm run typecheck && npm run lint && npm test`
4. **Nunca publique sem atualizar**: CHANGELOG.md e package.json version
5. **Nunca use `any` no TypeScript** - Use tipos explícitos ou `unknown`

### ✅ SEMPRE FAÇA ISSO:
1. **Sempre documente métodos públicos** com JSDoc completo
2. **Sempre escreva testes** junto com o código novo
3. **Sempre valide o OpenAPI spec** antes de gerar código
4. **Sempre use tipos do generated/** nos resources handwritten
5. **Sempre teste contra sandbox** antes de release

---

## 📁 Estrutura de Arquivos Obrigatória

```
client-nodejs/                    # @nfe-io/sdk - Core SDK
├── openapi/
│   ├── spec/
│   │   └── nfe-api.json          # ⚠️ SOURCE OF TRUTH - OpenAPI spec
│   └── generator-config.yaml     # Configuração do gerador
│
├── src/
│   ├── core/                     # ✏️ Core SDK implementation
│   │   ├── client.ts             # NfeClient principal
│   │   ├── types.ts              # TypeScript types completos
│   │   ├── errors/               # Sistema de erros
│   │   │   └── index.ts
│   │   ├── http/                 # HTTP client layer
│   │   │   └── client.ts
│   │   └── resources/            # API Resources
│   │       ├── companies.ts
│   │       ├── service-invoices.ts
│   │       ├── legal-people.ts
│   │       ├── natural-people.ts
│   │       └── webhooks.ts
│   │
│   └── index.ts                  # Public API exports
│
├── scripts/
│   ├── download-openapi.ts       # Download spec da API
│   └── validate-spec.ts          # Valida OpenAPI spec
│
├── tests/
│   ├── unit/                     # Testes unitários
│   ├── integration/              # Testes de integração
│   └── setup.ts                  # Test setup
│
├── examples/                     # Exemplos de uso
│   ├── basic-usage-esm.js
│   └── basic-usage-cjs.cjs
│
├── docs/                         # Documentação
├── .github/workflows/            # CI/CD pipelines
│
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── CONTRIBUTING.md               # Guidelines para extensões
└── README.md

NOTA: Adaptadores MCP e n8n foram movidos para repositórios separados:
  - @nfe-io/mcp-server (https://github.com/nfe/mcp-server)
  - @nfe-io/n8n-nodes (https://github.com/nfe/n8n-nodes)
```

---

## 🔄 Fluxo de Trabalho Obrigatório

### 1️⃣ Inicialização (Faça UMA VEZ)
```bash
# Criar estrutura base
mkdir -p nfe-io-sdk-v3/{openapi/spec,src/{generated,client,runtime,errors,utils},scripts,tests,examples}
cd nfe-io-sdk-v3

# Inicializar projeto
npm init -y

# Instalar dependências essenciais
npm install --save-dev \
  typescript@^5.3.0 \
  tsup@^8.0.0 \
  tsx@^4.7.0 \
  vitest@^1.0.0 \
  @vitest/coverage-v8 \
  eslint@^8.56.0 \
  prettier@^3.2.0 \
  openapi-typescript@^6.7.0

npm install zod@^3.22.0

# Criar configurações base
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
EOF

cat > package.json << 'EOF'
{
  "name": "@nfe-io/sdk",
  "version": "3.0.0-beta.1",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "download-spec": "tsx scripts/download-openapi.ts",
    "validate-spec": "tsx scripts/validate-spec.ts",
    "generate": "tsx scripts/generate-sdk.ts",
    "build": "npm run generate && tsup",
    "test": "vitest",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  }
}
EOF
```

### 2️⃣ A Cada Nova Feature (Ciclo Repetível)
```bash
# 1. Atualizar OpenAPI spec
npm run download-spec
npm run validate-spec

# 2. Gerar código
npm run generate

# 3. Implementar código handwritten
# Edite arquivos em src/client/, src/runtime/, etc.

# 4. Escrever testes
# Crie testes em tests/unit/ ou tests/integration/

# 5. Validar qualidade
npm run typecheck  # DEVE passar
npm run lint       # DEVE passar
npm test           # DEVE passar
npm run build      # DEVE gerar dist/

# 6. Commit
git add .
git commit -m "feat: implementa X"
```

### 3️⃣ Antes de Cada Commit
```bash
# Checklist obrigatório
✅ npm run typecheck  # Zero erros
✅ npm run lint       # Zero warnings
✅ npm test           # 100% passing
✅ npm run build      # Build sucesso
✅ git diff           # Revisar mudanças
✅ CHANGELOG.md       # Atualizado se necessário
```

---

## 🎯 Prioridades de Implementação

### 🔴 CRÍTICO - Implementar PRIMEIRO (Dias 1-5)

#### Sprint 1: Fundação
**Objetivo**: Projeto TypeScript funcional + geração de código básica

**Tarefas**:
1. ✅ Inicializar projeto TypeScript moderno
   - Setup package.json, tsconfig.json, tsup.config.ts
   - Configurar ESLint + Prettier
   - Estrutura de diretórios

2. ✅ Obter OpenAPI Spec
   - **IMPORTANTE**: A API NFE.io pode não ter spec público
   - **FALLBACK**: Criar manualmente baseado no código v2 e documentação
   - Script: `scripts/download-openapi.ts`
   - Validação: `scripts/validate-spec.ts`

3. ✅ Geração inicial de código
   - Usar `openapi-typescript` para gerar types
   - Script: `scripts/generate-sdk.ts`
   - Verificar tipos gerados compilam

**Validação**:
```bash
npm run download-spec  # Spec baixado ou criado manualmente
npm run validate-spec  # Spec válido
npm run generate       # Código gerado
npm run typecheck      # Zero erros
```

---

#### Sprint 2: Runtime Layer
**Objetivo**: HTTP client funcional com retry e rate limiting

**Tarefas**:
1. ✅ HTTP Client (`src/runtime/http-client.ts`)
   - Fetch API nativo (Node 18+)
   - Autenticação via Basic Auth
   - Timeout configurável
   - Tratamento de 202, 204, 4xx, 5xx

2. ✅ Retry Logic (`src/runtime/retry.ts`)
   - Exponential backoff
   - Configurável (maxRetries, baseDelay)
   - Retry apenas em erros retryable

3. ✅ Sistema de Erros (`src/errors/`)
   - Hierarquia: NfeError → ValidationError, AuthenticationError, etc.
   - Factory de erros por status HTTP
   - Tipos exportáveis

4. ✅ Rate Limiter (`src/runtime/rate-limiter.ts`)
   - Controle de concorrência
   - Intervalo mínimo entre requests
   - Queue de requests

**Validação**:
```bash
npm test tests/unit/runtime/  # Todos passando
npm run typecheck              # Zero erros
```

---

### 🟡 IMPORTANTE - Implementar SEGUNDO (Dias 6-12)

#### Sprint 3: Core Resources Implementation
**Objetivo**: Recursos principais do SDK completos e funcionais

**Tarefas em ordem**:
1. ✅ NfeClient principal (`src/core/client.ts`)
   - Constructor com opções (apiKey, environment, timeout, etc.)
   - Instancia todos os resources
   - Configuração de baseUrl por environment

2. ✅ ServiceInvoices (`src/core/resources/service-invoices.ts`)
   - **PRIORIDADE MÁXIMA** - Recurso mais usado
   - create() com suporte a 202 + polling
   - list() com paginação manual
   - retrieve(), cancel(), sendEmail()
   - downloadPDF(), downloadXML()
   - createAndWait() para polling automático

3. ✅ Companies (`src/core/resources/companies.ts`)
   - CRUD completo
   - uploadCertificate() com FormData

4. ⏳ LegalPeople (`src/core/resources/legal-people.ts`)
   - CRUD scoped por company_id
   - Seguir padrão do ServiceInvoices

5. ⏳ NaturalPeople (`src/core/resources/natural-people.ts`)
   - CRUD scoped por company_id
   - Seguir padrão do ServiceInvoices

6. ⏳ Webhooks (`src/core/resources/webhooks.ts`)
   - CRUD básico
   - validate() signature para segurança

**Validação**:
```bash
npm test tests/integration/  # Todos passando
npm run build                 # Exports corretos
```

**Exemplo de uso esperado**:
```typescript
const nfe = new NfeClient({ apiKey: 'xxx' });
const result = await nfe.serviceInvoices.create('company-id', data);
if (result.status === 'pending') {
  const invoice = await result.waitForCompletion();
}
```

---

### 🟢 IMPORTANTE - Implementar TERCEIRO (Dias 13-18)

#### Sprint 4: Extensibility & Testing

**Tarefas**:
1. ⏳ Preparar SDK para extensibilidade
   - Exports públicos bem definidos
   - JSDoc completo em todas as APIs públicas
   - CONTRIBUTING.md com guidelines para extensões
   - Documentar como outros packages podem usar o SDK

2. ⏳ Testes unitários completos
   - Cobertura > 80%
   - Todos os resources
   - Error handling
   - Retry logic
   - Mocks com Vitest

3. ⏳ Testes de integração com MSW
   - Simular API completa
   - Casos de erro e edge cases
   - Async invoice processing

4. ⏳ Documentação completa
   - README.md atualizado com exemplos v3
   - Migration guide v2 → v3
   - API reference completa
   - Seção sobre extensões oficiais (MCP, n8n)
   - Examples/ com código funcional

---

### 🔵 POLIMENTO - Implementar POR ÚLTIMO (Dias 19-22)

#### Sprint 5: CI/CD & Release

**Tarefas**:
1. ⏳ CI/CD Pipeline
   - GitHub Actions para testes automáticos
   - TypeScript compilation check
   - Linting e formatting
   - Coverage report

2. ⏳ NPM Publish Setup
   - Automated versioning
   - Release notes automáticas
   - Badges (build, coverage, version)

3. ⏳ Final polish
   - CHANGELOG.md completo
   - Preparar v3.0.0 stable release
   - Double-check backward compatibility warnings

**Validação**:
```bash
npm test -- --coverage  # Coverage > 80%
npm run docs            # Docs geradas
```

---

## 🔧 Configurações Essenciais

### package.json Obrigatório
```json
{
  "name": "@nfe-io/sdk",
  "version": "3.0.0-beta.1",
  "description": "Official NFe.io SDK for Node.js 18+",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    }
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "download-spec": "tsx scripts/download-openapi.ts",
    "validate-spec": "tsx scripts/validate-spec.ts",
    "generate": "tsx scripts/generate-sdk.ts",
    "build": "npm run generate && tsup",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write 'src/**/*.ts'",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm test"
  },
  "keywords": ["nfe", "nfse", "nota-fiscal", "invoice", "brazil"],
  "author": "NFE.io",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/nfe/client-nodejs.git"
  }
}
```

### tsconfig.json Obrigatório
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

### tsup.config.ts
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true,
  external: [], // Zero dependencies
});
```

---

## 🚨 Problemas Conhecidos e Soluções

### ⚠️ OpenAPI Spec Não Disponível Publicamente
**Problema**: NFE.io pode não ter spec OpenAPI público

**Solução**:
1. **Tentar**: `curl https://api.nfe.io/openapi.json`
2. **Se falhar**: Criar spec manualmente baseado em:
   - Código atual v2 (resources/*.js)
   - [Documentação oficial](https://nfe.io/docs/)
   - Análise dos samples/

**Estrutura mínima do spec**:
```yaml
openapi: 3.0.0
info:
  title: NFE.io API
  version: 1.0.0
servers:
  - url: https://api.nfe.io/v1
paths:
  /companies/{company_id}/serviceinvoices:
    post:
      operationId: createServiceInvoice
      # ... parameters, requestBody, responses
```

### ⚠️ FormData para Upload de Certificado
**Problema**: Node 18 não tem FormData nativo compatível

**Solução**:
```bash
npm install form-data@^4.0.0
```

```typescript
import FormData from 'form-data';

// Em Companies.uploadCertificate()
const form = new FormData();
form.append('file', fileBuffer, 'certificate.pfx');
form.append('password', password);
```

### ⚠️ Fetch API e Streams
**Problema**: Download de PDF/XML requer streaming

**Solução**:
```typescript
async downloadPDF(companyId: string, invoiceId: string): Promise<Buffer> {
  const response = await this.http.request<Response>(
    `/companies/${companyId}/serviceinvoices/${invoiceId}/pdf`,
    { headers: { Accept: 'application/pdf' } }
  );
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

---

## 🎯 Critérios de Sucesso por Sprint

### Sprint 1: Fundação
- [ ] `npm run typecheck` passa
- [ ] `npm run build` gera dist/
- [ ] OpenAPI spec existe (baixado ou manual)
- [ ] Código gerado compila

### Sprint 2: Runtime
- [ ] HttpClient faz requests reais
- [ ] Retry funciona com exponential backoff
- [ ] Erros tipados funcionam
- [ ] Testes unitários passam

### Sprint 3: DX Layer
- [ ] `const nfe = new NfeClient({ apiKey })` funciona
- [ ] `await nfe.serviceInvoices.create()` funciona
- [ ] Async iteration funciona
- [ ] Polling automático funciona

### Sprint 4: Polish
- [ ] Coverage > 80%
- [ ] README completo
- [ ] CI pipeline verde
- [ ] Examples funcionam

---

## 📝 Template de Commit

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: Nova feature
- `fix`: Bug fix
- `docs`: Documentação
- `test`: Testes
- `refactor`: Refatoração
- `chore`: Manutenção

**Exemplos**:
```bash
git commit -m "feat(client): adiciona NfeClient com configuração de environment"
git commit -m "fix(retry): corrige exponential backoff com jitter"
git commit -m "docs(readme): adiciona exemplos de uso básico"
git commit -m "test(invoices): adiciona testes de integração para create"
```

---

## 🤖 Instruções Finais para Execução Autônoma

### Quando Executar Automaticamente
✅ Setup inicial do projeto
✅ Geração de código do OpenAPI
✅ Implementação de resources seguindo padrões
✅ Escrita de testes unitários
✅ Configuração de CI/CD
✅ Geração de documentação

### Quando Pedir Intervenção Humana
❌ OpenAPI spec não encontrado (precisa ser criado manualmente)
❌ Decisões de breaking changes na API pública
❌ Credenciais para testes E2E ou publicação NPM
❌ Validação final antes do release

### Validação Contínua
Após CADA arquivo criado/modificado:
```bash
npm run typecheck && npm run lint && npm test
```

Se qualquer comando falhar, **PARE** e corrija antes de continuar.

---

## � Extensões Oficiais em Repositórios Separados

O SDK NFE.io v3 foi projetado para ser extensível. As seguintes extensões oficiais estão em repositórios separados:

### [@nfe-io/mcp-server](https://github.com/nfe/mcp-server)
**Model Context Protocol Server para integração com LLMs**

- Permite que LLMs (Claude, GPT, etc.) emitam notas fiscais via conversação natural
- Implementa MCP tools usando `@nfe-io/sdk` internamente
- Instale: `npm install @nfe-io/mcp-server`
- Depende de: `@nfe-io/sdk` (peer dependency)

### [@nfe-io/n8n-nodes](https://github.com/nfe/n8n-nodes)
**Custom nodes n8n para automação de workflows**

- Permite automação de emissão de notas fiscais em workflows n8n
- Nodes para ServiceInvoices, Companies, Webhooks
- Instale via n8n community nodes ou `npm install @nfe-io/n8n-nodes`
- Depende de: `@nfe-io/sdk` (dependency)

### Criando Sua Própria Extensão

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para guidelines sobre como criar extensões usando o SDK.

---

## �📚 Referências Essenciais

- **Documentação API**: https://nfe.io/docs/
- **Código v2**: Arquivos atuais deste projeto
- **OpenAPI Spec**: https://swagger.io/specification/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Vitest**: https://vitest.dev/
- **MSW**: https://mswjs.io/

---

**Boa implementação! 🚀**