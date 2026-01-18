# Spec: Company CRUD Operations

**Capability**: `company-crud-operations`  
**Related Change**: `implement-companies-resource`

---

## ADDED Requirements

### Requirement: Create Company with Validation
**Priority**: CRITICAL  
**Rationale**: Creating companies is the foundation of all NFE.io operations. Without proper validation, users may waste API calls and receive unclear error messages.

The SDK MUST provide a create() method that accepts company data, validates it client-side, and creates the company via the NFE.io API. The method MUST handle validation errors, authentication errors, and conflict errors gracefully.

#### Scenario: Successfully create a valid company
- **Given** a valid company data object with required fields (name, federalTaxNumber, address)
- **When** the user calls `nfe.companies.create(data)`
- **Then** the API creates the company and returns a Company object with generated `id`
- **And** the company data includes `createdOn` and `modifiedOn` timestamps
- **And** the returned company matches the input data

#### Scenario: Reject invalid CNPJ format
- **Given** a company data object with invalid CNPJ (wrong length or invalid check digits)
- **When** the user calls `nfe.companies.create(data)`
- **Then** the SDK throws a ValidationError before making an API call
- **And** the error message explains the CNPJ format requirement
- **And** no API request is made

#### Scenario: Handle authentication errors gracefully
- **Given** an invalid API key is configured
- **When** the user calls `nfe.companies.create(data)`
- **Then** the SDK throws an AuthenticationError
- **And** the error message indicates the API key is invalid
- **And** the error includes the HTTP status code (401)

#### Scenario: Handle duplicate company errors
- **Given** a company with the same federalTaxNumber already exists
- **When** the user calls `nfe.companies.create(data)`
- **Then** the SDK throws a ConflictError
- **And** the error message indicates a duplicate company exists
- **And** the error includes the conflicting company ID if available

---

### Requirement: List Companies with Pagination
**Priority**: HIGH  
**Rationale**: Users need to retrieve their companies efficiently, especially when they have many companies. Proper pagination prevents memory issues and improves performance.

The SDK MUST provide list() method with pagination support, listAll() for auto-pagination, and listIterator() for async iteration. Pagination MUST handle page boundaries correctly and prevent duplicate results.

#### Scenario: List first page of companies
- **Given** the user has at least 10 companies in their account
- **When** the user calls `nfe.companies.list({ pageCount: 10, pageIndex: 0 })`
- **Then** the SDK returns a ListResponse with exactly 10 companies
- **And** the response includes pagination metadata (totalCount, hasMore)
- **And** the companies are in a consistent order (e.g., by creation date)

#### Scenario: Navigate through pages
- **Given** the user has 50 companies in their account
- **When** the user calls `nfe.companies.list({ pageCount: 20, pageIndex: 0 })`
- **And** then calls `nfe.companies.list({ pageCount: 20, pageIndex: 1 })`
- **And** then calls `nfe.companies.list({ pageCount: 20, pageIndex: 2 })`
- **Then** the SDK returns 20, 20, and 10 companies respectively
- **And** no company appears in multiple pages
- **And** all 50 companies are retrieved across the three pages

#### Scenario: Auto-paginate all companies
- **Given** the user has 250 companies in their account
- **When** the user calls `nfe.companies.listAll()`
- **Then** the SDK automatically fetches all pages
- **And** returns an array of all 250 companies
- **And** makes exactly 3 API requests (100 per page)

#### Scenario: Stream companies with async iterator
- **Given** the user has 1000 companies in their account
- **When** the user iterates with `for await (const company of nfe.companies.listIterator())`
- **Then** the SDK yields companies one at a time
- **And** automatically fetches new pages as needed
- **And** the memory usage remains constant regardless of total count

---

### Requirement: Retrieve Company by ID
**Priority**: HIGH  
**Rationale**: Users frequently need to fetch a specific company by its ID for display or further operations.

The SDK MUST provide a retrieve() method that fetches a single company by ID. The method MUST throw NotFoundError for non-existent companies and return complete company data for valid IDs.

