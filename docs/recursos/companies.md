---
title: Empresas (emitentes)
sidebar_label: Empresas
sidebar_position: 4
slug: empresas
description: CRUD de empresas emitentes, iteração paginada, verificação de existência e gestão de certificados digitais com nfe.companies.
tags: [nodejs, empresa, referencia]
integration: [sdk]
---

# Empresas (emitentes)

`nfe.companies` gerencia as empresas emitentes (host `api.nfe.io`). A empresa é
o pré-requisito de toda emissão — e precisa de inscrição
([municipal](./municipal-taxes.md)/[estadual](./state-taxes.md)) e certificado.

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `create(data)` | Cria uma empresa. | `Company` |
| `retrieve(id)` / `update(id, data)` / `remove(id)` | CRUD. | `Company` / `void` |
| `exists(id)` | Existência via `HEAD` (404 → `false`). | `boolean` |
| `list(options?)` | Lista paginada. | `ListResponse<Company>` (`{ data, page }`) |
| `listAll()` | Coleta todas as páginas. | `Company[]` |
| `listIterator()` | Async iterator (lazy). | `AsyncIterableIterator<Company>` |
| `findByTaxNumber(cnpj)` / `findByName(name)` | Busca. | `Company` / lista |
| `uploadCertificate` / `replaceCertificate` / `validateCertificate` | Certificado (.pfx). | metadados |
| `getCertificateStatus` / `checkCertificateExpiration` | Status/validade do certificado. | info |

## Criar e verificar

```typescript
const company = await nfe.companies.create({
  name: 'Minha Empresa LTDA',
  federalTaxNumber: 11222333000181,
  email: 'fiscal@empresa.com',
});

if (await nfe.companies.exists(company.id)) {
  // pronta para configurar inscrições e certificado
}
```

### O CNPJ (`federalTaxNumber`)

- **Tipo `number`.** A API v1 de empresas trabalha com o CNPJ (ou CPF) como número.
- **Zero à esquerda.** Um CNPJ que começa com zero perde esse zero como número:
  `01234567999885` vira `1234567999885`. O SDK aceita o número assim e confere os dígitos
  verificadores depois de completar com zeros; a API faz o mesmo e grava as 14 posições. A
  leitura pela v1 devolve o número curto, e regravar a empresa com ele funciona.
  `findByTaxNumber` compara pelo valor, então acha a empresa pelo número curto.
- **String só com dígitos.** Em JavaScript sem tipos, uma string de 14 dígitos (CNPJ) ou 11
  (CPF) também é aceita, porque a API v1 aceita.
- **CNPJ alfanumérico** (IN RFB 2.229/2024, com letras nas 12 primeiras posições). A API v1 de
  empresas não aceita esse formato; só a API v3 aceita. O SDK lança `ValidationError` antes da
  requisição.

## Iterar todas as empresas

```typescript
for await (const c of nfe.companies.listIterator()) {
  console.log(c.id, c.name);
}
```

:::info Certificado
O upload do certificado (`uploadCertificate`) vive no host `api.nfe.io`. A
consulta/remoção por thumbprint fica em [Certificados](./certificates.md)
(host `api.nfse.io`).
:::

## Próximos passos

- [Inscrições municipais](./municipal-taxes.md) e [estaduais](./state-taxes.md)
- [Certificados](./certificates.md)
- [Paginação](../pagination.md)
