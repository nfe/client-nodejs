## Why

O SDK NFE.io v3 atualmente não oferece suporte à API de Consulta de Endereços, que permite buscar informações de endereço por CEP ou termo de pesquisa. Esta API é essencial para aplicações que precisam validar ou autocompletar endereços brasileiros usando dados oficiais dos Correios (DNE) integrados com códigos IBGE.

## What Changes

- Adicionar novo resource `Addresses` ao SDK com suporte a:
  - Consulta de endereço por CEP (código postal)
  - Pesquisa de endereço por filtro de campos
  - Pesquisa de endereço por termo genérico
- Gerar tipos TypeScript a partir do OpenAPI spec `consulta-endereco.yaml`
- **Suporte a múltiplas API keys e hosts**: A API de endereços usa um host diferente (`address.api.nfe.io`) e pode requerer uma chave de API distinta da chave principal. O SDK deve permitir:
  - Configuração de chave específica para a API de endereços (`addressApiKey`)
  - Fallback automático para a chave principal se não especificada
  - Leitura de `NFE_ADDRESS_API_KEY` do ambiente como alternativa
- Criar testes unitários e de integração para o novo resource
- Adicionar exemplos de uso na documentação

## Capabilities

### New Capabilities

- `address-lookup`: Capacidade de consultar e pesquisar endereços brasileiros através da API NFE.io. Inclui lookup por CEP, pesquisa por campos filtrados e pesquisa por termo genérico.
- `multi-api-support`: Infraestrutura para suportar múltiplas APIs NFE.io com hosts e chaves distintas. Permite que resources específicos usem configurações diferentes do client principal.

### Modified Capabilities

(Nenhuma - esta é uma adição sem modificações em capabilities existentes)

## Impact

- **Código**: 
  - Novo arquivo `src/core/resources/addresses.ts`
  - Novos tipos em `src/generated/consulta-endereco.ts`
  - Atualização de `src/core/client.ts` para expor o novo resource
  - Atualização de `src/core/types.ts` para incluir `addressApiKey` em `NfeConfig`
  - Atualização de `src/index.ts` para exportar tipos do Addresses
- **HTTP Client**: 
  - O resource `Addresses` terá seu próprio `HttpClient` configurado com:
    - Base URL: `https://address.api.nfe.io/v2`
    - API Key: `addressApiKey` (ou fallback para `apiKey`)
  - Reutiliza mesma lógica de retry, timeout e error handling
- **Testes**: 
  - `tests/unit/resources/addresses.test.ts`
  - `tests/integration/addresses.integration.test.ts`
- **Documentação**: 
  - Atualizar `README.md` com exemplos do Addresses
  - Novo exemplo em `examples/address-lookup.js`
  - Documentar configuração de múltiplas chaves

## Design Decision: Múltiplas Chaves de API

### Opção Escolhida: Chaves por Serviço com Validação Lazy

**Princípio**: Todas as chaves são opcionais no construtor. Validação acontece apenas quando o resource é usado.

```typescript
// Cenário 1: Só endereços
const nfe = new NfeClient({ addressApiKey: 'addr-key' });
await nfe.addresses.lookupByPostalCode('01310-100'); // ✅ Funciona
await nfe.companies.list(); // ❌ ConfigurationError: "API key required for Companies resource"

// Cenário 2: Só invoices/companies  
const nfe = new NfeClient({ apiKey: 'main-key' });
await nfe.companies.list(); // ✅ Funciona
await nfe.addresses.lookupByPostalCode('01310-100'); // ✅ Fallback para apiKey

// Cenário 3: Chaves separadas
const nfe = new NfeClient({
  apiKey: 'main-key',
  addressApiKey: 'addr-key'
});
// ✅ Cada resource usa sua chave específica

// Cenário 4: Mesma chave para tudo
const nfe = new NfeClient({ apiKey: 'universal-key' });
// ✅ Todos os resources usam a mesma chave
```

### Regras de Resolução de Chave

| Resource | Ordem de Resolução |
|----------|-------------------|
| Addresses | `addressApiKey` → `apiKey` → `env.NFE_ADDRESS_API_KEY` → `env.NFE_API_KEY` |
| Companies, ServiceInvoices, etc | `apiKey` → `env.NFE_API_KEY` |

### Mudança no Construtor

O construtor `NfeClient` **não lança erro** se nenhuma chave for fornecida. O erro ocorre apenas quando:
1. Um resource é chamado
2. A chave necessária para aquele resource não está disponível

```typescript
// Isso NÃO lança erro
const nfe = new NfeClient({ environment: 'production' });

// Isso lança ConfigurationError
await nfe.companies.list(); 
// Error: "API key required for Companies. Set 'apiKey' in config or NFE_API_KEY environment variable."
```

### Alternativas Consideradas

1. ~~Chave principal obrigatória~~: Impede uso isolado de resources auxiliares
2. ~~Clients separados por API~~: Verboso, experiência ruim
3. ~~Validação no construtor~~: Bloqueia casos de uso válidos
4. **Validação lazy (escolhida)**: Máxima flexibilidade, erros claros no momento certo

### Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `NFE_API_KEY` | Chave principal da API (invoices, companies, people, webhooks) |
| `NFE_ADDRESS_API_KEY` | Chave específica para API de endereços |
