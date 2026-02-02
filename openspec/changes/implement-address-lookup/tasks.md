## 1. Types & Generated Code

- [x] 1.1 Generate TypeScript types from `openapi/spec/consulta-endereco.yaml` using openapi-typescript
  - Note: Swagger 2.0 not supported by openapi-typescript v6+, types created manually
- [x] 1.2 Create `src/generated/consulta-endereco.ts` with generated types
- [x] 1.3 Export Address-related types from `src/generated/index.ts`

## 2. Core Types Extension

- [x] 2.1 Add `addressApiKey?: string` to `NfeConfig` interface in `src/core/types.ts`
- [x] 2.2 Add `Address` and `AddressLookupResponse` types to `src/core/types.ts`
- [x] 2.3 Add `AddressSearchOptions` type with `filter` field

## 3. Multi-API Support Infrastructure

- [x] 3.1 Refactor `NfeClient` constructor to not require `apiKey` (make it optional)
- [x] 3.2 Add `resolveAddressApiKey()` private method with fallback chain logic
- [x] 3.3 Add `resolveMainApiKey()` private method for existing resources
- [x] 3.4 Add `getEnvironmentVariable()` helper method for reading `NFE_ADDRESS_API_KEY`
- [x] 3.5 Convert `serviceInvoices`, `companies`, `legalPeople`, `naturalPeople`, `webhooks` to lazy getters with validation

## 4. Addresses Resource Implementation

- [x] 4.1 Create `src/core/resources/addresses.ts` with `AddressesResource` class
- [x] 4.2 Implement `lookupByPostalCode(postalCode: string)` method
- [x] 4.3 Implement `search(options: AddressSearchOptions)` method with `$filter` query param
- [x] 4.4 Implement `lookupByTerm(term: string)` method
- [x] 4.5 Add input validation for postal code format (8 digits, with or without hyphen)
- [x] 4.6 Add input validation for empty term
- [x] 4.7 Export `AddressesResource` from `src/core/resources/index.ts`

## 5. Client Integration

- [x] 5.1 Add lazy `addresses` getter to `NfeClient` class
- [x] 5.2 Create separate `HttpClient` instance for addresses with `https://address.api.nfe.io/v2` base URL
- [x] 5.3 Throw `ConfigurationError` with descriptive message when no API key available
- [x] 5.4 Export Address types from `src/index.ts`

## 6. Unit Tests

- [x] 6.1 Create `tests/unit/resources/addresses.test.ts`
- [x] 6.2 Test `lookupByPostalCode()` with valid CEP returns correct response
- [x] 6.3 Test `lookupByPostalCode()` with invalid CEP throws `ValidationError`
- [x] 6.4 Test `lookupByTerm()` with empty term throws `ValidationError`
- [x] 6.5 Test `search()` passes filter to query params correctly
- [x] 6.6 Create `tests/unit/client-multikey.test.ts` for multi-API key tests
- [x] 6.7 Test lazy getter throws when no key available
- [x] 6.8 Test fallback chain: `addressApiKey` → `apiKey` → env vars
- [x] 6.9 Test isolated resource usage (only addresses, no apiKey)

## 7. Integration Tests

- [x] 7.1 Create `tests/integration/addresses.integration.test.ts`
- [x] 7.2 Test real API call to lookup by postal code (requires test API key)
- [x] 7.3 Test real API call to search by term
- [x] 7.4 Test 404 response handling for non-existent CEP

## 8. Documentation & Examples

- [x] 8.1 Create `examples/address-lookup.js` with usage examples
- [x] 8.2 Update `README.md` with Addresses resource documentation
- [x] 8.3 Document `addressApiKey` configuration option
- [x] 8.4 Document environment variables `NFE_ADDRESS_API_KEY`
- [x] 8.5 Add JSDoc comments to all public methods in `AddressesResource`

## 9. Final Validation

- [x] 9.1 Run `npm run typecheck` - ensure zero errors
- [x] 9.2 Run `npm run lint` - ensure zero warnings (only pre-existing `any` warnings)
- [x] 9.3 Run `npm test` - ensure all tests pass (322 passing, 47 skipped)
- [x] 9.4 Run `npm run build` - ensure successful build
- [ ] 9.5 Test examples manually against sandbox/production API
