---
title: Consulta de CNPJ (pessoa jurídica)
sidebar_label: Consulta CNPJ
sidebar_position: 12
slug: consulta-cnpj
description: Consulte dados cadastrais e de inscrição estadual por CNPJ com nfe.legalEntityLookup (host legalentity.api.nfe.io).
tags: [nodejs, consulta, referencia]
integration: [sdk]
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

## Formato do CNPJ

- **Com ou sem máscara.** O SDK remove `.`, `/`, `-` e espaços e converte letras para
  maiúsculas antes de montar a URL. `'06.990.590/0001-23'` e `'06990590000123'` dão a mesma
  consulta.
- **12 letras ou dígitos e 2 dígitos verificadores** (IN RFB 2.229/2024). O SDK confere os
  dígitos verificadores (módulo 11, com o valor ASCII − 48 de cada caractere) e lança
  `ValidationError` sem fazer a requisição quando eles não batem. A API também recusa esse
  CNPJ, com `400`.
- **CNPJ alfanumérico.** As letras chegam à API, mas este recurso usa a versão `v2` da
  consulta, que só aceita CNPJ numérico. A API responde `400` com "CNPJ alfanumérico não é
  suportado nesta versão. Utilize a v3.", e o SDK lança `ValidationError` com essa mensagem.

## Próximos passos

- [Consulta CPF](./natural-person-lookup.md) · [Consulta CEP](./addresses.md)
