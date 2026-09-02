---
title: NFC-e — notas de consumidor
sidebar_label: NFC-e (consumidor)
sidebar_position: 3
slug: nfc-e
description: Emita e gerencie NFC-e com nfe.consumerInvoices no host api.nfse.io — emissão webhook-driven e environment obrigatório na listagem/leituras.
---

# NFC-e (notas de consumidor)

`nfe.consumerInvoices` cobre o ciclo de vida da NFC-e (host `api.nfse.io`). A
emissão é **webhook-driven** (202 = enfileirada; conclusão via webhook). É
distinto de `nfe.consumerInvoiceQuery` (consulta de cupom CFe-SAT, somente
leitura).

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `create(companyId, data)` | Emite a NFC-e (webhook-driven). | `ConsumerInvoice` |
| `list(companyId, options)` | Lista NFC-e. **`options.environment` é obrigatório.** | `{ consumerInvoices, hasMore }` |
| `retrieve(companyId, invoiceId)` | Consulta por id. | `ConsumerInvoice` |
| `cancel(companyId, invoiceId, reason?)` | Cancela a NFC-e. | `ConsumerInvoiceCancellationResponse` |
| `getItems(companyId, invoiceId, { limit?, startingAfter? })` | Itens da nota, com paginação cursor. | `{ items, hasMore, … }` |
| `getEvents(companyId, invoiceId, { limit?, startingAfter? })` | Eventos da nota, com paginação cursor. | `{ events, hasMore, … }` |
| `downloadPdf(companyId, invoiceId, force?)` / `downloadXml` / `downloadRejectionXml` | Link do documento. | `{ uri }` |
| `disable(companyId, data)` | Inutilização de numeração. | resultado |

`ConsumerInvoiceListOptions = { environment: 'Production' \| 'Test'; startingAfter?; endingBefore?; limit?; q? }`.

:::warning `environment` só na listagem
A API exige `environment` (`Production`/`Test`) em `list()` — sem ele responde
`400 environment has to be production or test`. As demais rotas **não definem**
esse parâmetro e não o recebem mais.
:::

:::info Downloads devolvem uma URL, não o arquivo
`downloadPdf`, `downloadXml` e `downloadRejectionXml` respondem com `{ uri }` — o
header `Accept` não altera a resposta. Baixar a URL é responsabilidade do chamador.

```typescript
const res = await nfe.consumerInvoices.downloadPdf(companyId, invoiceId);
const bytes = await fetch(res.uri!).then((r) => r.arrayBuffer());
```

O envelope difere do usado pelas rotas de **entrada**, que nomeiam o campo
`publicTemporaryUri`.
:::

## Listar e emitir

```typescript
const { consumerInvoices = [] } = await nfe.consumerInvoices.list(companyId, {
  environment: 'Test',
  limit: 5,
});

const invoice = await nfe.consumerInvoices.create(companyId, {
  buyer: { federalTaxNumber: 52998224725, name: 'Consumidor Final' },
  items: [{ code: '001', description: 'Produto', quantity: 1, unitAmount: 10.0 }],
  payment: { method: 'Cash', amount: 10.0 },
});
// 202: aguarde o webhook
```

## Próximos passos

- [Webhooks](../webhooks.md) e [Downloads](../downloads.md)
- [NFC-e RTC](./rtc.md)
