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
| `retrieve(companyId, invoiceId, environment?)` | Consulta por id. | `ConsumerInvoice` |
| `cancel(companyId, invoiceId)` | Cancela a NFC-e. | `ConsumerInvoice` |
| `getItems(companyId, invoiceId, environment?)` | Itens da nota. | resposta de itens |
| `getEvents(companyId, invoiceId, environment?)` | Eventos da nota. | resposta de eventos |
| `downloadPdf` / `downloadXml` / `downloadRejectionXml` (`, environment?`) | Downloads (Buffer). | `Buffer` |
| `disable(companyId, data)` | Inutilização de numeração. | resultado |

`ConsumerInvoiceListOptions = { environment: 'Production' \| 'Test'; startingAfter?; endingBefore?; limit?; q? }`.

:::warning `environment` obrigatório
A API exige `environment` (`Production`/`Test`) na listagem; as leituras aceitam
`environment` opcional. Sem ele, a listagem retorna `400`.
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
