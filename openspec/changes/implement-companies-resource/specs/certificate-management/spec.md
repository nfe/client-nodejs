# Spec: Certificate Management

**Capability**: `certificate-management`  
**Related Change**: `implement-companies-resource`

---

## ADDED Requirements

### Requirement: Upload Digital Certificate
**Priority**: CRITICAL  
**Rationale**: Companies must have valid digital certificates to issue electronic invoices. Certificate upload is mandatory for invoice operations.

The SDK MUST provide uploadCertificate() method that validates certificates locally before upload, supports .pfx and .p12 formats, handles FormData for file upload, and provides detailed error messages for validation failures.

#### Scenario: Upload valid certificate
- **Given** a valid .pfx certificate file and correct password
- **When** the user calls `nfe.companies.uploadCertificate("company-123", { file: buffer, password: "secret" })`
- **Then** the SDK validates the certificate locally first
- **And** uploads the certificate to the NFE.io API
- **And** returns an upload confirmation { uploaded: true }
- **And** the certificate becomes active for the company

#### Scenario: Reject certificate with wrong password
- **Given** a valid certificate file but incorrect password
- **When** the user calls `nfe.companies.uploadCertificate("company-123", { file: buffer, password: "wrong" })`
- **Then** the SDK throws a CertificateError during local validation
- **And** the error message indicates password verification failed
- **And** no API request is made

#### Scenario: Reject unsupported certificate format
- **Given** a certificate in unsupported format (e.g., .pem, .jks)
- **When** the user calls `nfe.companies.uploadCertificate("company-123", { file: buffer, password: "secret" })`
- **Then** the SDK throws a ValidationError
- **And** the error message lists supported formats (.pfx, .p12)
- **And** no API request is made

#### Scenario: Handle expired certificate upload
- **Given** a valid but expired certificate
- **When** the user calls `nfe.companies.uploadCertificate("company-123", { file: buffer, password: "secret" })`
- **Then** the SDK throws a CertificateError
- **And** the error indicates the certificate has expired
- **And** includes the expiration date
- **And** no API request is made

#### Scenario: Upload certificate with progress tracking
- **Given** a large certificate file (e.g., 5MB)
- **When** the user calls `nfe.companies.uploadCertificate("company-123", { file: buffer, password: "secret", onProgress: callback })`
- **Then** the SDK calls the onProgress callback with upload percentage
- **And** percentages range from 0 to 100
- **And** the upload completes successfully

---

### Requirement: Validate Certificate Before Upload
**Priority**: HIGH  
**Rationale**: Pre-upload validation prevents wasted API calls and provides immediate feedback on certificate issues.

The SDK MUST provide validateCertificate() method that parses certificates client-side, extracts metadata (subject, issuer, expiration), validates password, checks expiration dates, and returns detailed validation results without making API requests.

#### Scenario: Validate a valid certificate
- **Given** a valid .pfx certificate and correct password
- **When** the user calls `nfe.companies.validateCertificate(buffer, "secret")`
- **Then** the SDK returns { valid: true, metadata: { subject, issuer, expiresOn, ... } }
- **And** metadata includes certificate details
- **And** no API request is made (client-side only)

#### Scenario: Detect expired certificate
- **Given** an expired certificate
- **When** the user calls `nfe.companies.validateCertificate(buffer, "secret")`
- **Then** the SDK returns { valid: false, error: "Certificate has expired", metadata: ... }
- **And** includes the expiration date in metadata
- **And** no API request is made

#### Scenario: Detect not-yet-valid certificate
- **Given** a certificate with validFrom date in the future
- **When** the user calls `nfe.companies.validateCertificate(buffer, "secret")`
- **Then** the SDK returns { valid: false, error: "Certificate is not yet valid", metadata: ... }
- **And** includes the validFrom date in metadata

#### Scenario: Handle corrupt certificate file
- **Given** a corrupted or invalid file
- **When** the user calls `nfe.companies.validateCertificate(buffer, "secret")`
- **Then** the SDK returns { valid: false, error: "Invalid certificate or password" }
- **And** does not throw an exception (returns error object instead)

---

### Requirement: Get Certificate Status
**Priority**: HIGH  
**Rationale**: Users need to check certificate validity and expiration to ensure invoices can be issued.

The SDK MUST provide getCertificateStatus() method that retrieves certificate information from the API, calculates days until expiration, determines validity status, and identifies expiring-soon certificates (< 30 days).

#### Scenario: Get status of company with valid certificate
- **Given** a company has an active, valid certificate
- **When** the user calls `nfe.companies.getCertificateStatus("company-123")`
- **Then** the SDK returns detailed status:
  - hasCertificate: true
  - isValid: true
  - expiresOn: "2026-12-31"
  - daysUntilExpiration: 354
  - isExpiringSoon: false
- **And** the API request completes in < 1 second

#### Scenario: Get status of company with expiring certificate
- **Given** a company has a certificate expiring in 15 days
- **When** the user calls `nfe.companies.getCertificateStatus("company-123")`
- **Then** the SDK returns:
  - hasCertificate: true
  - isValid: true
  - expiresOn: "2026-01-26"
  - daysUntilExpiration: 15
  - isExpiringSoon: true (< 30 days)

#### Scenario: Get status of company with expired certificate
- **Given** a company has an expired certificate
- **When** the user calls `nfe.companies.getCertificateStatus("company-123")`
- **Then** the SDK returns:
  - hasCertificate: true
  - isValid: false
  - expiresOn: "2025-12-31"
  - daysUntilExpiration: -11 (negative = expired)
  - isExpiringSoon: false

