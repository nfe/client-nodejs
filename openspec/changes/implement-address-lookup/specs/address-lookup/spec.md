## ADDED Requirements

### Requirement: Lookup address by postal code
The system SHALL allow users to retrieve address information by providing a Brazilian postal code (CEP).

#### Scenario: Successful lookup by valid CEP
- **WHEN** user calls `addresses.lookupByPostalCode('01310-100')`
- **THEN** system returns an `AddressLookupResponse` with array of matching addresses containing state, city, district, street, and postal code fields

#### Scenario: Lookup with CEP without hyphen
- **WHEN** user calls `addresses.lookupByPostalCode('01310100')`
- **THEN** system accepts the format and returns matching addresses

#### Scenario: CEP not found
- **WHEN** user calls `addresses.lookupByPostalCode('00000-000')`
- **THEN** system throws `NotFoundError` with message indicating no address was found

#### Scenario: Invalid CEP format
- **WHEN** user calls `addresses.lookupByPostalCode('invalid')`
- **THEN** system throws `ValidationError` with message indicating invalid postal code format

---

### Requirement: Search addresses by filter
The system SHALL allow users to search for addresses using field filters via OData `$filter` query parameter.

#### Scenario: Successful search by filter
- **WHEN** user calls `addresses.search({ filter: "city eq 'São Paulo'" })`
- **THEN** system returns an `AddressLookupResponse` with matching addresses

#### Scenario: Empty search results
- **WHEN** user calls `addresses.search({ filter: "street eq 'NonexistentStreet'" })`
- **THEN** system returns an `AddressLookupResponse` with empty addresses array

#### Scenario: Invalid filter syntax
- **WHEN** user calls `addresses.search({ filter: 'invalid syntax' })`
- **THEN** system throws `BadRequestError` with message from API about invalid filter

---

### Requirement: Lookup address by generic term
The system SHALL allow users to search for addresses using a generic search term.

#### Scenario: Successful lookup by term
- **WHEN** user calls `addresses.lookupByTerm('Avenida Paulista')`
- **THEN** system returns an `AddressLookupResponse` with addresses matching the term

#### Scenario: Term not found
- **WHEN** user calls `addresses.lookupByTerm('xyznonexistent123')`
- **THEN** system throws `NotFoundError` with message indicating no addresses found

#### Scenario: Empty term
- **WHEN** user calls `addresses.lookupByTerm('')`
- **THEN** system throws `ValidationError` with message indicating term is required

---

### Requirement: Address response structure
The system SHALL return addresses with complete location data from Correios DNE integrated with IBGE city codes.

#### Scenario: Complete address data
- **WHEN** a successful address lookup is performed
- **THEN** each address in the response contains:
  - `state`: State abbreviation (e.g., 'SP')
  - `city.code`: IBGE city code
  - `city.name`: City name
  - `district`: District/neighborhood name
  - `street`: Street name
  - `streetSuffix`: Street type (e.g., 'Avenida', 'Rua')
  - `postalCode`: Postal code (CEP)
  - `country`: Country code
  - `additionalInformation`: Additional address info (optional)
  - `number`, `numberMin`, `numberMax`: Number range info (optional)

---

### Requirement: TypeScript type safety
The system SHALL provide complete TypeScript types for all address-related operations.

#### Scenario: Typed response
- **WHEN** user uses `addresses.lookupByPostalCode()` in TypeScript
- **THEN** the return type is `Promise<AddressLookupResponse>` with full type inference

#### Scenario: Typed address object
- **WHEN** user accesses properties of an Address object
- **THEN** TypeScript provides autocomplete and type checking for all address fields
