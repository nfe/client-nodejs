---
title: Primeiros passos com o SDK Node.js da NFE.io
sidebar_label: Primeiros passos
sidebar_position: 1
slug: primeiros-passos
description: Instale o pacote nfe-io, crie um NfeClient, emita sua primeira NFS-e e acompanhe o processamento com createAndWait/polling.
---

# Primeiros passos

Este guia cobre a instalação, a criação do cliente e a emissão da sua primeira
nota fiscal de serviço (NFS-e), incluindo o acompanhamento do processamento.

## 1. Instale o pacote

```sh
npm install nfe-io
# ou: pnpm add nfe-io / yarn add nfe-io
```

Requer **Node.js 22+**. O pacote publica ESM e CommonJS com tipos `.d.ts`.

## 2. Crie um cliente

```typescript
import { NfeClient } from 'nfe-io';

const nfe = new NfeClient({
  apiKey: process.env.NFE_API_KEY,
  environment: 'development', // 'development' (homologação) ou 'production'
});
```

Ou a partir do ambiente (lê `NFE_API_KEY`):

```typescript
import { createClientFromEnv } from 'nfe-io';
const nfe = createClientFromEnv('production');
```

## 3. Emita uma NFS-e

```typescript
const result = await nfe.serviceInvoices.create('55df4dc6b6cd9007e4f13ee8', {
  cityServiceCode: '2690',
  description: 'Manutenção e suporte técnico',
  servicesAmount: 100.0,
  borrower: { federalTaxNumber: 191, name: 'Banco do Brasil SA' },
});
```

## 4. Trate o retorno discriminado

`create` devolve uma união discriminada: `{ status: 'async' }` (HTTP 202,
enfileirada) ou `{ status: 'immediate' }` (HTTP 201, já materializada).

```typescript
if (result.status === 'async') {
  console.log('em processamento:', result.response.invoiceId);
  // reconsulte com retrieve(...) ou use createAndWait (passo 5)
} else {
  console.log('emitida:', result.invoice.id, result.invoice.number);
}
```

## 5. Acompanhe até um estado terminal (polling)

Para uma experiência síncrona, `createAndWait` combina `create` + polling com
backoff exponencial e devolve a nota já em estado terminal.

```typescript
const invoice = await nfe.serviceInvoices.createAndWait(
  '55df4dc6b6cd9007e4f13ee8',
  {
    cityServiceCode: '2690',
    description: 'Manutenção e suporte técnico',
    servicesAmount: 100.0,
    borrower: { federalTaxNumber: 191, name: 'Banco do Brasil SA' },
  },
  { timeout: 120000, onPoll: (attempt, status) => console.log(attempt, status) }
);

console.log(invoice.flowStatus); // 'Issued' (ou lança InvoiceProcessingError em 'IssueFailed')
```

:::tip Idempotência em retentativas
O SDK nunca refaz o POST sozinho. Em um timeout de rede, reinvoque `create`
com o mesmo `externalId`/idempotency para o servidor deduplicar e não emitir
documento fiscal duplicado.
:::

## Próximos passos

- [Emissão assíncrona e polling](./async-and-polling.md)
- [Configuração](./configuration.md) (timeout, retry, multi-chave)
- [Erros](./errors.md) e [Webhooks](./webhooks.md)
- Cookbook por recurso em [Recursos](./recursos/)
