---
title: NF-e de entrada (inbound / distribuição)
sidebar_label: NF-e de entrada
sidebar_position: 19
slug: nfe-de-entrada
description: Captura automática de NF-e de entrada (distribuição DF-e) com nfe.inboundProductInvoices (host api.nfse.io).
tags: [nodejs, nfe, inbound, distribuicao, referencia]
integration: [sdk]
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

:::warning Emitente com CNPJ alfanumérico
Quando o emitente tem CNPJ alfanumérico (IN RFB 2.229/2024), a chave de acesso tem letras nas
posições 7 a 18. O SDK aceita esse formato, converte as letras para maiúsculas e deixa cada rota
da API decidir:

- `getProductInvoiceDetails`, `getProductInvoiceEventDetails` e `getJson` usam
  `/inbound/productinvoices/{chave}…`, que aceita a chave com letras.
- `getDetails`, `getEventDetails`, `getXml`, `getPdf` e `getEventXml` usam `/inbound/{chave}…`.
  Em 18/11/2026, essas rotas ainda respondiam `400` ("access key must have 44 digits") para
  chave com letras, e o SDK repassa esse erro como `ValidationError`.
:::

## Próximos passos

- [CT-e](./transportation-invoices.md)
- [Consulta de NF-e por chave](./product-invoice-query.md)
