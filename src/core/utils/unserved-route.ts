/**
 * NFE.io SDK — rotas declaradas na spec que a plataforma não serve.
 *
 * Algumas rotas existem na OpenAPI (e no `nfeio-docs`) e simplesmente não são
 * roteadas em produção. O chamador recebe `404` e não tem como distinguir isso de
 * "esse dado não existe" — vai procurar defeito nos próprios dados, ou reportar
 * como bug do SDK.
 *
 * Como a distinção foi feita (2026-09-02):
 *
 * - Comparar com um path inventado no mesmo host. `404` de corpo vazio, sem
 *   `content-type`, byte a byte igual ao do path inventado, é roteamento — não
 *   "não encontrado". Rota servida devolve corpo com mensagem.
 * - Confirmação independente: rota servida responde `401` **sem credencial**;
 *   rota não servida responde `404` sem credencial, porque o middleware de
 *   autenticação nem chega a rodar.
 *
 * O SDK **não** bloqueia a chamada no cliente. A requisição sai; só o `404` é
 * enriquecido. Se a rota voltar a ser servida, o `200` passa intacto e nada aqui
 * precisa ser desfeito — um guard antes da requisição congelaria a medição de
 * hoje no código, e ninguém lembraria de removê-lo.
 */

import { NotFoundError, isNotFoundError } from '../errors/index.js';

/** Quando a ausência da rota foi medida. */
export const UNSERVED_ROUTE_MEASURED_ON = '2026-09-02';

/**
 * Executa a chamada e, **somente** em `404`, relança com a explicação.
 *
 * Preserva a classe do erro (`NotFoundError`), para não quebrar quem já trata
 * `instanceof` ou `isNotFoundError()`.
 *
 * @param route - A rota, como aparece na spec
 * @param call - A requisição
 */
export async function withUnservedRouteNote<T>(route: string, call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    if (!isNotFoundError(error)) throw error;

    throw new NotFoundError(
      `A plataforma não serve a rota ${route} (medido em ${UNSERVED_ROUTE_MEASURED_ON}): ` +
        'ela está declarada na OpenAPI e responde 404 idêntico ao de um caminho inexistente, ' +
        'inclusive sem credencial. Não é "registro não encontrado" — é rota ausente, e não há ' +
        'nada a corrigir na chamada. Pendência aberta com o time de API.',
      error.details
    );
  }
}
