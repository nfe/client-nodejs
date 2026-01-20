/**
 * NFE.io SDK - Generated Types Index
 *
 * This file re-exports types from all OpenAPI specifications.
 * Types are namespaced by spec to avoid conflicts.
 *
 * @generated
 * Last updated: 2026-01-19T23:42:06.128Z
 */

// ============================================================================
// Per-Spec Namespace Exports
// ============================================================================

export * as CalculoImpostos from './calculo-impostos-v1.js';
export * as ConsultaCte from './consulta-cte-v2.js';
export * as ConsultaNfeDistribuicao from './consulta-nfe-distribuicao-v1.js';
export * as NfConsumidor from './nf-consumidor-v2.js';
export * as NfProduto from './nf-produto-v2.js';
export * as NfServico from './nf-servico-v1.js';
export * as Nfeio from './nfeio.js';

// ============================================================================
// Convenience Type Aliases
// ============================================================================

// Common types from main spec (nf-servico-v1)
// Use these for convenience, or use namespaced versions for specificity

// Since OpenAPI specs don't have separate schemas (schemas: never),
// we define minimal types here for backward compatibility
// These are placeholders - real API responses may have more fields

export interface ServiceInvoice {
  id?: string;
  flowStatus?: string;
  status?: string;
  [key: string]: unknown;
}

export interface Company {
  id?: string;
  federalTaxNumber?: number;
  name?: string;
  [key: string]: unknown;
}

export interface LegalPerson {
  id?: string;
  federalTaxNumber?: string | number;
  name?: string;
  [key: string]: unknown;
}

export interface NaturalPerson {
  id?: string;
  federalTaxNumber?: string | number;
  name?: string;
  [key: string]: unknown;
}

// ============================================================================
// Backward Compatibility
// ============================================================================

// Main spec (nf-servico) types available at root level for convenience
// This maintains compatibility with existing code
export * from './nf-servico-v1.js';
