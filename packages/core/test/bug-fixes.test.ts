/**
 * Regression tests for the bug-fix sweep.
 *
 * Each test locks in the fix for a concrete reproducer the adversarial
 * review found. If any of these fail, the corresponding bug has returned.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  canonicalizeUrl,
  mapOffer,
  mapProduct,
  stripHtmlForSchema,
  toJsonLdScriptTag,
} from '@ranklabs/schema';

/* ─────────────────────────────────────────────────────────────────────────
 * Bug 1: toJsonLdScriptTag HTML attribute injection
 * ──────────────────────────────────────────────────────────────────────── */

describe('bug fix: toJsonLdScriptTag escapes attribute values', () => {
  it('does not inject attributes via id option', () => {
    const html = toJsonLdScriptTag(
      { '@type': 'Thing', name: 'x' },
      { id: '" onload="alert(1)" x="' },
    );
    // The injected onload handler must not appear as a parsed attribute.
    expect(html).not.toMatch(/ onload="alert/);
    // The literal text should be escaped inside id="...".
    expect(html).toContain('&quot;');
  });

  it('does not inject attributes via nonce option', () => {
    const html = toJsonLdScriptTag(
      { '@type': 'Thing', name: 'x' },
      { nonce: '" onerror="steal()" y="' },
    );
    expect(html).not.toMatch(/ onerror="steal/);
  });

  it('escapes ampersands and angle brackets in attributes', () => {
    const html = toJsonLdScriptTag(
      { '@type': 'Thing', name: 'x' },
      { id: 'a&b<c>d' },
    );
    expect(html).toContain('id="a&amp;b&lt;c&gt;d"');
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Bug 2: mapCondition returned NewCondition for undefined
 * ──────────────────────────────────────────────────────────────────────── */

describe('bug fix: Offer.itemCondition omitted when not provided', () => {
  it('omits itemCondition from the emitted Offer when input is undefined', () => {
    const offer = mapOffer({ price: 10, currency: 'USD', availability: 'InStock' }) as any;
    expect(offer.itemCondition).toBeUndefined();
  });

  it('omits itemCondition for empty string input', () => {
    const offer = mapOffer({
      price: 10,
      currency: 'USD',
      availability: 'InStock',
      itemCondition: '' as any,
    }) as any;
    expect(offer.itemCondition).toBeUndefined();
  });

  it('emits itemCondition when provided explicitly', () => {
    const offer = mapOffer({
      price: 10,
      currency: 'USD',
      availability: 'InStock',
      itemCondition: 'Used',
    }) as any;
    expect(offer.itemCondition).toBe('https://schema.org/UsedCondition');
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Bug 3: mapProduct crashed when offers was undefined
 * Bug 4: normalizeBrand crashed when brand was null/undefined
 * ──────────────────────────────────────────────────────────────────────── */

describe('bug fix: mapProduct defensive guards', () => {
  it('omits offers instead of crashing when offers is undefined', () => {
    const p = mapProduct({
      id: 'p1',
      title: 'Widget',
      description: 'A widget',
      handle: 'widget',
      url: 'https://example.com/products/widget',
      images: [{ url: 'https://example.com/w.jpg', altText: 'Widget' }],
      brand: 'Acme',
      offers: undefined as any,
    }) as any;
    expect(p['@type']).toBe('Product');
    expect(p.offers).toBeUndefined();
  });

  it('omits brand instead of crashing when brand is null', () => {
    const p = mapProduct({
      id: 'p1',
      title: 'Widget',
      description: 'A widget',
      handle: 'widget',
      url: 'https://example.com/products/widget',
      images: [{ url: 'https://example.com/w.jpg', altText: 'Widget' }],
      brand: null as any,
      offers: { price: 10, currency: 'USD', availability: 'InStock' },
    }) as any;
    expect(p.brand).toBeUndefined();
  });

  it('omits brand instead of crashing when brand is empty string', () => {
    const p = mapProduct({
      id: 'p1',
      title: 'Widget',
      description: 'A widget',
      handle: 'widget',
      url: 'https://example.com/products/widget',
      images: [{ url: 'https://example.com/w.jpg', altText: 'Widget' }],
      brand: '',
      offers: { price: 10, currency: 'USD', availability: 'InStock' },
    }) as any;
    expect(p.brand).toBeUndefined();
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Bug 5: mapAvailability coerced non-string to "null" / "undefined"
 * ──────────────────────────────────────────────────────────────────────── */

describe('bug fix: mapAvailability rejects non-string input', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('warns and defaults to InStock for null', () => {
    const offer = mapOffer({ price: 10, currency: 'USD', availability: null as any }) as any;
    expect(offer.availability).toBe('https://schema.org/InStock');
    expect(
      warnSpy.mock.calls.some((c) =>
        String(c[0]).includes('Offer.availability must be a non-empty string'),
      ),
    ).toBe(true);
  });

  it('warns and defaults to InStock for object input', () => {
    const offer = mapOffer({ price: 10, currency: 'USD', availability: {} as any }) as any;
    expect(offer.availability).toBe('https://schema.org/InStock');
  });

  it('warns and defaults to InStock for empty string', () => {
    const offer = mapOffer({ price: 10, currency: 'USD', availability: '' as any }) as any;
    expect(offer.availability).toBe('https://schema.org/InStock');
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Bug 6: canonicalizeUrl accepted javascript: / data: / file: / vbscript:
 * ──────────────────────────────────────────────────────────────────────── */

describe('bug fix: canonicalizeUrl rejects dangerous protocols', () => {
  it('throws on javascript: URL', () => {
    expect(() => canonicalizeUrl('javascript:alert(1)')).toThrow(TypeError);
  });

  it('throws on data: URL', () => {
    expect(() => canonicalizeUrl('data:text/html,<script>alert(1)</script>')).toThrow(TypeError);
  });

  it('throws on file: URL', () => {
    expect(() => canonicalizeUrl('file:///etc/passwd')).toThrow(TypeError);
  });

  it('throws on vbscript: URL', () => {
    expect(() => canonicalizeUrl('vbscript:msgbox(1)')).toThrow(TypeError);
  });

  it('accepts normal http/https URLs', () => {
    expect(canonicalizeUrl('https://example.com').url).toBe('https://example.com/');
    expect(canonicalizeUrl('http://example.com/foo').url).toBe('http://example.com/foo');
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Bug 7: stripHtmlForSchema leaked content from unclosed <script> / <style>
 * ──────────────────────────────────────────────────────────────────────── */

describe('bug fix: stripHtmlForSchema handles unclosed script / style', () => {
  it('strips unclosed <script> openings and everything after', () => {
    const out = stripHtmlForSchema('<p>hi</p><script>alert(1)');
    expect(out).not.toContain('alert');
    expect(out).toContain('hi');
  });

  it('strips unclosed <style> openings and everything after', () => {
    const out = stripHtmlForSchema('<p>hi</p><style>body{color:red;}');
    expect(out).not.toContain('color');
    expect(out).toContain('hi');
  });

  it('still strips properly closed script tags (existing behavior)', () => {
    const out = stripHtmlForSchema('<p>hi</p><script>alert(1)</script><p>bye</p>');
    expect(out).not.toContain('alert');
    expect(out).toContain('hi');
    expect(out).toContain('bye');
  });

  it('strips case-variant unclosed scripts', () => {
    const out = stripHtmlForSchema('<p>hi</p><SCRIPT>alert(1)');
    expect(out).not.toContain('alert');
  });
});
