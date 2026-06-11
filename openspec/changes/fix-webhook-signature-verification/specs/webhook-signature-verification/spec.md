# Spec: Webhook Signature Verification

**Capability**: `webhook-signature-verification`
**Related Change**: `fix-webhook-signature-verification`

---

## MODIFIED Requirements

### Requirement: Verify Webhook Signature From NFE.io

**Priority**: CRITICAL
**Rationale**: Webhook signatures are the only mechanism preventing forged delivery to user endpoints. The SDK's verifier MUST correctly match the scheme NFE.io produces in production, MUST be timing-safe, and MUST never throw on adversarial input.

The SDK MUST provide `WebhooksResource.validateSignature(payload, signature, secret)` that:
- Accepts the raw body as either `Buffer` (preferred, byte-exact) or `string` (encoded as UTF-8)
- Accepts the header value as `string`, `string[]` (Node IncomingMessage shape), or `undefined`
- Returns `true` only when the provided signature matches `HMAC-SHA1(secret, body_bytes)` after stripping the `sha1=` prefix and normalizing case
- Returns `false` for any malformed input, missing input, wrong algorithm prefix, length mismatch, or signature mismatch
- Never throws — including on invalid hex, missing arguments, wrong types, or empty inputs
- Uses `crypto.timingSafeEqual` over equal-length byte buffers (not strings)
- Uses a statically imported `node:crypto` (no runtime `require` lookups)

#### Scenario: Validate a real signature from NFE.io (live fixture)

- **Given** a captured webhook delivery from `api.nfse.io` with body `{"action":"ping","webHook":{...}}` (389 bytes)
- **And** the configured secret `probe-secret-32chars-minimum-length-1`
- **And** the header value `sha1=52854606A8B839F24B818CA0DF33CC5A5C7C5406`
- **When** the user calls `nfe.webhooks.validateSignature(bodyBuffer, headerValue, secret)`
- **Then** the method returns `true`

#### Scenario: Validate the same signature with lowercased hex

- **Given** the same fixture as above
- **And** the header value `sha1=52854606a8b839f24b818ca0df33cc5a5c7c5406` (lowercased)
- **When** validation runs
- **Then** the method returns `true` (case-insensitive comparison)

#### Scenario: Accept Buffer and string payloads equivalently

- **Given** a body string `bodyStr` and its UTF-8 buffer `bodyBuf`
- **And** a valid signature computed over `bodyBuf`
- **When** validation runs with `bodyStr` as payload
- **Then** the method returns `true`
- **When** validation runs with `bodyBuf` as payload
- **Then** the method also returns `true`

#### Scenario: Accept header value as array (Node IncomingMessage)

- **Given** a valid signature delivered as `headers['x-hub-signature']` which Node may expose as a single-element array
- **When** validation runs with the array as the signature argument
- **Then** the method returns `true` using the first element

#### Scenario: Reject a tampered body

- **Given** a valid signature for body `bodyA`
- **When** validation runs with `bodyA` mutated by one byte
- **Then** the method returns `false`
- **And** does not throw

#### Scenario: Reject a signature with the wrong algorithm prefix

- **Given** a header value `sha256=<any 64 hex chars>`
- **When** validation runs
- **Then** the method returns `false`
- **And** does not throw

#### Scenario: Reject a signature without the `sha1=` prefix

- **Given** a header value that is a bare 40-char hex string (no prefix)
- **When** validation runs
- **Then** the method returns `false`
- **And** does not throw

#### Scenario: Reject a signature of incorrect length

- **Given** a header value `sha1=abc`
- **When** validation runs
- **Then** the method returns `false`
- **And** does not throw

#### Scenario: Reject a signature with non-hex characters

- **Given** a header value `sha1=` + 40 non-hex characters
- **When** validation runs
- **Then** the method returns `false`
- **And** does not throw

#### Scenario: Reject a missing or empty secret

- **Given** the secret is `undefined`, `null`, or `''`
- **When** validation runs
- **Then** the method returns `false`
- **And** does not throw

#### Scenario: Reject a missing or empty signature header

- **Given** the signature argument is `undefined`, `null`, `''`, or `[]`
- **When** validation runs
- **Then** the method returns `false`
- **And** does not throw

#### Scenario: Use constant-time comparison

- **Given** the implementation computes the expected HMAC and compares against the provided one
- **Then** comparison MUST go through `crypto.timingSafeEqual` over equal-length byte buffers
- **And** MUST NOT short-circuit on the first mismatching byte (e.g., no `===` on hex strings)

#### Scenario: Use statically imported `node:crypto`

- **Given** the implementation needs `createHmac` and `timingSafeEqual`
- **Then** they MUST be imported via `import { createHmac, timingSafeEqual } from 'node:crypto'` at module top
- **And** MUST NOT use `(globalThis as any).require`, `require('crypto')`, or any runtime lookup

---

## REMOVED Requirements

### Requirement: Tolerate Crypto Module Unavailability

**Reason for removal**: The previous implementation attempted runtime detection of `crypto` and silently returned `false` when unavailable. This was a workaround for an environment NFE.io does not target (the SDK supports Node 18+ exclusively, where `node:crypto` is always present). The defensive lookup masked the real bugs (defects #1–#5 in [design.md](../../design.md)). With static imports, the dependency is type-checked and guaranteed at module load time.

---

## ADDED Requirements

### Requirement: Document Raw-Body Capture Pattern

**Priority**: HIGH
**Rationale**: The most common consumer failure mode is computing HMAC over a re-serialized JSON object (`JSON.stringify(req.body)`), whose byte representation differs from what NFE.io signed. Documentation MUST steer users to capture raw bytes at the HTTP boundary.

The SDK's webhook documentation (README, API.md, JSDoc on `validateSignature`, examples) MUST:
- Show an Express snippet using `express.raw({ type: '*/*' })` (or equivalent middleware)
- Pass `req.body` (Buffer) directly to `validateSignature`, not `JSON.stringify(req.body)`
- Call out in a warning block that re-serializing JSON before validation will fail unpredictably
- Show how to parse the validated buffer back into JSON after verification (`JSON.parse(req.body.toString('utf8'))`)

#### Scenario: Example uses Buffer, not re-serialized JSON

- **Given** the documented Express example for webhook validation
- **When** a reader copy-pastes the snippet
- **Then** the snippet uses `express.raw()` middleware (or documents the equivalent for Fastify/Koa/native http)
- **And** passes `req.body` directly to `validateSignature` without `JSON.stringify`
- **And** parses the JSON only after `validateSignature` returns true
