---
title: Configuração do SDK Node.js da NFE.io
sidebar_label: Configuração
sidebar_position: 2
slug: configuracao
description: Chaves de API (apiKey e dataApiKey), ambiente, timeout, retry e reconfiguração em runtime do NfeClient.
---

# Configuração

O `NfeClient` recebe um objeto `NfeConfig`. Todos os campos são opcionais, mas
ao menos uma chave de API é necessária para a maioria dos recursos.

```typescript
import { NfeClient } from 'nfe-io';

const nfe = new NfeClient({
  apiKey: process.env.NFE_API_KEY,        // chave principal (emissão, empresas, ...)
  dataApiKey: process.env.NFE_DATA_API_KEY, // chave de dados/consulta (opcional)
  environment: 'production',                // 'production' | 'development'
  timeout: 30000,                           // ms
  retryConfig: { maxRetries: 3, baseDelay: 1000, maxDelay: 5000, backoffMultiplier: 2 },
});
```

## Campos

| Campo | Tipo | Descrição |
|---|---|---|
| `apiKey` | `string` | Chave principal: emissão (NFS-e/NF-e/NFC-e), empresas, webhooks, tax-codes. |
| `dataApiKey` | `string` | Chave de dados/consulta: CEP, CNPJ, CPF, CT-e. Faz fallback para `apiKey`. |
| `environment` | `'production' \| 'development'` | Seleciona homologação vs produção. |
| `baseUrl` | `string` | Sobrescreve o host padrão (uso avançado/testes). |
| `timeout` | `number` | Timeout por requisição, em ms. |
| `retryConfig` | `RetryConfig` | `maxRetries`, `baseDelay`, `maxDelay?`, `backoffMultiplier?`. |

:::info Duas chaves, dois escopos
Recursos de **dados/consulta** (endereço, CNPJ, CPF) usam `dataApiKey` (com
fallback para `apiKey`). Os demais usam `apiKey`. Veja
[Roteamento multi-host / multi-chave](./multi-host-routing.md).
:::

## A partir do ambiente

```typescript
import { createClientFromEnv } from 'nfe-io';
// lê NFE_API_KEY (e NFE_DATA_API_KEY, se houver)
const nfe = createClientFromEnv('production');
```

## Reconfigurar em runtime

`updateConfig` reaplica a configuração e **invalida todos os caches** de
recursos e clientes HTTP — nenhuma instância retém host/chave/timeout antigos.

```typescript
nfe.updateConfig({ timeout: 60000 });
```

## Próximos passos

- [Roteamento multi-host / multi-chave](./multi-host-routing.md)
- [Erros](./errors.md) e política de retry
- [Primeiros passos](./getting-started.md)
