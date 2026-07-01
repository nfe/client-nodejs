---
title: Tratamento de erros no SDK Node.js da NFE.io
sidebar_label: Erros
sidebar_position: 8
slug: erros
description: Hierarquia de erros (NfeError), type guards, mapeamento de status HTTP e política de retry.
---

# Erros

Todos os erros do SDK herdam de **`NfeError`**. Cada classe mapeia um tipo de
falha; use `instanceof` ou os **type guards** para ramificar.

## Hierarquia

| Classe | Quando ocorre |
|---|---|
| `NfeError` | Base de todos os erros do SDK. |
| `ValidationError` | 400 / validação local (inputs inválidos) — lançado **antes** do HTTP quando possível. |
| `AuthenticationError` | 401 (chave inválida/ausente). |
| `NotFoundError` | 404. |
| `ConflictError` | 409. |
| `RateLimitError` | 429 (com informação de retry). |
| `TimeoutError` | Timeout da requisição. |
| `ConnectionError` | Falha de rede/conexão. |
| `ServerError` / `InternalServerError` | 5xx. |
| `InvoiceProcessingError` | Emissão/cancelamento falhou (`IssueFailed`/`CancelFailed`) ou 202 sem `Location`. |
| `PollingTimeoutError` | Polling excedeu o `timeout` sem atingir estado terminal. |
| `ConfigurationError` | Configuração inválida (ex.: recurso sem chave). |

## Type guards

```typescript
import {
  isNfeError, isValidationError, isAuthenticationError,
  isNotFoundError, isTimeoutError, isConnectionError, isPollingTimeoutError,
} from 'nfe-io';

try {
  await nfe.serviceInvoices.createAndWait(companyId, data);
} catch (err) {
  if (isValidationError(err)) {
    // erro de dados — corrija o payload
  } else if (isPollingTimeoutError(err)) {
    // ainda processando — reconsulte depois com retrieve()
  } else if (isNfeError(err)) {
    console.error(err.message);
  } else {
    throw err;
  }
}
```

## Retry

O cliente HTTP repete automaticamente falhas transitórias (rede, 429, 5xx)
conforme o `retryConfig` (`maxRetries`, `baseDelay`, `maxDelay?`,
`backoffMultiplier?`). Erros de validação e 4xx **não** são repetidos.

:::warning POST não é repetido às cegas
Requisições que criam documentos fiscais **não** são repetidas automaticamente.
Em timeouts, reconsulte por `retrieveByExternalId`/`retrieve` (ou reenvie com a
mesma chave de idempotência) para evitar emissão duplicada.
:::

## Próximos passos

- [Configuração](./configuration.md) (retry/timeout)
- [Assíncrono e polling](./async-and-polling.md)
