---
title: Códigos auxiliares de tributos (tax codes)
sidebar_label: Códigos de tributos
sidebar_position: 16
slug: codigos-de-tributos
description: Liste códigos de operação, finalidade de aquisição e perfis fiscais com nfe.taxCodes (host api.nfse.io, chave principal).
---

# Códigos auxiliares (tax codes)

`nfe.taxCodes` (host `api.nfse.io`, **chave principal**) lista os códigos
auxiliares usados no motor de [cálculo de impostos](./tax-calculation.md).

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `listOperationCodes(options?)` | Códigos de operação. | paginado (`{ items, currentPage, totalPages, totalCount }`) |
| `listAcquisitionPurposes(options?)` | Finalidades de aquisição. | paginado |
| `listIssuerTaxProfiles(options?)` | Perfis fiscais do emissor. | paginado |
| `listRecipientTaxProfiles(options?)` | Perfis fiscais do destinatário. | paginado |

## Exemplo

```typescript
const ops = await nfe.taxCodes.listOperationCodes({ pageIndex: 1, pageCount: 20 });
for (const code of ops.items ?? []) console.log(code.code, code.description);
```

:::info Chave principal
Ao contrário de outros recursos em `api.nfse.io`, `taxCodes` usa a **chave
principal** (`apiKey`). Em contas com `dataApiKey` separada, o SDK já roteia
para a chave correta.
:::

## Próximos passos

- [Cálculo de impostos](./tax-calculation.md)
