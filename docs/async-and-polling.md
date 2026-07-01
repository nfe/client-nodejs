---
title: Emissão assíncrona e polling no SDK Node.js da NFE.io
sidebar_label: Assíncrono e polling
sidebar_position: 3
slug: assincrono-e-polling
description: Retorno discriminado (202 vs 201), estados de FlowStatus, createAndWait/cancelAndWait e emissão webhook-driven.
---

# Emissão assíncrona e polling

A emissão fiscal costuma ser **assíncrona**. O SDK expõe isso de duas formas,
dependendo do produto: **polling** (NFS-e) e **webhook-driven** (NF-e/NFC-e).

## Retorno discriminado (NFS-e)

`serviceInvoices.create` (e `serviceInvoicesRtc.create`) devolvem uma união
discriminada pela tag `status`:

```typescript
const r = await nfe.serviceInvoices.create(companyId, data);
if (r.status === 'async') {
  // HTTP 202 — enfileirada
  r.response.invoiceId; // id para reconsultar
  r.response.location;  // header Location
} else {
  // HTTP 201 — já materializada
  r.invoice;            // ServiceInvoiceData
}
```

## createAndWait (polling embutido)

Combina `create` + polling com backoff exponencial e devolve a nota em estado
terminal. Lança `InvoiceProcessingError` em `IssueFailed`/`CancelFailed`.

```typescript
const invoice = await nfe.serviceInvoices.createAndWait(companyId, data, {
  timeout: 120000,     // total, ms (padrão 2 min)
  initialDelay: 1000,  // ms antes do 1º poll
  maxDelay: 10000,     // teto entre polls
  backoffFactor: 1.5,
  onPoll: (attempt, flowStatus) => console.log(attempt, flowStatus),
});
```

`cancelAndWait` faz o mesmo para cancelamento (também assíncrono).

## Estados de `FlowStatus`

| Terminal | Em processamento |
|---|---|
| `Issued`, `IssueFailed`, `Cancelled`, `CancelFailed` | `WaitingCalculateTaxes`, `WaitingDefineRpsNumber`, `WaitingSend`, `WaitingSendCancel`, `WaitingReturn`, `WaitingDownload`, `PullFromCityHall` |

O polling encerra ao atingir um estado **terminal**.

## Webhook-driven (NF-e / NFC-e)

`productInvoices.create`, `productInvoicesRtc.create` e `consumerInvoices.create`
**não fazem polling**: um `202` indica que a nota foi enfileirada e a conclusão
é notificada por **webhook**. Configure webhooks e reaja aos eventos em vez de
consultar em loop.

:::tip Escolha o padrão certo
- NFS-e: `createAndWait` (polling) para um fluxo síncrono simples.
- NF-e/NFC-e: emita e trate a conclusão via [Webhooks](./webhooks.md).
:::

## Próximos passos

- [Webhooks](./webhooks.md)
- [Notas de serviço (NFS-e)](./recursos/service-invoices.md)
- [Emissão RTC](./rtc-emission.md)
