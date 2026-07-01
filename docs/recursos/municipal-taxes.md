---
title: Inscrições municipais
sidebar_label: Inscrições municipais
sidebar_position: 5
slug: inscricoes-municipais
description: CRUD de inscrições municipais (pré-requisito da NFS-e) com nfe.municipalTaxes, incluindo updatePrefecture (PATCH) e getSeries.
---

# Inscrições municipais

`nfe.municipalTaxes` (host `api.nfse.io`) gerencia as inscrições municipais da
empresa — **pré-requisito para emissão de NFS-e**. Espelha
[`stateTaxes`](./state-taxes.md).

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `list(companyId)` | Lista as inscrições. | `{ municipalTaxes, hasMore }` |
| `create(companyId, data)` | Cria uma inscrição. | `MunicipalTax` |
| `retrieve(companyId, municipalTaxId)` | Consulta por id. | `MunicipalTax` |
| `update(companyId, municipalTaxId, data)` | Atualiza. | `MunicipalTax` |
| `delete(companyId, municipalTaxId)` | Remove. | `void` |
| `updatePrefecture(companyId, municipalTaxId, data)` | Atualiza credenciais da prefeitura (HTTP **PATCH**). | `MunicipalTax` |
| `getSeries(companyId, municipalTaxId, serie)` | Consulta uma série de RPS. | dados da série |

## Exemplo

```typescript
const { municipalTaxes = [] } = await nfe.municipalTaxes.list(companyId);

const created = await nfe.municipalTaxes.create(companyId, {
  code: '123456',
  // ...credenciais/config da prefeitura
});

await nfe.municipalTaxes.updatePrefecture(companyId, created.id, {
  // login/senha da prefeitura
});
```

## Próximos passos

- [Notas de serviço (NFS-e)](./service-invoices.md)
- [Empresas](./companies.md)
