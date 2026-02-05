import { SCHEMA_CONTEXT } from './constants';

export type JsonLdObject = object;
export type JsonLdNode = JsonLdObject & { '@type'?: string; '@id'?: string };

function isJsonLdNode(value: unknown): value is JsonLdNode {
  return !!value && typeof value === 'object';
}

function stripContext<T>(node: T): T {
  if (!isJsonLdNode(node)) return node;
  if (!('@context' in (node as any))) return node;

  const { ['@context']: _ctx, ...rest } = node as any;
  return rest as T;
}

function flattenNodes(input: Array<JsonLdNode | null | undefined | JsonLdNode[]>): JsonLdNode[] {
  const out: JsonLdNode[] = [];
  for (const item of input) {
    if (!item) continue;
    if (Array.isArray(item)) {
      for (const n of item) {
        if (!isJsonLdNode(n)) continue;
        out.push(n);
      }
      continue;
    }
    if (!isJsonLdNode(item)) continue;
    out.push(item);
  }
  return out;
}

function dedupeById(nodes: JsonLdNode[]): JsonLdNode[] {
  const seen = new Set<string>();
  const out: JsonLdNode[] = [];

  for (const n of nodes) {
    const idValue = (n as any)['@id'];
    const id = typeof idValue === 'string' ? idValue : undefined;
    if (!id) {
      out.push(n);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(n);
  }

  return out;
}

export function createGraph(
  ...nodes: Array<JsonLdNode | null | undefined | JsonLdNode[]>
): { '@context': string; '@graph': JsonLdNode[] } {
  const flat = flattenNodes(nodes).map(stripContext);
  const graph = dedupeById(flat);

  return {
    '@context': SCHEMA_CONTEXT,
    '@graph': graph,
  };
}

export function withContext<T>(node: T): T & { '@context': string } {
  if (!isJsonLdNode(node)) {
    throw new TypeError('[ranklabs-schema] withContext() expects a JSON-LD object node');
  }
  return {
    '@context': SCHEMA_CONTEXT,
    ...(stripContext(node) as any),
  };
}

function htmlEscapeJson(json: string): string {
  // Prevent breaking out of <script> and avoid issues with some JS parsers
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export type JsonLdStringifyOptions = {
  pretty?: boolean;
  escapeForHtml?: boolean;
};

export function toJsonLdString(value: unknown, opts?: JsonLdStringifyOptions): string {
  const pretty = opts?.pretty ?? false;
  const escapeForHtml = opts?.escapeForHtml ?? true;

  const json = JSON.stringify(value, (_k, v) => (v === undefined ? undefined : v), pretty ? 2 : 0);
  if (!escapeForHtml) return json;
  return htmlEscapeJson(json);
}

export type JsonLdScriptTagOptions = {
  id?: string;
  nonce?: string;
};

export function toJsonLdScriptTag(value: unknown, opts?: JsonLdScriptTagOptions): string {
  const idAttr = opts?.id ? ` id=\"${opts.id}\"` : '';
  const nonceAttr = opts?.nonce ? ` nonce=\"${opts.nonce}\"` : '';
  const json = toJsonLdString(value, { pretty: false, escapeForHtml: true });

  return `<script${idAttr}${nonceAttr} type=\"application/ld+json\">${json}</script>`;
}
