export type CanonicalizeUrlOptions = {
  stripHash?: boolean;
  stripKnownTrackingParams?: boolean;
  sortQueryParams?: boolean;
  lowercaseHost?: boolean;
  removeDefaultPort?: boolean;
  removeTrailingSlash?: boolean;
};

export type CanonicalizeUrlResult = {
  url: string;
  changed: boolean;
  changes: string[];
};

const warnedCanonicalizations = new Set<string>();

/**
 * @internal Test-only: clears the dedupe set for canonicalization warnings
 * so a spy can assert warnings fire deterministically across tests.
 * Not part of the public API.
 */
export function __resetCanonicalizationWarningsForTests(): void {
  warnedCanonicalizations.clear();
}

function isProductionEnv(): boolean {
  const env = (globalThis as any)?.process?.env?.NODE_ENV;
  return env === 'production';
}

const KNOWN_TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'gclid',
  'fbclid',
  'msclkid',
  'ttclid',
  'twclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  '_ga',
  '_gac',
  '_gid',
  '_gl',
]);

function defaults(opts?: CanonicalizeUrlOptions): Required<CanonicalizeUrlOptions> {
  return {
    stripHash: opts?.stripHash ?? true,
    stripKnownTrackingParams: opts?.stripKnownTrackingParams ?? true,
    sortQueryParams: opts?.sortQueryParams ?? true,
    lowercaseHost: opts?.lowercaseHost ?? true,
    removeDefaultPort: opts?.removeDefaultPort ?? true,
    removeTrailingSlash: opts?.removeTrailingSlash ?? false,
  };
}

/**
 * Protocols we refuse to canonicalize. These are the classic dangerous
 * schemes: `javascript:` runs code if rendered as a link, `data:` can
 * embed HTML/JS, `file:` can exfiltrate local resources, `vbscript:` is
 * the IE-era equivalent of `javascript:`. Passing one of these into a
 * mapper would land it in a JSON-LD `@id`, `url`, or `sameAs` field,
 * creating an open-redirect / link-injection vector for consumers that
 * render URLs as hyperlinks.
 */
const DANGEROUS_PROTOCOLS = new Set([
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
]);

/**
 * Canonicalize a URL (lowercase host, strip default ports, strip tracking
 * params, sort query params, optionally strip hash / trailing slash).
 * Returns the canonicalized form plus a list of which transformations
 * applied, so callers can log or test the effect.
 *
 * Rejects dangerous protocols (`javascript:`, `data:`, `file:`,
 * `vbscript:`) with a `TypeError`, preventing them from landing in JSON-LD
 * `@id` / `url` / `sameAs` fields.
 *
 * Most users should prefer the `canonicalId.*` helpers, which wrap this
 * and produce a full fragment-based `@id`. Reach for `canonicalizeUrl`
 * directly when you need the bare canonical form of a URL (for cache
 * keys, dedup, or logging).
 *
 * @example
 * canonicalizeUrl('https://Example.com/path?utm_source=x&b=2&a=1#frag').url
 *   // -> 'https://example.com/path?a=1&b=2'
 */
export function canonicalizeUrl(url: string, opts?: CanonicalizeUrlOptions): CanonicalizeUrlResult {
  const o = defaults(opts);
  const original = new URL(url);
  if (DANGEROUS_PROTOCOLS.has(original.protocol.toLowerCase())) {
    throw new TypeError(
      `[ranklabs-schema] canonicalizeUrl refuses protocol '${original.protocol}'. Only http(s) and standard web URLs are allowed.`,
    );
  }
  const u = new URL(original.toString());
  const changes: string[] = [];

  if (o.lowercaseHost) {
    const before = u.hostname;
    u.hostname = u.hostname.toLowerCase();
    if (before !== u.hostname) changes.push('lowercaseHost');
  }

  if (o.removeDefaultPort) {
    const before = u.port;
    if ((u.protocol === 'https:' && u.port === '443') || (u.protocol === 'http:' && u.port === '80')) {
      u.port = '';
    }
    if (before !== u.port) changes.push('removeDefaultPort');
  }

  if (o.stripHash) {
    const before = u.hash;
    u.hash = '';
    if (before !== u.hash) changes.push('stripHash');
  }

  if (o.removeTrailingSlash) {
    const before = u.pathname;
    if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    if (before !== u.pathname) changes.push('removeTrailingSlash');
  }

  if (o.stripKnownTrackingParams) {
    let removed = false;
    const keys: string[] = [];
    u.searchParams.forEach((_value, key) => {
      keys.push(key);
    });
    for (const key of keys) {
      if (!KNOWN_TRACKING_PARAMS.has(key)) continue;
      u.searchParams.delete(key);
      removed = true;
    }
    if (removed) changes.push('stripKnownTrackingParams');
  }

  if (o.sortQueryParams) {
    const entries: Array<[string, string]> = [];
    u.searchParams.forEach((value, key) => {
      entries.push([key, value]);
    });
    if (entries.length > 1) {
      const sorted = entries
        .slice()
        .sort(([ak, av], [bk, bv]) => (ak === bk ? av.localeCompare(bv) : ak.localeCompare(bk)));

      const sameOrder = entries.every(([k, v], i) => k === sorted[i]?.[0] && v === sorted[i]?.[1]);
      if (!sameOrder) {
        u.search = '';
        for (const [k, v] of sorted) u.searchParams.append(k, v);
        changes.push('sortQueryParams');
      }
    }
  }

  const out = u.toString();
  return {
    url: out,
    changed: out !== original.toString(),
    changes,
  };
}

export function canonicalizeUrlString(url: string, opts?: CanonicalizeUrlOptions): string {
  return canonicalizeUrl(url, opts).url;
}

export function canonicalizeUrlStringWithDevWarnings(url: string, opts?: CanonicalizeUrlOptions): string {
  const r = canonicalizeUrl(url, opts);
  if (r.changed && !isProductionEnv()) {
    const key = `${url} -> ${r.url}`;
    if (!warnedCanonicalizations.has(key)) {
      warnedCanonicalizations.add(key);
      console.warn(`[ranklabs-schema] Canonicalized URL: ${url} -> ${r.url} (${r.changes.join(', ')})`);
    }
  }
  return r.url;
}
