/**
 * Alignment guard: os corpos de escrita de companies amarrados aos schemas
 * gerados da contribuintes-v2 (`CreateCompanyResourceItem` /
 * `UpdateCompanyResourceItem`).
 *
 * As assinaturas públicas de `create()`/`update()` seguem frouxas
 * (`Omit<Company>` / `Partial<Company>`, compat legada — tightening fica para
 * a próxima major ou para a migração de CRUD v2). Este arquivo PINA o contrato
 * real do fio no nível de tipo: se um sync de spec mudar os obrigatórios do
 * corpo de create/update, o `npm run test:types` quebra em vez de driftar.
 *
 * Fatos pinados (nota Obsidian "companies create-update com tipagem frouxa",
 * 2026-07-13):
 *  - create e update exigem o MESMO conjunto: name, federalTaxNumber,
 *    taxRegime, address — update é PUT (substituição total), não PATCH;
 *  - `email` NÃO existe no corpo de escrita (apesar de o tipo `Company`
 *    legado exigi-lo).
 */

import { describe, it, expectTypeOf } from 'vitest';
import type {
  CreateCompanyResourceItem,
  UpdateCompanyResourceItem,
} from '../../src/index.js';

// Chaves obrigatórias de um objeto (as que não aceitam undefined por omissão)
type RequiredKeys<T> = {
  [K in keyof T]-?: object extends Pick<T, K> ? never : K;
}[keyof T];

describe('Corpos de escrita de companies ↔ schemas gerados (contribuintes-v2)', () => {
  it('create exige exatamente name, federalTaxNumber, taxRegime e address', () => {
    expectTypeOf<RequiredKeys<CreateCompanyResourceItem>>().toEqualTypeOf<
      'name' | 'federalTaxNumber' | 'taxRegime' | 'address'
    >();
  });

  it('update (PUT, substituição total) exige o MESMO conjunto do create', () => {
    expectTypeOf<RequiredKeys<UpdateCompanyResourceItem>>().toEqualTypeOf<
      RequiredKeys<CreateCompanyResourceItem>
    >();
  });

  it('email NÃO faz parte do corpo de escrita (create nem update)', () => {
    expectTypeOf<'email'>().not.toExtend<keyof CreateCompanyResourceItem>();
    expectTypeOf<'email'>().not.toExtend<keyof UpdateCompanyResourceItem>();
  });

  it('update aceita id opcional além do conjunto do create (única diferença)', () => {
    expectTypeOf<
      Exclude<keyof UpdateCompanyResourceItem, keyof CreateCompanyResourceItem>
    >().toEqualTypeOf<'id'>();
  });

  it('tipos de contrato dos obrigatórios', () => {
    const c = {} as CreateCompanyResourceItem;
    expectTypeOf(c.name).toEqualTypeOf<string>();
    expectTypeOf(c.federalTaxNumber).toEqualTypeOf<number>();
    expectTypeOf(c.address).not.toBeNever();
    expectTypeOf(c.taxRegime).not.toBeNever();
  });
});
