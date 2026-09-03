---
title: Downloads de PDF e XML no SDK Node.js da NFE.io
sidebar_label: Downloads (PDF/XML)
sidebar_position: 6
slug: downloads-pdf-xml
description: Baixe DANFE/PDF e XML como Buffer, individualmente ou em ZIP por empresa, com o Accept correto.
---

# Downloads (PDF/XML)

Os métodos de download retornam um **`Buffer`** com os bytes do arquivo, sempre
de uma nota identificada — o `invoiceId` é obrigatório.

```typescript
import { writeFileSync } from 'node:fs';

// PDF
const pdf = await nfe.serviceInvoices.downloadPdf(companyId, invoiceId);
writeFileSync('nota.pdf', pdf);

// XML
const xml = await nfe.serviceInvoices.downloadXml(companyId, invoiceId);
writeFileSync('nota.xml', xml);
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

## Outros downloads

| Recurso | Métodos |
|---|---|
| `serviceInvoices` | `downloadPdf`, `downloadXml` |
| `serviceInvoicesRtc` | `downloadCancellationXml` (XML do evento de cancelamento) |
| `consumerInvoices` (NFC-e) | `downloadPdf`, `downloadXml`, `downloadRejectionXml` (aceitam `environment`) |
| `productInvoices` | `downloadPdf`, `downloadXml` |
| `productInvoiceQuery` / `consumerInvoiceQuery` | `downloadPdf`/`downloadXml` por chave de acesso |

:::tip Streaming para arquivos grandes
Os métodos carregam o arquivo inteiro em memória (`Buffer`). Para lotes grandes
(ZIP da empresa), considere baixar fora do horário de pico e persistir em disco
logo após o retorno.
:::

## Próximos passos

- [Notas de serviço (NFS-e)](./recursos/service-invoices.md)
- [NFC-e](./recursos/consumer-invoices.md)
