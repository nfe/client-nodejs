# Tarefas: Corrigir Verificação de Assinatura de Webhook

**Change ID**: `fix-webhook-signature-verification`
**Esforço estimado**: 2 dias
**Prioridade**: 🔴 CRÍTICA

---

## Fase 1 — Correção principal

- [x] **1.1** Substituir `require` em runtime por import estático de `node:crypto` em [src/core/resources/webhooks.ts](../../../src/core/resources/webhooks.ts)
- [x] **1.2** Reescrever o corpo de `validateSignature` conforme [design.md](./design.md): aceitar `Buffer | string` no payload, `string | string[] | undefined` na assinatura, validar prefixo `sha1=`, normalizar case, comparar via `timingSafeEqual` em buffers de 20 bytes
- [x] **1.3** Atualizar JSDoc da função: trocar `X-NFE-Signature` → `X-Hub-Signature`, mostrar exemplo com `express.raw()`, documentar trade-off Buffer vs string
- [x] **1.4** `npm run typecheck && npm run lint` saem com exit code 0

## Fase 2 — Testes com fixtures reais

- [x] **2.1** Criar `tests/fixtures/webhook-signatures.json` com 3 triplets (body, secret, header_value) capturados do probe ao vivo
- [x] **2.2** Adicionar testes positivos em `tests/unit/webhooks-signature.test.ts`: cada fixture valida; round-trip random; case-insensitivity; Buffer e string equivalentes; header como array
- [x] **2.3** Adicionar testes negativos: body adulterado, secret errado, prefixo errado, sem prefixo, comprimento inválido, hex inválido, undefined/empty inputs — todos retornam `false` e NÃO lançam exceção
- [x] **2.4** `npm run test:coverage` mostra 100% de cobertura de branches em `validateSignature`; cobertura geral do recurso ≥ 80%

## Fase 3 — Propagação de documentação

- [x] **3.1** Atualizar `docs/API.md`: trocar `x-nfe-signature` → `x-hub-signature`, atualizar snippet pra `express.raw()` + `req.body` Buffer, adicionar nota sobre HMAC-SHA1 + hex maiúsculo + prefixo `sha1=`
- [x] **3.2** Atualizar `examples/all-resources-demo.js` e `examples/real-world-webhooks.js`: nome do header correto + padrão `express.raw()` + `req.body`
- [x] **3.3** Atualizar `skills/nfeio-sdk/SKILL.md` e `skills/nfeio-sdk/references/service-invoices-and-polling.md`: mencionar explicitamente prefixo `sha1=`, hex maiúsculo, preferir `Buffer`
- [x] **3.4** Adicionar entrada destacada em `CHANGELOG.md` (em português, conforme convenção do projeto) sinalizando a correção crítica

## Fase 4 — Helpers ergonômicos (opcional, pode ficar pra follow-up)

- [ ] **4.1** Implementar `verifyRequest({ headers, body }, secret): boolean` que compõe sobre `validateSignature`
- [ ] **4.2** Expor tipo `WebhookDeliveryHeaders` com `xHookId`, `xHookAttempts`, `contentMd5`, `xHubSignature` parseados; adicionar helper `parseDeliveryHeaders(headers)`

---

## Definition of Done

- [x] Todas as tasks das Fases 1–3 marcadas como completas
- [x] `npm run typecheck && npm run lint && npm test -- --run` todos passam (650 testes verdes, 0 falhas)
- [x] `validateSignature` tem 100% de cobertura de branches
- [x] Uma nova execução manual do probe contra o sandbox confirma que os fixtures continuam validando (rodado durante 2.1; 3/3 fixtures bateram com `sha1_hex_upper_prefixed`)
- [x] Entrada no CHANGELOG comitada
- [x] Zero ocorrências acidentais de `X-NFE-Signature` em `src/`, `docs/`, `examples/`, `skills/` (as únicas duas restantes são callouts explícitos do tipo "não use isso")
- [x] Zero ocorrências acidentais de `sha256`/`SHA-256` no contexto de assinatura de webhook (as restantes são teste negativo e disclaimers "not SHA-256")
- [ ] Descrição do PR inclui link pra esta proposta e evidência do probe (pendente — PR ainda não aberta)
