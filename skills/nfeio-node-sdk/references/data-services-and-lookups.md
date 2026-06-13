# Data Services & Lookups

Detailed reference for read-only query and lookup resources across multiple API hosts.

## API Host Mapping

| Resource | API Host | Auth Key |
|----------|----------|----------|
| Addresses | `address.api.nfe.io/v2` | `dataApiKey` (fallback: `apiKey`) |
| ProductInvoiceQuery | `nfe.api.nfe.io` | `apiKey` |
| ConsumerInvoiceQuery | `nfe.api.nfe.io` | `apiKey` |
| LegalEntityLookup | `legalentity.api.nfe.io` | `dataApiKey` (fallback: `apiKey`) |
| NaturalPersonLookup | `naturalperson.api.nfe.io` | `dataApiKey` (fallback: `apiKey`) |

Resources using `dataApiKey` will fall back to `apiKey` if `dataApiKey` is not configured. At least one must be set.

---

## AddressesResource

Access via `nfe.addresses`. Global scope (no company ID needed).

### lookupByPostalCode(postalCode): Promise<AddressLookupResponse>

```typescript
// Both formats accepted:
const result = await nfe.addresses.lookupByPostalCode('01310-100');
const result = await nfe.addresses.lookupByPostalCode('01310100');
```

Validates CEP format (8 digits, with or without dash).

### search(options?): Promise<AddressLookupResponse>

OData filter expression support:
```typescript
const result = await nfe.addresses.search({
  filter: "city eq 'Sao Paulo' and state eq 'SP'",
});
```

### lookupByTerm(term): Promise<AddressLookupResponse>

Free-text search:
```typescript
const result = await nfe.addresses.lookupByTerm('Avenida Paulista Sao Paulo');
```

### AddressLookupResponse

```typescript
interface AddressLookupResponse {
  addresses: Address[];
}

interface Address {
  state: string;                    // UF code (e.g., 'SP')
  city: {
    code: string;                   // IBGE city code
    name: string;
  };
  district: string;
  street: string;
  streetSuffix: string;
  number: string;
  numberMin: string;
  numberMax: string;
  additionalInformation: string;
  postalCode: string;               // Format: '01310100' (no dash)
  country: string;
}
```

---

## ProductInvoiceQueryResource (NF-e SEFAZ Query)

Access via `nfe.productInvoiceQuery`. Global scope.
Queries NF-e data directly from SEFAZ by access key. No company scope needed.

### retrieve(accessKey): Promise<ProductInvoiceDetails>

```typescript
// Access key must be exactly 44 numeric digits
const invoice = await nfe.productInvoiceQuery.retrieve('35210512345678000190550010000001231123456789');
```

**ProductInvoiceDetails** contains:
- `issuer`: Company that issued (CNPJ, name, address, IE)
- `buyer`: Recipient (CNPJ/CPF, name, address)
- `items[]`: Line items with description, NCM, CFOP, quantity, amounts, taxes
- `totals`: ICMS totals, ISSQN totals
- `transport`: Shipping information
- `payment`: Payment details
- `protocol`: SEFAZ authorization protocol
- `additionalInfo`: Fisco/taxpayer notes
- `events[]`: Fiscal events (cancellation, correction, manifestation)

Key status values:
```typescript
type ProductInvoiceStatus = 'unknown' | 'authorized' | 'canceled';
type ProductInvoiceOperationType = 'incoming' | 'outgoing';
type ProductInvoiceEnvironmentType = 'production' | 'test';
```

### downloadPdf(accessKey): Promise<Buffer>

Downloads DANFE PDF as raw `Buffer`. Write directly to file:
```typescript
const pdf = await nfe.productInvoiceQuery.downloadPdf(accessKey);
writeFileSync('danfe.pdf', pdf);
```

### downloadXml(accessKey): Promise<Buffer>

Downloads NF-e XML as raw `Buffer`.

### listEvents(accessKey): Promise<ProductInvoiceEventsResponse>

Lists fiscal events for the invoice (cancellations, correction letters, manifestations).

---

## ConsumerInvoiceQueryResource (CFe-SAT)

Access via `nfe.consumerInvoiceQuery`. Global scope.
Queries CFe-SAT (Cupom Fiscal Eletronico) data from SEFAZ.

### retrieve(accessKey): Promise<TaxCoupon>

```typescript
const coupon = await nfe.consumerInvoiceQuery.retrieve(accessKey);
```

**TaxCoupon** contains:
- `issuer`: Emitter details
- `buyer`: Consumer details (optional, may be anonymous)
- `items[]`: Line items with description, NCM, CFOP, quantity, taxes
- `total`: ICMS and ISSQN totals
- `payment`: Payment details (cash, card, etc.)
- `additionalInformation`: Extra data

Key status values:
```typescript
type CouponStatus = 'Unknown' | 'Authorized' | 'Canceled';
type CouponTaxRegime = 'National_Simple' | 'National_Simple_Brute' | 'Normal_Regime';
```

### downloadXml(accessKey): Promise<Buffer>

Downloads CFe XML as raw `Buffer`.

---

## LegalEntityLookupResource (CNPJ Query)

Access via `nfe.legalEntityLookup`. Global scope.
Queries Receita Federal for company data by CNPJ.

### getBasicInfo(cnpj, options?): Promise<LegalEntityBasicInfoResponse>

