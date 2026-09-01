---
title: NF-e de entrada (inbound / distribuição)
sidebar_label: NF-e de entrada
sidebar_position: 19
slug: nfe-de-entrada
description: Captura automática de NF-e de entrada (distribuição DF-e) com nfe.inboundProductInvoices (host api.nfse.io).
---

# NF-e de entrada (inbound)

`nfe.inboundProductInvoices` (host `api.nfse.io`, chave de dados) gerencia a
captura automática de NF-e de entrada (distribuição DF-e) e a consulta dos
documentos capturados.

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `enableAutoFetch(companyId, data)` / `disableAutoFetch(companyId)` | Liga/desliga a captura automática. | settings |
| `getSettings(companyId)` | Configuração atual. | settings |
| `getDetails(companyId, ...)` / `getProductInvoiceDetails(...)` | Detalhes dos documentos. | dados |
| `getEventDetails(...)` / `getProductInvoiceEventDetails(...)` | Detalhes de eventos. | dados |
| `getXml(companyId, accessKey)` / `getPdf(...)` / `getEventXml(...)` | Documento capturado. | `{ publicTemporaryUri }` |

:::info Downloads devolvem uma URL, não o arquivo
`getXml`, `getPdf` e `getEventXml` respondem com um objeto `{ publicTemporaryUri }`
— uma URL pré-assinada e temporária. Binário não trafega nessas rotas e o header
`Accept` não altera a resposta; baixar a URL é responsabilidade do chamador.

```typescript
const res = await nfe.inboundProductInvoices.getPdf(companyId, accessKey);
const bytes = await fetch(res.publicTemporaryUri!).then((r) => r.arrayBuffer());
```
:::

## Exemplo

```typescript
await nfe.inboundProductInvoices.enableAutoFetch(companyId, { /* config */ });
const settings = await nfe.inboundProductInvoices.getSettings(companyId);
```

## Próximos passos

- [CT-e](./transportation-invoices.md)
- [Consulta de NF-e por chave](./product-invoice-query.md)
