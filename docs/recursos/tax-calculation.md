---
title: Cálculo de impostos
sidebar_label: Cálculo de impostos
sidebar_position: 17
slug: calculo-de-impostos
description: Calcule tributos (ICMS, PIS, COFINS, IPI, II) por item com nfe.taxCalculation (host api.nfse.io).
---

# Cálculo de impostos

`nfe.taxCalculation` (host `api.nfse.io`) expõe o motor de cálculo de tributos
para operações com produtos.

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `calculate(tenantId, request)` | Calcula os tributos da operação. | detalhamento por item |

Os códigos usados no request (operação, finalidade, perfis fiscais) vêm de
[Códigos de tributos](./tax-codes.md).

## Exemplo

```typescript
const result = await nfe.taxCalculation.calculate(tenantId, {
  // operação + itens conforme os códigos auxiliares
  items: [{ /* ... */ }],
});
// result contém o detalhamento (ICMS, PIS, COFINS, IPI, II) por item
```

## Próximos passos

- [Códigos de tributos](./tax-codes.md)
- [Notas de produto (NF-e)](./product-invoices.md)
