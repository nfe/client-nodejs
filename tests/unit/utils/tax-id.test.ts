/**
 * Regra única de CNPJ, CPF e chave de acesso (change fix-tax-id-validation).
 *
 * Vetores:
 * - `12ABC34501DE35`: exemplo público da Receita Federal para o CNPJ alfanumérico;
 * - `FIOUQ123000109`: sintético com F, I, O, U e Q, que a Receita aceita;
 * - `01234567999885`: sintético que começa com zero; a consulta de CNPJ confirmou que não
 *   existe na Receita (2026-11-18);
 * - a chave de acesso é sintética, montada com o CNPJ de exemplo da Receita.
 */

import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../../src/core/errors/index.js';
import {
  isAlphanumericCnpj,
  isValidAccessKey,
  isValidCnpj,
  isValidCpf,
  normalizeAccessKey,
  normalizeCnpj,
  normalizeCpf,
  requireAccessKey,
  requireCnpj,
} from '../../../src/core/utils/tax-id.js';

const ALPHA_KEY = '35260612ABC34501DE35550010000000031100000033';

/** Cálculo numérico usado até a v6.0.1 (`companies.ts`), para provar equivalência. */
function legacyNumericCnpjIsValid(cnpj: number): boolean {
  const cnpjStr = cnpj.toString().padStart(14, '0');
  if (cnpjStr.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpjStr)) return false;
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpjStr[i]!) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (firstDigit !== parseInt(cnpjStr[12]!)) return false;
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpjStr[i]!) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return secondDigit === parseInt(cnpjStr[13]!);
}

describe('tax-id: CNPJ', () => {
  it('aceita o exemplo alfanumérico da Receita e recusa o DV errado', () => {
    expect(isValidCnpj('12ABC34501DE35')).toBe(true);
    expect(isValidCnpj('12ABC34501DE36')).toBe(false);
  });

  it('aceita as 26 letras, inclusive F, I, O, U e Q', () => {
    expect(isValidCnpj('FIOUQ123000109')).toBe(true);
  });

  it('aceita o CNPJ numérico tradicional e recusa sequência repetida', () => {
    expect(isValidCnpj('11222333999952')).toBe(true);
    expect(isValidCnpj(11222333999952)).toBe(true);
    expect(isValidCnpj('11111111111111')).toBe(false);
    expect(isValidCnpj('00000000000000')).toBe(false);
  });

  it('completa com zeros o number que perdeu o zero à esquerda', () => {
    expect(normalizeCnpj(1234567999885)).toBe('01234567999885');
    expect(isValidCnpj(1234567999885)).toBe(true);
    expect(isValidCnpj(1234567999886)).toBe(false);
  });

  it('não completa string curta: string precisa ter 14 posições depois da normalização', () => {
    expect(isValidCnpj('1234567999885')).toBe(false);
  });

  it('normaliza máscara e minúsculas sem perder letras', () => {
    expect(normalizeCnpj('12.abc.345/01de-35')).toBe('12ABC34501DE35');
    expect(normalizeCnpj(' 11.222.333/9999-52 ')).toBe('11222333999952');
    expect(isValidCnpj('12.abc.345/01de-35')).toBe(true);
  });

  it('recusa formato com letra nos dígitos verificadores ou tamanho errado', () => {
    expect(isValidCnpj('12ABC34501DEA5')).toBe(false);
    expect(isValidCnpj('12ABC34501DE3')).toBe(false);
    expect(isValidCnpj('CNPJ 11.222.333/9999-52')).toBe(false);
  });

  it('recusa number que não é inteiro seguro e não negativo', () => {
    expect(isValidCnpj(-11222333999952)).toBe(false);
    expect(isValidCnpj(11222333999952.5)).toBe(false);
    expect(isValidCnpj(Number.NaN)).toBe(false);
  });

  it('detecta CNPJ alfanumérico pelas 12 primeiras posições', () => {
    expect(isAlphanumericCnpj('12.ABC.345/01DE-35')).toBe(true);
    expect(isAlphanumericCnpj('12abc34501de35')).toBe(true);
    expect(isAlphanumericCnpj('11222333999952')).toBe(false);
    expect(isAlphanumericCnpj(11222333999952)).toBe(false);
  });

  it('dá o mesmo resultado que o cálculo numérico antigo para os CNPJs da suíte', () => {
    const numerics = [
      11222333999952, 12345678000276, 11111111000111, 11122233344455, 11223344000155,
      12345678000190, 12345678901234, 33333333000133, 98765432000110, 98765432109876,
      11444555000149, 1234567999885, 191,
    ];
    for (const cnpj of numerics) {
      expect(isValidCnpj(cnpj), String(cnpj)).toBe(legacyNumericCnpjIsValid(cnpj));
    }
  });

  describe('requireCnpj', () => {
    it('devolve o CNPJ normalizado', () => {
      expect(requireCnpj('12.abc.345/01de-35')).toBe('12ABC34501DE35');
      expect(requireCnpj(1234567999885)).toBe('01234567999885');
    });

    it('lança ValidationError para vazio, formato e DV', () => {
      expect(() => requireCnpj('')).toThrow('Federal tax number (CNPJ) is required');
      expect(() => requireCnpj('   ')).toThrow(ValidationError);
      expect(() => requireCnpj(undefined)).toThrow(ValidationError);
      expect(() => requireCnpj('CNPJ 11.222.333/9999-52')).toThrow(
        '12 letters or digits followed by 2 check digits'
      );
      expect(() => requireCnpj('12ABC34501DE36')).toThrow('check digits do not match');
    });
  });
});

describe('tax-id: CPF', () => {
  it('valida o CPF e completa com zeros o number', () => {
    expect(normalizeCpf(1234567890)).toBe('01234567890');
    expect(isValidCpf(1234567890)).toBe(true);
    expect(isValidCpf('012.345.678-90')).toBe(true);
    expect(isValidCpf('01234567891')).toBe(false);
    expect(isValidCpf('11111111111')).toBe(false);
  });

  it('não arranca letras: string com letra não vira CPF válido', () => {
    expect(isValidCpf('A01234567890')).toBe(false);
  });
});

describe('tax-id: chave de acesso', () => {
  it('aceita letras nas posições 7 a 18 e normaliza para maiúsculas', () => {
    expect(isValidAccessKey(ALPHA_KEY)).toBe(true);
    expect(normalizeAccessKey(` ${ALPHA_KEY.toLowerCase()} `)).toBe(ALPHA_KEY);
    expect(requireAccessKey(ALPHA_KEY.toLowerCase())).toBe(ALPHA_KEY);
  });

  it('continua aceitando a chave numérica', () => {
    expect(isValidAccessKey('35240112345678000190550010000001231234567890')).toBe(true);
  });

  it('recusa letra fora do CNPJ', () => {
    expect(isValidAccessKey(`${ALPHA_KEY.slice(0, 43)}X`)).toBe(false);
    expect(isValidAccessKey(`A${ALPHA_KEY.slice(1)}`)).toBe(false);
    expect(isValidAccessKey(`${ALPHA_KEY.slice(0, 20)}A${ALPHA_KEY.slice(21)}`)).toBe(false);
  });

  it('lança ValidationError para vazio e formato', () => {
    expect(() => requireAccessKey('')).toThrow('Access key is required');
    expect(() => requireAccessKey('123')).toThrow(ValidationError);
    expect(() => requireAccessKey('123')).toThrow('positions 7 to 18');
  });
});
