---
title: Consulta de CNPJ (pessoa jurídica)
sidebar_label: Consulta CNPJ
sidebar_position: 12
slug: consulta-cnpj
description: Consulte dados cadastrais e de inscrição estadual por CNPJ com nfe.legalEntityLookup (host legalentity.api.nfe.io).
---

# Consulta de CNPJ

`nfe.legalEntityLookup` (host `legalentity.api.nfe.io`, chave de dados) consulta
dados cadastrais de pessoa jurídica na Receita Federal e informações de
inscrição estadual.

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `getBasicInfo(cnpj, options?)` | Dados cadastrais (razão social, endereço, CNAE, etc.). | `{ legalEntity }` |
| `getStateTaxInfo(state, cnpj)` | Inscrição estadual na UF indicada (ex.: `'SP'`). | dados de IE |
| `getStateTaxForInvoice(state, cnpj)` | IE adequada para emissão. | dados de IE |
| `getSuggestedStateTaxForInvoice(state, cnpj)` | IE sugerida para emissão. | dados de IE |

## Exemplo

```typescript
const { legalEntity } = await nfe.legalEntityLookup.getBasicInfo('06990590000123');
console.log(legalEntity?.name, legalEntity?.address?.city?.name);
```

## Próximos passos

- [Consulta CPF](./natural-person-lookup.md) · [Consulta CEP](./addresses.md)
