---
title: Downloads de PDF e XML no SDK Node.js da NFE.io
sidebar_label: Downloads (PDF/XML)
sidebar_position: 6
slug: downloads-pdf-xml
description: Baixe DANFE/PDF e XML de uma nota identificada, em bytes (Buffer) ou por link, conforme o recurso.
---

# Downloads (PDF/XML)

O formato do retorno depende do recurso. A NFS-e e a consulta de NF-e por chave devolvem os
**bytes** do arquivo (`Buffer`); os demais devolvem um **link** para ele, e baixá-lo fica com a
aplicação. Em todos, o download é de uma nota identificada.

```typescript
import { writeFileSync } from 'node:fs';

// NFS-e: bytes
const pdf = await nfe.serviceInvoices.downloadPdf(companyId, invoiceId);
writeFileSync('nota.pdf', pdf);

const xml = await nfe.serviceInvoices.downloadXml(companyId, invoiceId);
writeFileSync('nota.xml', xml);

// NF-e: link para o arquivo
const { uri } = await nfe.productInvoices.downloadPdf(companyId, productInvoiceId);
```

> **Não existe download em lote por empresa.** Até a versão 5.2.0 o `invoiceId`
> era opcional e a documentação prometia um ZIP com todas as notas. A rota não
> existe: `/serviceinvoices/pdf` responde
> `404 "service invoice with id (pdf) was not found"`, porque o servidor casa a
> rota `/{id}` e trata `pdf` como identificador. Medido em 2026-09-02; a rota
> também não está na spec `nf-servico-v1`. Para baixar várias notas, itere sobre
> os ids.

## Disponibilidade por estado

O PDF/XML só existe após a nota atingir um **estado terminal**
(`Issued`/`Cancelled`). Antes disso, o download pode retornar `404` — use
[polling ou webhooks](./async-and-polling.md) para aguardar a emissão.

## Por recurso

| Recurso | Métodos | Retorno |
|---|---|---|
| `serviceInvoices` | `downloadPdf`, `downloadXml` | `Buffer` |
| `serviceInvoicesRtc` | `downloadCancellationXml` (XML do evento de cancelamento) | `Buffer` |
| `productInvoices` | `downloadPdf` (`force?`), `downloadXml`, `downloadRejectionXml`, `downloadEpecXml`, `downloadCorrectionLetterPdf`, `downloadCorrectionLetterXml` | `NfeFileResource` (`{ uri }`) |
| `consumerInvoices` (NFC-e) | `downloadPdf` (`force?`), `downloadXml`, `downloadRejectionXml` | `ConsumerInvoiceFileResource` (`{ uri }`) |
| `inboundProductInvoices` | `getXml`, `getPdf`, `getEventXml` | `InboundFileResource` (`{ publicTemporaryUri }`) |
| `transportationInvoices` | `downloadXml`, `downloadEventXml` | `InboundFileResource` (`{ publicTemporaryUri }`) |
| `productInvoiceQuery` | `downloadPdf`, `downloadXml`, por chave de acesso | `Buffer` |

O `publicTemporaryUri` é um link pré-assinado e temporário. A consulta de cupom CFe-SAT
(`consumerInvoiceQuery`) está descontinuada: a plataforma não serve a rota.

:::tip Memória
Os métodos que devolvem `Buffer` carregam o arquivo inteiro em memória. Para muitas notas,
baixe uma a uma e grave em disco logo após cada retorno.
:::

## Próximos passos

- [Notas de serviço (NFS-e)](./recursos/service-invoices.md)
- [NFC-e](./recursos/consumer-invoices.md)
