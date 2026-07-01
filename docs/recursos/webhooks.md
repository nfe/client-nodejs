---
title: Webhooks (recurso)
sidebar_label: Webhooks
sidebar_position: 9
slug: recurso-webhooks
description: Métodos de webhooks por empresa e por conta, verificação de assinatura e lista de eventos ao vivo com nfe.webhooks.
---

# Webhooks (recurso)

`nfe.webhooks` gerencia assinaturas de webhook e verifica assinaturas de
entrega. Para o guia conceitual (assinatura HMAC, `express.raw`), veja
[Webhooks](../webhooks.md).

## Métodos — por empresa (`/companies/{id}/webhooks`)

| Método | Descrição |
|---|---|
| `list(companyId)` | Lista os webhooks da empresa. |
| `create(companyId, data)` | Cria um webhook. |
| `retrieve(companyId, webhookId)` / `update(...)` / `delete(...)` | CRUD. |
| `test(companyId, webhookId)` | Dispara um teste. |
| `validateSignature(payload, signature, secret)` | Valida a assinatura HMAC-SHA1 (`x-hub-signature`). |

## Métodos — por conta (`/v2/webhooks`, sem `companyId`)

| Método | Descrição |
|---|---|
| `listAccountWebhooks()` | Lista webhooks da conta (`{ data }`). |
| `createAccountWebhook(data)` | Cria webhook de conta. |
| `retrieveAccountWebhook(id)` / `updateAccountWebhook(id, data)` / `deleteAccountWebhook(id)` | CRUD. |
| `pingAccountWebhook(id)` | Dispara um ping de teste. |
| `deleteAllAccountWebhooks()` | ⚠️ Remove **todos** os webhooks da conta. |
| `fetchEventTypes()` | Lista de tipos de evento **ao vivo** (`string[]`). |

## Exemplo

```typescript
const eventTypes = await nfe.webhooks.fetchEventTypes();

const created = await nfe.webhooks.createAccountWebhook({
  uri: 'https://seu-site.com/webhook',
  events: eventTypes.slice(0, 2),
});
await nfe.webhooks.pingAccountWebhook(created.id);
```

## Próximos passos

- [Webhooks (guia)](../webhooks.md)
- [Assíncrono e webhook-driven](../async-and-polling.md)
