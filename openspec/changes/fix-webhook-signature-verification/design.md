# Design: Fix Webhook Signature Verification

**Change ID**: `fix-webhook-signature-verification`
**Status**: Draft

---

## Current State Analysis

### Defective implementation

[src/core/resources/webhooks.ts:164-189](../../../src/core/resources/webhooks.ts#L164-L189):

```typescript
validateSignature(payload: string, signature: string, secret: string): boolean {
  try {
    // Import crypto dynamically to avoid issues in non-Node environments
    const crypto = (globalThis as any).require?.('crypto');
    if (!crypto) {
      throw new Error('crypto module not available');
    }

    const hmac = crypto.createHmac('sha256', secret);   // ❌ wrong algorithm
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');        // ❌ lowercase, no prefix handling

    return crypto.timingSafeEqual(                       // ❌ throws on length mismatch
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error validating webhook signature:', error);  // ❌ silent failure
    return false;
  }
}
```

**Per-defect breakdown:**

| # | Line | Symptom | Root cause |
|---|---|---|---|
| 1 | 171 | `crypto` is always `undefined` → throws | `globalThis.require` is non-standard. Not present in ESM, not present in CJS module scope, only present (sometimes) at REPL or via legacy globals |
| 2 | 176 | Even if (1) is fixed, signature never matches | NFE.io uses HMAC-SHA1, not SHA256 |
| 3 | 178 | Even if (1)+(2) fixed, comparison fails | NFE.io returns uppercase hex; our `digest('hex')` returns lowercase |
| 4 | 181-184 | Even if (1)+(2)+(3) fixed, still fails | NFE.io sends `sha1=<hex>`, not bare `<hex>` |
| 5 | 181 | Throws on length mismatch | `timingSafeEqual` requires equal lengths; with prefix mismatch (5 extra chars), lengths differ → throws → caught → returns false but error path is opaque |
| 6 | 187 | Bug masking | Wrapping everything in `try/catch + console.error + return false` hides real errors from operators |

### Documentation inconsistency

The header name is wrong in **three** places that ship to users:

| Location | Current | Should be |
|---|---|---|
| [webhooks.ts:139](../../../src/core/resources/webhooks.ts#L139) (JSDoc) | `X-NFE-Signature` | `X-Hub-Signature` |
| [webhooks.ts:147](../../../src/core/resources/webhooks.ts#L147) (JSDoc example) | `x-nfe-signature` | `x-hub-signature` |
| [docs/API.md:1483](../../../docs/API.md#L1483) | `x-nfe-signature` | `x-hub-signature` |
| [examples/all-resources-demo.js:160](../../../examples/all-resources-demo.js#L160) | `x-nfe-signature` | `x-hub-signature` |
| [examples/real-world-webhooks.js:143](../../../examples/real-world-webhooks.js#L143) | `X-NFE-Signature` | `X-Hub-Signature` |

Already correct (no change needed):
- [skills/nfeio-sdk/SKILL.md:284](../../../skills/nfeio-sdk/SKILL.md#L284)
- [skills/nfeio-sdk/references/service-invoices-and-polling.md:317-321](../../../skills/nfeio-sdk/references/service-invoices-and-polling.md#L317-L321)

The skill files were apparently authored against the real API while the SDK was authored against an assumed contract — they diverged.

---

## Target Design

### Module-level imports

Move from runtime `require` to top-of-file static import. This is the v3 SDK norm everywhere else:

```typescript
import { createHmac, timingSafeEqual } from 'node:crypto';
```

This makes the dependency static, tree-shakable, and type-checked. `node:` prefix is the modern Node.js convention and works on Node 18+.

### Implementation

```typescript
validateSignature(
  payload: Buffer | string,
  signature: string | string[] | undefined,
  secret: string,
): boolean {
  // Guard: required inputs
  if (!secret || signature == null) return false;

  // Normalize header value: Node's IncomingMessage typing allows string | string[]
  const sigStr = Array.isArray(signature) ? signature[0] : signature;
  if (typeof sigStr !== 'string' || sigStr.length === 0) return false;

  // Strip and validate prefix
  const PREFIX = 'sha1=';
  if (sigStr.length <= PREFIX.length) return false;
  if (sigStr.slice(0, PREFIX.length).toLowerCase() !== PREFIX) return false;

  // Normalize case + validate hex shape (HMAC-SHA1 is always 40 hex chars)
  const received = sigStr.slice(PREFIX.length).toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(received)) return false;

  // Compute expected over raw body bytes
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
  const expected = createHmac('sha1', secret).update(body).digest('hex');

  // Length-checked timing-safe compare on 20-byte digests
  const a = Buffer.from(received, 'hex');
  const b = Buffer.from(expected, 'hex');
  // Both are 20 bytes here, but assert anyway — defense in depth
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

### Why `Buffer | string` for payload

NFE.io computes HMAC over **raw body bytes**. If the user passes a string, we MUST agree on encoding. UTF-8 is correct because:
- The Content-Type header sent by NFE.io is `application/json; charset=utf-8` (confirmed via probe)
- JSON is UTF-8 by spec
- `JSON.stringify(obj)` returns a UTF-8-encodable string

However, several footguns exist if the user reaches for `JSON.stringify(req.body)`:
- Property iteration order is implementation-defined → byte order may differ from what NFE.io signed
- Whitespace, escape sequences (`/` vs `\/`), Unicode escapes can differ
- Date serialization, BigInt, etc.

**The only safe path is to validate against the bytes received on the wire.** We document this prominently and provide the `Buffer` path first-class. The string path is a convenience for users who *know* they have the exact original body string.

### Length-check before `timingSafeEqual`

After the regex `^[a-f0-9]{40}$` and the SHA-1 output (always 40 hex), both buffers are guaranteed 20 bytes. The explicit `if (a.length !== b.length)` is defense-in-depth that costs one comparison and prevents a class of throw-on-bad-input bugs.

### Why no `try/catch`

Every error path in the new implementation is handled by an explicit `return false` on validated branches. There is no remaining throw site:
- Regex `.test()` doesn't throw
- `Buffer.from(hex, 'hex')` doesn't throw on invalid hex (returns shorter buffer) — but we already validated via regex
- `createHmac` only throws on unknown algorithm; `'sha1'` is hardcoded
- `timingSafeEqual` only throws on length mismatch; we pre-check

So no try/catch is needed, and removing it means real bugs surface as their natural exceptions instead of being swallowed.

---

## Optional ergonomic helper (Phase 4)

Many users have request objects with both header and body. Provide a thin convenience:

```typescript
verifyRequest(
  request: {
    headers: Record<string, string | string[] | undefined>;
    body: Buffer | string;
  },
  secret: string,
): boolean {
  const sig =
    request.headers['x-hub-signature'] ??
    request.headers['X-Hub-Signature'];
  return this.validateSignature(request.body, sig, secret);
}
```

This composes on top of `validateSignature` and stays out of the validation logic itself, so it can be added (or removed) without touching the security-critical path.

---

## Test Strategy

### Live fixtures

Capture three (body, secret, signature) triplets directly from a probe run and commit them to `tests/fixtures/webhook-signatures.json`. These are the ground truth — if production NFE.io changes scheme, these fixtures break and we know immediately.

Example fixture row:
```json
{
  "label": "product_invoice ping (api.nfse.io)",
  "secret": "probe-secret-32chars-minimum-length-1",
  "body": "{\"action\":\"ping\",\"webHook\":{\"Id\":\"907ce731f350454e95ca8e4963ab9656\",...}}",
  "header_value": "sha1=52854606A8B839F24B818CA0DF33CC5A5C7C5406"
}
```

### Test matrix

| Category | Cases |
|---|---|
| Positive — fixtures | Each captured triplet validates to `true` |
| Positive — round-trip | For random bodies + secrets, computed signature validates to `true` |
| Positive — case | Same signature in UPPER and lower case both validate |
| Positive — payload | Same body as `Buffer` and `string` both validate |
| Positive — header shape | Header as `string` and `[string]` both validate |
| Negative — tamper | Flip one byte in body → `false` |
| Negative — wrong secret | Right body, wrong secret → `false` |
| Negative — wrong prefix | `sha256=...` → `false` |
| Negative — no prefix | bare hex → `false` |
| Negative — wrong length | `sha1=abc` → `false` |
| Negative — non-hex | `sha1=zzz...` → `false` |
| Negative — undefined inputs | missing secret, missing header → `false` |
| Robustness | Each negative case asserts `expect(...).toBe(false)` AND `expect(() => ...).not.toThrow()` |

### Coverage target

`validateSignature` is small and security-critical. Target **100% branch coverage** for this single function. Aggregate webhook resource coverage should remain at or above the project's 80% threshold.

---

## Migration

### For SDK users

Before:
```js
const sig = req.headers['x-nfe-signature'];               // wrong header
const payload = JSON.stringify(req.body);                  // wrong bytes
nfe.webhooks.validateSignature(payload, sig, secret);     // always false
```

After:
```js
// Use express.raw() so req.body is a Buffer with the EXACT bytes NFE.io signed
app.post('/webhook', express.raw({ type: '*/*' }), (req, res) => {
  const ok = nfe.webhooks.validateSignature(
    req.body,                              // Buffer — preserves bytes
    req.headers['x-hub-signature'],        // correct header
    process.env.NFE_WEBHOOK_SECRET,
  );
  if (!ok) return res.status(401).end();
  const payload = JSON.parse(req.body.toString('utf8'));
  // process payload...
});
```

### Internal callers

There are none — the SDK does not invoke `validateSignature` internally. All call sites are user code.

### Release vehicle

This is a bugfix → patch release. Add a prominent ⚠ note in `CHANGELOG.md` (Portuguese, per project convention):

> ### 🔒 Correção crítica: validação de assinatura de webhook
> Versões anteriores rejeitavam silenciosamente toda assinatura legítima da NFE.io. Atualize imediatamente. Veja a seção "Webhooks" do README para o exemplo correto.

---

## Decision Log

| # | Decision | Alternatives considered | Rationale |
|---|---|---|---|
| 1 | Use static `import { createHmac } from 'node:crypto'` | Dynamic `require`, lazy import | Project is Node 18+ only; static imports are idiomatic everywhere else in v3; eliminates the runtime-availability class of bugs |
| 2 | Accept `Buffer \| string` for payload, not just string | string-only, Buffer-only | Buffer is the correct, byte-exact form. String is a footgun but common — accept it with UTF-8 encoding and document the risk |
| 3 | Return `false` on every error path, not throw | Throw on programmer errors (missing secret) | Webhook validation runs on every incoming request. Throwing here causes 500s where 401 is correct. Predictable boolean simplifies caller code |
| 4 | No try/catch wrapper | Keep try/catch as safety net | Every throw site has been eliminated. A bare try/catch hides real bugs and was the source of defect #5 silently masking defect #1 |
| 5 | Compare bytes via `timingSafeEqual` on raw hex-decoded buffers, not strings | String compare lowercased hex | timing-safety is the whole point of `timingSafeEqual`. Comparing 20-byte buffers is the strongest guarantee. Length is pre-validated |
| 6 | Validate hex shape with regex before `Buffer.from` | Skip validation | `Buffer.from('zz', 'hex')` returns an empty buffer silently — would otherwise pass through to a length-mismatch failure. Better to reject explicitly at the prefix layer |
| 7 | Lowercase normalization on receive side, not just the expected side | Compare uppercase to uppercase | Defense-in-depth against potential future NFE.io changes to case. Cost is one `.toLowerCase()` on a ≤45-char string |
| 8 | Don't support `sha256=` prefix yet | Add `sha256=` branch defensively | YAGNI. Adding it later is additive (one extra branch + algorithm switch). Real risk is wrong-by-default behavior, not future flexibility |
