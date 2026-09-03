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
| `api.nfe.io/v1` | **principal** | `serviceInvoices`, `serviceInvoicesRtc`, `companies` (v1), `legalPeople`, `naturalPeople`, `notifications` |
| `api.nfe.io/v2` | **principal** | `webhooks` (nível de **conta**) |
| `api.nfse.io` | **principal** | `certificates`, `companies` (lado v2), `consumerInvoices` (NFC-e), `inboundProductInvoices`, `municipalTaxes`, `productInvoices`, `productInvoicesRtc`, `stateTaxes`, `taxCalculation`, `taxCodes`, `transportationInvoices` |
| `address.api.nfe.io/v2` | **dados** | `addresses` |
| `legalentity.api.nfe.io` | **dados** | `legalEntityLookup` (CNPJ) |
| `naturalperson.api.nfe.io` | **dados** | `naturalPersonLookup` (CPF) |
| `nfe.api.nfe.io` | **dados** | `productInvoiceQuery`, `consumerInvoiceQuery` |

:::danger As duas chaves são complementares, não alternativas
Cada chave responde **`403` no território da outra**. Não existe "a chave que
serve para tudo": os hosts **fiscais** (`api.nfe.io`, `api.nfse.io`) só aceitam a
principal, e os de **consulta** (`nfe.api.nfe.io`, `legalentity`, `naturalperson`,
`address`) só aceitam a de dados.

O SDK aplica um fallback de `dataApiKey` para `apiKey` quando a de dados não é
informada. Isso é uma conveniência para quem tem uma chave só com os dois escopos
— **não** significa que uma substitua a outra. Se você configurar apenas
`dataApiKey`, os recursos fiscais lançam `ConfigurationError` na hora, em vez de
falhar com `403` na chamada.
:::

:::warning Correção em 2026-09-02
Até esta data a tabela acima dizia que `productInvoices`, `productInvoicesRtc`,
`stateTaxes`, `municipalTaxes`, `certificates`, `transportationInvoices` e
`inboundProductInvoices` usavam a chave **de dados** em `api.nfse.io`. Estava
errado: `api.nfse.io` é host fiscal e responde `403` à chave de dados. Era o
mesmo defeito que o SDK carregava no roteamento interno, corrigido antes desta
página. Se você replicou o mapa antigo na sua aplicação, ajuste. Histórico em
[`MIGRATION.md`](https://github.com/nfe/client-nodejs/blob/master/MIGRATION.md).
:::

## Por que isso importa

O SDK já embute o mapeamento acima. Isso evita erros clássicos como montar o
host/caminho errado ou usar a chave sem permissão para um endpoint. Ao abrir um
chamado ou depurar um `403`/`404`, confira se a **chave** informada cobre o
escopo do recurso na tabela.

## Próximos passos

- [Configuração](./configuration.md)
- [Erros](./errors.md)
