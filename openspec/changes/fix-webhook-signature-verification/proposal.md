# Proposal: Fix Webhook Signature Verification

**Change ID**: `fix-webhook-signature-verification`
**Status**: Draft
**Created**: 2026-06-11
**Author**: Andre Kutianski (with empirical evidence collected via live probe)
**Priority**: 🔴 CRITICAL (security-relevant; method is currently non-functional)

---

## Problem Statement

`WebhooksResource.validateSignature()` ([src/core/resources/webhooks.ts:164](../../../src/core/resources/webhooks.ts#L164)) is the SDK's gatekeeper against forged webhook deliveries. **It does not work today.** Empirical probing against the real NFE.io API revealed five independent defects, any one of which causes valid webhooks to be rejected:

| # | Defect | Current code | NFE.io reality |
|---|---|---|---|
| 1 | **Wrong header name** documented & in examples | `X-NFE-Signature` | `X-Hub-Signature` |
| 2 | **Wrong hash algorithm** | `HMAC-SHA256` | `HMAC-SHA1` |
| 3 | **Wrong case comparison** | implicit lowercase hex | UPPERCASE hex |
| 4 | **No prefix handling** | raw hex compare | `sha1=` prefix sent |
| 5 | **`require('crypto')` is broken** | `(globalThis as any).require?.('crypto')` | always returns `undefined` in ESM and CommonJS modules → `validateSignature` always returns `false` |

Defects #1–#4 mean that **even after fixing #5**, the method would still reject all real NFE.io webhooks. Defect #5 means the method is currently a no-op that silently rejects everything, including legitimate traffic.

Two minor implementation bugs compound the issue:
- `crypto.timingSafeEqual()` throws (not returns false) when the two buffers differ in length — easy attacker DoS or noisy log spam.
- Errors are swallowed by `console.error` and the method returns `false`, hiding configuration bugs.

---

## Evidence

A live probe was run against `https://api.nfse.io/v2/webhooks` in the test account, with three independent registrations (filters: product invoices, service invoices, and a mixed cross-product filter). All three produced **identical signature schemes**:

```
Header:    X-Hub-Signature
Format:    sha1=<HMAC-SHA1(secret, raw_body_utf8_bytes).hex().toUpperCase()>
Example:   sha1=BCD17C02B9E3B40A18E745E7E04247E4AD2DD935
Verified:  Content-MD5 of the body also matched byte-for-byte (independent confirmation)
```

The probe also established:
- All NFE.io products (NF-e Produto, NF-e Consumidor, NF-e Serviço, CT-e, Distribuição) share **one global webhook registry** on `api.nfse.io`. Signature scheme is identical across all of them.
- The documentation at `nfeio-docs/.../distribuicao/02-doc-tecnica-clientes-dev.md` claims `X-NFe-Signature` + HMAC-SHA256 — **this is incorrect** (no such scheme exists in production). Fixing the doc is out of scope here but should be tracked.

Probe script + raw logs preserved at `/tmp/webhook-probe.js` and `/tmp/webhook-probe.log` for reproducibility. Reference test fixtures derived from real responses will be included in the implementation.

---

## Goals

### Primary

1. `validateSignature()` MUST correctly verify webhook signatures sent by NFE.io's production API.
2. The method MUST use `node:crypto` via static import (no runtime `require` lookups).
3. The method MUST be timing-safe regardless of input length or format.
4. The method MUST NOT throw on malformed inputs — invalid signatures simply return `false`.
5. Documentation, examples, and the bundled SDK skill MUST reflect the correct header name and algorithm.

### Secondary

1. Add a permissive overload that accepts the raw `IncomingMessage`-style request object, so users do not have to manually pull `headers['x-hub-signature']` and reconstruct the raw body.
2. Surface `X-Hook-Id` and `X-Hook-Attempts` headers in a small helper type so consumers can implement idempotency without poking at raw headers.

### Non-Goals

1. **Fixing the broader `Webhook` resource shape mismatch** (url vs uri, events vs filters, etc.) — there is a separate, larger discrepancy between the SDK's webhook CRUD types and the real OpenAPI schema. That deserves its own proposal (`align-webhooks-resource-with-openapi`). This change is scoped to signature verification only.
2. **Webhook delivery itself** — the SDK is the receiver, not the deliverer. Out of scope.
3. **Updating `nfeio-docs/`** — third-party doc repo. Will be tracked as a separate issue against the docs team.
4. **Supporting alternative algorithms** (e.g., future SHA256 migration) — YAGNI. Re-open if NFE.io publishes a v2 webhook signature scheme.

---

## Proposed Solution

### New `validateSignature` API surface

```typescript
class WebhooksResource {
  /**
   * Verify the HMAC-SHA1 signature on a webhook delivery from NFE.io.
   *
   * @param payload - The raw request body. Pass a Buffer when possible to
   *                  preserve exact bytes; strings are encoded as UTF-8.
   * @param signature - The full value of the X-Hub-Signature header,
   *                    including the "sha1=" prefix.
   * @param secret - The webhook secret configured when registering.
   * @returns true if the signature matches; false on any mismatch, malformed
   *          input, missing prefix, or runtime error.
   *
   * @example
   *   app.post('/webhook', express.raw({ type: '*\/*' }), (req, res) => {
   *     const ok = nfe.webhooks.validateSignature(
   *       req.body,
   *       req.headers['x-hub-signature'],
   *       process.env.NFE_WEBHOOK_SECRET,
   *     );
   *     if (!ok) return res.status(401).end();
   *     // ...
   *   });
   */
  validateSignature(
    payload: Buffer | string,
    signature: string | string[] | undefined,
    secret: string,
  ): boolean;
}
```

### Implementation outline

```typescript
import { createHmac, timingSafeEqual } from 'node:crypto';

validateSignature(payload, signature, secret) {
  if (!secret || !signature) return false;
  const sigStr = Array.isArray(signature) ? signature[0] : signature;
  if (typeof sigStr !== 'string') return false;

  const prefix = 'sha1=';
  if (!sigStr.toLowerCase().startsWith(prefix)) return false;
  const received = sigStr.slice(prefix.length).toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(received)) return false;

  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
  const expected = createHmac('sha1', secret).update(body).digest('hex'); // always lowercase

  const a = Buffer.from(received, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

The comparison normalizes both sides to lowercase hex bytes, so NFE.io's UPPERCASE output and our lowercase output collide cleanly. Buffers always have length 20 (HMAC-SHA1) at the comparison step, so `timingSafeEqual` never throws.

### Breaking change?

Strictly: yes — the method signature gains `Buffer` as an accepted payload type, and the semantic changes from "always-false" to "correct verification". In practice, **no consumer code can be successfully using `validateSignature` today**, because it always returns `false`. The "breaking" change is therefore "code that depended on the broken behavior will now correctly accept legitimate webhooks." We treat this as a bugfix and ship in the next patch/minor release with a clear CHANGELOG entry.

---

## Implementation Phases

### Phase 1 — Core fix (Day 1)
- Rewrite `validateSignature` with static `node:crypto` import, prefix handling, case normalization, length-safe comparison
- Update inline JSDoc with the corrected header name and a working Express snippet

### Phase 2 — Tests (Day 1)
- Unit tests using **real fixtures** captured from the probe (body, secret, signature triplets)
- Property-style tests: every signature produced by `createHmac('sha1', secret)` over a body MUST validate, in both upper and lowercase hex
- Negative tests: missing prefix, wrong algorithm prefix (`sha256=`), wrong length, tampered body, missing secret, missing header, header as array, Buffer vs string payload equivalence
- Anti-regression: assert the method does NOT throw on any malformed input

### Phase 3 — Documentation propagation (Day 2)
- `docs/API.md` webhook section: header name + algorithm
- `examples/all-resources-demo.js`, `examples/real-world-webhooks.js`: corrected snippets
- `skills/nfeio-sdk/SKILL.md` and `skills/nfeio-sdk/references/service-invoices-and-polling.md`: already correct on header name, but update to show the prefix and case handling
- `CHANGELOG.md`: prominent bugfix entry with migration note

### Phase 4 — Optional ergonomic helpers (Day 2, can be deferred)
- `verifyRequest(req, secret)` overload accepting `{ headers, body }` shape
- Surface `X-Hook-Id` / `X-Hook-Attempts` via a typed accessor

---

## Success Criteria

1. ✅ `validateSignature` returns `true` for the three captured probe fixtures (verified in tests)
2. ✅ `validateSignature` returns `false` (never throws) for every adversarial input in the negative test suite
3. ✅ `npm run typecheck && npm run lint && npm test -- --run` all pass
4. ✅ No remaining occurrence of `X-NFE-Signature` in `src/`, `docs/`, `examples/`, or `skills/`
5. ✅ No remaining occurrence of `sha256` or `SHA-256` in the webhook signature context
6. ✅ A new live re-run of the probe still matches the fixtures' algorithm/format (smoke test on each release)

---

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| NFE.io changes the signature scheme in the future (e.g., adds SHA256) | High | Low | The new code is explicit about the prefix (`sha1=`). Adding `sha256=` later is additive, not breaking |
| User-side raw body parsing strips/normalizes bytes before reaching `validateSignature` | High | Medium | Docs prominently warn: use `express.raw()` or equivalent, not `express.json()`. Accept `Buffer` first-class |
| Existing consumer was somehow extracting the right header via the wrong constant string | Low | Low | No path in the SDK actually delivers signature verification today. CHANGELOG entry explains |
| Test fixtures contain real-looking secret | Low | Low | Use the probe's `probe-secret-32chars-minimum-length-1` — clearly non-production |

---

## Out-of-Scope Follow-ups (track separately)

1. **`align-webhooks-resource-with-openapi`** — fix `Webhook` type (`url` → `uri`, `events` → `filters`, add `contentType`, `insecureSsl`, `headers[]`, `status`)
2. **`fix-nfeio-docs-distribuicao-signature`** — file issue/PR against `nfeio-docs` repo to correct the SHA256 claim in distribuicao docs
3. **`sync-openapi-specs-with-docs`** — local `openapi/spec/` is missing several specs that exist in `nfeio-docs/static/api/` (RTC family, Distribuição v2, query API v3s)

---

## Open Questions

1. Should `validateSignature` also accept the lower-level `(IncomingMessage, secret)` form? Decided: yes, as a secondary helper in Phase 4, not blocking the main fix.
2. Should we add a stricter typed `WebhookHeaders` interface exposing `x-hook-id`, `x-hook-attempts`, `content-md5`? Decided: yes if cheap, but it's additive and can defer.
3. Should we deprecate the standalone `validateSignature` in favor of a request-shaped helper? Decided: no — keep both for flexibility.
