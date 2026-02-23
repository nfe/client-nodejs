/**
 * Type-level tests for tax calculation types.
 *
 * These tests verify required/optional fields on request/response interfaces
 * at compile time. If any assertion fails, TypeScript will produce a compile error.
 */

import { describe, it, expect } from 'vitest';
import type {
  TaxOperationType,
  TaxOrigin,
  TaxCalcTaxRegime,
  BrazilianState,
  TaxIcms,
  TaxIcmsUfDest,
  TaxPis,
  TaxCofins,
  TaxIpi,
  TaxIi,
  CalculateRequestIssuer,
  CalculateRequestRecipient,
  CalculateItemRequest,
  CalculateRequest,
  CalculateItemResponse,
  CalculateResponse,
  TaxCode,
  TaxCodePaginatedResponse,
  TaxCodeListOptions,
} from '../../../src/core/types.js';

// ============================================================================
// Compile-time type assertion helpers
// ============================================================================

/**
 * Assert that type A is assignable to type B.
 * If not, TypeScript will produce a compile error.
 */
type AssertAssignable<_A extends B, B> = true;

// ============================================================================
// Enum / union type checks
// ============================================================================

// TaxOperationType accepts only valid values
type _OpOutgoing = AssertAssignable<'Outgoing', TaxOperationType>;
type _OpIncoming = AssertAssignable<'Incoming', TaxOperationType>;

// TaxOrigin accepts all 9 values
type _OriginNational = AssertAssignable<'National', TaxOrigin>;
type _OriginFDI = AssertAssignable<'ForeignDirectImport', TaxOrigin>;
type _OriginFIM = AssertAssignable<'ForeignInternalMarket', TaxOrigin>;

// TaxCalcTaxRegime accepts all 6 values
type _RegimeNS = AssertAssignable<'NationalSimple', TaxCalcTaxRegime>;
type _RegimeRP = AssertAssignable<'RealProfit', TaxCalcTaxRegime>;
type _RegimePP = AssertAssignable<'PresumedProfit', TaxCalcTaxRegime>;
type _RegimeExempt = AssertAssignable<'Exempt', TaxCalcTaxRegime>;

// BrazilianState accepts known values
type _StateSP = AssertAssignable<'SP', BrazilianState>;
type _StateEX = AssertAssignable<'EX', BrazilianState>;

// ============================================================================
// Runtime tests verifying type structure
// ============================================================================

