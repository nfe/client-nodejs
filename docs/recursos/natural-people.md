---
title: Pessoas físicas (tomadores PF)
sidebar_label: Pessoas físicas
sidebar_position: 15
slug: pessoas-fisicas
description: CRUD de pessoas físicas (tomadores) por empresa com nfe.naturalPeople, incluindo criação em lote e busca por CPF.
---

# Pessoas físicas (tomadores PF)

`nfe.naturalPeople` (host `api.nfe.io`) gerencia pessoas físicas vinculadas a
uma empresa (tomadores/clientes PF).

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `list(companyId)` | Lista as PF. | `ListResponse<NaturalPerson>` |
| `create(companyId, data)` | Cria uma PF. | `NaturalPerson` |
| `retrieve(companyId, personId)` / `update(...)` / `delete(...)` | CRUD. | `NaturalPerson` / `void` |
| `createBatch(companyId, data)` | Criação em lote. | resultado do lote |
| `findByTaxNumber(companyId, cpf)` | Busca por CPF. | `NaturalPerson` |

## Exemplo

```typescript
const person = await nfe.naturalPeople.create(companyId, {
  federalTaxNumber: 52998224725,
  name: 'Cliente PF',
  email: 'cliente-pf@exemplo.com',
});
```

## Próximos passos

- [Pessoas jurídicas](./legal-people.md)
- [Empresas](./companies.md)
