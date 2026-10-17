/**
 * O desembrulho de envelope é defensivo.
 *
 * A leitura por id de inscrição municipal, inscrição estadual e notificação
 * responde `{ "<chave>": {…} }` (medido em 2026-10-15). O `POST` e o `PUT` das
 * inscrições não foram sondados, então o helper precisa aceitar também a
 * entidade direta — e não pode inventar desembrulho onde não há envelope.
 */

import { describe, it, expect } from 'vitest';
import { unwrapEnvelope } from '../../../src/core/utils/envelope.js';

describe('unwrapEnvelope', () => {
  it('devolve o conteúdo da chave quando o corpo é o envelope', () => {
    const body = { municipalTax: { id: 'mt-1', taxNumber: '123' } };

    expect(unwrapEnvelope(body, 'municipalTax')).toEqual({ id: 'mt-1', taxNumber: '123' });
  });

  it('devolve a entidade direta como veio', () => {
    const body = { id: 'mt-1', taxNumber: '123' };

    expect(unwrapEnvelope(body, 'municipalTax')).toBe(body);
  });

  it('devolve o corpo como veio quando a chave está ausente', () => {
    const body = { hasMore: false, municipalTaxes: [] };

    expect(unwrapEnvelope(body, 'municipalTax')).toBe(body);
  });

  it('não desembrulha quando o valor da chave não é objeto', () => {
    for (const value of [null, 'texto', 42, [{ id: 'x' }]]) {
      const body = { stateTax: value };

      expect(unwrapEnvelope(body, 'stateTax')).toBe(body);
    }
  });

  it('não quebra com corpo vazio ou não objeto', () => {
    expect(unwrapEnvelope(undefined, 'notification')).toBeUndefined();
    expect(unwrapEnvelope(null, 'notification')).toBeNull();
    expect(unwrapEnvelope('texto', 'notification')).toBe('texto');
  });
});
