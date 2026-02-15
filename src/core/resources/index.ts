/**
 * NFE.io SDK v3 - Resources Index
 *
 * Centralized exports for all API resources
 */

// Resource classes
export { ServiceInvoicesResource, createServiceInvoicesResource } from './service-invoices.js';
export { CompaniesResource, createCompaniesResource } from './companies.js';
export { LegalPeopleResource } from './legal-people.js';
export { NaturalPeopleResource } from './natural-people.js';
export { WebhooksResource } from './webhooks.js';
export { AddressesResource, createAddressesResource, ADDRESS_API_BASE_URL } from './addresses.js';
export { TransportationInvoicesResource, createTransportationInvoicesResource, CTE_API_BASE_URL } from './transportation-invoices.js';
export { InboundProductInvoicesResource, createInboundProductInvoicesResource } from './inbound-product-invoices.js';
export { ProductInvoiceQueryResource, createProductInvoiceQueryResource, NFE_QUERY_API_BASE_URL } from './product-invoice-query.js';
export { ConsumerInvoiceQueryResource, createConsumerInvoiceQueryResource } from './consumer-invoice-query.js';
export { LegalEntityLookupResource, createLegalEntityLookupResource, LEGAL_ENTITY_API_BASE_URL } from './legal-entity-lookup.js';
export { NaturalPersonLookupResource, createNaturalPersonLookupResource, NATURAL_PERSON_API_BASE_URL } from './natural-person-lookup.js';
