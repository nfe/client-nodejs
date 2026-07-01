---
title: Inscrições estaduais
sidebar_label: Inscrições estaduais
sidebar_position: 6
slug: inscricoes-estaduais
description: CRUD de inscrições estaduais (pré-requisito da NF-e) com nfe.stateTaxes, incluindo troca de autorizador (switchAuthorizer).
---

# Inscrições estaduais

`nfe.stateTaxes` (host `api.nfse.io`) gerencia as inscrições estaduais (IE) da
empresa — **pré-requisito para emissão de NF-e**.

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `list(companyId)` | Lista as inscrições. | `{ stateTaxes, hasMore }` |
| `create(companyId, data)` | Cria uma inscrição. | `StateTax` |
| `retrieve(companyId, stateTaxId)` | Consulta por id. | `StateTax` |
| `update(companyId, stateTaxId, data)` | Atualiza. | `StateTax` |
| `delete(companyId, stateTaxId)` | Remove. | `void` |
| `switchAuthorizer(companyId, stateTaxId, data?)` | Troca o autorizador NF-e (ex.: SVRS). | `StateTax` |

## Exemplo

```typescript
const { stateTaxes = [] } = await nfe.stateTaxes.list(companyId);

await nfe.stateTaxes.switchAuthorizer(companyId, stateTaxes[0].id, {
  authorizer: 'SVRS',
});
```

## Próximos passos

- [Notas de produto (NF-e)](./product-invoices.md)
- [Empresas](./companies.md)