#### Scenario: Retrieve an existing company
- **Given** a company exists with ID "company-123"
- **When** the user calls `nfe.companies.retrieve("company-123")`
- **Then** the SDK returns the Company object
- **And** the returned data matches the company's current state
- **And** includes all fields (name, federalTaxNumber, address, etc.)

#### Scenario: Handle non-existent company
- **Given** no company exists with ID "invalid-id"
- **When** the user calls `nfe.companies.retrieve("invalid-id")`
- **Then** the SDK throws a NotFoundError
- **And** the error message indicates the company was not found
- **And** the error includes the requested company ID

---

### Requirement: Update Company Information
**Priority**: HIGH  
**Rationale**: Companies need to update their information when details change (address, contact info, etc.).

The SDK MUST provide an update() method that accepts a company ID and partial update data. The method MUST validate updates client-side, support partial updates (only specified fields changed), and return the complete updated company object.

#### Scenario: Update company name
- **Given** a company exists with ID "company-123" and name "Old Name"
- **When** the user calls `nfe.companies.update("company-123", { name: "New Name" })`
- **Then** the SDK updates the company and returns the updated Company object
- **And** the returned company has name "New Name"
- **And** the modifiedOn timestamp is updated
- **And** other fields remain unchanged

#### Scenario: Update multiple fields
- **Given** a company exists with ID "company-123"
- **When** the user calls `nfe.companies.update("company-123", { name: "New Name", email: "new@example.com" })`
- **Then** the SDK updates both fields
- **And** returns the complete updated Company object
- **And** all specified fields are updated
- **And** unspecified fields remain unchanged

#### Scenario: Reject invalid updates
- **Given** a company exists with ID "company-123"
- **When** the user calls `nfe.companies.update("company-123", { federalTaxNumber: "invalid" })`
- **Then** the SDK throws a ValidationError
- **And** the company data remains unchanged
- **And** no API request is made (client-side validation)

---

### Requirement: Delete Company
**Priority**: MEDIUM  
**Rationale**: Users need to remove companies that are no longer active. Note: Method named `remove()` to avoid JavaScript keyword conflicts.

The SDK MUST provide a remove() method that deletes a company by ID. The method MUST handle non-existent companies (NotFoundError), potential cascade deletions, and return deletion confirmation.

#### Scenario: Successfully delete a company
- **Given** a company exists with ID "company-123" and has no dependent resources
- **When** the user calls `nfe.companies.remove("company-123")`
- **Then** the SDK deletes the company
- **And** returns a deletion confirmation { deleted: true, id: "company-123" }
- **And** subsequent retrieve() calls for this ID throw NotFoundError

#### Scenario: Handle deletion with dependent resources
- **Given** a company exists with ID "company-123"
- **And** the company has active service invoices
- **When** the user calls `nfe.companies.remove("company-123")`
- **Then** the SDK may throw a ConflictError (if API prevents deletion)
- **Or** successfully deletes with cascade (if API allows)
- **And** the behavior is documented clearly

#### Scenario: Handle deletion of non-existent company
- **Given** no company exists with ID "invalid-id"
- **When** the user calls `nfe.companies.remove("invalid-id")`
- **Then** the SDK throws a NotFoundError
- **And** the error indicates the company was not found

---

## MODIFIED Requirements

None - these are new requirements for v3.

---

## REMOVED Requirements

None - all v2 functionality is preserved with modernization.

---

## Cross-Capability Dependencies

- **Depends on**: Generated types from `generate-sdk-from-openapi` change
- **Used by**: `service-invoices`, `legal-people`, `natural-people` (all company-scoped)
- **Relates to**: `certificate-management` capability (companies need certificates for invoices)

---

## Notes

- All CRUD operations use generated types from `src/generated/index.ts`
- Error handling follows the error hierarchy defined in `src/core/errors/`
- Pagination strategy may vary based on actual API implementation (offset vs cursor)
- The `remove()` method is named to avoid the JavaScript `delete` keyword
- All operations support retry for transient failures (5xx, rate limits)
