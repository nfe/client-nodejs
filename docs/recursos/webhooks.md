---
title: Webhooks (recurso)
sidebar_label: Webhooks
sidebar_position: 9
slug: recurso-webhooks
description: Métodos de webhooks por conta, verificação de assinatura e lista de eventos ao vivo com nfe.webhooks.
---

# Webhooks (recurso)

`nfe.webhooks` gerencia assinaturas de webhook e verifica assinaturas de
entrega. Para o guia conceitual (assinatura HMAC, `express.raw`), veja
[Webhooks](../webhooks.md).

Webhooks são gerenciados **por conta** (`/v2/webhooks`). Os métodos por empresa
(`list/create/retrieve/update/delete/test(companyId, ...)`) estão **deprecated**:
a rota `/v1/companies/{id}/webhooks` retorna 404 na API atual.

## Métodos — por conta (`/v2/webhooks`, sem `companyId`)

| Método | Descrição |
|---|---|
| `listAccountWebhooks()` | Lista webhooks da conta (`{ data }`). |
| `createAccountWebhook(data)` | Cria webhook de conta. |
| `retrieveAccountWebhook(id)` / `updateAccountWebhook(id, data)` / `deleteAccountWebhook(id)` | CRUD. |
| `pingAccountWebhook(id)` | Dispara um ping de teste. |
| `deleteAllAccountWebhooks()` | ⚠️ Remove **todos** os webhooks da conta. |
| `fetchEventTypes()` | Lista de tipos de evento **ao vivo** (`string[]`). |
| `validateSignature(payload, signature, secret)` | Valida a assinatura HMAC-SHA1 (`x-hub-signature`). |

## Exemplo

```typescript
const eventTypes = await nfe.webhooks.fetchEventTypes();

const created = await nfe.webhooks.createAccountWebhook({
  uri: 'https://seu-site.com/webhook', // precisa responder 2xx já na criação (ping)
  contentType: 'json',
  secret: 'um-segredo-de-32-a-64-caracteres-aqui',
  filters: ['service_invoice.issued_successfully', 'service_invoice.cancelled_successfully'],
});
if (created.id) await nfe.webhooks.pingAccountWebhook(created.id);
```

:::info Verificação na criação
Ao criar um webhook, a NFE.io faz um ping na `uri` e exige resposta **2xx** —
o endpoint precisa estar no ar antes do `createAccountWebhook`. O `secret`
(32–64 caracteres) é ecoado na resposta do create, mas omitido nas leituras.
:::

:::caution Update é substituição integral
`updateAccountWebhook` faz um `PUT`: campos omitidos voltam ao padrão — um
update sem `status` **desativa o webhook**. Parta do `retrieveAccountWebhook`
e envie o objeto completo.
:::

## Próximos passos

- [Webhooks (guia)](../webhooks.md)
- [Assíncrono e webhook-driven](../async-and-polling.md)
