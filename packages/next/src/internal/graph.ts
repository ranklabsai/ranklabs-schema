import React from 'react';
import { createGraph, type JsonLdNode } from '@ranklabs/schema';
import { RenderJsonLd } from './render';

/**
 * Renders a single `<script type="application/ld+json">` containing a
 * deduped `@graph` of the passed nodes. Safe for SSR (works in the App
 * Router, Pages Router, and the Metadata API when rendered as a child).
 *
 * **Unique `id` per instance.** `id` becomes the HTML id on the rendered
 * `<script>` tag. If you render more than one `GraphSchema` on the same
 * page, pass a unique `id` to each so the DOM stays valid.
 *
 * @param nodes
 *   An array of JSON-LD node objects (from mappers like `mapProduct`,
 *   `mapArticle`, etc.). Nested arrays are flattened, and `null` /
 *   `undefined` entries are dropped, so conditional rendering is easy.
 * @param id
 *   Optional HTML id for the emitted `<script>` tag. Defaults to
 *   `"schema-graph"`. Provide a unique id per instance when rendering
 *   multiple graphs on one page.
 *
 * @example
 * // Inside a Next.js Server Component:
 * <GraphSchema
 *   id="schema-product"
 *   nodes={[
 *     mapWebPage(webPageInput),
 *     mapProduct(productInput),
 *     mapBreadcrumbList(breadcrumbInput),
 *   ]}
 * />
 */
export function GraphSchema({
  nodes,
  id,
}: {
  nodes: Array<JsonLdNode | null | undefined | JsonLdNode[]>;
  id?: string;
}) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-graph',
    data: createGraph(...nodes),
  });
}
