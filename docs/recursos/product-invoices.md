---
title: Notas fiscais de produto (NF-e)
sidebar_label: Notas de produto
sidebar_position: 2
slug: notas-fiscais-de-produto
description: Emita e gerencie NF-e com nfe.productInvoices no host api.nfse.io — emissão webhook-driven, carta de correção, downloads e inutilização.
tags: [nodejs, nfe, emissao, referencia]
integration: [sdk]
---

# Notas fiscais de produto (NF-e)

`nfe.productInvoices` fala com o host `api.nfse.io` e cobre o ciclo de vida da
NF-e. A emissão é **webhook-driven**: um `202` indica que a nota foi enfileirada
e a conclusão é notificada por [webhook](../webhooks.md) (sem polling).

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `create(companyId, data)` | Emite a NF-e (webhook-driven). | `NfeProductInvoiceIssueData` |
| `createWithStateTax(companyId, stateTaxId, data)` | Emite pela inscrição estadual indicada. | `NfeProductInvoiceIssueData` |
| `list(companyId, options)` | Lista NF-e. **Requer `environment`** (`Production`/`Test`). | envelope `{ productInvoices, hasMore }` |
| `retrieve(companyId, invoiceId)` | Consulta por id. | dados da NF-e |
| `cancel(companyId, invoiceId, reason?)` | Cancela a NF-e (assíncrono). | `NfeRequestCancellationResource` |
| `listItems` / `listEvents` | Itens e eventos da nota. | respostas específicas |
| `downloadPdf` / `downloadXml` / `downloadRejectionXml` / `downloadEpecXml` | Link do arquivo, não os bytes; `downloadPdf` aceita `force?` para regenerar. | `NfeFileResource` (`{ uri }`) |
| `sendCorrectionLetter(companyId, invoiceId, reason)` | Emite carta de correção (CC-e). `reason` é texto de 15 a 1.000 caracteres, sem acento. | `NfeRequestCancellationResource` |
| `downloadCorrectionLetterPdf` / `downloadCorrectionLetterXml` | Link do arquivo da CC-e. | `NfeFileResource` (`{ uri }`) |
| `disable(companyId, invoiceId, reason?)` / `disableRange(companyId, data)` | Inutilização de uma nota ou de uma faixa de numeração. | `NfeRequestCancellationResource` / `NfeDisablementResource` |

:::warning `environment` obrigatório na listagem
`list` exige `environment` (`'Production'` ou `'Test'`). Chamar sem o parâmetro
retorna `400`.
:::

## Emitir e acompanhar

```typescript
const invoice = await nfe.productInvoices.create(companyId, {
  buyer: { federalTaxNumber: 52998224725, name: 'Cliente Teste' },
  items: [{ code: '001', description: 'Produto', quantity: 1, unitAmount: 100.0 }],
});
// 202: aguarde o webhook de conclusão (não faz polling)
```

## Carta de correção (CC-e)

```typescript
// texto de 15 a 1.000 caracteres, sem acento
await nfe.productInvoices.sendCorrectionLetter(
  companyId,
  invoiceId,
  'Correcao da descricao do item 1',
);
```

## Próximos passos

- [Webhooks](../webhooks.md) e [Assíncrono](../async-and-polling.md)
- [Inscrições estaduais](./state-taxes.md) (pré-requisito da NF-e)
- [NF-e RTC](./rtc.md)
