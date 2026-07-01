---
title: Emissão RTC (recursos)
sidebar_label: RTC
sidebar_position: 10
slug: recursos-rtc
description: Recursos de emissão no leiaute RTC — serviceInvoicesRtc (NFS-e) e productInvoicesRtc (NF-e/NFC-e).
---

# RTC (recursos)

O leiaute RTC (IBS/CBS/IS) é selecionado pelo **payload**, nos mesmos endpoints
da emissão atual. Para o guia conceitual, veja [Emissão RTC](../rtc-emission.md).

## `nfe.serviceInvoicesRtc` (NFS-e RTC · api.nfe.io)

| Método | Descrição | Retorno |
|---|---|---|
| `create(companyId, data)` | Emite NFS-e RTC. | `CreateInvoiceResponse` (união discriminada) |
| `createAndWait(companyId, data, options?)` | Emite + polling até terminal. | `ServiceInvoiceData` |
| `retrieve(companyId, invoiceId)` | Consulta por id. | `ServiceInvoiceData` |
| `downloadCancellationXml(companyId, invoiceId)` | XML do evento de cancelamento. | `Buffer` |

Tipo de request: `NFSeRtcRequest` (grupo `ibsCbs`).

## `nfe.productInvoicesRtc` (NF-e/NFC-e RTC · api.nfse.io)

| Método | Descrição | Retorno |
|---|---|---|
| `create(companyId, data)` | Emite NF-e/NFC-e RTC (webhook-driven, sem polling). | `NfeProductInvoiceIssueData` |

Tipo de request: `ProductInvoiceRtcRequest` (IBS estadual/municipal, CBS, IS).

## Exemplo

```typescript
const invoice = await nfe.serviceInvoicesRtc.createAndWait(companyId, {
  borrower: { federalTaxNumber: 52998224725, name: 'Cliente Teste' },
  cityServiceCode: '10677',
  description: 'Serviço (RTC)',
  servicesAmount: 100.0,
  ibsCbs: {},
});
```

## Próximos passos

- [Emissão RTC (guia)](../rtc-emission.md)
- [Notas de serviço](./service-invoices.md) · [Notas de produto](./product-invoices.md)
