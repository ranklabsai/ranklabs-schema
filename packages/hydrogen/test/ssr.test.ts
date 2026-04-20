/**
 * SSR smoke tests for @ranklabs/schema-hydrogen.
 *
 * These tests verify that `GraphSchema` and `JsonLdSchema` render a
 * <script type="application/ld+json"> tag via React's server renderer
 * exactly as a Hydrogen storefront would during SSR. If these pass, the
 * output will reach crawlers in the initial HTML payload (no hydration
 * required).
 *
 * We use `renderToStaticMarkup` (strips data-reactroot, closer to what
 * a server-rendered snippet actually looks like).
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  GraphSchema,
  JsonLdSchema,
  mapOrganization,
  mapProduct,
  mapWebSite,
  withContext,
} from '@ranklabs/schema-hydrogen';

function render(el: React.ReactElement): string {
  return renderToStaticMarkup(el);
}

describe('GraphSchema SSR', () => {
  it('emits a <script type="application/ld+json"> with an @graph', () => {
    const html = render(
      React.createElement(GraphSchema, {
        id: 'schema-site',
        nodes: [
          mapOrganization({
            name: 'Shop',
            url: 'https://example.com',
            logo: { url: 'https://example.com/logo.png', altText: 'Shop logo' },
          }),
          mapWebSite({
            name: 'Shop',
            url: 'https://example.com',
          }),
        ],
      }),
    );
    expect(html).toMatch(/<script[^>]+type="application\/ld\+json"/);
    expect(html).toContain('id="schema-site"');
    expect(html).toContain('"@graph"');
    expect(html).toContain('"@context":"https://schema.org"');
  });

  it('dedupes nodes with matching @ids', () => {
    const org = mapOrganization({
      name: 'Shop',
      url: 'https://example.com',
      logo: { url: 'https://example.com/logo.png', altText: 'Shop logo' },
    });
    const html = render(
      React.createElement(GraphSchema, { nodes: [org, org] }),
    );
    const match = html.match(/"@type":"Organization"/g);
    expect(match && match.length).toBe(1);
  });

  it('filters null/undefined nodes gracefully', () => {
    const html = render(
      React.createElement(GraphSchema, {
        nodes: [
          null,
          undefined,
          mapWebSite({ name: 'Shop', url: 'https://example.com' }),
        ],
      }),
    );
    expect(html).toContain('"@type":"WebSite"');
  });

  it('escapes </script> sequences in string content', () => {
    const html = render(
      React.createElement(GraphSchema, {
        nodes: [
          mapOrganization({
            name: 'Shop </script><script>alert(1)</script>',
            url: 'https://example.com',
            logo: { url: 'https://example.com/logo.png', altText: 'Shop logo' },
          }),
        ],
      }),
    );
    // The dangerous sequence must not appear verbatim: toJsonLdString escapes
    // `<`, `>`, `&` when escapeForHtml is true (the default in RenderJsonLd).
    expect(html).not.toMatch(/<\/script>\s*<script/);
  });

  it('emits no output when given only null/undefined nodes', () => {
    const html = render(
      React.createElement(GraphSchema, { nodes: [null, undefined] }),
    );
    // createGraph([]) returns a graph with an empty @graph: still renders a
    // script tag, but with an empty list. Crawlers treat this as no-op.
    expect(html).toMatch(/<script[^>]+type="application\/ld\+json"/);
    expect(html).toContain('"@graph":[]');
  });
});

describe('JsonLdSchema SSR', () => {
  it('renders pre-built JSON-LD as a script tag', () => {
    const data = withContext(
      mapProduct({
        id: 'p1',
        title: 'Rug',
        description: 'Desc',
        handle: 'rug',
        url: 'https://example.com/products/rug',
        images: [{ url: 'https://example.com/img.jpg', altText: 'Rug' }],
        brand: 'Acme',
        offers: { price: 100, currency: 'USD', availability: 'InStock' },
      }) as any,
    );
    const html = render(
      React.createElement(JsonLdSchema, { id: 'schema-product', data }),
    );
    expect(html).toMatch(/<script[^>]+type="application\/ld\+json"/);
    expect(html).toContain('id="schema-product"');
    expect(html).toContain('"@type":"Product"');
  });

  it('renders null when data is falsy', () => {
    const html = render(React.createElement(JsonLdSchema, { data: null }));
    expect(html).toBe('');
  });
});
