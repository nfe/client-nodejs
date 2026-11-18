/**
 * NFE.io SDK — CNPJ, CPF e chave de acesso: normalização e validação no cliente.
 *
 * Uma regra só para todos os recursos. Até a v6.0.1, cada recurso validava do seu jeito:
 * `companies` media o número com `toString().length` e recusava documento que começa com
 * zero; a consulta de CNPJ fazia `replace(/\D/g, '')` e arrancava as letras; quatro
 * recursos exigiam chave de acesso só com dígitos.
 *
 * Princípio: a validação local nunca recusa um valor que a API aceita.
 *
 * - **CNPJ** (IN RFB 2.229/2024): 12 letras ou dígitos e 2 dígitos verificadores. O DV é o
 *   módulo 11 com o valor ASCII − 48 de cada caractere; para dígitos, é o cálculo de sempre.
 *   As 26 letras valem (a Receita não veda nenhuma).
 * - **`number` perdeu os zeros à esquerda** na conversão, então é completado com zeros antes
 *   de validar. A API faz o mesmo: medido em 2026-11-18, `POST /v1/companies` com
 *   `1234567999885` responde `201` e grava `01234567999885`.
 * - **Chave de acesso**: as posições 7 a 20 trazem o CNPJ do emitente, então as posições 7 a
 *   18 podem ter letras.
 *
 * Interno nesta versão: export público é superfície nova e fica para uma minor.
 */

import { ValidationError } from '../errors/index.js';

const CNPJ_LENGTH = 14;
const CPF_LENGTH = 11;

/** Formato do CNPJ depois de normalizado: 12 letras ou dígitos e 2 dígitos verificadores. */
const CNPJ_PATTERN = /^[0-9A-Z]{12}[0-9]{2}$/;

/** Chave de acesso de 44 posições: letras só nas posições 7 a 18 (o CNPJ do emitente). */
const ACCESS_KEY_PATTERN = /^\d{6}[0-9A-Z]{12}\d{26}$/;

/** Separadores de máscara que a normalização remove. Letras nunca são removidas. */
const MASK_CHARACTERS = /[.\-/\s]/g;

/** Pesos do módulo 11 do CNPJ, para o primeiro e o segundo dígito verificador. */
const CNPJ_FIRST_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const CNPJ_SECOND_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

/**
 * Converte um `number` em string de dígitos completada com zeros até `length`.
 * Valor que não é inteiro seguro e não negativo vira string sem completar, e a validação o recusa.
 */
function numberToDigits(value: number, length: number): string {
  if (!Number.isSafeInteger(value) || value < 0) {
    return String(value);
  }
  return String(value).padStart(length, '0');
}

/** Valor de um caractere no cálculo do DV: código ASCII − 48 (`'0'`→0, `'A'`→17, `'Z'`→42). */
function charValue(text: string, index: number): number {
  return text.charCodeAt(index) - 48;
}

/** Módulo 11: resto 0 ou 1 dá dígito 0; os demais dão 11 − resto. */
function mod11Digit(sum: number): number {
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

function cnpjCheckDigits(base: string): string {
  let sum = 0;
  CNPJ_FIRST_WEIGHTS.forEach((weight, i) => {
    sum += charValue(base, i) * weight;
  });
  const first = mod11Digit(sum);

  const withFirst = `${base}${first}`;
  sum = 0;
  CNPJ_SECOND_WEIGHTS.forEach((weight, i) => {
    sum += charValue(withFirst, i) * weight;
  });
  const second = mod11Digit(sum);

  return `${first}${second}`;
}

function cpfCheckDigit(cpf: string, length: number): number {
  let sum = 0;
  for (let i = 0; i < length; i++) {
    sum += charValue(cpf, i) * (length + 1 - i);
  }
  return mod11Digit(sum);
}

// ============================================================================
// CNPJ
// ============================================================================

/**
 * Normaliza um CNPJ sem perder letras.
 *
 * - `string`: remove `.`, `/`, `-` e espaços, e converte para maiúsculas.
 * - `number`: completa com zeros à esquerda até 14 posições.
 *
 * @example
 * normalizeCnpj('12.abc.345/01de-35'); // '12ABC34501DE35'
 * normalizeCnpj(1234567999885);        // '01234567999885'
 */
export function normalizeCnpj(value: string | number): string {
  if (typeof value === 'number') {
    return numberToDigits(value, CNPJ_LENGTH);
  }
  return value.replace(MASK_CHARACTERS, '').toUpperCase();
}

/**
 * Confere formato e dígitos verificadores de um CNPJ, numérico ou alfanumérico.
 * Recusa 14 caracteres iguais.
 */
export function isValidCnpj(value: string | number): boolean {
  const cnpj = normalizeCnpj(value);
  if (!CNPJ_PATTERN.test(cnpj)) return false;
  if (/^(.)\1{13}$/.test(cnpj)) return false;
  return cnpj.slice(12) === cnpjCheckDigits(cnpj.slice(0, 12));
}

/** Diz se o CNPJ tem letra nas 12 primeiras posições. Um `number` nunca é alfanumérico. */
export function isAlphanumericCnpj(value: string | number): boolean {
  if (typeof value === 'number') return false;
  return /[A-Z]/.test(normalizeCnpj(value).slice(0, 12));
}

/**
 * Normaliza e valida um CNPJ recebido como argumento de método.
 *
 * @returns O CNPJ normalizado, pronto para entrar numa URL
 * @throws {ValidationError} Se estiver vazio, fora do formato ou com DV inválido
 */
export function requireCnpj(value: string | number | null | undefined): string {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    throw new ValidationError('Federal tax number (CNPJ) is required');
  }

  const cnpj = normalizeCnpj(value);
  if (!CNPJ_PATTERN.test(cnpj)) {
    throw new ValidationError(
      `Invalid federal tax number format: "${value}". Expected 14 characters after removing punctuation: ` +
        '12 letters or digits followed by 2 check digits (e.g., "11222333999952", "11.222.333/9999-52" ' +
        'or the alphanumeric "12.ABC.345/01DE-35").'
    );
  }
  if (!isValidCnpj(cnpj)) {
    throw new ValidationError(
      `Invalid federal tax number: "${value}". The CNPJ check digits do not match.`
    );
  }
  return cnpj;
}

