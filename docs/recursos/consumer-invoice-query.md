---
title: Consulta de cupom (CFe-SAT)
sidebar_label: Consulta CFe-SAT
sidebar_position: 21
slug: consulta-cfe-sat
description: nfe.consumerInvoiceQuery consulta cupons CFe-SAT por chave de acesso — métodos descontinuados, porque a plataforma não serve as rotas.
---

# Consulta de cupom (CFe-SAT)

`nfe.consumerInvoiceQuery` (host `nfe.api.nfe.io`, chave de dados) consultaria
cupons fiscais CFe-SAT por **chave de acesso**. É distinto de
[`consumerInvoices`](./consumer-invoices.md), a emissão de NFC-e.

:::warning[Métodos descontinuados: a plataforma não serve estas rotas]
As rotas `/v1/consumerinvoices/coupon/{chave}` e `.xml` estão declaradas na OpenAPI,
mas respondem `404` igual ao de um caminho inexistente, inclusive sem credencial
(medido em 2026-09-02). Noventa dias de log de gateway não têm um único `200` nelas.

Os dois métodos estão marcados `@deprecated`. Eles continuam emitindo a requisição, e
o `404` vem com essa explicação. Não há substituto na API hoje.
:::

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `retrieve(accessKey)` | **Descontinuado**: consultaria o cupom por chave; a rota responde `404`. | — |
| `downloadXml(accessKey)` | **Descontinuado**: baixaria o XML do cupom; a rota responde `404`. | — |

## Próximos passos

- [Consulta de NF-e](./product-invoice-query.md)
- [NFC-e (emissão)](./consumer-invoices.md)
