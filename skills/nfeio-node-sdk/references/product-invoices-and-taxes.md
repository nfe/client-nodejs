# Product Invoices (NF-e), Taxes, CT-e & Inbound Documents

Detailed reference for resources hosted at `api.nfse.io` (CT-e/product API).

## ProductInvoicesResource (NF-e Issuance)

Access via `nfe.productInvoices`. Company-scoped.

**Important**: All product invoice operations are **always async** (return 202). There is NO `createAndWait()`. Completion is notified via **webhooks**.

### create(companyId, data): Promise<NfeProductInvoiceIssueData>

Issues a product invoice. Returns immediately with 202 status. The invoice will be processed asynchronously and the result delivered via webhook.

```typescript
// Simplified NfeProductInvoiceIssueData structure
{
  // Buyer info
  buyer: {
    personType: NfePersonType;         // 'NaturalPerson' | 'LegalEntity' | 'Foreign'
    federalTaxNumber?: string;
    name: string;
    email?: string;
    address: NfeAddress;
    stateTaxNumber?: string;           // IE (Inscrição Estadual)
    stateTaxIndicator?: NfeReceiverStateTaxIndicator;
  };
  
  // Items
  items: Array<{
    code: string;
    description: string;
    ncm: string;                       // 8-digit NCM code
    cfop: number;                      // CFOP
    quantity: number;
    unitAmount: number;
    totalAmount: number;
    tax: NfeInvoiceItemTax;            // ICMS, IPI, PIS, COFINS, II
    origin: number;                     // Tax origin code
    // ... many more optional fields
  }>;
  
  // Operation details
  operationType: NfeOperationType;     // 'Outgoing' | 'Incoming'
  purposeType?: NfePurposeType;        // 'Normal' | 'Complement' | 'Adjustment' | 'Devolution'
  consumerPresenceType?: NfeConsumerPresenceType;
  
  // Payment
  payment: NfePaymentResource;
  
  // Optional sections
  transport?: NfeTransportInformation;
  additionalInformation?: NfeAdditionalInformation;
  billing?: NfeBillingResource;
}
```

### createWithStateTax(companyId, stateTaxId, data): Promise<NfeProductInvoiceIssueData>

Same as `create()` but uses a specific state tax registration (IE) for issuance. Use when company has multiple IEs across states.

### list(companyId, options): Promise<NfeProductInvoiceListResponse>

**`environment` is REQUIRED**. Uses cursor-based pagination (not offset).

```typescript
interface NfeProductInvoiceListOptions {
  environment: NfeEnvironmentType;     // 'Production' | 'Test' -- REQUIRED
  startingAfter?: string;              // Cursor: invoice ID for next page
  endingBefore?: string;               // Cursor: invoice ID for previous page
  limit?: number;                      // Items per page (default: 25)
  q?: string;                          // ElasticSearch query string
}
```

### retrieve(companyId, invoiceId): Promise<NfeProductInvoice>

Returns complete invoice with events.

### cancel(companyId, invoiceId, reason?): Promise<NfeRequestCancellationResource>

Cancels invoice. Always async (204 response). Reason string is optional.

### listItems(companyId, invoiceId, options?): Promise<NfeInvoiceItemsResponse>

### listEvents(companyId, invoiceId, options?): Promise<NfeProductInvoiceEventsResponse>

### downloadPdf(companyId, invoiceId, force?): Promise<NfeFileResource>

Returns `{ uri }` for the DANFE PDF, not the bytes: fetch the file from the URI. `force: true`
regenerates the PDF regardless of the invoice's `flowStatus`.

### downloadXml(companyId, invoiceId): Promise<NfeFileResource>

`{ uri }` for the NF-e XML.

### downloadRejectionXml(companyId, invoiceId): Promise<NfeFileResource>

`{ uri }` for the XML of a rejected invoice.

### downloadEpecXml(companyId, invoiceId): Promise<NfeFileResource>

`{ uri }` for the XML in EPEC contingency mode.

### sendCorrectionLetter(companyId, invoiceId, reason): Promise<NfeRequestCancellationResource>

Issues a Carta de Correção Eletrônica (CC-e). Processing is asynchronous. `reason` is a plain
string with 15 to 1,000 characters, without accents or special characters:

```typescript
await nfe.productInvoices.sendCorrectionLetter(
  companyId,
  invoiceId,
  'Correcao do endereco de entrega do destinatario',
);
```

### disable(companyId, invoiceId, reason?): Promise<NfeRequestCancellationResource>

Inutilização (disablement) of a specific invoice, by ID. Processing is asynchronous; `reason` is
optional.

### disableRange(companyId, data): Promise<NfeDisablementResource>

Disables a range of invoice numbers. To disable a single number, use the same `beginNumber` and
`lastNumber`.

