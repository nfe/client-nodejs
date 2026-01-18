# Generate SDK from OpenAPI - Proposta OpenSpec

Esta proposta implementa geração automática de código TypeScript a partir das especificações OpenAPI existentes no projeto.

## 📋 Estrutura da Proposta

```
openspec/changes/generate-sdk-from-openapi/
├── proposal.md           # Visão geral e objetivos
├── tasks.md             # Tarefas detalhadas (5 dias)
├── design.md            # Arquitetura e decisões técnicas
└── specs/               # Especificações por capacidade
    ├── code-generation/
    │   └── spec.md      # Geração de tipos TypeScript
    ├── spec-validation/
    │   └── spec.md      # Validação de specs OpenAPI
    └── build-integration/
        └── spec.md      # Integração no pipeline de build
```

## 🎯 Objetivo

Automatizar a geração de tipos TypeScript a partir dos 12 arquivos OpenAPI existentes:
- `nf-servico-v1.yaml` (Nota Fiscal de Serviço)
- `nf-produto-v2.yaml` (Nota Fiscal de Produto)
- `nf-consumidor-v2.yaml` (Nota Fiscal do Consumidor)
- E mais 9 especificações

## 🚀 Comandos Propostos

### Geração Manual (Desenvolvedor)
```bash
# Validar specs OpenAPI
npm run validate:spec

# Gerar tipos TypeScript
npm run generate

# Modo watch (regenera ao modificar specs)
npm run generate:watch

# Verificar tipos compilam
npm run typecheck
```

### Geração Automática (CI/CD)
```bash
# Build completo (inclui validação + geração)
npm run build

# No CI/CD, o pipeline rodará:
npm run validate:spec  # Falha se specs inválidos
npm run generate       # Gera tipos
npm run typecheck      # Valida compilação
npm run test           # Testa integração
```

## 📦 Estrutura de Código Proposta

```
src/
├── generated/           # ⚠️ AUTO-GERADO - NÃO EDITAR
│   ├── index.ts        # Re-exports unificados
│   ├── schema.ts       # Tipos mesclados (compatibilidade)
│   ├── nf-servico.ts   # Tipos de nota fiscal de serviço
│   ├── nf-produto.ts   # Tipos de nota fiscal de produto
│   └── ...             # Outros specs
│
└── core/resources/     # ✏️ HANDWRITTEN - Usa tipos gerados
    ├── service-invoices.ts  # Importa de generated/nf-servico
    ├── companies.ts         # Importa de generated/companies
    └── ...

scripts/
├── generate-types.ts   # Orquestrador de geração
├── validate-spec.ts    # Validador de specs OpenAPI
└── download-openapi.ts # Download de specs (se disponível)
```

## 🔄 Fluxo de Trabalho

### 1. Desenvolvedor modifica spec OpenAPI
```bash
# Editar spec
vim openapi/spec/nf-servico-v1.yaml

# Regenerar tipos
npm run generate

# Tipos atualizados em src/generated/nf-servico.ts
```

### 2. Atualizar resource handwritten
```typescript
// src/core/resources/service-invoices.ts
import { NfServico } from '@/generated';

type ServiceInvoice = NfServico.components['schemas']['ServiceInvoice'];

export class ServiceInvoicesResource {
  async create(data: ServiceInvoice): Promise<ServiceInvoice> {
    // Tipos sincronizados com OpenAPI!
  }
}
```

### 3. CI/CD valida e gera automaticamente
```yaml
# .github/workflows/ci.yml
- name: Validate OpenAPI Specs
  run: npm run validate:spec
  
- name: Generate Types
  run: npm run generate
  
- name: Type Check
  run: npm run typecheck
```

## ✨ Benefícios

### 1. Single Source of Truth
- OpenAPI specs são a fonte de verdade
- Tipos TypeScript sempre sincronizados com API
- Elimina divergências entre documentação e código

### 2. Redução de Manutenção
- Não precisa atualizar tipos manualmente
- Mudanças na API refletem automaticamente
- Menos código handwritten para manter

### 3. Cobertura Completa
- 12 specs OpenAPI disponíveis
- Atualmente só 5 resources implementados manualmente
- Geração automática cobre todos os endpoints

### 4. Validação Contínua
- CI/CD falha se specs inválidos
- Tipos devem compilar antes de merge
- Testes garantem tipos correspondem ao runtime

## 🔧 Implementação

### Fase 1: Fundação (Dias 1-2)
- Criar scripts de geração e validação
- Gerar tipos do spec principal (`nf-servico-v1.yaml`)
- Migrar ServiceInvoices resource para tipos gerados

### Fase 2: Cobertura Completa (Dia 3)
- Gerar tipos de todos os 12 specs
- Criar índice unificado
- Estratégia para conflitos de tipos

### Fase 3: Automação (Dia 4)
- Integração CI/CD
- Modo watch para desenvolvimento
- Cache para otimizar builds

### Fase 4: Documentação (Dia 5)
- README atualizado
- Guia de migração
- Exemplos de uso

## 📝 Validação

A proposta foi validada com OpenSpec:

```bash
$ openspec validate generate-sdk-from-openapi --strict
✓ Change 'generate-sdk-from-openapi' is valid
```

## 📚 Documentos Relacionados

- [proposal.md](./proposal.md) - Proposta completa
- [tasks.md](./tasks.md) - Lista de tarefas detalhadas
- [design.md](./design.md) - Decisões arquiteturais
- [specs/](./specs/) - Especificações técnicas por capacidade

## 🚦 Próximos Passos

1. **Revisar proposta** - Stakeholders aprovam abordagem?
2. **Esclarecer questões abertas** - Ver seção "Open Questions" em proposal.md
3. **Iniciar implementação** - Seguir tasks.md fase por fase
4. **Feedback contínuo** - Ajustar conforme necessário

## 🤝 Como Contribuir

Esta é uma proposta em fase de design. Para aplicá-la:

```bash
# Quando aprovada, aplicar com OpenSpec:
openspec apply generate-sdk-from-openapi

# Ou implementar manualmente seguindo tasks.md
```

---

**Status**: ✅ Proposta validada e pronta para revisão  
**Próximo**: Aguardando aprovação para iniciar implementação
