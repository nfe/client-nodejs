## Context

O SDK NFE.io v3 atualmente suporta 5 resources (ServiceInvoices, Companies, LegalPeople, NaturalPeople, Webhooks) todos conectados ao mesmo host (`api.nfe.io/v1`) usando uma única API key.

A API de Consulta de Endereços opera em um host diferente (`address.api.nfe.io/v2`) e pode requerer uma chave de API distinta. Isso cria a necessidade de:

1. Suportar múltiplos hosts dentro do mesmo client
2. Permitir chaves de API por serviço
3. Manter compatibilidade com o padrão existente de inicialização

**Stakeholders**: Desenvolvedores que integram com NFE.io para validação/autocompletar de endereços brasileiros.

**Constraints**:
- Zero runtime dependencies (usar fetch nativo)
- Node.js 18+ (já é requisito do SDK)
- TypeScript strict mode
- Manter padrões existentes de recursos (HttpClient, error handling, retry)

## Goals / Non-Goals

**Goals:**

1. Implementar resource `Addresses` com 3 métodos de consulta (CEP, filtro, termo)
2. Suportar chave de API separada (`addressApiKey`) com fallback para `apiKey`
3. Permitir instanciação do client apenas com `addressApiKey` (sem `apiKey`)
4. Validação lazy de chaves (erro apenas quando resource é usado)
5. Manter 100% compatibilidade com código existente
6. Gerar tipos TypeScript a partir do OpenAPI spec

**Non-Goals:**

- Cache de resultados (implementação futura)
- Rate limiting específico para API de endereços (usa o padrão do SDK)
- Suporte a outros serviços NFE.io com hosts separados nesta iteração
- Migração de recursos existentes para o novo padrão de chaves

## Decisions

### 1. Arquitetura de HttpClient por Resource

**Decisão**: O resource `Addresses` terá seu próprio `HttpClient` instanciado com configuração específica.

**Alternativas consideradas**:
- ~~HttpClient único com troca dinâmica de host~~: Complexo, propenso a erros de estado
- ~~Factory de HttpClients no NfeClient~~: Over-engineering para um caso
- **HttpClient por resource (escolhido)**: Simples, isolado, fácil de testar

**Implementação**:
```typescript
// Em NfeClient constructor
const addressHttpConfig = buildHttpConfig(
  this.resolveAddressApiKey(),
  'https://address.api.nfe.io/v2',
  this.config.timeout,
  this.config.retryConfig
);
this.addresses = new AddressesResource(new HttpClient(addressHttpConfig));
```

### 2. Resolução de API Key com Fallback Chain

**Decisão**: Implementar cadeia de fallback para resolver chave da API de endereços.

**Ordem de resolução**:
1. `config.addressApiKey` (explícito no construtor)
2. `config.apiKey` (fallback para chave principal)
3. `env.NFE_ADDRESS_API_KEY` (variável de ambiente específica)
4. `env.NFE_API_KEY` (variável de ambiente principal)

**Implementação**:
```typescript
private resolveAddressApiKey(): string | undefined {
  return (
    this.config.addressApiKey ||
    this.config.apiKey ||
    this.getEnv('NFE_ADDRESS_API_KEY') ||
    this.getEnv('NFE_API_KEY')
  );
}
```

### 3. Validação Lazy de Chaves

**Decisão**: Não validar chaves no construtor. Validar apenas quando um resource é usado.

**Alternativas consideradas**:
- ~~Validar no construtor~~: Impede uso isolado de resources
- ~~Validar no primeiro request~~: Atraso confuso no erro
- **Validar na criação do resource (escolhido)**: Erro claro, permite uso isolado

**Implementação**:
```typescript
// Getter lazy para addresses
private _addresses?: AddressesResource;

get addresses(): AddressesResource {
  if (!this._addresses) {
    const apiKey = this.resolveAddressApiKey();
    if (!apiKey) {
      throw new ConfigurationError(
        'API key required for Addresses. Set "addressApiKey" or "apiKey" in config, ' +
        'or NFE_ADDRESS_API_KEY/NFE_API_KEY environment variable.'
      );
    }
    this._addresses = new AddressesResource(this.createHttpClient(apiKey, ADDRESS_BASE_URL));
  }
  return this._addresses;
}
```

### 4. Estrutura do Resource Addresses

**Decisão**: Seguir padrão existente dos outros resources, com métodos específicos para cada endpoint.

**Métodos**:
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `lookupByPostalCode(cep)` | `GET /v2/addresses/{postalCode}` | Busca por CEP |
| `search(filter)` | `GET /v2/addresses?$filter=...` | Pesquisa por campos |
| `lookupByTerm(term)` | `GET /v2/addresses/{term}` | Pesquisa por termo genérico |

**Tipos de retorno**:
```typescript
interface AddressLookupResponse {
  addresses: Address[];
}

interface Address {
  state: string;
  city: { code: string; name: string };
  district: string;
  additionalInformation: string;
  streetSuffix: string;
  street: string;
  number: string;
  numberMin: string;
  numberMax: string;
  postalCode: string;
  country: string;
}
```

### 5. Backward Compatibility

**Decisão**: Manter `apiKey` funcionando exatamente como antes para recursos existentes.

**Garantias**:
- Código existente sem `addressApiKey` continua funcionando
- `apiKey` ainda funciona como fallback para Addresses
- Construtor sem nenhuma chave é permitido (erro lazy)

## Risks / Trade-offs

### Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Usuário confuso com duas chaves | Média | Baixo | Documentação clara, fallback automático |
| Erro lazy pode ser inesperado | Baixa | Médio | Mensagem de erro detalhada com instruções |
| Múltiplos HttpClients aumentam memória | Baixa | Baixo | HttpClient é leve, criado sob demanda |

### Trade-offs

| Trade-off | Escolha | Justificativa |
|-----------|---------|---------------|
| Simplicidade vs Flexibilidade | Flexibilidade | Suportar múltiplos casos de uso compensa complexidade |
| Validação eager vs lazy | Lazy | Permite uso isolado de resources |
| HttpClient compartilhado vs separado | Separado | Isolamento, sem estado global |

## Open Questions

1. **Rate limiting**: A API de endereços tem limites diferentes da API principal? (Assumindo não por enquanto)
2. **Retry behavior**: Erros 429 devem ter backoff diferente? (Usando padrão do SDK)
3. **Caching**: Implementar cache de CEPs consultados? (Fora do escopo desta iteração)
