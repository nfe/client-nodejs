---
title: Consulta de cupom (CFe-SAT)
sidebar_label: Consulta CFe-SAT
sidebar_position: 21
slug: consulta-cfe-sat
description: Consulte cupons CFe-SAT por chave de acesso e baixe o XML com nfe.consumerInvoiceQuery (host nfe.api.nfe.io).
---

# Consulta de cupom (CFe-SAT)

`nfe.consumerInvoiceQuery` (host `nfe.api.nfe.io`, chave de dados) consulta
cupons fiscais CFe-SAT por **chave de acesso**. É somente leitura — distinto de
[`consumerInvoices`](./consumer-invoices.md) (emissão de NFC-e).

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `retrieve(accessKey)` | Consulta o cupom por chave. | dados do cupom |
| `downloadXml(accessKey)` | XML do cupom. | `Buffer` |

## Exemplo

```typescript
const coupon = await nfe.consumerInvoiceQuery.retrieve(accessKey);
const xml = await nfe.consumerInvoiceQuery.downloadXml(accessKey);
```

## Próximos passos

- [Consulta de NF-e](./product-invoice-query.md)
- [NFC-e (emissão)](./consumer-invoices.md)