// ============================================================================
// CPF
// ============================================================================

/**
 * Normaliza um CPF.
 *
 * - `string`: remove `.`, `/`, `-` e espaços.
 * - `number`: completa com zeros à esquerda até 11 posições.
 */
export function normalizeCpf(value: string | number): string {
  if (typeof value === 'number') {
    return numberToDigits(value, CPF_LENGTH);
  }
  return value.replace(MASK_CHARACTERS, '');
}

/** Confere formato (11 dígitos) e dígitos verificadores de um CPF. Recusa 11 dígitos iguais. */
export function isValidCpf(value: string | number): boolean {
  const cpf = normalizeCpf(value);
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  return cpf[9] === String(cpfCheckDigit(cpf, 9)) && cpf[10] === String(cpfCheckDigit(cpf, 10));
}

// ============================================================================
// Comparação
// ============================================================================

/**
 * Diz se dois valores de CNPJ ou CPF são o mesmo documento.
 *
 * Documento numérico compara pelo valor, então `1234567999885` e `'01234567999885'` são iguais:
 * a API v1 devolve como `number` o que perdeu o zero à esquerda. Documento com letra compara
 * pelo texto normalizado. Valor que não é `string` nem `number` nunca é igual a nada.
 */
export function isSameTaxNumber(a: unknown, b: unknown): boolean {
  const asText = (value: unknown): string | undefined => {
    if (typeof value === 'number')
      return Number.isSafeInteger(value) && value >= 0 ? String(value) : undefined;
    if (typeof value === 'string') return value.replace(MASK_CHARACTERS, '').toUpperCase();
    return undefined;
  };
  const left = asText(a);
  const right = asText(b);
  if (left === undefined || right === undefined || left === '' || right === '') return false;
  if (/^\d+$/.test(left) && /^\d+$/.test(right)) {
    return left.replace(/^0+(?=\d)/, '') === right.replace(/^0+(?=\d)/, '');
  }
  return left === right;
}

// ============================================================================
// Chave de acesso
// ============================================================================

/** Normaliza uma chave de acesso: remove espaços das pontas e converte para maiúsculas. */
export function normalizeAccessKey(value: string): string {
  return value.trim().toUpperCase();
}

/** Confere o formato da chave de acesso de 44 posições. Não confere o DV da chave: isso é da API. */
export function isValidAccessKey(value: string): boolean {
  return ACCESS_KEY_PATTERN.test(normalizeAccessKey(value));
}

/**
 * Normaliza e valida uma chave de acesso recebida como argumento de método.
 *
 * @returns A chave normalizada, pronta para entrar numa URL
 * @throws {ValidationError} Se estiver vazia ou fora do formato
 */
export function requireAccessKey(value: string | null | undefined): string {
  if (!value || value.trim() === '') {
    throw new ValidationError('Access key is required');
  }

  const key = normalizeAccessKey(value);
  if (!ACCESS_KEY_PATTERN.test(key)) {
    throw new ValidationError(
      `Invalid access key: "${value}". Expected 44 characters: digits only, except positions 7 to 18, ` +
        'which hold the issuer CNPJ and may contain letters (alphanumeric CNPJ).'
    );
  }
  return key;
}
