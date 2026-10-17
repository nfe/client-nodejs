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
A **principal** é a que vale em `api.nfe.io` e `api.nfse.io`, e é a que o SDK envia
aos recursos desses hosts. A **de dados** vale nos hosts de consulta
(`nfe.api.nfe.io`, `legalentity`, `naturalperson`, `address`).

Medido em 2026-10-14, rota por rota: a chave de dados é recusada (`403`) nas rotas
de documento fiscal (NF-e, NFC-e, NFS-e, documentos de entrada e `tax-codes`), e a
principal é recusada (`403`) nos hosts de consulta. Algumas rotas de cadastro da
conta também aceitam a chave de dados, mas isso não é contrato documentado, e o SDK
não depende disso.

O SDK aplica um fallback de `dataApiKey` para `apiKey` quando a de dados não é
informada. Isso é uma conveniência para quem tem uma chave só com os dois escopos
— **não** significa que uma substitua a outra. Se você configurar apenas
`dataApiKey`, os recursos de `api.nfe.io` e `api.nfse.io` lançam
`ConfigurationError` na hora, em vez de arriscar um `403` na chamada.
:::

:::warning Correções de registro
- **2026-09-02.** Até essa data, a tabela acima dizia que `productInvoices`,
  `productInvoicesRtc`, `stateTaxes`, `municipalTaxes`, `certificates`,
  `transportationInvoices` e `inboundProductInvoices` usavam a chave **de dados** em
  `api.nfse.io`. Estava errado: as rotas de documento fiscal desse host respondem
  `403` à chave de dados, e o SDK passou a enviar a principal. Se você replicou o
  mapa antigo na sua aplicação, ajuste.
- **2026-10-14.** O texto anterior desta nota dizia que cada chave era recusada em todo o
  host da outra. Isso generalizava para o host inteiro uma medição feita só em rotas de
  documento fiscal. A regra é por rota, como descrito acima.

Histórico em
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
