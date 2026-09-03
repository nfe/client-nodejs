/**
 * O aviso de rota não servida não pode virar bloqueio.
 *
 * Quatro métodos públicos apontam para rotas que a plataforma não serve
 * (`municipalTaxes.getSeries`, `.updatePrefecture`, `consumerInvoiceQuery.retrieve`,
 * `.downloadXml`). O SDK enriquece o `404` para o chamador não confundir com
 * "esse dado não existe" — mas **não** recusa a chamada no cliente: se a rota
 * subir, o `200` tem que passar sem que ninguém precise lembrar de remover um
 * guard.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  withUnservedRouteNote,
  UNSERVED_ROUTE_MEASURED_ON,
} from '../../../src/core/utils/unserved-route.js';
import {
  NotFoundError,
  ValidationError,
  AuthenticationError,
} from '../../../src/core/errors/index.js';

const ROTA = 'GET /v1/exemplo/{id}';

describe('withUnservedRouteNote', () => {
  it('deixa a resposta de sucesso passar intacta', async () => {
    const call = vi.fn().mockResolvedValue({ data: { ok: true }, status: 200 });

    await expect(withUnservedRouteNote(ROTA, call)).resolves.toEqual({
      data: { ok: true },
      status: 200,
    });
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('a requisição sai — nada é bloqueado antes da chamada', async () => {
    const call = vi.fn().mockRejectedValue(new NotFoundError('Not found'));

    await expect(withUnservedRouteNote(ROTA, call)).rejects.toThrow();
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('no 404, explica que a rota não é servida e cita a rota e a data', async () => {
    const call = vi.fn().mockRejectedValue(new NotFoundError('Not found'));

    const erro = await withUnservedRouteNote(ROTA, call).catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(NotFoundError);
    expect((erro as NotFoundError).message).toContain(ROTA);
    expect((erro as NotFoundError).message).toContain(UNSERVED_ROUTE_MEASURED_ON);
    expect((erro as NotFoundError).message).toContain('não serve');
  });

  it('preserva a classe do erro, para não quebrar quem trata instanceof', async () => {
    const call = vi.fn().mockRejectedValue(new NotFoundError('Not found'));

    const erro = await withUnservedRouteNote(ROTA, call).catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(NotFoundError);
    expect((erro as NotFoundError).statusCode).toBe(404);
  });

  it('preserva os detalhes do erro original', async () => {
    const details = { corpo: 'vazio' };
    const call = vi.fn().mockRejectedValue(new NotFoundError('Not found', details));

    const erro = await withUnservedRouteNote(ROTA, call).catch((e: unknown) => e);

    expect((erro as NotFoundError).details).toEqual(details);
  });

  it.each([
    ['ValidationError', new ValidationError('inválido')],
    ['AuthenticationError', new AuthenticationError('sem credencial')],
    ['Error comum', new Error('rede caiu')],
  ])('não toca em %s', async (_nome, original) => {
    const call = vi.fn().mockRejectedValue(original);

    await expect(withUnservedRouteNote(ROTA, call)).rejects.toBe(original);
  });
});
