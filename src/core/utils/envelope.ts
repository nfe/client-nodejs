/**
 * NFE.io SDK — envelopes de propriedade única nas respostas da API.
 *
 * Várias rotas respondem com a entidade embrulhada numa propriedade só:
 * `{ "municipalTax": {…} }`, `{ "stateTax": {…} }`, `{ "notification": {…} }`.
 * Até a v6.0.0, alguns métodos devolviam esse envelope com o tipo da entidade:
 * o código que seguia o tipo compilava e lia `resultado.id` como `undefined`.
 *
 * Medido em 2026-10-15: a leitura por id dos três recursos responde com o
 * envelope. A spec `contribuintes-v2` declara o mesmo envelope no `POST` e no
 * `PUT` das inscrições, que não foram sondados porque exigiriam escrita. Por
 * isso o desembrulho é defensivo: se a resposta vier com a entidade direta, ela
 * passa como veio.
 *
 * Não fica na camada HTTP de propósito. Cada recurso sabe a chave do próprio
 * envelope; um desembrulho genérico ali teria de adivinhá-la e mudaria o retorno
 * de métodos que já desembrulham certo (`companies`, `webhooks`, `legalPeople`).
 */

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Devolve `body[key]` quando ele é um objeto; nos demais casos, o `body` como veio.
 *
 * @param body - O corpo da resposta, já parseado
 * @param key - A propriedade do envelope (`municipalTax`, `stateTax`, `notification`…)
 */
export function unwrapEnvelope<T>(body: unknown, key: string): T {
  if (isPlainObject(body) && isPlainObject(body[key])) {
    return body[key] as T;
  }
  return body as T;
}
