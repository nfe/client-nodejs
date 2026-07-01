---
title: Webhooks no SDK Node.js da NFE.io
sidebar_label: Webhooks
sidebar_position: 7
slug: webhooks
description: Verificação de assinatura HMAC-SHA1 (x-hub-signature), webhooks por empresa e por conta, e lista de eventos ao vivo.
---

# Webhooks

A NFE.io notifica eventos (emissão, cancelamento, falha, etc.) por webhook. O
SDK cobre a configuração dos webhooks e a **verificação de assinatura**.

## Verificar a assinatura (obrigatório)

As entregas são assinadas com **HMAC-SHA1** no header `x-hub-signature`
(hex maiúsculo, prefixo `sha1=`). Verifique usando o **corpo bruto** (bytes),
não o JSON já parseado.

```typescript
import express from 'express';

app.post('/webhook/nfe', express.raw({ type: '*/*' }), (req, res) => {
  const ok = nfe.webhooks.validateSignature(
    req.body,                       // Buffer bruto — NÃO use express.json()
    req.headers['x-hub-signature'], // string | string[] | undefined
    process.env.NFE_WEBHOOK_SECRET  // seu segredo
  );
  if (!ok) return res.sendStatus(401);
  // ... processe o evento
  res.sendStatus(200);
});
```

:::warning Use o corpo bruto
`validateSignature` compara os bytes exatos que a NFE.io assinou. Se você
parsear o corpo antes (`express.json()`), a reserialização muda os bytes e a
verificação falha. Use `express.raw()` e passe o `Buffer`.
:::

A comparação é feita com `timingSafeEqual` (resistente a timing attacks) e
aceita a assinatura como `string` ou `string[]`.

## Webhooks por empresa vs por conta

| Escopo | Acesso | Caminho |
|---|---|---|
| Empresa | `nfe.webhooks.list/create/retrieve/update/delete(companyId, ...)` | `/companies/{id}/webhooks` |
| Conta | `nfe.webhooks.listAccountWebhooks/createAccountWebhook/...` | `/v2/webhooks` (host-root) |

Métodos de conta (sem `companyId`): `listAccountWebhooks`, `createAccountWebhook`,
`retrieveAccountWebhook`, `updateAccountWebhook`, `deleteAccountWebhook`,
`pingAccountWebhook` e `deleteAllAccountWebhooks` (⚠️ remove **todos**).

## Tipos de evento ao vivo

Prefira `fetchEventTypes()` (fonte da verdade é o servidor) ao invés da lista
fixa `getAvailableEvents()` (marcada como `@deprecated`).

```typescript
const eventTypes = await nfe.webhooks.fetchEventTypes(); // string[]
```

## Próximos passos

- [Emissão assíncrona e webhook-driven](./async-and-polling.md)
- [Erros](./errors.md)
