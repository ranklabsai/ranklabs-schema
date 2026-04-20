/**
 * LOCALE URL HELPERS
 *
 * Multi-locale storefronts typically prefix paths with a locale segment
 * (e.g. `/us/products/foo`, `/au/collections/x`). These helpers let
 * integration code produce consistent canonical `@id`s while still
 * reflecting the visible, locale-prefixed URL elsewhere.
 *
 * Intentionally zero-dependency and tolerant of both path-only and
 * fully-qualified URLs.
 */

/**
 * Remove a leading `/<locale>` segment from a URL or pathname.
 * Accepts the locale as either `"us"` or `"/us"`.
 *
 * ```
 * stripLocalePrefix('/us/products/foo', 'us')
 *   -> '/products/foo'
 * stripLocalePrefix('https://example.com/au/collections/x', 'au')
 *   -> 'https://example.com/collections/x'
 * stripLocalePrefix('/products/foo', 'us')     // locale not present
 *   -> '/products/foo'
 * ```
 */
export function stripLocalePrefix(urlOrPath: string, locale: string): string {
  if (!urlOrPath || !locale) return urlOrPath;
  const clean = locale.replace(/^\//, '').toLowerCase();
  if (!clean) return urlOrPath;

  // Fully-qualified URL branch
  if (/^https?:\/\//i.test(urlOrPath)) {
    try {
      const u = new URL(urlOrPath);
      u.pathname = stripLocaleFromPathname(u.pathname, clean);
      return u.toString();
    } catch {
      return urlOrPath;
    }
  }

  // Pathname branch
  return stripLocaleFromPathname(urlOrPath, clean);
}

function stripLocaleFromPathname(pathname: string, locale: string): string {
  const lower = pathname.toLowerCase();
  if (lower === `/${locale}`) return '/';
  if (lower.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  return pathname;
}

/**
 * Detect which supported locale a pathname belongs to, or `null` if none.
 *
 * ```
 * detectLocale('/au/products/x', ['us', 'au', 'ca']) -> 'au'
 * detectLocale('/products/x', ['us', 'au'])          -> null
 * ```
 */
export function detectLocale(
  urlOrPath: string,
  supportedLocales: readonly string[],
): string | null {
  if (!urlOrPath) return null;
  let pathname = urlOrPath;
  if (/^https?:\/\//i.test(urlOrPath)) {
    try {
      pathname = new URL(urlOrPath).pathname;
    } catch {
      return null;
    }
  }
  const lower = pathname.toLowerCase();
  for (const l of supportedLocales) {
    const clean = l.replace(/^\//, '').toLowerCase();
    if (!clean) continue;
    if (lower === `/${clean}` || lower.startsWith(`/${clean}/`)) return clean;
  }
  return null;
}
