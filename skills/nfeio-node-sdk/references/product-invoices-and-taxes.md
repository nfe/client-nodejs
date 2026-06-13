# Product Invoices (NF-e), Taxes, CT-e & Inbound Documents

Detailed reference for resources hosted at `api.nfse.io` (CT-e/product API).

## ProductInvoicesResource (NF-e Issuance)

Access via `nfe.productInvoices`. Company-scoped.

**Important**: All product invoice operations are **always async** (return 202). There is NO `createAndWait()`. Completion is notified via **webhooks**.

### create(companyId, data): Promise<NfeProductInvoice>

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

### createWithStateTax(companyId, stateTaxId, data): Promise<NfeProductInvoice>

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

### downloadPdf(companyId, invoiceId): Promise<Buffer>

Returns the DANFE PDF as a raw Buffer.

### downloadXml(companyId, invoiceId): Promise<Buffer>

Returns the NF-e XML.

### downloadRejectionXml(companyId, invoiceId): Promise<Buffer>

XML for rejected invoices.

### downloadEpecXml(companyId, invoiceId): Promise<Buffer>

XML for EPEC contingency mode.

### sendCorrectionLetter(companyId, invoiceId, data): Promise<NfeProductInvoice>

Issues a Carta de Correao Eletrnica (CC-e):

```typescript
await nfe.productInvoices.sendCorrectionLetter(companyId, invoiceId, {
  correctionText: 'Correction description here',
  // Must be 15-1000 characters
  // No accents or special characters allowed
});
```

### disable(companyId, data): Promise<NfeProductInvoice>

Inutilizao (disablement) of invoice number. Prevents specific numbers from being used.

```typescript
interface NfeDisablementData {
  stateTaxId: string;
  environment: NfeEnvironmentType;
  invoiceSeries: number;
  invoiceNumberStart: number;
  invoiceNumberEnd: number;
  reason: string;
}
```

### disableRange(companyId, data): Promise<NfeProductInvoice>

Disable a range of invoice numbers at once.

---

## StateTaxesResource (Inscrio Estadual)

Access via `nfe.stateTaxes`. Company-scoped. **Prerequisite for NF-e issuance.**

```typescript
interface NfeStateTax {
  id: string;
  type: NfeStateTaxType;                  // 'nFe' | 'nFce' | 'cTe'
  state: NfeStateTaxStateCode;
  taxNumber: string;                       // IE number
  environment: NfeStateTaxEnvironmentType; // 'Production' | 'Test'
  status: NfeStateTaxStatus;
  specialTaxRegime?: NfeSpecialTaxRegime;
  securityCredential?: NfeSecurityCredential;
}
```

| Method | Signature |
|--------|-----------|
| `list` | `(companyId, options?): Promise<NfeStateTaxListResponse>` |
| `create` | `(companyId, data): Promise<NfeStateTax>` |
| `retrieve` | `(companyId, stateTaxId): Promise<NfeStateTax>` |
| `update` | `(companyId, stateTaxId, data): Promise<NfeStateTax>` |
| `delete` | `(companyId, stateTaxId): Promise<void>` |

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

All return `TaxCodePaginatedResponse` with `{ data: TaxCode[], totalCount, page }`.

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

Enable automatic CT-e fetch via SEFAZ Distribuio DFe:

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

### retrieveEvent(companyId, accessKey): Promise<TransportationInvoiceMetadata>

### downloadXml(companyId, accessKey): Promise<Buffer>

### downloadEventXml(companyId, accessKey): Promise<Buffer>

---

## InboundProductInvoicesResource (NF-e Distribution)

Access via `nfe.inboundProductInvoices`. Company-scoped.
Uses CT-e API host (`api.nfse.io`).

### enableAutoFetch(companyId, options?): Promise<InboundSettings>

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

| Method | Input | Returns |
|--------|-------|---------|
| `getDetails(companyId, accessKey)` | 44-digit key | Generic metadata |
| `getProductInvoiceDetails(companyId, accessKey)` | 44-digit key | Product invoice metadata |
| `getEventDetails(companyId, accessKey)` | 44-digit key | Event metadata |
| `getProductInvoiceEventDetails(companyId, accessKey)` | 44-digit key | Product invoice event metadata |
| `getXml(companyId, accessKey)` | 44-digit key | XML string |
| `getEventXml(companyId, accessKey)` | 44-digit key | Event XML string |
| `getPdf(companyId, accessKey)` | 44-digit key | PDF string (base64) |
| `getJson(companyId, accessKey, format?)` | 44-digit key | JSON string |

### manifest(companyId, accessKey, eventType): Promise<InboundInvoiceMetadata>

Send Manifestao do Destinatrio:

```typescript
type ManifestEventType =
  | 210210   // Cincia da Operao (awareness)
  | 210220   // Confirmao da Operao (confirmation)
  | 210240;  // Operao No Realizada (not performed)
```

### reprocessWebhook(companyId, accessKey): Promise<void>

Resend webhook notification for a specific document.

---

## NF-e Product Invoice Lifecycle

```
1. Create state tax registration (IE)
   nfe.stateTaxes.create(companyId, { ... })

2. Create product invoice (always async)
   nfe.productInvoices.create(companyId, data)
   -> Returns 202 immediately

3. Receive webhook notification
   invoice.issued / invoice.failed

4. Download files
   nfe.productInvoices.downloadPdf(companyId, id)
   nfe.productInvoices.downloadXml(companyId, id)

5. If needed: correction letter or cancellation
   nfe.productInvoices.sendCorrectionLetter(companyId, id, { correctionText })
   nfe.productInvoices.cancel(companyId, id)
```
