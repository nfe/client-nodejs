/**
 * Alignment guard: `ManifestEventType` amarrado ao enum de `tpEvent` que a plataforma declara na
 * rota de manifestação: `[210200, 210210, 210220, 210240]`.
 *
 * Até a 6.0.1 o tipo não tinha o `210200` (Confirmação da Operação), e a documentação chamava o
 * `210220` (Desconhecimento da Operação) de Confirmação. Enviar o `210220` por engano registra na
 * SEFAZ que a operação não é reconhecida. Se alguém remover o `210200` ou mudar o conjunto, este
 * teste quebra em vez de driftar em silêncio.
 */

import { describe, it, expectTypeOf } from 'vitest';
import type { ManifestEventType } from '../../src/index.js';

describe('ManifestEventType: alinhamento com o enum da plataforma', () => {
  it('tem exatamente os quatro códigos da manifestação do destinatário', () => {
    expectTypeOf<ManifestEventType>().toEqualTypeOf<210200 | 210210 | 210220 | 210240>();
  });

  it('aceita o 210200, a Confirmação da Operação', () => {
    expectTypeOf<210200>().toMatchTypeOf<ManifestEventType>();
  });
});
