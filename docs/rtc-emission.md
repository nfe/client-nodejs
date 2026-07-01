---
title: Emissão RTC (Reforma Tributária) no SDK Node.js da NFE.io
sidebar_label: Emissão RTC
sidebar_position: 9
slug: emissao-rtc
description: Emita NFS-e e NF-e/NFC-e no leiaute RTC (IBS/CBS/IS). O RTC é selecionado pelo payload, no mesmo endpoint da emissão atual.
---

# Emissão RTC (Reforma Tributária do Consumo)

O leiaute RTC (grupos **IBS**, **CBS** e **IS**) é **selecionado pelo payload** —
os endpoints são os mesmos da emissão atual. O SDK expõe recursos dedicados para
deixar o opt-in explícito e tipado.

- `nfe.serviceInvoicesRtc` — NFS-e no leiaute RTC (grupo `ibsCbs`).
- `nfe.productInvoicesRtc` — NF-e/NFC-e no leiaute RTC (IBS estadual/municipal, CBS, IS).

Os recursos de emissão existentes (`serviceInvoices`/`productInvoices`)
permanecem inalterados; RTC é opt-in.

## NFS-e RTC (com polling)

`serviceInvoicesRtc.create` retorna a mesma união discriminada de
`serviceInvoices`; `createAndWait` faz polling até o estado terminal.

```typescript
const invoice = await nfe.serviceInvoicesRtc.createAndWait(companyId, {
  borrower: { federalTaxNumber: 52998224725, name: 'Cliente Teste' },
  cityServiceCode: '10677',
  description: 'Serviço (RTC)',
  servicesAmount: 100.0,
  ibsCbs: { /* grupo RTC conforme a NT_2025.002 */ },
});
```

Também há `retrieve` e `downloadCancellationXml` (XML do evento de cancelamento,
Ambiente Nacional).

## NF-e/NFC-e RTC (webhook-driven)

`productInvoicesRtc.create` **não faz polling** (202 = enfileirada; conclusão
via webhook), espelhando `productInvoices`.

```typescript
const invoice = await nfe.productInvoicesRtc.create(companyId, {
  buyer: { federalTaxNumber: 52998224725, name: 'Cliente Teste' },
  items: [{ code: '001', description: 'Produto', quantity: 1, unitAmount: 100.0 }],
  ibsCbsIs: { /* grupos RTC conforme a NT_2025.002 */ },
});
```

:::info Tipos de request
`NFSeRtcRequest` (NFS-e) e `ProductInvoiceRtcRequest` (NF-e/NFC-e) são derivados
das specs oficiais. A proveniência das specs está registrada em
`openapi/spec/SOURCES.json` (NT_2025.002_v1.30).
:::

## Próximos passos

- [Assíncrono e polling](./async-and-polling.md) e [Webhooks](./webhooks.md)
- [Notas de serviço (NFS-e)](./recursos/service-invoices.md) · [Notas de produto (NF-e)](./recursos/product-invoices.md)
