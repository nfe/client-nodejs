# Contribuindo para nfe-io SDK

Obrigado por seu interesse em contribuir para o SDK NFE.io! 🎉

## 📋 Tipos de Contribuição

### 1. 🐛 Reportar Bugs
- Use o [issue tracker](https://github.com/nfe/client-nodejs/issues)
- Inclua versão do Node.js, SDK, e passos para reproduzir
- Código mínimo reproduzível é muito apreciado

### 2. 💡 Sugerir Features
- Abra uma issue com tag `enhancement`
- Descreva o caso de uso e benefícios
- Considere se a feature pertence ao SDK core ou a uma extensão

### 3. 🔧 Contribuir com Código
- Fork o repositório
- Crie uma branch: `git checkout -b feature/minha-feature`
- Faça commits semânticos: `feat:`, `fix:`, `docs:`, etc.
- Abra um Pull Request

---

## 🏗️ Setup de Desenvolvimento

```bash
# Clone o repositório
git clone https://github.com/nfe/client-nodejs.git
cd client-nodejs

# Instale dependências
npm install

# Valide specs OpenAPI
npm run validate:spec

# Gere tipos do OpenAPI
npm run generate

# Rode testes
npm test

# Build
npm run build

# Typecheck
npm run typecheck
```

### Workflow de Desenvolvimento com OpenAPI

O SDK gera tipos automaticamente das especificações OpenAPI:

```bash
# 1. Valide specs antes de começar
npm run validate:spec

# 2. Gere tipos (já incluído no build)
npm run generate

# 3. Durante desenvolvimento, use watch mode
npm run generate:watch
```

**Importante**:
- Specs estão em `openapi/spec/*.yaml`
- Tipos gerados ficam em `src/generated/` com banner `// ⚠️ AUTO-GENERATED - DO NOT EDIT`
- **NUNCA** edite arquivos em `src/generated/` manualmente
- O build (`npm run build`) automaticamente valida e gera tipos antes de compilar
- CI/CD valida specs e regenera tipos em cada PR
```

---

## 🧪 Testes

Todos os PRs devem incluir testes:

```bash
# Rodar todos os testes
npm test

# Rodar com coverage
npm test -- --coverage

# Rodar testes específicos
npm test -- src/core/resources/companies.test.ts
```

**Requisito**: Coverage > 80% para novas features.

---

## 📝 Estilo de Código

O projeto usa ESLint + Prettier:

```bash
# Lint
npm run lint

# Format
npm run format
```

**Importante**: Configure seu editor para usar as configs do projeto.

---

## 🔌 Criando Extensões para o SDK

O SDK NFE.io v3 é projetado para ser extensível. Se você quer criar uma extensão (ex: integração com outra plataforma), siga este guia.

### Arquitetura de Extensões

```
Sua Extensão
    ↓ usa
nfe-io (este repositório)
    ↓ chama
NFE.io API
```

### Exemplo: Criar um wrapper customizado

```typescript
// my-nfe-wrapper/src/index.ts
import { NfeClient, type NfeConfig } from 'nfe-io';

export class MyNfeWrapper {
  private client: NfeClient;
  
  constructor(config: NfeConfig) {
    this.client = new NfeClient(config);
  }
  
  // Seu método customizado
  async issueInvoiceSimplified(amount: number, description: string) {
    const companies = await this.client.companies.list();
    const companyId = companies.companies[0].id;
    
    return this.client.serviceInvoices.createAndWait(companyId, {
      cityServiceCode: '12345',
      description,
      servicesAmount: amount,
      borrower: {
        // ... dados do tomador
      }
    });
  }
}
```

### Package.json da Extensão

```json
{
  "name": "my-nfe-wrapper",
  "version": "1.0.0",
  "dependencies": {
    "nfe-io": "^3.0.0"
  }
}
```

### Publicando Extensões

1. **Repositório separado**: Crie um novo repositório para sua extensão
2. **Naming**: Use prefixo como `nfe-*` ou `@yourscope/nfe-*`
3. **Documentação**: README explicando o propósito e uso
4. **Peer dependency**: Use `nfe-io` como peer ou dependency

---

## 🏢 Extensões Oficiais

Extensões mantidas pela equipe NFE.io:

### [@nfe-io/mcp-server](https://github.com/nfe/mcp-server)
**MCP Server para integração com LLMs**

```typescript
// Como a extensão usa o SDK internamente
import { NfeClient } from 'nfe-io';

export class NfeMcpServer {
  private sdk: NfeClient;
  
  constructor(apiKey: string) {
    this.sdk = new NfeClient({ apiKey });
  }
  
  // MCP tool implementation
  async mcpCreateInvoice(params: any) {
    return this.sdk.serviceInvoices.create(
      params.companyId,
      params.data
    );
  }
}
```

### [@nfe-io/n8n-nodes](https://github.com/nfe/n8n-nodes)
**n8n Nodes para automação**

```typescript
// Como o n8n node usa o SDK
import { NfeClient } from 'nfe-io';
import { IExecuteFunctions } from 'n8n-core';

export class NfeIoNode {
  async execute(this: IExecuteFunctions) {
    const apiKey = this.getCredentials('nfeIoApi').apiKey;
    const sdk = new NfeClient({ apiKey });
    
    // Implementação do node usando SDK
    return sdk.serviceInvoices.list(companyId);
  }
}
```

---

## 📖 Guidelines para Extensões

### ✅ Faça:
- Use tipos TypeScript exportados pelo SDK
- Documente casos de uso específicos da sua extensão
- Mantenha a extensão focada (single responsibility)
- Escreva testes para sua extensão
- Siga semver estrito

### ❌ Não Faça:
- Não reimplemente funcionalidades do SDK core
- Não acesse APIs internas (use apenas exports públicos)
- Não copie código do SDK (use como dependency)
- Não quebre compatibilidade sem major version bump

---

## 🔍 APIs Públicas do SDK

Tudo exportado via `src/index.ts` é API pública:

```typescript
// ✅ API Pública - Use livremente
import { 
  NfeClient,
  createNfeClient,
  type ServiceInvoice,
  type Company,
  NfeError,
  AuthenticationError
} from 'nfe-io';

// ❌ API Interna - NÃO use
import { HttpClient } from 'nfe-io/dist/core/http/client';
```

---

## 🤝 Processo de Review

1. **Automated checks**: CI roda testes, lint, typecheck
2. **Code review**: Mantenedor revisa código
3. **Discussion**: Feedback e iterações
4. **Merge**: Após aprovação

**Tempo típico de review**: 2-5 dias úteis.

---

## 📞 Precisa de Ajuda?

- **Dúvidas sobre uso**: [Discussions](https://github.com/nfe/client-nodejs/discussions)
- **Bugs**: [Issues](https://github.com/nfe/client-nodejs/issues)
- **Email**: suporte@nfe.io

---

## 📜 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto (MIT).

---

**Obrigado por contribuir! 🚀**
