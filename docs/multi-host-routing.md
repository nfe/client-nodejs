---
title: Roteamento multi-host e multi-chave no SDK Node.js da NFE.io
sidebar_label: Multi-host / multi-chave
sidebar_position: 4
slug: multi-host-e-multi-chave
description: A NFE.io é composta por várias APIs em hosts distintos e duas chaves (principal e de dados). Entenda qual recurso usa qual host e chave.
---

# Roteamento multi-host / multi-chave

A plataforma NFE.io não é uma única API: são **vários serviços em hosts
distintos**, e há **duas chaves** — a principal (`apiKey`) e a de dados
(`dataApiKey`). O SDK roteia cada recurso para o host/chave corretos; você só
precisa fornecer as chaves na configuração.

## Hosts e chaves por recurso

| Host | Chave | Recursos |
|---|---|---|
| `api.nfe.io/v1` | principal | `serviceInvoices`, `serviceInvoicesRtc`, `companies`, `legalPeople`, `naturalPeople`, `notifications` |
| `api.nfe.io/v2` | principal | `webhooks` (nível de **conta**) |
| `api.nfse.io` | principal | `consumerInvoices` (NFC-e), `taxCodes` |
| `api.nfse.io` | dados | `productInvoices`, `productInvoicesRtc`, `stateTaxes`, `municipalTaxes`, `certificates`, `transportationInvoices`, `inboundProductInvoices` |
| `address.api.nfe.io/v2` | dados | `addresses` |
| `legalentity.api.nfe.io` | dados | `legalEntityLookup` (CNPJ) |
| `naturalperson.api.nfe.io` | dados | `naturalPersonLookup` (CPF) |
| `nfe.api.nfe.io` | dados | `productInvoiceQuery`, `consumerInvoiceQuery` |

:::info Fallback de chave
`dataApiKey` faz fallback para `apiKey` quando não informada. Se você usa **uma
só chave** com todos os escopos, basta configurar `apiKey`.
:::

:::warning Contas com chaves separadas
Se sua conta usa chaves **distintas** para dados e emissão, garanta que a chave
principal tenha acesso aos produtos de emissão/consulta que você vai usar
(NFС-e, tax-codes e emissão usam a chave principal). Uma chave sem escopo
retorna `403`.
:::

## Por que isso importa

O SDK já embute o mapeamento acima. Isso evita erros clássicos como montar o
host/caminho errado ou usar a chave sem permissão para um endpoint. Ao abrir um
chamado ou depurar um `403`/`404`, confira se a **chave** informada cobre o
escopo do recurso na tabela.

## Próximos passos

- [Configuração](./configuration.md)
- [Erros](./errors.md)
