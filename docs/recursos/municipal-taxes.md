---
title: Inscrições municipais
sidebar_label: Inscrições municipais
sidebar_position: 5
slug: inscricoes-municipais
description: CRUD de inscrições municipais (pré-requisito da NFS-e) com nfe.municipalTaxes, incluindo a semântica de substituição do update (PUT).
tags: [nodejs, nfse, inscricao-municipal, referencia]
integration: [sdk]
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
| `update(companyId, municipalTaxId, data)` | **Substitui** a inscrição (HTTP **PUT**). Veja abaixo. | `MunicipalTax` |
| `delete(companyId, municipalTaxId)` | Remove. | `void` |
| `updatePrefecture(companyId, municipalTaxId, data)` | **Descontinuado** (`@deprecated`): a plataforma não serve a rota e responde `404`. | — |
| `getSeries(companyId, municipalTaxId, serie)` | **Descontinuado** (`@deprecated`): a plataforma não serve a rota e responde `404`. | — |

`create`, `retrieve` e `update` devolvem a própria inscrição. A API responde com o
envelope `{ "municipalTax": {…} }`, e o SDK o desembrulha desde a 6.0.1.

## Exemplo

```typescript
const { municipalTaxes = [] } = await nfe.municipalTaxes.list(companyId);

const created = await nfe.municipalTaxes.create(companyId, {
  city: { code: '4106902', name: 'Curitiba' },
  taxNumber: '123456',
  rpsSerialNumber: 'IO',
  environment: 'Development',
});

console.log(created.id);
```

## Atualizar: o PUT substitui a inscrição

`update` é um **PUT de substituição**, não uma atualização dos campos enviados.
Segundo a documentação da plataforma (`nfe/docs@b9e7953`, 14/10/2026):

- `taxNumber` omitido é **apagado**;
- `environment` omitido volta para `Development`;
- os demais campos omitidos não têm garantia de manter o valor.

O caminho seguro é ler a inscrição, alterar só o necessário e enviar o objeto de volta:

```typescript
const current = await nfe.municipalTaxes.retrieve(companyId, municipalTaxId);
const { rpsNumber, lastRpsSent, ...rest } = current; // omitidos, o contador de RPS é mantido
await nfe.municipalTaxes.update(companyId, municipalTaxId, { ...rest, issRate: 2.5 });
```

:::warning[Não reenvie o contador de RPS]
`rpsNumber` e `lastRpsSent` omitidos mantêm o contador da série. Um valor enviado
**sobrescreve** o contador, inclusive para trás: reenviar o número lido antes de uma
emissão repete números de RPS. Só os envie quando quiser mover o contador de
propósito, por exemplo ao trocar de série.
:::

O SDK não mediu esse comportamento por conta própria, porque exigiria escrever sobre
uma inscrição real. A fonte é a documentação da plataforma.

## Rotas que a plataforma não serve

`updatePrefecture` e `getSeries` estão **descontinuados**: as rotas
`.../municipaltaxes/{id}/updateprefecture` e `.../series/{serie}` estão declaradas na
OpenAPI, mas a plataforma responde `404`, igual ao de um caminho inexistente,
inclusive sem credencial (medido em 2026-09-02 e de novo em 2026-10-14). Os métodos
continuam emitindo a requisição; o `404` vem com essa explicação. Não há substituto
na API hoje.

## Próximos passos

- [Notas de serviço (NFS-e)](./service-invoices.md)
- [Empresas](./companies.md)
