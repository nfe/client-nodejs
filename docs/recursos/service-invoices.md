---
title: Notas fiscais de serviço (NFS-e)
sidebar_label: Notas de serviço
sidebar_position: 1
slug: notas-fiscais-de-servico
description: Emita, liste, consulte, cancele e baixe NFS-e com nfe.serviceInvoices no host api.nfe.io /v1, tratando o retorno discriminado 202.
---

# Notas fiscais de serviço (NFS-e)

`nfe.serviceInvoices` é o recurso canônico de emissão da plataforma. Ele fala
com o host `api.nfe.io` no caminho `/v1` e cobre todo o ciclo de vida da nota:
emissão (síncrona ou assíncrona), consulta, listagem, cancelamento, envio por
e-mail e download de PDF/XML.

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `create(companyId, data)` | Emite a NFS-e. | `CreateInvoiceResponse` (união discriminada) |
| `createAndWait(companyId, data, options?)` | Emite e faz polling até um estado terminal. | `ServiceInvoiceData` |
| `list(companyId, options?)` | Lista paginada (page-style) com filtros de data. | `ServiceInvoiceListResponse` (`{ serviceInvoices, page }`) |
| `retrieve(companyId, invoiceId)` | Consulta uma NFS-e por id. | `ServiceInvoiceData` |
| `retrieveByExternalId(companyId, externalId)` | Consulta por id externo (idempotência/reconciliação). | `ServiceInvoiceData` |
| `cancel(companyId, invoiceId)` | Cancela (assíncrono). | `CancelInvoiceResponse` (união discriminada) |
| `cancelAndWait(companyId, invoiceId, options?)` | Cancela e faz polling até concluir. | `ServiceInvoiceData` |
| `sendEmail(companyId, invoiceId)` | Reenvia a nota por e-mail ao tomador. | `{ sent, message }` |
| `downloadPdf(companyId, invoiceId?)` | PDF da nota; sem `invoiceId`, baixa o ZIP da empresa. | `Buffer` |
| `downloadXml(companyId, invoiceId?)` | XML da nota; sem `invoiceId`, baixa o ZIP da empresa. | `Buffer` |

As opções de `list` são `pageIndex`, `pageCount`, `issuedBegin`, `issuedEnd`,
`createdBegin`, `createdEnd` e `hasTotals`.

:::warning Validação fail-fast
Os métodos validam `companyId`/`invoiceId` **antes** de qualquer chamada HTTP.
Ids vazios ou em branco lançam `ValidationError` sem tráfego de rede.
:::

## Emitir uma NFS-e e tratar o retorno discriminado

`create` devolve `{ status: 'async' }` (HTTP 202, enfileirada) ou
`{ status: 'immediate' }` (HTTP 201, já materializada). Distinga pela tag
`status` — o TypeScript estreita o tipo em cada ramo.

```typescript
const result = await nfe.serviceInvoices.create('55df4dc6b6cd9007e4f13ee8', {
  cityServiceCode: '2690',
  description: 'Manutenção e suporte técnico',
  servicesAmount: 100.0,
  borrower: { federalTaxNumber: 191, name: 'Banco do Brasil SA' },
});

if (result.status === 'async') {
  result.response.invoiceId; // id para reconsultar enquanto processa
  result.response.location;  // caminho do header Location
} else {
  result.invoice;            // ServiceInvoiceData já emitida
}
```

## Acompanhar até um estado terminal (polling)

`createAndWait` combina `create` + polling (backoff exponencial) e devolve a
nota já em estado terminal, lançando `InvoiceProcessingError` em `IssueFailed`.

```typescript
const invoice = await nfe.serviceInvoices.createAndWait(companyId, data, {
  timeout: 120000,       // padrão: 2 min
  initialDelay: 1000,
  onPoll: (attempt, flowStatus) => console.log(attempt, flowStatus),
});

invoice.flowStatus; // 'Issued'
```

Veja [Emissão assíncrona e polling](../async-and-polling.md) para os estados de
`FlowStatus` e as opções de polling.

## Baixar PDF e XML (bytes binários)

```typescript
import { writeFileSync } from 'node:fs';

const pdf = await nfe.serviceInvoices.downloadPdf(companyId, invoiceId);
writeFileSync('nota.pdf', pdf);

// ZIP de todas as notas da empresa (sem invoiceId):
const zip = await nfe.serviceInvoices.downloadXml(companyId);
writeFileSync('notas-xml.zip', zip);
```

## Cancelar e reenviar por e-mail

O cancelamento é **assíncrono** (HTTP 202 + `Location`). Use `cancelAndWait`
para bloquear até o cancelamento concluir.

```typescript
const settled = await nfe.serviceInvoices.cancelAndWait(companyId, invoiceId);
settled.flowStatus; // 'Cancelled'

// Sem bloquear — trate a união discriminada:
const c = await nfe.serviceInvoices.cancel(companyId, invoiceId);
if (c.status === 'async') console.log('cancelando:', c.response.invoiceId);

await nfe.serviceInvoices.sendEmail(companyId, invoiceId);
```

## Próximos passos

- [Emissão assíncrona e polling](../async-and-polling.md)
- [Downloads (PDF/XML)](../downloads.md) e [Paginação](../pagination.md)
- [Empresas](./companies.md) e [Inscrições municipais](./municipal-taxes.md) (pré-requisitos da emissão de NFS-e)
