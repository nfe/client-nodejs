---
title: CT-e (conhecimento de transporte)
sidebar_label: CT-e (transporte)
sidebar_position: 18
slug: cte-transporte
description: Habilite e consulte CT-e por chave de acesso com nfe.transportationInvoices (host api.nfse.io).
---

# CT-e (conhecimento de transporte)

`nfe.transportationInvoices` (host `api.nfse.io`, chave de dados) habilita a
captura de CT-e e consulta documentos por chave de acesso.

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `enable(companyId, data)` / `disable(companyId)` | Habilita/desabilita a captura de CT-e. | settings |
| `getSettings(companyId)` | Configuração atual. | settings |
| `retrieve(companyId, accessKey)` | Consulta um CT-e por chave. | dados do CT-e |
| `downloadXml(companyId, accessKey)` | XML do CT-e. | XML |
| `getEvent(companyId, ...)` / `downloadEventXml(companyId, ...)` | Eventos do CT-e. | evento / XML |

## Exemplo

```typescript
const settings = await nfe.transportationInvoices.getSettings(companyId);
const cte = await nfe.transportationInvoices.retrieve(companyId, accessKey);
```

## Próximos passos

- [NF-e de entrada (inbound)](./inbound-product-invoices.md)
- [Roteamento multi-host / multi-chave](../multi-host-routing.md)