```typescript
// CNPJ accepts formatted or raw string
const info = await nfe.legalEntityLookup.getBasicInfo('12.345.678/0001-90');
const info = await nfe.legalEntityLookup.getBasicInfo('12345678000190');

interface LegalEntityBasicInfoOptions {
  includePartners?: boolean;     // Include partner/shareholder info
  includeActivities?: boolean;   // Include CNAE economic activities
}
```

**LegalEntityBasicInfo** key fields:
```typescript
{
  federalTaxNumber: string;        // CNPJ
  name: string;                    // Legal name (razao social)
  tradeName?: string;              // Trade name (nome fantasia)
  status: LegalEntityStatus;       // 'Active' | 'Suspended' | 'Cancelled' | ...
  size: LegalEntitySize;           // 'ME' | 'EPP' | 'DEMAIS'
  unit: LegalEntityUnit;           // 'Headoffice' | 'Subsidiary'
  natureCode: LegalEntityNatureCode;
  taxRegime: LegalEntityTaxRegime; // 'SimplesNacional' | 'MEI' | 'Normal' | 'Unknown'
  openingDate?: string;
  email?: string;
  capital?: number;                // Social capital
  address?: LegalEntityAddress;
  phones?: LegalEntityPhone[];
  activities?: LegalEntityEconomicActivity[];  // CNAE codes
  partners?: LegalEntityPartner[];
}
```

Status enum:
```typescript
type LegalEntityStatus = 'Unknown' | 'Active' | 'Suspended' | 'Cancelled' | 'Unabled' | 'Null';
```

### getStateTaxInfo(state, cnpj): Promise<LegalEntityStateTaxResponse>

Get state tax registrations (Inscricoes Estaduais) for a specific state:

```typescript
const taxInfo = await nfe.legalEntityLookup.getStateTaxInfo('SP', '12345678000190');
```

**BrazilianState** type — all 27 UF codes plus special values:
```typescript
type BrazilianState =
  | 'AC' | 'AL' | 'AM' | 'AP' | 'BA' | 'CE' | 'DF' | 'ES'
  | 'GO' | 'MA' | 'MG' | 'MS' | 'MT' | 'PA' | 'PB' | 'PE'
  | 'PI' | 'PR' | 'RJ' | 'RN' | 'RO' | 'RR' | 'RS' | 'SC'
  | 'SE' | 'SP' | 'TO'
  | 'EX'  // Exterior (foreign)
  | 'NA'; // Not applicable
```

Returns state tax registrations with status per state:
```typescript
interface LegalEntityStateTax {
  taxNumber: string;                      // IE number
  state: BrazilianState;
  status: LegalEntityStateTaxStatus;      // 'Abled' | 'Unabled' | 'Cancelled' | 'Unknown'
}
```

### getStateTaxForInvoice(state, cnpj): Promise<LegalEntityStateTaxForInvoiceResponse>

Like `getStateTaxInfo()` but with extended status evaluation for invoice issuance. Use this to determine which IE to use when creating product invoices.

### getSuggestedStateTaxForInvoice(state, cnpj): Promise<LegalEntityStateTaxForInvoiceResponse>

Auto-detects the best IE for invoice issuance. Enterprise use case.

---

## NaturalPersonLookupResource (CPF Query)

Access via `nfe.naturalPersonLookup`. Global scope.
Queries Receita Federal for CPF cadastral status.

### getStatus(cpf, birthDate): Promise<NaturalPersonStatusResponse>

```typescript
// CPF accepts formatted or raw string
// birthDate as 'YYYY-MM-DD' string
const status = await nfe.naturalPersonLookup.getStatus(
  '123.456.789-09',
  '1990-01-15'
);
```

**NaturalPersonStatusResponse**:
```typescript
{
  name: string;
  status: NaturalPersonStatus;
  registrationDate?: string;
  // ...
}

type NaturalPersonStatus =
  | 'Regular'
  | 'Suspensa'
  | 'Cancelada'
  | 'Titular Falecido'
  | 'Pendente de Regularizacao'
  | 'Nula';
```

---

## Common Patterns

### Address from CEP to Invoice

```typescript
// 1. Look up address by CEP
const { addresses } = await nfe.addresses.lookupByPostalCode('01310-100');
const addr = addresses[0];

// 2. Use in invoice borrower
await nfe.serviceInvoices.createAndWait(companyId, {
  // ...
  borrower: {
    federalTaxNumber: 12345678000190,
    name: 'Client',
    address: {
      country: addr.country,
      postalCode: addr.postalCode,
      street: addr.street,
      number: '100',
      district: addr.district,
      city: { code: addr.city.code, name: addr.city.name },
      state: addr.state,
    },
  },
});
```

### CNPJ Validation Before Invoice

```typescript
// 1. Check if CNPJ is active
const { legalEntity } = await nfe.legalEntityLookup.getBasicInfo(cnpj);
if (legalEntity?.status !== 'Active') {
  throw new Error(`CNPJ ${cnpj} is not active: ${legalEntity?.status}`);
}

// 2. Check state tax for NF-e
const { legalEntity: taxInfo } = await nfe.legalEntityLookup.getStateTaxForInvoice('SP', cnpj);
const validIE = taxInfo?.stateTaxes?.find(t => t.status === 'Abled');
```
