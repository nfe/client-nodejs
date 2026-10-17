---
title: Inscrições estaduais
sidebar_label: Inscrições estaduais
sidebar_position: 6
slug: inscricoes-estaduais
description: CRUD de inscrições estaduais (pré-requisito da NF-e) com nfe.stateTaxes, incluindo troca de autorizador (switchAuthorizer).
tags: [nodejs, nfe, inscricao-estadual, referencia]
integration: [sdk]
---

# Inscrições estaduais

`nfe.stateTaxes` (host `api.nfse.io`) gerencia as inscrições estaduais (IE) da
empresa — **pré-requisito para emissão de NF-e**.

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `list(companyId, options?)` | Lista as inscrições (paginação por cursor). | `{ stateTaxes, hasMore }` |
| `create(companyId, data)` | Cria uma inscrição. | `NfeStateTax` |
| `retrieve(companyId, stateTaxId)` | Consulta por id. | `NfeStateTax` |
| `update(companyId, stateTaxId, data)` | Atualiza. | `NfeStateTax` |
| `delete(companyId, stateTaxId)` | Remove. | `void` |
| `switchAuthorizer(companyId, stateTaxId, data?)` | Troca o autorizador NF-e (ex.: SVRS). | `NfeStateTax` |

## Exemplo

```typescript
const { stateTaxes = [] } = await nfe.stateTaxes.list(companyId);

const primeira = stateTaxes[0];
if (primeira?.id) {
  await nfe.stateTaxes.switchAuthorizer(companyId, primeira.id, { authorizer: 'SVRS' });
}
```

## Próximos passos

- [Notas de produto (NF-e)](./product-invoices.md)
- [Empresas](./companies.md)
