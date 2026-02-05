import React from 'react';
import { createGraph, type JsonLdNode } from '@ranklabs/schema';
import { RenderJsonLd } from './render';

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
