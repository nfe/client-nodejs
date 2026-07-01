---
title: Biblioteca NFE.io em Node.js para Emissão de Notas Fiscais (NFS-e, NF-e, NFC-e, CT-e)
description: SDK Node.js oficial da NFE.io — TypeScript nativo, Node 22+, zero dependências de runtime, ESM + CommonJS e respostas discriminadas.
sidebar_label: Biblioteca Node.js
slug: /desenvolvedores/bibliotecas/node
provider: NFE.io
badge: SDK
layout_type: IntegrationLayout
heroImage: /docs/img/bibliotecas/nodejs.svg
ctaLabel: GitHub NFE.io Node.js
ctaUrl: https://github.com/nfe/client-nodejs
---

# Biblioteca Node.js NFE.io

SDK oficial da [NFE.io](https://nfe.io) para Node.js: emissão e gestão de
documentos fiscais eletrônicos brasileiros (NFS-e, NF-e, NFC-e, CT-e) com
ergonomia moderna e **zero dependências de runtime**.

- **Cliente único** `NfeClient` com acessores `camelCase` por recurso, inicializados sob demanda (lazy).
- **TypeScript nativo** — tipos gerados das specs OpenAPI oficiais; autocompletar e checagem no editor.
- **Respostas discriminadas** para emissão assíncrona (`{ status: 'immediate' | 'async' }`) e utilitários de polling.
- **ESM + CommonJS** no mesmo pacote; alvo **Node.js 22+**.

## Requisitos

- Node.js **22** ou superior.
- **Zero dependências de runtime** — apenas APIs nativas do Node (fetch, AbortController, Buffer).

## Instalação

```sh
npm install nfe-io
# ou: pnpm add nfe-io / yarn add nfe-io
```

## Primeiros passos

```typescript
import { NfeClient } from 'nfe-io';

const nfe = new NfeClient({ apiKey: process.env.NFE_API_KEY });

const result = await nfe.serviceInvoices.create('55df4dc6b6cd9007e4f13ee8', {
  cityServiceCode: '2690',
  description: 'Manutenção e suporte técnico',
  servicesAmount: 100.0,
  borrower: { federalTaxNumber: 191, name: 'Banco do Brasil SA' },
});
```

O fluxo completo (retorno discriminado + polling) está em
[Primeiros passos](./getting-started.md).

## Guias

- [Primeiros passos](./getting-started.md) — instalação, cliente e primeira NFS-e.
- [Configuração](./configuration.md) — chaves de API, ambiente, timeout e retry.
- [Emissão assíncrona e polling](./async-and-polling.md) — retorno discriminado e `createAndWait`.
- [Roteamento multi-host / multi-chave](./multi-host-routing.md) — quais recursos usam qual host e chave.
- [Paginação](./pagination.md) — listas page-style e cursor.
- [Downloads (PDF/XML)](./downloads.md) — bytes binários e ZIPs.
- [Webhooks](./webhooks.md) — assinatura, eventos e webhooks de conta.
- [Erros](./errors.md) — hierarquia de erros e type guards.
- [Emissão RTC (Reforma Tributária)](./rtc-emission.md) — leiautes IBS/CBS/IS.

## Recursos (cookbook)

Um guia prático por recurso em [Recursos](./recursos/). Destaques:

- [Notas de serviço (NFS-e)](./recursos/service-invoices.md)
- [Notas de produto (NF-e)](./recursos/product-invoices.md)
- [NFC-e (consumidor)](./recursos/consumer-invoices.md)
- [Empresas](./recursos/companies.md) · [Inscrições municipais](./recursos/municipal-taxes.md) · [Inscrições estaduais](./recursos/state-taxes.md)
- [Consulta CNPJ](./recursos/legal-entity-lookup.md) · [Consulta CPF](./recursos/natural-person-lookup.md) · [Consulta CEP](./recursos/addresses.md)
