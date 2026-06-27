/**
 * Type-level regression guard for the additive Company repoint (0B).
 *
 * This file is type-checked by `npm run test:types` (vitest --typecheck). A plain
 * .test.ts would be excluded from type-checking, so the guard must live here.
 */

import { describe, it, expectTypeOf } from 'vitest';
import type {
  Company,
  CompanyResourceItem,
  CreateCompanyResourceItem,
} from '../../src/index.js';

describe('Company type — additive, non-breaking', () => {
  it('keeps the permissive index signature (arbitrary reads compile as unknown)', () => {
    const c = {} as Company;
    expectTypeOf(c.someUndocumentedField).toBeUnknown();
  });

  it('preserves existing required field types', () => {
    const c = {} as Company;
    expectTypeOf(c.name).toEqualTypeOf<string>();
    expectTypeOf(c.federalTaxNumber).toEqualTypeOf<number>();
  });

  it('exposes the strict spec-backed types for opt-in use', () => {
    expectTypeOf<CompanyResourceItem>().not.toBeNever();
    expectTypeOf<CreateCompanyResourceItem>().not.toBeNever();
  });
});
