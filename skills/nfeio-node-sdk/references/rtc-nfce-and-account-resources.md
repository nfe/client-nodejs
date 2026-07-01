# RTC, NFC-e & Account Resources (v5)

New resources introduced in v5. Signatures are current as of v5.0.0.

## RTC — Reforma Tributária do Consumo

The RTC layout (IBS/CBS/IS tax groups) is **selected by the payload** — same endpoints as
regular issuance. NFS-e polls; NF-e/NFC-e is webhook-driven.

### `nfe.serviceInvoicesRtc` (NFS-e RTC · api.nfe.io · Company)
```typescript
create(companyId, data: NFSeRtcRequest): Promise<CreateInvoiceResponse>   // discriminated union
createAndWait(companyId, data: NFSeRtcRequest, options?: PollingOptions): Promise<ServiceInvoiceData>
retrieve(companyId, invoiceId): Promise<ServiceInvoiceData>
downloadCancellationXml(companyId, invoiceId): Promise<Buffer>            // XML do evento de cancelamento (Ambiente Nacional)
```
`NFSeRtcRequest` carries the `ibsCbs` group. `create()` returns
`{ status: 'immediate', invoice } | { status: 'async', response }` (same shape as
`serviceInvoices.create`).

### `nfe.productInvoicesRtc` (NF-e/NFC-e RTC · api.nfse.io · Company)
```typescript
create(companyId, data: ProductInvoiceRtcRequest): Promise<NfeProductInvoiceIssueData>  // webhook-driven, no polling
```
`ProductInvoiceRtcRequest` carries the IBS (estadual/municipal), CBS and IS groups.

---

## `nfe.consumerInvoices` — NFC-e (api.nfse.io · Company)

Webhook-driven emission (202 = enqueued; completion via webhook). **`environment`
(`'Production' | 'Test'`) is required on `list`** and accepted (optional) on the reads.

```typescript
create(companyId, data: ConsumerInvoiceData): Promise<ConsumerInvoice>          // webhook-driven
list(companyId, options: ConsumerInvoiceListOptions): Promise<ConsumerInvoiceListResponse>  // options.environment REQUIRED
retrieve(companyId, invoiceId, environment?): Promise<ConsumerInvoice>
cancel(companyId, invoiceId): Promise<ConsumerInvoice>
getItems(companyId, invoiceId, environment?): Promise<NfeInvoiceItemsResponse>
getEvents(companyId, invoiceId, environment?): Promise<NfeProductInvoiceEventsResponse>
downloadPdf(companyId, invoiceId, environment?): Promise<Buffer>                 // DANFE-NFC-e
downloadXml(companyId, invoiceId, environment?): Promise<Buffer>
downloadRejectionXml(companyId, invoiceId, environment?): Promise<Buffer>
disable(companyId, data: ConsumerInvoiceDisablementData): Promise<NfeDisablementResource>  // inutilização
```
`ConsumerInvoiceListOptions = { environment: 'Production' | 'Test'; startingAfter?; endingBefore?; limit?; q? }`.
Distinct from `nfe.consumerInvoiceQuery` (read-only CFe-SAT coupon lookup).

---

## `nfe.municipalTaxes` — Inscrições Municipais (api.nfse.io · Company)

CRUD of municipal enrollments — **prerequisite for NFS-e issuance** (mirrors `stateTaxes`).

```typescript
list(companyId): Promise<MunicipalTaxListResponse>                       // { municipalTaxes, hasMore }
create(companyId, data: CreateMunicipalTaxData): Promise<MunicipalTax>
retrieve(companyId, municipalTaxId): Promise<MunicipalTax>
update(companyId, municipalTaxId, data: UpdateMunicipalTaxData): Promise<MunicipalTax>
delete(companyId, municipalTaxId): Promise<void>
updatePrefecture(companyId, municipalTaxId, data: UpdateMunicipalTaxData): Promise<MunicipalTax>  // HTTP PATCH
getSeries(companyId, municipalTaxId, serie): Promise<Record<string, unknown>>
```

---

## `nfe.certificates` — Certificados por thumbprint (api.nfse.io · Company)

```typescript
list(companyId): Promise<CertificatesMetadataResource>                   // { certificates }
getByThumbprint(companyId, thumbprint): Promise<CertificateMetadataResource>
deleteByThumbprint(companyId, thumbprint): Promise<void>
getByThumbprintV1(companyId, thumbprint): Promise<...>                   // variantes v1
deleteByThumbprintV1(companyId, thumbprint): Promise<void>
```
Complements the legacy `companies.uploadCertificate` (upload lives on api.nfe.io).

---

## `nfe.notifications` — Notificações (api.nfe.io · Company)

```typescript
list(companyId): Promise<NotificationListResponse>                       // { notifications }
retrieve(companyId, notificationId): Promise<Notification>
delete(companyId, notificationId): Promise<void>
sendEmail(companyId, data?): Promise<void>
```

---

## Account-scoped webhooks (`nfe.webhooks.*Account*`)

Account-level (host-root `/v2/webhooks`, **no companyId**) — distinct from the
company-scoped `nfe.webhooks.list/create(...)` under `/companies/{id}/webhooks`.

```typescript
listAccountWebhooks(): Promise<ListResponse<Webhook>>                    // unwraps the {webHooks} envelope
createAccountWebhook(data: Partial<Webhook>): Promise<Webhook>
retrieveAccountWebhook(webhookId): Promise<Webhook>
updateAccountWebhook(webhookId, data): Promise<Webhook>
deleteAccountWebhook(webhookId): Promise<void>
deleteAllAccountWebhooks(): Promise<void>                                // ⚠️ removes ALL account webhooks
pingAccountWebhook(webhookId): Promise<void>
fetchEventTypes(): Promise<Array<WebhookEvent | (string & {})>>          // LIVE event-type list (extracts ids)
```
Prefer `fetchEventTypes()` over the deprecated hardcoded `getAvailableEvents()`.

---

## Other v5 additions

- `serviceInvoices.cancelAndWait(companyId, invoiceId, options?)` — polls until the async
  cancellation settles (`cancel()` returns a discriminated `CancelInvoiceResponse`).
- `serviceInvoices.retrieveByExternalId(companyId, externalId)` — idempotency/reconciliation.
- `companies.exists(companyId)` — `HEAD` check (404 → `false`).
- `stateTaxes.switchAuthorizer(companyId, stateTaxId, data?)` — NF-e authorizer switch.