```typescript
interface NfeDisablementData {
  environment: NfeEnvironmentType;  // 'None' | 'Production' | 'Test'
  serie: number;
  state: NfeStateCode;              // 'SP', 'RJ', ...
  beginNumber: number;
  lastNumber: number;
  reason?: string;
}
```

---

## StateTaxesResource (Inscrição Estadual)

Access via `nfe.stateTaxes`. Company-scoped. **Prerequisite for NF-e issuance.**

```typescript
// As declared by the SDK; every field is optional.
interface NfeStateTax {
  id?: string;
  companyId?: string;
  accountId?: string;
  code?: NfeStateTaxStateCode;                    // the state
  environmentType?: NfeStateTaxEnvironmentType;   // 'none' | 'production' | 'test'
  taxNumber?: string;                             // IE number
  serie?: number;
  number?: number;
  series?: number[];                              // all series of this registration
  status?: NfeStateTaxStatus;                     // 'inactive' | 'none' | 'active'
  type?: NfeStateTaxType;                         // 'default' | 'nFe' | 'nFCe'
  specialTaxRegime?: NfeStateTaxSpecialTaxRegime;
  securityCredential?: NfeSecurityCredential;
  batchId?: number;
  createdOn?: string;
  modifiedOn?: string;
}
```

The enum values follow the spec's casing (state codes such as `'sP'`), which is questioned
upstream in nfe/docs#338.

| Method | Signature |
|--------|-----------|
| `list` | `(companyId, options?): Promise<NfeStateTaxListResponse>` |
| `create` | `(companyId, data): Promise<NfeStateTax>` |
| `retrieve` | `(companyId, stateTaxId): Promise<NfeStateTax>` |
| `update` | `(companyId, stateTaxId, data): Promise<NfeStateTax>` |
| `delete` | `(companyId, stateTaxId): Promise<void>` |

`create`, `retrieve` and `update` return the registration itself since 6.0.1. The API wraps it in
`{ stateTax: {…} }`; up to 6.0.0 the SDK returned that envelope typed as `NfeStateTax`, so
`result.id` was `undefined`.

`update` sends a PUT. For state taxes it is not documented whether omitted fields keep their
value (the municipal-tax PUT replaces the registration). The safe pattern is to `retrieve`,
change what you need and send the whole object back.

Uses cursor-based pagination like product invoices.

---

## TaxCalculationResource

Access via `nfe.taxCalculation`. Tenant-scoped (uses `tenantId`).

### calculate(tenantId, request): Promise<CalculateResponse>

Computes Brazilian taxes for product operations.

```typescript
interface CalculateRequest {
  operationType: TaxOperationType;     // 'Incoming' | 'Outgoing'
  issuer: {
    state: BrazilianState;             // 'SP', 'RJ', 'MG', etc.
    taxRegime: TaxCalcTaxRegime;       // 'RealProfit' | 'SimplesNacional' | ...
    stateTaxNumber?: string;           // IE
  };
  recipient: {
    state: BrazilianState;
    taxRegime?: TaxCalcTaxRegime;
  };
  items: CalculateItemRequest[];
}

interface CalculateItemRequest {
  id: string;                          // Your item identifier
  operationCode: number;               // CFOP number
  origin: TaxOrigin;                   // 'National' | 'Foreign' | ...
  quantity: number;
  unitAmount: number;
  ncm: string;                         // 8-digit NCM code
  // Optional tax overrides:
  icms?: Partial<TaxIcms>;
  pis?: Partial<TaxPis>;
  cofins?: Partial<TaxCofins>;
  ipi?: Partial<TaxIpi>;
  ii?: Partial<TaxIi>;
}
```

**Response**:
```typescript
interface CalculateResponse {
  items?: CalculateItemResponse[];
}

interface CalculateItemResponse {
  id: string;
  cfop?: number;                       // CFOP determined by engine
  icms?: TaxIcms;                      // ICMS breakdown
  icmsUfDest?: TaxIcmsUfDest;         // DIFAL (interestadual)
  pis?: TaxPis;
  cofins?: TaxCofins;
  ipi?: TaxIpi;
  ii?: TaxIi;                          // Import tax
}
```

Each tax type includes fields like: `cst` (tax situation code), `vBC` (tax base), `pTax` (rate), `vTax` (amount).

---

## TaxCodesResource

Access via `nfe.taxCodes`. Global scope. Reference data for tax calculation inputs.

| Method | Returns |
|--------|---------|
| `listOperationCodes(options?)` | CFOP codes |
| `listAcquisitionPurposes(options?)` | Acquisition purpose codes |
| `listIssuerTaxProfiles(options?)` | Issuer tax profile codes |
| `listRecipientTaxProfiles(options?)` | Recipient tax profile codes |