#### Scenario: Get status of company without certificate
- **Given** a company has no certificate uploaded
- **When** the user calls `nfe.companies.getCertificateStatus("company-123")`
- **Then** the SDK returns:
  - hasCertificate: false
  - isValid: false
  - Other fields are undefined or null

---

### Requirement: Replace/Rotate Certificate
**Priority**: MEDIUM  
**Rationale**: Certificates expire and must be rotated. A dedicated method simplifies this common operation.

The SDK MUST provide replaceCertificate() method that validates new certificate, uploads it to replace the existing one, optionally verifies old certificate password, and ensures atomic replacement (old certificate remains if new upload fails).

#### Scenario: Replace certificate with new one
- **Given** a company has an existing certificate
- **When** the user calls `nfe.companies.replaceCertificate("company-123", { newFile: buffer, newPassword: "new-secret" })`
- **Then** the SDK validates the new certificate
- **And** uploads the new certificate (replacing the old one)
- **And** returns upload confirmation
- **And** the old certificate is no longer active

#### Scenario: Replace with verification of old certificate
- **Given** a company has an existing certificate
- **When** the user calls `nfe.companies.replaceCertificate("company-123", { oldPassword: "old-secret", newFile: buffer, newPassword: "new-secret" })`
- **Then** the SDK verifies the old password matches (optional safety check)
- **And** proceeds with replacement if verification succeeds
- **And** throws CertificateError if old password is wrong

#### Scenario: Atomic replacement on API error
- **Given** a company has an existing certificate
- **When** the user calls `nfe.companies.replaceCertificate()` but the API fails
- **Then** the SDK does not delete the old certificate
- **And** throws the appropriate error
- **And** the old certificate remains active

---

### Requirement: Check Certificate Expiration Warning
**Priority**: LOW  
**Rationale**: Proactive warnings help users avoid service disruptions from expired certificates.

The SDK MUST provide checkCertificateExpiration() method that checks certificate expiration against a configurable threshold (default 30 days), returns warning object if expiring soon, and returns null if certificate is valid beyond threshold.

#### Scenario: Warning for expiring certificate
- **Given** a company has a certificate expiring in 20 days
- **When** the user calls `nfe.companies.checkCertificateExpiration("company-123", 30)`
- **Then** the SDK returns a warning object:
  - companyId: "company-123"
  - expiresOn: "2026-01-31"
  - daysRemaining: 20
  - message: "Certificate expires in 20 days"

#### Scenario: No warning for valid certificate
- **Given** a company has a certificate expiring in 60 days
- **When** the user calls `nfe.companies.checkCertificateExpiration("company-123", 30)`
- **Then** the SDK returns null (no warning)
- **And** no error is thrown

#### Scenario: Custom threshold for warnings
- **Given** a company has a certificate expiring in 40 days
- **When** the user calls `nfe.companies.checkCertificateExpiration("company-123", 45)`
- **Then** the SDK returns a warning (40 < 45)
- **When** the user calls `nfe.companies.checkCertificateExpiration("company-123", 30)`
- **Then** the SDK returns null (40 > 30)

---

### Requirement: Batch Certificate Status Check
**Priority**: LOW  
**Rationale**: Users managing many companies need efficient bulk certificate checking.

The SDK MUST provide helper methods (getCompaniesWithActiveCertificates, getCompaniesWithExpiredCertificates, getCompaniesWithExpiringSoonCertificates) that filter companies by certificate status efficiently, batch certificate status checks to avoid rate limits, and return filtered company lists.

#### Scenario: Get companies with active certificates
- **Given** 100 companies, 60 with valid certificates, 20 expired, 20 without certificates
- **When** the user calls `nfe.companies.getCompaniesWithActiveCertificates()`
- **Then** the SDK returns an array of 60 companies
- **And** each company has hasCertificate=true and isValid=true
- **And** the operation completes in reasonable time (< 30 seconds)

#### Scenario: Get companies with expired certificates
- **Given** 100 companies, 20 with expired certificates
- **When** the user calls `nfe.companies.getCompaniesWithExpiredCertificates()`
- **Then** the SDK returns an array of 20 companies
- **And** each company has hasCertificate=true and isValid=false

#### Scenario: Get companies with expiring soon certificates
- **Given** 100 companies, 15 with certificates expiring in < 30 days
- **When** the user calls `nfe.companies.getCompaniesWithExpiringSoonCertificates(30)`
- **Then** the SDK returns an array of 15 companies
- **And** each company's certificate expires within 30 days

---

## MODIFIED Requirements

None - certificate management is new in v3 with enhanced functionality.

---

## REMOVED Requirements

None.

---

## Cross-Capability Dependencies

- **Depends on**: `company-crud-operations` (requires company to exist)
- **Enables**: Service invoice creation (requires valid certificate)
- **Relates to**: Error handling (uses CertificateError, ValidationError)

---

## Security Considerations

1. **Password Handling**:
   - Passwords never logged or stored by SDK
   - Passwords transmitted only over HTTPS
   - Certificate buffers cleared from memory after upload

2. **Certificate Validation**:
   - Local validation prevents uploading invalid certificates
   - Reduces exposure of private keys to API
   - Catches errors early before network transmission

3. **Error Messages**:
   - Avoid exposing certificate contents in errors
   - Generic messages for authentication failures
   - Detailed messages only for validation (no sensitive data)

---

## Notes

- Certificate formats supported: .pfx, .p12 (PKCS#12)
- Node.js 18+ provides native crypto APIs for certificate parsing
- FormData handling may require `form-data` package in Node.js
- Certificate file size limits should be documented (typical: 1-10MB)
- API may have rate limits on certificate uploads (e.g., 10 per hour)
