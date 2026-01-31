## 1. Types & Generated Code

- [ ] 1.1 Generate TypeScript types from `openapi/spec/consulta-endereco.yaml` using openapi-typescript
- [ ] 1.2 Create `src/generated/consulta-endereco.ts` with generated types
- [ ] 1.3 Export Address-related types from `src/generated/index.ts`

## 2. Core Types Extension

- [ ] 2.1 Add `addressApiKey?: string` to `NfeConfig` interface in `src/core/types.ts`
- [ ] 2.2 Add `Address` and `AddressLookupResponse` types to `src/core/types.ts`
- [ ] 2.3 Add `AddressSearchOptions` type with `filter` field

## 3. Multi-API Support Infrastructure

- [ ] 3.1 Refactor `NfeClient` constructor to not require `apiKey` (make it optional)
- [ ] 3.2 Add `resolveAddressApiKey()` private method with fallback chain logic
- [ ] 3.3 Add `resolveMainApiKey()` private method for existing resources
- [ ] 3.4 Add `getEnvironmentVariable()` helper method for reading `NFE_ADDRESS_API_KEY`
- [ ] 3.5 Convert `serviceInvoices`, `companies`, `legalPeople`, `naturalPeople`, `webhooks` to lazy getters with validation

## 4. Addresses Resource Implementation

- [ ] 4.1 Create `src/core/resources/addresses.ts` with `AddressesResource` class
- [ ] 4.2 Implement `lookupByPostalCode(postalCode: string)` method
- [ ] 4.3 Implement `search(options: AddressSearchOptions)` method with `$filter` query param
- [ ] 4.4 Implement `lookupByTerm(term: string)` method
- [ ] 4.5 Add input validation for postal code format (8 digits, with or without hyphen)
- [ ] 4.6 Add input validation for empty term
- [ ] 4.7 Export `AddressesResource` from `src/core/resources/index.ts`

## 5. Client Integration

- [ ] 5.1 Add lazy `addresses` getter to `NfeClient` class
- [ ] 5.2 Create separate `HttpClient` instance for addresses with `https://address.api.nfe.io/v2` base URL
- [ ] 5.3 Throw `ConfigurationError` with descriptive message when no API key available
- [ ] 5.4 Export Address types from `src/index.ts`

## 6. Unit Tests

- [ ] 6.1 Create `tests/unit/resources/addresses.test.ts`
- [ ] 6.2 Test `lookupByPostalCode()` with valid CEP returns correct response
- [ ] 6.3 Test `lookupByPostalCode()` with invalid CEP throws `ValidationError`
- [ ] 6.4 Test `lookupByTerm()` with empty term throws `ValidationError`
- [ ] 6.5 Test `search()` passes filter to query params correctly
- [ ] 6.6 Create `tests/unit/client-multikey.test.ts` for multi-API key tests
- [ ] 6.7 Test lazy getter throws when no key available
- [ ] 6.8 Test fallback chain: `addressApiKey` → `apiKey` → env vars
- [ ] 6.9 Test isolated resource usage (only addresses, no apiKey)

## 7. Integration Tests

- [ ] 7.1 Create `tests/integration/addresses.integration.test.ts`
- [ ] 7.2 Test real API call to lookup by postal code (requires test API key)
- [ ] 7.3 Test real API call to search by term
- [ ] 7.4 Test 404 response handling for non-existent CEP

## 8. Documentation & Examples

- [ ] 8.1 Create `examples/address-lookup.js` with usage examples
- [ ] 8.2 Update `README.md` with Addresses resource documentation
- [ ] 8.3 Document `addressApiKey` configuration option
- [ ] 8.4 Document environment variables `NFE_ADDRESS_API_KEY`
- [ ] 8.5 Add JSDoc comments to all public methods in `AddressesResource`

## 9. Final Validation

- [ ] 9.1 Run `npm run typecheck` - ensure zero errors
- [ ] 9.2 Run `npm run lint` - ensure zero warnings
- [ ] 9.3 Run `npm test` - ensure all tests pass
- [ ] 9.4 Run `npm run build` - ensure successful build
- [ ] 9.5 Test examples manually against sandbox/production API
