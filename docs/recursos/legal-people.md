---
title: Pessoas jurídicas (tomadores PJ)
sidebar_label: Pessoas jurídicas
sidebar_position: 14
slug: pessoas-juridicas
description: CRUD de pessoas jurídicas (tomadores) por empresa com nfe.legalPeople, incluindo criação em lote e busca por CNPJ.
---

# Pessoas jurídicas (tomadores PJ)

`nfe.legalPeople` (host `api.nfe.io`) gerencia pessoas jurídicas vinculadas a
uma empresa (tomadores/clientes PJ).

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `list(companyId)` | Lista as PJ. | `ListResponse<LegalPerson>` |
| `create(companyId, data)` | Cria uma PJ. | `LegalPerson` |
| `retrieve(companyId, personId)` / `update(...)` / `delete(...)` | CRUD. | `LegalPerson` / `void` |
| `createBatch(companyId, data)` | Criação em lote. | resultado do lote |
| `findByTaxNumber(companyId, cnpj)` | Busca por CNPJ. | `LegalPerson` |

## Exemplo

```typescript
const person = await nfe.legalPeople.create(companyId, {
  federalTaxNumber: 11444555000149,
  name: 'Cliente PJ LTDA',
  email: 'cliente-pj@exemplo.com',
});
```

## Próximos passos

- [Pessoas físicas](./natural-people.md)
- [Empresas](./companies.md)
