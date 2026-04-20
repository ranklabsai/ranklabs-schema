/**
 * SSR smoke test for @ranklabs/schema-next.
 *
 * The next adapter shares its render / graph internals with schema-hydrogen;
 * this file just verifies the Next-facing exports also SSR correctly.
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { GraphSchema, mapOrganization, mapWebSite } from '@ranklabs/schema-next';

describe('schema-next: GraphSchema SSR', () => {
  it('renders an Organization + WebSite graph as a single script tag', () => {
    const html = renderToStaticMarkup(
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
    expect(html).toContain('"@graph"');
    expect(html).toContain('"@type":"Organization"');
    expect(html).toContain('"@type":"WebSite"');
  });
});
