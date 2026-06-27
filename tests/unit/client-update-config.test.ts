/**
 * Regression test for updateConfig cache invalidation (fix-repo-bugs).
 *
 * Before the fix, updateConfig() reset only ~10 of the cached resources/clients,
 * leaving productInvoices/stateTaxes/taxCalculation/query/lookup resources stale
 * (holding an HTTP client built with the old config). This asserts every getter
 * rebuilds after updateConfig.
 */

import { describe, it, expect } from 'vitest';
import { NfeClient } from '../../src/core/client.js';

describe('NfeClient.updateConfig — full cache invalidation', () => {
  it('rebuilds previously-missed resources after updateConfig', () => {
    const nfe = new NfeClient({ apiKey: 'fiscal-key', dataApiKey: 'data-key' });

    // Resources that were NOT in the old reset list:
    const before = {
      productInvoices: nfe.productInvoices,
      stateTaxes: nfe.stateTaxes,
      taxCalculation: nfe.taxCalculation,
      taxCodes: nfe.taxCodes,
      // ...and one that always was reset, as a control:
      serviceInvoices: nfe.serviceInvoices,
    };

    nfe.updateConfig({ timeout: 45000 });

    expect(nfe.productInvoices).not.toBe(before.productInvoices);
    expect(nfe.stateTaxes).not.toBe(before.stateTaxes);
    expect(nfe.taxCalculation).not.toBe(before.taxCalculation);
    expect(nfe.taxCodes).not.toBe(before.taxCodes);
    expect(nfe.serviceInvoices).not.toBe(before.serviceInvoices);
  });
});