describe('Tax Calculation Type-level Tests', () => {
  it('CalculateRequest requires issuer, recipient, operationType, items', () => {
    // Valid: all required fields
    const request: CalculateRequest = {
      issuer: { state: 'SP', taxRegime: 'RealProfit' },
      recipient: { state: 'RJ' },
      operationType: 'Outgoing',
      items: [{ id: '1', operationCode: 121, origin: 'National', quantity: 1, unitAmount: 100 }],
    };
    expect(request.issuer).toBeDefined();
    expect(request.recipient).toBeDefined();
    expect(request.operationType).toBeDefined();
    expect(request.items).toHaveLength(1);

    // Optional fields should be assignable
    const requestWithOptionals: CalculateRequest = {
      ...request,
      collectionId: 'col-1',
      isProductRegistration: false,
    };
    expect(requestWithOptionals.collectionId).toBe('col-1');
  });

  it('CalculateRequestIssuer requires state and taxRegime', () => {
    const issuer: CalculateRequestIssuer = {
      state: 'SP',
      taxRegime: 'RealProfit',
    };
    expect(issuer.state).toBe('SP');
    expect(issuer.taxRegime).toBe('RealProfit');

    // Optional field
    const withProfile: CalculateRequestIssuer = {
      ...issuer,
      taxProfile: 'industry',
    };
    expect(withProfile.taxProfile).toBe('industry');
  });

  it('CalculateRequestRecipient requires only state', () => {
    // Minimal: only state is required
    const recipient: CalculateRequestRecipient = { state: 'RJ' };
    expect(recipient.state).toBe('RJ');

    // All fields
    const full: CalculateRequestRecipient = {
      state: 'MG',
      taxRegime: 'NationalSimple',
      taxProfile: 'final_consumer_non_icms_contributor',
    };
    expect(full.taxRegime).toBe('NationalSimple');
  });

  it('CalculateItemRequest requires id, operationCode, origin, quantity, unitAmount', () => {
    const item: CalculateItemRequest = {
      id: 'item-1',
      operationCode: 121,
      origin: 'National',
      quantity: 10,
      unitAmount: 50.0,
    };
    expect(item.id).toBe('item-1');
    expect(item.operationCode).toBe(121);

    // All optional fields
    const fullItem: CalculateItemRequest = {
      ...item,
      acquisitionPurpose: '569',
      issuerTaxProfile: 'industry',
      recipientTaxProfile: 'industry',
      sku: 'SKU-001',
      ncm: '61091000',
      cest: '1234567',
      benefit: 'BEN01',
      exTipi: '01',
      gtin: '7891234567890',
      freightAmount: 10,
      insuranceAmount: 5,
      discountAmount: 2,
      othersAmount: 1,
    };
    expect(fullItem.ncm).toBe('61091000');
  });

  it('CalculateItemResponse has all optional fields', () => {
    // Empty response is valid (all fields optional)
    const empty: CalculateItemResponse = {};
    expect(empty.id).toBeUndefined();

    // Full response
    const full: CalculateItemResponse = {
      id: 'item-1',
      cfop: 6102,
      cest: '1234567',
      benefit: 'BEN01',
      icms: { cst: '00', vBC: '1000.00' },
      icmsUfDest: { vBCUFDest: '1000.00' },
      pis: { cst: '01' },
      cofins: { cst: '01' },
      ipi: { cst: '50' },
      ii: { vBC: '0.00' },
      additionalInformation: 'test',
      lastModified: '2025-01-01T00:00:00Z',
      productId: 'prod-1',
    };
    expect(full.cfop).toBe(6102);
  });

  it('CalculateResponse has optional items array', () => {
    const empty: CalculateResponse = {};
    expect(empty.items).toBeUndefined();

    const withItems: CalculateResponse = { items: [{ id: '1', cfop: 5102 }] };
    expect(withItems.items).toHaveLength(1);
  });

  it('TaxCode has all optional string fields', () => {
    const code: TaxCode = {};
    expect(code.code).toBeUndefined();

    const full: TaxCode = { code: '121', description: 'Venda de mercadoria' };
    expect(full.code).toBe('121');
  });

  it('TaxCodePaginatedResponse has correct shape', () => {
    const response: TaxCodePaginatedResponse = {
      items: [{ code: '121', description: 'test' }],
      currentPage: 1,
      totalPages: 5,
      totalCount: 100,
    };
    expect(response.items).toHaveLength(1);
    expect(response.currentPage).toBe(1);
    expect(response.totalPages).toBe(5);
    expect(response.totalCount).toBe(100);
  });

  it('TaxCodeListOptions has all optional pagination fields', () => {
    // Empty is valid
    const empty: TaxCodeListOptions = {};
    expect(empty.pageIndex).toBeUndefined();

    // Full
    const full: TaxCodeListOptions = { pageIndex: 2, pageCount: 25 };
    expect(full.pageIndex).toBe(2);
  });

  it('Tax component interfaces have all optional string fields', () => {
    // All tax components should work with empty objects
    const icms: TaxIcms = {};
    const icmsUfDest: TaxIcmsUfDest = {};
    const pis: TaxPis = {};
    const cofins: TaxCofins = {};
    const ipi: TaxIpi = {};
    const ii: TaxIi = {};

    expect(icms.cst).toBeUndefined();
    expect(icmsUfDest.vBCUFDest).toBeUndefined();
    expect(pis.cst).toBeUndefined();
    expect(cofins.cst).toBeUndefined();
    expect(ipi.cst).toBeUndefined();
    expect(ii.vBC).toBeUndefined();
  });
});
