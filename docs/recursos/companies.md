---
title: Empresas (emitentes)
sidebar_label: Empresas
sidebar_position: 4
slug: empresas
description: CRUD de empresas emitentes, iteração paginada, verificação de existência e gestão de certificados digitais com nfe.companies.
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
