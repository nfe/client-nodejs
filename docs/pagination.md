---
title: Paginação no SDK Node.js da NFE.io
sidebar_label: Paginação
sidebar_position: 5
slug: paginacao
description: Listas page-style com filtros de data, envelopes de resposta por recurso e iteração automática de empresas.
---

# Paginação

Os recursos de listagem retornam **envelopes** — o array vem sob uma chave
específica, não na raiz. O formato varia por recurso.

## Envelopes por recurso

| Recurso | Formato |
|---|---|
| `serviceInvoices.list` | `{ serviceInvoices, page }` |
| `companies.list` | `{ data, page }` (via `ListResponse<Company>`) |
| `municipalTaxes.list` / `stateTaxes.list` | `{ municipalTaxes \| stateTaxes, hasMore }` |
| `consumerInvoices.list` | `{ consumerInvoices, hasMore }` |
| `certificates.list` | `{ certificates }` |
| `notifications.list` | `{ notifications }` |

```typescript
const { serviceInvoices = [], page } = await nfe.serviceInvoices.list(companyId, {
  pageIndex: 1,   // 1-based
  pageCount: 20,  // até 50
  issuedBegin: '2026-01-01',
  issuedEnd: '2026-01-31',
});
```

:::warning Índice 1-based e limite de página
As listas page-style da plataforma são **1-based** (`pageIndex` começa em 1) e
`pageCount` tem teto (tipicamente 50). Valores fora disso podem ser rejeitados
pela API com `400`.
:::

## Iterar todas as empresas

`companies` oferece iteração automática, cuidando das páginas para você:

```typescript
// Coleta tudo em memória:
const all = await nfe.companies.listAll();

// Ou itere lazily (async iterator):
for await (const company of nfe.companies.listIterator()) {
  console.log(company.id, company.name);
}
```

## Filtros por data (NFS-e)

`serviceInvoices.list` aceita `issuedBegin`/`issuedEnd` e
`createdBegin`/`createdEnd` (formato `yyyy-MM-dd`), além de `hasTotals`.

## Próximos passos

- [Notas de serviço (NFS-e)](./recursos/service-invoices.md)
- [Empresas](./recursos/companies.md)
