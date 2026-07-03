/**
 * Alignment guard: o tipo manuscrito `AccountWebhook` amarrado ao schema GERADO
 * do spec oficial (`src/generated/nf-servico-v1.ts`, paths `/v2/webhooks`).
 *
 * Se um sync de spec mudar o contrato de webhooks, este arquivo quebra o
 * `npm run test:types` em vez de deixar o tipo manual driftar em silêncio —
 * a causa raiz do bug original (contrato company-scoped alucinado no rewrite)
 * foi exatamente o resource manuscrito ignorar estas fontes.
 *
 * Desvios DELIBERADOS do gerado (contrato de fio real, sonda 2026-07-02):
 *  - `contentType`/`status`: o spec declara enums inteiros (0 | 1), mas a API
 *    serializa strings ("json", "Active"). O AccountWebhook segue o fio.
 *    Divergência reportada ao time de docs (tasks.md 3.3). As assertions abaixo
 *    PINAM o enum int do gerado: se o spec for corrigido para string, elas
 *    falham — sinal para remover o desvio daqui e do types.ts.
 *  - `id`: ausente no body de create do gerado (a API que o atribui); presente
 *    no AccountWebhook porque o mesmo tipo descreve as respostas.
 */

import { describe, it, expectTypeOf } from 'vitest';
import type { paths } from '../../src/generated/nf-servico-v1.js';
import type { AccountWebhook } from '../../src/index.js';

// Schema gerado do body de criação (POST /v2/webhooks -> requestBody -> webHook)
type GeneratedCreateEnvelope = NonNullable<
  paths['/v2/webhooks']['post']['requestBody']
>['content']['application/json'];
type GeneratedWebHook = NonNullable<GeneratedCreateEnvelope['webHook']>;

describe('AccountWebhook ↔ schema gerado de /v2/webhooks', () => {
  it('o request de create é envelopado na chave webHook (contrato ao vivo: 400 sem ela)', () => {
    expectTypeOf<keyof GeneratedCreateEnvelope>().toEqualTypeOf<'webHook'>();
  });

  it('todo campo do gerado existe no AccountWebhook (spec sync novo → campo novo → falha aqui)', () => {
    expectTypeOf<keyof GeneratedWebHook>().toExtend<keyof AccountWebhook>();
  });

  it('AccountWebhook não inventa campos: só o gerado + id (respostas)', () => {
    expectTypeOf<Exclude<keyof AccountWebhook, keyof GeneratedWebHook>>().toEqualTypeOf<'id'>();
  });

  it('campos de contrato idêntico ao gerado', () => {
    const g = {} as GeneratedWebHook;
    expectTypeOf(g.uri).toEqualTypeOf<string>();
    expectTypeOf(g.secret).toEqualTypeOf<string | undefined>();
    expectTypeOf(g.insecureSsl).toEqualTypeOf<boolean | undefined>();
    expectTypeOf(g.createdOn).toEqualTypeOf<string | undefined>();
    expectTypeOf(g.modifiedOn).toEqualTypeOf<string | undefined>();
    const a = {} as AccountWebhook;
    expectTypeOf(a.uri).toEqualTypeOf<string>();
    expectTypeOf(a.secret).toEqualTypeOf<string | undefined>();
    expectTypeOf(a.insecureSsl).toEqualTypeOf<boolean | undefined>();
  });

  it('DESVIO PINADO: spec declara contentType/status como enum int; o fio real é string', () => {
    // Se estas duas falharem, o spec foi corrigido → remover o desvio do AccountWebhook.
    expectTypeOf<GeneratedWebHook['contentType']>().toEqualTypeOf<0 | 1 | undefined>();
    expectTypeOf<GeneratedWebHook['status']>().toEqualTypeOf<0 | 1 | undefined>();
    // O tipo público segue o formato de fio (sonda 2026-07-02: "json" / "Active").
    const a = {} as AccountWebhook;
    expectTypeOf(a.contentType).toExtend<string | undefined>();
    expectTypeOf(a.status).toExtend<string | undefined>();
  });

  it('filters aceita os event types reais (união aberta sobre o string[] do gerado)', () => {
    const g = {} as GeneratedWebHook;
    expectTypeOf(g.filters).toEqualTypeOf<readonly string[] | undefined>();
    const ok: AccountWebhook = {
      uri: 'https://example.com/hook',
      filters: ['service_invoice.issued_successfully', 'um_evento_futuro.qualquer'],
    };
    expectTypeOf(ok.filters).not.toBeNever();
  });
});
