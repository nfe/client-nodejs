---
title: Consulta de endereço (CEP)
sidebar_label: Endereços (CEP)
sidebar_position: 11
slug: consulta-cep
description: Consulte endereços por CEP com nfe.addresses (host address.api.nfe.io). Suporta apenas lookup por CEP; retorna um Address único.
---

# Consulta de endereço (CEP)

`nfe.addresses` (host `address.api.nfe.io/v2`, chave de dados) consulta
endereços brasileiros por CEP. A API real suporta **somente lookup por CEP**.

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `lookupByPostalCode(postalCode)` | Consulta o endereço do CEP. | `Address` |

## Exemplo

```typescript
const address = await nfe.addresses.lookupByPostalCode('01310-100');
console.log(address.street);     // 'Paulista'
console.log(address.city.name);  // 'São Paulo'
console.log(address.postalCode); // '01310-100' (com hífen)
```

O CEP é validado (8 dígitos, com ou sem hífen) **antes** da chamada.

:::warning Removido na v5
`addresses.search()` e `addresses.lookupByTerm()` foram removidos — os endpoints
retornavam `404` no host real. Use `lookupByPostalCode`.
:::

## Próximos passos

- [Consulta CNPJ](./legal-entity-lookup.md) · [Consulta CPF](./natural-person-lookup.md)
- [Roteamento multi-host / multi-chave](../multi-host-routing.md)
