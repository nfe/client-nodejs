/**
 * NFE.io SDK - Generated Types Index
 *
 * This file re-exports types from all OpenAPI specifications.
 * Types are namespaced by spec to avoid conflicts.
 *
 * @generated
 * Last updated: 2026-01-10T21:48:26.099Z
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

// Import types to avoid namespace errors
import type { components as NfServicoComponents } from './nf-servico-v1.js';

export type ServiceInvoice = NfServicoComponents['schemas']['ServiceInvoice'];
export type Company = NfServicoComponents['schemas']['Company'];
export type LegalPerson = NfServicoComponents['schemas']['LegalPerson'];
export type NaturalPerson = NfServicoComponents['schemas']['NaturalPerson'];

// Note: Other specs may define these types differently.
// Use namespaced imports (e.g., import { components } from '@/generated/nf-produto-v2') when specificity is needed.

// ============================================================================
// Backward Compatibility
// ============================================================================

// Main spec (nf-servico) types available at root level for convenience
// This maintains compatibility with existing code
export * from './nf-servico-v1.js';