All return `TaxCodePaginatedResponse` with `{ items?: TaxCode[], currentPage?, totalPages?, totalCount? }` (live-verified 2026-07-13 — note it is `items`/`currentPage`, NOT the `data`/`page` shape used by `ListResponse<T>` elsewhere in the SDK). Pagination is 1-based (`pageIndex`, default 1).

```typescript
interface TaxCode {
  code: string;
  description: string;
}
```

---

## TransportationInvoicesResource (CT-e)

Access via `nfe.transportationInvoices`. Company-scoped.
Uses CT-e API host (`api.nfse.io`).

### enable(companyId, options?): Promise<TransportationInvoiceInboundSettings>

Enable automatic CT-e fetch via SEFAZ Distribuição DFe:

```typescript
await nfe.transportationInvoices.enable(companyId, {
  startFromNsu?: number,     // Start from specific NSU
  startFromDate?: string,    // ISO 8601 date
});
```

### disable(companyId): Promise<TransportationInvoiceInboundSettings>

### getSettings(companyId): Promise<TransportationInvoiceInboundSettings>

### retrieve(companyId, accessKey): Promise<TransportationInvoiceMetadata>

Get CT-e metadata by 44-digit access key.

### getEvent(companyId, accessKey, eventKey): Promise<TransportationInvoiceMetadata>

### downloadXml(companyId, accessKey): Promise<InboundFileResource>

### downloadEventXml(companyId, accessKey, eventKey): Promise<InboundFileResource>

Both downloads return `{ publicTemporaryUri }`, a pre-signed, time-limited URI; downloading the
file is up to the caller.

---

## InboundProductInvoicesResource (NF-e Distribution)

Access via `nfe.inboundProductInvoices`. Company-scoped.
Uses CT-e API host (`api.nfse.io`).

### enableAutoFetch(companyId, options): Promise<InboundSettings>

```typescript
interface EnableInboundOptions {
  startFromNsu?: string;
  startFromDate?: string;              // ISO 8601
  environmentSEFAZ?: string;
  automaticManifesting?: AutomaticManifesting;
  webhookVersion?: string;
}
```

### disableAutoFetch(companyId): Promise<InboundSettings>

### getSettings(companyId): Promise<InboundSettings>

### Document Access Methods

`accessKey` is the 44-digit key; `eventKey` identifies an event of that document.

| Method | Returns |
|--------|---------|
| `getDetails(companyId, accessKey)` | `InboundInvoiceMetadata` |
| `getProductInvoiceDetails(companyId, accessKey)` | `InboundProductInvoiceMetadata` |
| `getEventDetails(companyId, accessKey, eventKey)` | `InboundInvoiceMetadata` |
| `getProductInvoiceEventDetails(companyId, accessKey, eventKey)` | `InboundProductInvoiceMetadata` |
| `getXml(companyId, accessKey)` | `InboundFileResource` |
| `getEventXml(companyId, accessKey, eventKey)` | `InboundFileResource` |
| `getPdf(companyId, accessKey)` | `InboundFileResource` |
| `getJson(companyId, accessKey)` | `InboundInvoiceMetadata` |

`InboundFileResource` is `{ publicTemporaryUri }`, a pre-signed, time-limited URI: the XML and the
PDF never travel in the response, and downloading them is up to the caller.

`getProductInvoiceDetails`, `getProductInvoiceEventDetails`, `getJson` and `reprocessWebhook`
reach the API since 6.0.1. Up to 6.0.0 they called `/inbound/productinvoice/` (singular), which
the platform does not serve: every call ended in 404.

### manifest(companyId, accessKey, tpEvent?): Promise<string>

Sends the Manifestação do Destinatário. `tpEvent` defaults to `210210`:

```typescript
type ManifestEventType =
  | 210210   // Ciência da Operação (awareness, default)
  | 210220   // Confirmação da Operação (confirmation)
  | 210240;  // Operação não Realizada (not performed)
```

### reprocessWebhook(companyId, accessKeyOrNsu): Promise<InboundProductInvoiceMetadata>

Resends the webhook notification for a document, identified by its 44-digit access key or by its
NSU.

---

## NF-e Product Invoice Lifecycle

```
1. Create state tax registration (IE)
   nfe.stateTaxes.create(companyId, { ... })

2. Create product invoice (always async)
   nfe.productInvoices.create(companyId, data)
   -> Returns 202 immediately

3. Receive webhook notification
   product_invoice.issued_successfully / product_invoice.issued_failed / product_invoice.issued_error

4. Download files (each returns { uri }; fetch the file from it)
   nfe.productInvoices.downloadPdf(companyId, id)
   nfe.productInvoices.downloadXml(companyId, id)

5. If needed: correction letter or cancellation
   nfe.productInvoices.sendCorrectionLetter(companyId, id, reason)  // 15-1000 chars, no accents
   nfe.productInvoices.cancel(companyId, id)
```
