/**
 * HTML SANITIZATION FOR SCHEMA.ORG TEXT FIELDS
 *
 * Used for content that lands in schema fields accepting HTML, most
 * commonly `FAQPage.acceptedAnswer.text` (Google allows a limited HTML
 * subset) and `Article.articleBody` (plain text preferred).
 *
 * **This is not a security sanitizer.** It removes `<script>` and
 * `<style>` elements but does not strip dangerous attributes like
 * `onerror=`, `onclick=`, or `href="javascript:..."`. For user-generated
 * or otherwise untrusted input, use a real library (`sanitize-html`,
 * `DOMPurify`) before passing to this utility. Use `stripHtmlForSchema`
 * on trusted CMS output (Sanity, Contentful, Shopify, Gladly) to
 * normalize shape for JSON-LD text fields.
 *
 * In dev mode the utility logs a warning when it detects common
 * injection patterns (inline event handlers, `javascript:` URIs) so you
 * spot risky inputs early. The warning does not mutate the output.
 *
 * What it does:
 *  - Removes `<script>` and `<style>` elements including their contents.
 *  - Strips all tags except a small allowlist when `mode: 'google-faq'`.
 *  - Decodes the five standard HTML entities to their characters
 *    (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`).
 *  - Collapses runs of whitespace to single spaces.
 */
import { devWarn } from './warn';

const INJECTION_PATTERNS = /\bon[a-z]+\s*=|javascript\s*:|data\s*:\s*text\/html/i;

const GOOGLE_FAQ_ALLOWED_TAGS = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'br',
  'ol',
  'ul',
  'li',
  'a',
  'p',
  'div',
  'b',
  'strong',
  'i',
  'em',
]);

export type StripHtmlMode = 'plain-text' | 'google-faq';

export type StripHtmlOptions = {
  /**
   * `'plain-text'` (default): remove every tag.
   * `'google-faq'`: keep tags on Google's FAQPage allowlist and drop the rest.
   */
  mode?: StripHtmlMode;
};

const SCRIPT_OR_STYLE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
// Fallback for unclosed `<script ...>` or `<style ...>` tags: the closing
// </script>/</style> was omitted or malformed, so the backreference-aware
// SCRIPT_OR_STYLE regex couldn't catch it. We drop from the opening tag
// through end-of-input.
const UNCLOSED_SCRIPT_OR_STYLE = /<(script|style)\b[\s\S]*$/i;
const TAG = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g;
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};
const ENTITY_RE = /&(amp|lt|gt|quot|#39|apos|nbsp);/g;

export function stripHtmlForSchema(input: string, opts?: StripHtmlOptions): string {
  if (!input) return '';
  const mode = opts?.mode ?? 'plain-text';

  if (INJECTION_PATTERNS.test(input)) {
    devWarn(
      'stripHtmlForSchema: input contains an inline event handler, `javascript:` URI, or `data:text/html` URI. This utility is not a security sanitizer; for untrusted input, pair with sanitize-html or DOMPurify.',
    );
  }

  let out = input.replace(SCRIPT_OR_STYLE, '').replace(UNCLOSED_SCRIPT_OR_STYLE, '');

  out = out.replace(TAG, (match, tag: string) => {
    if (mode === 'google-faq' && GOOGLE_FAQ_ALLOWED_TAGS.has(tag.toLowerCase())) {
      return match;
    }
    // Substitute a space when stripping so adjacent text across removed tags
    // doesn't concatenate (e.g. `<p>a</p><p>b</p>` -> `a b`, not `ab`).
    return ' ';
  });

  out = out.replace(ENTITY_RE, (m) => ENTITIES[m] ?? m);
  out = out.replace(/\s+/g, ' ').trim();

  return out;
}
