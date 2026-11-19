/**
 * NFE.io SDK v3 - Consumer Invoice Query Resource
 *
 * Queries CFe-SAT (Cupom Fiscal Eletrônico) consumer invoices
 * by access key. Read-only lookups — no company scope required.
 * Uses the API host: nfe.api.nfe.io
 */

import type { HttpClient } from '../http/client.js';
import type { TaxCoupon } from '../types.js';
import { requireAccessKey } from '../utils/tax-id.js';
import { withUnservedRouteNote } from '../utils/unserved-route.js';

// ============================================================================
// Constants
// ============================================================================

// ============================================================================
// Validation Helpers
// ============================================================================

// ============================================================================
// Resource Implementation
// ============================================================================

/**
 * Consumer Invoice Query Resource
 *
 * @deprecated **A plataforma não serve nenhuma das duas rotas deste recurso.**
 * Elas estão declaradas na spec `consulta-nf-consumidor` e na documentação da plataforma, em
 * `nfe.api.nfe.io` — e respondem `404` de corpo vazio, sem `content-type`,
 * idêntico ao de um path inventado no mesmo host. Confirmação independente: o
 * `404` vem **inclusive sem credencial**, enquanto uma rota servida no mesmo host
 * responde `401` sem credencial — o middleware de autenticação nem chega a rodar.
 * Noventa dias de log de gateway não têm um único `200`. Medido em 2026-09-02.
 *
 * Os métodos continuam emitindo a requisição: se a rota subir, o resultado passa
 * sem alteração.
 *
 * @description
 * Queries CFe-SAT (Cupom Fiscal Eletrônico) consumer invoices by access key.
 * This is a read-only resource that does not require company scope.
 *
 * **Capabilities:**
 * - Retrieve full coupon details (issuer, buyer, items, totals, payment)
 * - Download original CFe XML
 *
 * **Authentication:** Uses data API key (`dataApiKey` or `apiKey` fallback).
 *
 * @example
 * ```typescript
 * const coupon = await nfe.consumerInvoiceQuery.retrieve(
 *   '35240112345678000190590000000012341234567890'
 * );
 * console.log(coupon.issuer?.name, coupon.totals?.couponAmount);
 * ```
 */
export class ConsumerInvoiceQueryResource {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Retrieve full CFe-SAT coupon details from SEFAZ by access key
   *
   * @param accessKey - 44-character access key (Chave de Acesso; positions 7-18 may hold letters of an alphanumeric CNPJ)
   * @returns Full coupon details including issuer, buyer, items, totals, and payment
   * @throws {ValidationError} If access key format is invalid
   * @throws {NotFoundError} If no coupon matches the access key (HTTP 404)
   * @throws {AuthenticationError} If API key is invalid (HTTP 401)
   *
   * @example
   * ```typescript
   * const coupon = await nfe.consumerInvoiceQuery.retrieve(
   *   '35240112345678000190590000000012341234567890'
   * );
   * console.log(coupon.currentStatus); // 'Authorized'
   * console.log(coupon.issuer?.name);
   * console.log(coupon.totals?.couponAmount);
   * ```
   */
  async retrieve(accessKey: string): Promise<TaxCoupon> {
    const key = requireAccessKey(accessKey);
    const response = await withUnservedRouteNote(
      'GET /v1/consumerinvoices/coupon/{accessKey}',
      () => this.http.get<TaxCoupon>(`/v1/consumerinvoices/coupon/${key}`)
    );
    return response.data;
  }

  /**
   * Download the raw CFe XML for a consumer invoice by access key
   *
   * @param accessKey - 44-character access key (Chave de Acesso; positions 7-18 may hold letters of an alphanumeric CNPJ)
   * @returns Buffer containing the XML binary content
   * @throws {ValidationError} If access key format is invalid
   * @throws {NotFoundError} If no coupon matches the access key (HTTP 404)
   * @throws {AuthenticationError} If API key is invalid (HTTP 401)
   *
   * @example
   * ```typescript
   * const xmlBuffer = await nfe.consumerInvoiceQuery.downloadXml(
   *   '35240112345678000190590000000012341234567890'
   * );
   * fs.writeFileSync('cfe.xml', xmlBuffer);
   * ```
   */
  async downloadXml(accessKey: string): Promise<Buffer> {
    const key = requireAccessKey(accessKey);
    const response = await withUnservedRouteNote(
      'GET /v1/consumerinvoices/coupon/{accessKey}.xml',
      () =>
        this.http.getBuffer(
          `/v1/consumerinvoices/coupon/${key}.xml`,
          // Mesmo motivo do productInvoiceQuery: sem o JSON de segunda escolha, o
          // erro volta 406 de corpo vazio em vez da mensagem da API.
          'application/xml, application/json;q=0.9'
        )
    );
    return response.data;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new ConsumerInvoiceQueryResource instance
 */
export function createConsumerInvoiceQueryResource(http: HttpClient): ConsumerInvoiceQueryResource {
  return new ConsumerInvoiceQueryResource(http);
}
