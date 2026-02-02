## ADDED Requirements

### Requirement: Per-service API key configuration
The system SHALL allow configuration of separate API keys for different NFE.io services within a single client instance.

#### Scenario: Configure address-specific API key
- **WHEN** user creates client with `new NfeClient({ addressApiKey: 'addr-key' })`
- **THEN** the `addresses` resource uses `addr-key` for authentication

#### Scenario: Configure both main and address API keys
- **WHEN** user creates client with `new NfeClient({ apiKey: 'main', addressApiKey: 'addr' })`
- **THEN** the `addresses` resource uses `addr` and other resources use `main`

#### Scenario: Single API key for all resources
- **WHEN** user creates client with `new NfeClient({ apiKey: 'universal-key' })`
- **THEN** all resources including `addresses` use `universal-key`

---

### Requirement: API key fallback chain
The system SHALL resolve API keys using a defined fallback chain when multiple sources are available.

#### Scenario: Address API key fallback to main key
- **WHEN** user creates client with `new NfeClient({ apiKey: 'main' })` (no addressApiKey)
- **THEN** the `addresses` resource uses `main` as fallback

#### Scenario: Environment variable fallback for addresses
- **WHEN** user creates client without keys but `NFE_ADDRESS_API_KEY` is set in environment
- **THEN** the `addresses` resource uses the environment variable value

#### Scenario: Environment variable fallback chain
- **WHEN** user creates client without keys and only `NFE_API_KEY` is set in environment
- **THEN** the `addresses` resource uses `NFE_API_KEY` as final fallback

#### Scenario: Explicit key overrides environment
- **WHEN** user creates client with `addressApiKey: 'explicit'` and `NFE_ADDRESS_API_KEY` is set
- **THEN** the `addresses` resource uses `explicit` (config takes precedence)

---

### Requirement: Lazy API key validation
The system SHALL NOT validate API key presence at client construction time; validation occurs only when a resource is accessed.

#### Scenario: Client creation without any keys
- **WHEN** user creates client with `new NfeClient({ environment: 'production' })`
- **THEN** no error is thrown at construction time

#### Scenario: Error when accessing resource without key
- **WHEN** user accesses `nfe.addresses` without any API key configured
- **THEN** system throws `ConfigurationError` with message: "API key required for Addresses. Set 'addressApiKey' or 'apiKey' in config, or NFE_ADDRESS_API_KEY/NFE_API_KEY environment variable."

#### Scenario: Error when accessing main resource without key
- **WHEN** user accesses `nfe.companies` without `apiKey` or `NFE_API_KEY` configured
- **THEN** system throws `ConfigurationError` with message indicating the specific key needed

#### Scenario: Isolated resource usage
- **WHEN** user creates client with only `addressApiKey` and accesses only `addresses`
- **THEN** operations succeed without requiring `apiKey`

---

### Requirement: Multiple base URL support
The system SHALL support resources that connect to different NFE.io API hosts.

#### Scenario: Addresses resource uses dedicated host
- **WHEN** `addresses` resource makes HTTP requests
- **THEN** requests are sent to `https://address.api.nfe.io/v2`

#### Scenario: Main resources use default host
- **WHEN** `companies`, `serviceInvoices`, or other main resources make HTTP requests
- **THEN** requests are sent to `https://api.nfe.io/v1`

#### Scenario: Shared configuration for timeout and retry
- **WHEN** client is configured with custom `timeout` and `retryConfig`
- **THEN** both `addresses` and main resources use the same timeout and retry settings

---

### Requirement: Resource isolation
The system SHALL ensure that each resource with a different API host has its own isolated HTTP client instance.

#### Scenario: Separate HTTP clients
- **WHEN** client has both `addresses` and `companies` resources
- **THEN** each resource has its own `HttpClient` instance

#### Scenario: No cross-contamination of auth
- **WHEN** `addresses` uses `addressApiKey` and `companies` uses `apiKey`
- **THEN** credentials are never mixed between resources

#### Scenario: Lazy resource initialization
- **WHEN** client is created with `addressApiKey`
- **THEN** the `addresses` HttpClient is only created when `nfe.addresses` is first accessed
