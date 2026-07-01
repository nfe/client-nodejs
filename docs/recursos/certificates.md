---
title: Certificados digitais (por thumbprint)
sidebar_label: Certificados
sidebar_position: 7
slug: certificados
description: Consulta e remoção de certificados digitais por thumbprint com nfe.certificates (host api.nfse.io), com variantes v1.
---

# Certificados (por thumbprint)

`nfe.certificates` (host `api.nfse.io`) lista, consulta e remove certificados
digitais por **thumbprint**. Complementa o upload legado
(`companies.uploadCertificate`, host `api.nfe.io`).

## Métodos

| Método | Descrição | Retorno |
|---|---|---|
| `list(companyId)` | Lista os certificados da empresa. | `{ certificates }` |
| `getByThumbprint(companyId, thumbprint)` | Consulta por thumbprint. | metadados do certificado |
| `deleteByThumbprint(companyId, thumbprint)` | Remove por thumbprint. | `void` |
| `getByThumbprintV1(companyId, thumbprint)` | Variante v1. | metadados |
| `deleteByThumbprintV1(companyId, thumbprint)` | Variante v1. | `void` |

## Exemplo

```typescript
const { certificates = [] } = await nfe.certificates.list(companyId);

const thumb = certificates[0]?.thumbprint;
if (thumb) {
  const cert = await nfe.certificates.getByThumbprint(companyId, thumb);
  // await nfe.certificates.deleteByThumbprint(companyId, thumb);
}
```

:::info Upload de certificado
O envio do `.pfx` é feito por `companies.uploadCertificate` (host `api.nfe.io`).
Aqui você consulta/remove o que já foi enviado.
:::

## Próximos passos

- [Empresas](./companies.md)
