---
title: Consulta de NF-e por chave (SEFAZ)
sidebar_label: Consulta NF-e
sidebar_position: 20
slug: consulta-nfe
description: Consulte NF-e por chave de acesso e baixe PDF/XML com nfe.productInvoiceQuery (host nfe.api.nfe.io).
---

# Consulta de NF-e por chave (SEFAZ)

`nfe.productInvoiceQuery` (host `nfe.api.nfe.io`, chave de dados) consulta NF-e
por **chave de acesso** e baixa os arquivos. É somente leitura (não emite).

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `retrieve(accessKey)` | Consulta a NF-e por chave. | dados da NF-e |
| `downloadPdf(accessKey)` | DANFE em PDF. | `Buffer` |
| `downloadXml(accessKey)` | XML da NF-e. | `Buffer` |
| `listEvents(accessKey)` | Eventos da NF-e. | lista de eventos |

## Exemplo

```typescript
const nfe_ = await nfe.productInvoiceQuery.retrieve(accessKey);
const pdf = await nfe.productInvoiceQuery.downloadPdf(accessKey);
```

## Próximos passos

- [Consulta de cupom (CFe-SAT)](./consumer-invoice-query.md)
- [NF-e de entrada](./inbound-product-invoices.md)
