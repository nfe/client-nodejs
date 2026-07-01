---
title: Consulta de CPF (pessoa física)
sidebar_label: Consulta CPF
sidebar_position: 13
slug: consulta-cpf
description: Consulte a situação cadastral de um CPF com nfe.naturalPersonLookup (host naturalperson.api.nfe.io). Requer data de nascimento.
---

# Consulta de CPF

`nfe.naturalPersonLookup` (host `naturalperson.api.nfe.io`, chave de dados)
consulta a situação cadastral de uma pessoa física.

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `getStatus(cpf, birthDate)` | Situação cadastral do CPF. | dados de situação |

:::warning Data de nascimento é obrigatória
A API exige a **data de nascimento** junto do CPF. Chamar sem ela retorna
erro de validação.
:::

## Exemplo

```typescript
const status = await nfe.naturalPersonLookup.getStatus('52998224725', '1990-01-31');
```

## Próximos passos

- [Consulta CNPJ](./legal-entity-lookup.md) · [Consulta CEP](./addresses.md)
