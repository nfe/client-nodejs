/**
 * Contratos de certificado, contra a API real.
 *
 * Existe porque `getCertificateStatus` passou meses lendo uma forma que a API
 * nunca devolveu, e nenhum teste percebeu: os unitários alimentavam a própria
 * invenção. Um mock não consegue afirmar o nome de um campo que só a API sabe.
 *
 * Somente leitura — nada aqui cria, altera ou remove nada na conta.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  createIntegrationClient,
  skipIfNoApiKey,
  INTEGRATION_TEST_CONFIG,
} from './setup.js';
import { NfeClient } from '../../src/core/client.js';
import type { Company } from '../../src/core/types.js';

describe.skipIf(skipIfNoApiKey())('Certificados — contrato ao vivo', () => {
  let client: NfeClient;
  let page: Company[];

  beforeAll(async () => {
    client = createIntegrationClient();
    page = (await client.companies.list({ pageCount: 50, pageIndex: 1 })).data;
  });

  /** Empresa da página cujo item de listagem já indica certificado instalado. */
  function withCertificate(): Company | undefined {
    return page.find(c => Boolean((c as { certificate?: { thumbprint?: string } }).certificate?.thumbprint));
  }

  /** Empresa da página sem certificado no item de listagem. */
  function withoutCertificate(): Company | undefined {
    return page.find(c => !(c as { certificate?: { thumbprint?: string } }).certificate?.thumbprint);
  }

  it(
    'a listagem de empresas traz o certificado embutido',
    { timeout: INTEGRATION_TEST_CONFIG.timeout },
    () => {
      // É o que permite a varredura por conta não fazer uma requisição por empresa.
      const company = withCertificate();
      expect(company, 'nenhuma empresa com certificado na primeira página').toBeDefined();

      const certificate = (company as { certificate: Record<string, unknown> }).certificate;
      expect(certificate).toHaveProperty('expiresOn');
      expect(certificate).toHaveProperty('status');
      expect(typeof certificate.status).toBe('string');
    }
  );

  it(
    'empresa com certificado: o status vem de validUntil e status',
    { timeout: INTEGRATION_TEST_CONFIG.timeout },
    async () => {
      const company = withCertificate();
      expect(company).toBeDefined();

      const status = await client.companies.getCertificateStatus(company!.id!);

      expect(status.hasCertificate).toBe(true);
      expect(status.certificates.length).toBeGreaterThan(0);

      // Os campos que o método lia antes NÃO existem na resposta da API.
      const raw = status.certificates[0]!;
      expect(raw).toHaveProperty('validUntil');
      expect(raw).toHaveProperty('status');
      expect(raw).not.toHaveProperty('hasCertificate');
      expect(raw).not.toHaveProperty('expiresOn');
      expect(raw).not.toHaveProperty('isValid');

      // E o resumo normaliza para `expiresOn`, derivando os dois campos calculados.
      expect(status.expiresOn).toBe(raw.validUntil);
      expect(typeof status.daysUntilExpiration).toBe('number');
      expect(typeof status.isExpiringSoon).toBe('boolean');
      expect(status.isValid).toBe(raw.status === 'Active');
    }
  );

  it(
    'empresa sem certificado responde 200 com lista vazia, não 404',
    { timeout: INTEGRATION_TEST_CONFIG.timeout },
    async () => {
      const company = withoutCertificate();
      expect(company, 'nenhuma empresa sem certificado na primeira página').toBeDefined();

      const status = await client.companies.getCertificateStatus(company!.id!);

      expect(status.hasCertificate).toBe(false);
      expect(status.certificates).toEqual([]);
      expect(status.expiresOn).toBeUndefined();
    }
  );

  it(
    'a varredura por conta concorda com a listagem',
    { timeout: 120_000 },
    async () => {
      const comCertificado = await client.companies.getCompaniesWithCertificates();

      // Toda empresa devolvida tem certificado ativo no próprio item de listagem —
      // é de lá que a seleção sai, sem requisição por empresa.
      for (const company of comCertificado) {
        const certificate = (company as { certificate?: { status?: string } }).certificate;
        expect(certificate?.status).toBe('Active');
      }
    }
  );
});
