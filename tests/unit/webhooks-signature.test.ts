/**
 * Tests for WebhooksResource.validateSignature
 *
 * Combines live fixtures captured from api.nfse.io with synthetic round-trip
 * tests and adversarial inputs. The live fixtures are the ground truth — if
 * they ever fail, NFE.io has changed scheme.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { WebhooksResource } from '../../src/core/resources/webhooks';
import type { HttpClient } from '../../src/core/http/client';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesPath = resolve(here, '../fixtures/webhook-signatures.json');

interface Fixture {
  label: string;
  description: string;
  secret: string;
  body: string;
  header_value: string;
  content_md5: string;
  x_hook_id: string;
  user_agent: string;
}

const fixtures: Fixture[] = (
  JSON.parse(readFileSync(fixturesPath, 'utf8')) as { fixtures: Fixture[] }
).fixtures;

describe('WebhooksResource.validateSignature', () => {
  let webhooks: WebhooksResource;

  beforeEach(() => {
    webhooks = new WebhooksResource({} as HttpClient);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Positive: live fixtures from api.nfse.io
  // ─────────────────────────────────────────────────────────────────────────

  describe('live fixtures (captured from api.nfse.io)', () => {
    it.each(fixtures.map((f) => [f.label, f]))(
      'validates %s (string body)',
      (_label, fx) => {
        expect(webhooks.validateSignature(fx.body, fx.header_value, fx.secret)).toBe(true);
      },
    );

    it.each(fixtures.map((f) => [f.label, f]))(
      'validates %s (Buffer body)',
      (_label, fx) => {
        const buf = Buffer.from(fx.body, 'utf8');
        expect(webhooks.validateSignature(buf, fx.header_value, fx.secret)).toBe(true);
      },
    );

    it.each(fixtures.map((f) => [f.label, f]))(
      'validates %s with lowercased header (case-insensitive)',
      (_label, fx) => {
        expect(webhooks.validateSignature(fx.body, fx.header_value.toLowerCase(), fx.secret)).toBe(
          true,
        );
      },
    );

    it.each(fixtures.map((f) => [f.label, f]))(
      'validates %s with header as single-element array (Node IncomingMessage shape)',
      (_label, fx) => {
        expect(webhooks.validateSignature(fx.body, [fx.header_value], fx.secret)).toBe(true);
      },
    );

    it.each(fixtures.map((f) => [f.label, f]))(
      'rejects %s when body is mutated by one byte',
      (_label, fx) => {
        const tampered = fx.body.replace(/"webHook"/, '"WEBhook"'); // case-flip one tag
        expect(webhooks.validateSignature(tampered, fx.header_value, fx.secret)).toBe(false);
      },
    );

    it.each(fixtures.map((f) => [f.label, f]))(
      'rejects %s under wrong secret',
      (_label, fx) => {
        expect(
          webhooks.validateSignature(fx.body, fx.header_value, fx.secret + '-tampered'),
        ).toBe(false);
      },
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Positive: round-trip with arbitrary bodies
  // ─────────────────────────────────────────────────────────────────────────

  describe('round-trip', () => {
    const cases = [
      { name: 'small JSON', body: '{"event":"test"}' },
      { name: 'empty body', body: '' },
      { name: 'unicode', body: '{"description":"Nota fiscal — emissão de serviço"}' },
      { name: 'large payload', body: 'x'.repeat(10000) },
    ];

    it.each(cases)('round-trips $name (uppercase prefix)', ({ body }) => {
      const secret = 'a-test-secret-with-some-entropy-123';
      const sig =
        'sha1=' +
        createHmac('sha1', secret).update(body, 'utf8').digest('hex').toUpperCase();
      expect(webhooks.validateSignature(body, sig, secret)).toBe(true);
    });

    it.each(cases)('round-trips $name (lowercase prefix)', ({ body }) => {
      const secret = 'a-test-secret-with-some-entropy-123';
      const sig = 'sha1=' + createHmac('sha1', secret).update(body, 'utf8').digest('hex');
      expect(webhooks.validateSignature(body, sig, secret)).toBe(true);
    });

    it('accepts uppercase SHA1= prefix variants', () => {
      const body = '{"foo":"bar"}';
      const secret = 'abc';
      const hex = createHmac('sha1', secret).update(body, 'utf8').digest('hex');
      expect(webhooks.validateSignature(body, 'SHA1=' + hex, secret)).toBe(true);
      expect(webhooks.validateSignature(body, 'Sha1=' + hex.toUpperCase(), secret)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Negative: malformed / adversarial inputs
  // ─────────────────────────────────────────────────────────────────────────

  describe('adversarial / malformed inputs', () => {
    const validBody = '{"action":"ping"}';
    const validSecret = 'a-test-secret-with-some-entropy-123';
    const validSig =
      'sha1=' + createHmac('sha1', validSecret).update(validBody, 'utf8').digest('hex');

    const negativeCases: Array<{
      name: string;
      payload: Buffer | string;
      signature: unknown;
      secret: string;
    }> = [
      {
        name: 'missing prefix (bare hex)',
        payload: validBody,
        signature: validSig.replace('sha1=', ''),
        secret: validSecret,
      },
      {
        name: 'wrong algorithm prefix (sha256=)',
        payload: validBody,
        signature: 'sha256=' + 'a'.repeat(64),
        secret: validSecret,
      },
      {
        name: 'wrong algorithm prefix (md5=)',
        payload: validBody,
        signature: 'md5=' + 'a'.repeat(32),
        secret: validSecret,
      },
      {
        name: 'too short',
        payload: validBody,
        signature: 'sha1=abc',
        secret: validSecret,
      },
      {
        name: 'too long',
        payload: validBody,
        signature: 'sha1=' + 'a'.repeat(41),
        secret: validSecret,
      },
      {
        name: 'non-hex characters',
        payload: validBody,
        signature: 'sha1=' + 'z'.repeat(40),
        secret: validSecret,
      },
      {
        name: 'undefined signature',
        payload: validBody,
        signature: undefined,
        secret: validSecret,
      },
      {
        name: 'null signature',
        payload: validBody,
        signature: null,
        secret: validSecret,
      },
      {
        name: 'empty string signature',
        payload: validBody,
        signature: '',
        secret: validSecret,
      },
      {
        name: 'empty array signature',
        payload: validBody,
        signature: [],
        secret: validSecret,
      },
      {
        name: 'array with non-string first element',
        payload: validBody,
        signature: [undefined],
        secret: validSecret,
      },
      {
        name: 'numeric signature',
        payload: validBody,
        signature: 12345,
        secret: validSecret,
      },
      {
        name: 'empty secret',
        payload: validBody,
        signature: validSig,
        secret: '',
      },
      {
        name: 'tampered body',
        payload: validBody.replace('ping', 'pong'),
        signature: validSig,
        secret: validSecret,
      },
      {
        name: 'wrong secret',
        payload: validBody,
        signature: validSig,
        secret: validSecret + '-other',
      },
      {
        name: 'prefix only',
        payload: validBody,
        signature: 'sha1=',
        secret: validSecret,
      },
    ];

    it.each(negativeCases)('returns false for $name (and does not throw)', (c) => {
      let result: boolean | undefined;
      expect(() => {
        result = webhooks.validateSignature(
          c.payload,
          // deliberate `any` cast to feed adversarial types past the static signature
          c.signature as unknown as string,
          c.secret,
        );
      }).not.toThrow();
      expect(result).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Timing-safe behavior smoke check
  // ─────────────────────────────────────────────────────────────────────────

  describe('timing-safety', () => {
    it('does not throw when received and expected differ in raw header length (pre-check)', () => {
      const body = 'irrelevant';
      const secret = 's';
      // Construct a header_value whose stripped length differs from 40 — must
      // be caught by the regex pre-check, not by timingSafeEqual throwing.
      expect(() => webhooks.validateSignature(body, 'sha1=cafe', secret)).not.toThrow();
      expect(webhooks.validateSignature(body, 'sha1=cafe', secret)).toBe(false);
    });
  });
});
