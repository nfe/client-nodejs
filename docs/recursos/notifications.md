---
title: Notificações
sidebar_label: Notificações
sidebar_position: 8
slug: notificacoes
description: Liste, consulte, remova e envie por e-mail as notificações da empresa com nfe.notifications (host api.nfe.io).
---

# Notificações

`nfe.notifications` (host `api.nfe.io`) gerencia as notificações da empresa.

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `list(companyId)` | Lista as notificações. | `{ notifications }` |
| `retrieve(companyId, notificationId)` | Consulta por id. | `Notification` |
| `delete(companyId, notificationId)` | Remove. | `void` |
| `sendEmail(companyId, data?)` | Envia notificação por e-mail. | `void` |

## Exemplo

```typescript
const { notifications = [] } = await nfe.notifications.list(companyId);

await nfe.notifications.sendEmail(companyId, { to: 'destino@exemplo.com' });
```

## Próximos passos

- [Webhooks](../webhooks.md)
- [Empresas](./companies.md)
