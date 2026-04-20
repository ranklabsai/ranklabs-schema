/**
 * RICH-RESULT VALIDATION
 *
 * Semantic validation beyond the structural checks in `validateJsonLd`.
 * Walks a node or @graph and reports missing REQUIRED and RECOMMENDED fields
 * per Schema.org type, using Google's rich-result eligibility rules as the
 * baseline where applicable.
 *
 * This is opt-in: callers run it against their prepared JSON-LD and decide
 * whether to throw, warn, or fail CI. It does not mutate input.
 */

export type RichResultSeverity = 'required' | 'recommended';

export type RichResultIssue = {
  /** Schema.org @type the issue was found on (e.g. 'Product'). */
  type: string;
  /** Stable issue code for programmatic handling. */
  code:
    | 'missing_required_field'
    | 'missing_recommended_field'
    | 'invalid_value'
    | 'empty_list';
  /** REQUIRED issues block rich-result eligibility; RECOMMENDED ones degrade it. */
  severity: RichResultSeverity;
  message: string;
  /** JSONPath-ish pointer to the offending node/field. */
  path: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Internal helpers
 * ──────────────────────────────────────────────────────────────────────── */

type Node = Record<string, unknown>;

function isObject(v: unknown): v is Node {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function hasSomeValue(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (isObject(v)) return Object.keys(v).length > 0;
  return true;
}

function typeOf(node: Node): string[] {
  const t = node['@type'];
  if (typeof t === 'string') return [t];
  if (Array.isArray(t)) return t.filter((x): x is string => typeof x === 'string');
  return [];
}

/**
 * A node is treated as a *reference* to a fuller entity when it has an `@id`
 * and only identity keys (`@type`, `@id`, `name`, `url`). We don't run rules
 * against references. The substantive node they point to is validated
 * elsewhere in the graph.
 */
const REFERENCE_KEYS = new Set(['@type', '@id', 'name', 'url']);
function isEntityReference(node: Node): boolean {
  if (!isNonEmptyString(node['@id'])) return false;
  for (const k of Object.keys(node)) {
    if (k === '@context') continue;
    if (!REFERENCE_KEYS.has(k)) return false;
  }
  return true;
}

function push(
  issues: RichResultIssue[],
  type: string,
  path: string,
  field: string,
  severity: RichResultSeverity,
  message?: string,
): void {
  issues.push({
    type,
    code:
      severity === 'required'
        ? 'missing_required_field'
        : 'missing_recommended_field',
    severity,
    message:
      message ||
      `${type} is ${severity === 'required' ? 'missing required' : 'missing recommended'} field \`${field}\``,
    path: `${path}.${field}`,
  });
}

/* ─────────────────────────────────────────────────────────────────────────
 * Per-type rules
 * ──────────────────────────────────────────────────────────────────────── */

type Rule = (node: Node, path: string, issues: RichResultIssue[]) => void;

/**
 * Product rich-result rules.
 * @see https://developers.google.com/search/docs/appearance/structured-data/product
 */
const productRule: Rule = (node, path, issues) => {
  const t = typeOf(node)[0] || 'Product';
  if (!isNonEmptyString(node.name)) push(issues, t, path, 'name', 'required');
  if (!hasSomeValue(node.image)) push(issues, t, path, 'image', 'required');

  const isGroup = t === 'ProductGroup';
  if (isGroup) {
    if (!hasSomeValue(node.hasVariant)) {
      push(issues, t, path, 'hasVariant', 'required');
    }
  } else {
    if (!hasSomeValue(node.offers)) {
      push(issues, t, path, 'offers', 'required');
    }
  }
  if (!hasSomeValue(node.brand)) push(issues, t, path, 'brand', 'recommended');
  if (!hasSomeValue(node.description))
    push(issues, t, path, 'description', 'recommended');
  const hasAnyGtin =
    isNonEmptyString(node.gtin) ||
    isNonEmptyString(node.gtin8) ||
    isNonEmptyString(node.gtin12) ||
    isNonEmptyString(node.gtin13) ||
    isNonEmptyString(node.gtin14) ||
    isNonEmptyString(node.sku) ||
    isNonEmptyString(node.mpn);
  if (!hasAnyGtin) push(issues, t, path, 'gtin|sku|mpn', 'recommended');
};

/**
 * Offer rules. Google requires price, priceCurrency, and availability.
 */
const offerRule: Rule = (node, path, issues) => {
  const t = 'Offer';
  if (!hasSomeValue(node.price) && !hasSomeValue(node.priceSpecification)) {
    push(issues, t, path, 'price', 'required');
  }
  if (!isNonEmptyString(node.priceCurrency)) {
    push(issues, t, path, 'priceCurrency', 'required');
  }
  if (!isNonEmptyString(node.availability)) {
    push(issues, t, path, 'availability', 'required');
  }
};

const articleRule: Rule = (node, path, issues) => {
  const t = typeOf(node)[0] || 'Article';
  if (!isNonEmptyString(node.headline)) push(issues, t, path, 'headline', 'required');
  if (!isNonEmptyString(node.datePublished))
    push(issues, t, path, 'datePublished', 'required');
  const author = node.author;
  if (!hasSomeValue(author)) {
    push(issues, t, path, 'author', 'required');
  } else if (isObject(author) && !isNonEmptyString(author.name)) {
    push(issues, t, `${path}.author`, 'name', 'required');
  }
  if (!hasSomeValue(node.image))
    push(issues, t, path, 'image', 'recommended');
  if (!hasSomeValue(node.keywords))
    push(issues, t, path, 'keywords', 'recommended');
  const publisher = node.publisher;
  if (isObject(publisher)) {
    const pTypes = typeOf(publisher);
    if (pTypes.length && !pTypes.includes('Organization')) {
      issues.push({
        type: t,
        code: 'invalid_value',
        severity: 'required',
        message: `Article.publisher should be an Organization (got '${pTypes.join(',')}'). Google rejects non-Organization publishers for Article rich results.`,
        path: `${path}.publisher.@type`,
      });
    }
    if (!hasSomeValue(publisher.logo)) {
      push(issues, t, `${path}.publisher`, 'logo', 'required');
    }
  }
};

const organizationRule: Rule = (node, path, issues) => {
  const t = typeOf(node)[0] || 'Organization';
  if (!isNonEmptyString(node.name)) push(issues, t, path, 'name', 'required');
  if (!isNonEmptyString(node.url)) push(issues, t, path, 'url', 'required');
  if (!hasSomeValue(node.logo)) push(issues, t, path, 'logo', 'required');
  if (!hasSomeValue(node.sameAs)) push(issues, t, path, 'sameAs', 'recommended');
};

const webSiteRule: Rule = (node, path, issues) => {
  const t = 'WebSite';
  if (!isNonEmptyString(node.name)) push(issues, t, path, 'name', 'required');
  if (!isNonEmptyString(node.url)) push(issues, t, path, 'url', 'required');
  const pa = node.potentialAction;
  const actions = Array.isArray(pa) ? pa : pa ? [pa] : [];
  for (let i = 0; i < actions.length; i += 1) {
    const a = actions[i];
    if (!isObject(a)) continue;
    if (typeOf(a).includes('SearchAction')) {
      const target = a.target;
      const urlTemplate = isObject(target)
        ? (target.urlTemplate as string | undefined)
        : typeof target === 'string'
          ? target
          : undefined;
      if (!isNonEmptyString(urlTemplate)) {
        push(issues, 'SearchAction', `${path}.potentialAction[${i}].target`, 'urlTemplate', 'required');
      } else if (!/\{[A-Za-z_][A-Za-z0-9_]*\}/.test(urlTemplate)) {
        issues.push({
          type: 'SearchAction',
          code: 'invalid_value',
          severity: 'required',
          message: `SearchAction target '${urlTemplate}' is missing a {placeholder} token. Sitelinks Searchbox will not work.`,
          path: `${path}.potentialAction[${i}].target.urlTemplate`,
        });
      }
    }
  }
};

const aggregateRatingRule: Rule = (node, path, issues) => {
  const t = 'AggregateRating';
  if (!hasSomeValue(node.ratingValue))
    push(issues, t, path, 'ratingValue', 'required');
  if (!hasSomeValue(node.reviewCount) && !hasSomeValue(node.ratingCount)) {
    push(
      issues,
      t,
      path,
      'reviewCount|ratingCount',
      'required',
      `AggregateRating requires at least one of reviewCount or ratingCount`,
    );
  }
};

const breadcrumbRule: Rule = (node, path, issues) => {
  const t = 'BreadcrumbList';
  const items = node.itemListElement;
  if (!Array.isArray(items) || items.length === 0) {
    push(issues, t, path, 'itemListElement', 'required');
    return;
  }
  items.forEach((item, i) => {
    if (!isObject(item)) return;
    if (typeof item.position !== 'number') {
      push(issues, t, `${path}.itemListElement[${i}]`, 'position', 'required');
    }
    if (!isNonEmptyString(item.name)) {
      push(issues, t, `${path}.itemListElement[${i}]`, 'name', 'required');
    }
    if (!hasSomeValue(item.item)) {
      push(issues, t, `${path}.itemListElement[${i}]`, 'item', 'required');
    }
  });
};

const faqPageRule: Rule = (node, path, issues) => {
  const t = 'FAQPage';
  const items = node.mainEntity;
  const arr = Array.isArray(items) ? items : items ? [items] : [];
  if (arr.length === 0) {
    push(issues, t, path, 'mainEntity', 'required');
    return;
  }
  arr.forEach((q, i) => {
    if (!isObject(q)) return;
    if (!isNonEmptyString(q.name)) {
      push(issues, 'Question', `${path}.mainEntity[${i}]`, 'name', 'required');
    }
    const a = q.acceptedAnswer;
    if (!isObject(a) || !isNonEmptyString(a.text as string)) {
      push(issues, 'Question', `${path}.mainEntity[${i}]`, 'acceptedAnswer.text', 'required');
    }
  });
};

const itemListRule: Rule = (node, path, issues) => {
  const t = 'ItemList';
  const items = node.itemListElement;
  if (!Array.isArray(items) || items.length === 0) {
    push(issues, t, path, 'itemListElement', 'required');
    return;
  }
  items.forEach((li, i) => {
    if (!isObject(li)) return;
    if (typeof li.position !== 'number') {
      push(issues, t, `${path}.itemListElement[${i}]`, 'position', 'required');
    }
    if (!hasSomeValue(li.item)) {
      push(issues, t, `${path}.itemListElement[${i}]`, 'item', 'required');
    }
  });
};

const reviewRule: Rule = (node, path, issues) => {
  const t = 'Review';
  if (!hasSomeValue(node.author)) push(issues, t, path, 'author', 'required');
  if (!hasSomeValue(node.reviewRating)) push(issues, t, path, 'reviewRating', 'required');
  if (!hasSomeValue(node.itemReviewed) && !isNonEmptyString(node.url as string)) {
    push(issues, t, path, 'itemReviewed|url', 'recommended');
  }
};

const webPageRule: Rule = (node, path, issues) => {
  const t = 'WebPage';
  if (!isNonEmptyString(node.name)) push(issues, t, path, 'name', 'required');
  if (!isNonEmptyString(node.url)) push(issues, t, path, 'url', 'required');
};

const howToRule: Rule = (node, path, issues) => {
  const t = 'HowTo';
  if (!isNonEmptyString(node.name)) push(issues, t, path, 'name', 'required');
  const steps = node.step;
  if (!Array.isArray(steps) || steps.length === 0) {
    push(issues, t, path, 'step', 'required');
    return;
  }
  steps.forEach((s, i) => {
    if (!isObject(s)) return;
    if (!isNonEmptyString(s.name) && !isNonEmptyString(s.text)) {
      push(issues, 'HowToStep', `${path}.step[${i}]`, 'name|text', 'required');
    }
  });
  if (!hasSomeValue(node.image))
    push(issues, t, path, 'image', 'recommended');
  if (!isNonEmptyString(node.totalTime))
    push(issues, t, path, 'totalTime', 'recommended');
};

const RULES: Record<string, Rule> = {
  Product: productRule,
  ProductGroup: productRule,
  Offer: offerRule,
  Article: articleRule,
  BlogPosting: articleRule,
  NewsArticle: articleRule,
  TechArticle: articleRule,
  Organization: organizationRule,
  LocalBusiness: organizationRule,
  WebSite: webSiteRule,
  AggregateRating: aggregateRatingRule,
  BreadcrumbList: breadcrumbRule,
  FAQPage: faqPageRule,
  ItemList: itemListRule,
  Review: reviewRule,
  WebPage: webPageRule,
  CollectionPage: webPageRule,
  HowTo: howToRule,
};

/* ─────────────────────────────────────────────────────────────────────────
 * Walk
 * ──────────────────────────────────────────────────────────────────────── */

function walk(value: unknown, path: string, issues: RichResultIssue[]): void {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, issues));
    return;
  }
  if (!isObject(value)) return;

  // Graph wrapper
  const graph = value['@graph'];
  if (Array.isArray(graph)) {
    graph.forEach((node, i) => walk(node, `${path}.@graph[${i}]`, issues));
    return;
  }

  // Run rules for this node's type(s), but skip pure `@id` references.
  if (!isEntityReference(value)) {
    for (const t of typeOf(value)) {
      const rule = RULES[t];
      if (rule) rule(value, path, issues);
    }
  }

  // Recurse into nested nodes so child Offers, AggregateRatings, etc. get checked
  for (const [k, v] of Object.entries(value)) {
    if (k.startsWith('@')) continue;
    walk(v, `${path}.${k}`, issues);
  }
}

/**
 * Validate rich-result eligibility for a JSON-LD node or @graph.
 *
 * Returns a flat list of issues. Callers choose what to do with them:
 *
 * ```ts
 * const issues = validateRichResults(graph);
 * const blocking = issues.filter(i => i.severity === 'required');
 * if (blocking.length) throw new Error(formatRichResultIssues(blocking));
 * ```
 *
 * This does not replace {@link validateJsonLd}; use both. `validateJsonLd`
 * checks structure, and `validateRichResults` checks semantic richness.
 */
export function validateRichResults(value: unknown): RichResultIssue[] {
  const issues: RichResultIssue[] = [];
  walk(value, '$', issues);
  return issues;
}

/** Human-readable formatter for a list of issues. Useful in CI logs. */
export function formatRichResultIssues(issues: RichResultIssue[]): string {
  if (!issues.length) return 'No rich-result issues.';
  return issues
    .map((i) => `[${i.severity.toUpperCase()}] ${i.path}: ${i.message}`)
    .join('\n');
}
