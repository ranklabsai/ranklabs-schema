import { SCHEMA_CONTEXT } from '../constants';
import { cleanJsonLd, type CleanJsonLdOptions } from './clean';
import { formatValidationIssues } from './format';

export type ValidationIssue = {
  code:
    | 'invalid_root'
    | 'invalid_context'
    | 'missing_graph'
    | 'invalid_graph'
    | 'nested_context'
    | 'invalid_id'
    | 'invalid_type';
  message: string;
  path: string;
};

export class JsonLdValidationError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(formatValidationIssues(issues));
    this.name = 'JsonLdValidationError';
    this.issues = issues;
  }
}

export type ValidateJsonLdOptions = {
  allowContext?: string;
  validateIds?: boolean;
  validateTypes?: boolean;
};

export type PrepareJsonLdMode = 'silent' | 'warn' | 'throw';

export type PrepareJsonLdOptions = {
  mode?: PrepareJsonLdMode;
  clean?: CleanJsonLdOptions;
  validate?: ValidateJsonLdOptions;
};

function validateDefaults(opts?: ValidateJsonLdOptions): Required<ValidateJsonLdOptions> {
  return {
    allowContext: opts?.allowContext ?? SCHEMA_CONTEXT,
    validateIds: opts?.validateIds ?? true,
    validateTypes: opts?.validateTypes ?? true,
  };
}

function prepareDefaults(opts?: PrepareJsonLdOptions): Required<PrepareJsonLdOptions> {
  return {
    mode: opts?.mode ?? 'warn',
    clean: opts?.clean ?? {},
    validate: opts?.validate ?? {},
  };
}

function isProductionEnv(): boolean {
  const env = (globalThis as any)?.process?.env?.NODE_ENV;
  return env === 'production';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isGraphObject(value: unknown): value is { '@context': unknown; '@graph': unknown } {
  if (!isObject(value)) return false;
  return '@context' in value && '@graph' in value;
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function isValidType(value: unknown): boolean {
  if (typeof value === 'string' && value.length > 0) return true;
  if (Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'string' && v.length > 0)) {
    return true;
  }
  return false;
}

function validateRoot(value: unknown, opts: Required<ValidateJsonLdOptions>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!isObject(value)) {
    issues.push({
      code: 'invalid_root',
      message: 'Expected JSON-LD root to be an object',
      path: '$',
    });
    return issues;
  }

  const ctx = (value as any)['@context'];
  if (ctx !== undefined && ctx !== opts.allowContext) {
    issues.push({
      code: 'invalid_context',
      message: `Root @context must be '${opts.allowContext}' when provided`,
      path: '$.@context',
    });
  }

  if (isGraphObject(value)) {
    const graph = (value as any)['@graph'];
    if (graph === undefined) {
      issues.push({ code: 'missing_graph', message: 'Graph root must include @graph', path: '$.@graph' });
      return issues;
    }
    if (!Array.isArray(graph)) {
      issues.push({ code: 'invalid_graph', message: '@graph must be an array', path: '$.@graph' });
      return issues;
    }
  }

  return issues;
}

function walk(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  opts: Required<ValidateJsonLdOptions>,
  allowContextAtPath: string,
): void {
  if (value === null || value === undefined) return;

  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, issues, opts, allowContextAtPath));
    return;
  }

  if (!isObject(value)) return;

  if ('@context' in value && path !== allowContextAtPath) {
    issues.push({
      code: 'nested_context',
      message: 'Nested @context is not allowed; compose context at the root only',
      path: `${path}.@context`,
    });
  }

  if (opts.validateIds && '@id' in value) {
    const id = (value as any)['@id'];
    if (id !== undefined && (typeof id !== 'string' || !isValidUrl(id))) {
      issues.push({
        code: 'invalid_id',
        message: '@id must be an absolute http(s) URL when provided',
        path: `${path}.@id`,
      });
    }
  }

  if (opts.validateTypes && '@type' in value) {
    const type = (value as any)['@type'];
    if (type !== undefined && !isValidType(type)) {
      issues.push({
        code: 'invalid_type',
        message: '@type must be a non-empty string (or string[]) when provided',
        path: `${path}.@type`,
      });
    }
  }

  for (const [k, v] of Object.entries(value)) {
    if (k === '@context') continue;
    walk(v, `${path}.${k}`, issues, opts, allowContextAtPath);
  }
}

export function validateJsonLd(value: unknown, opts?: ValidateJsonLdOptions): ValidationIssue[] {
  const o = validateDefaults(opts);
  const issues: ValidationIssue[] = [];

  issues.push(...validateRoot(value, o));
  if (issues.some((i) => i.code === 'invalid_root')) return issues;

  if (isGraphObject(value)) {
    const graph = (value as any)['@graph'];
    if (Array.isArray(graph)) {
      for (let i = 0; i < graph.length; i += 1) {
        const node = graph[i];
        if (isObject(node) && '@context' in node) {
          issues.push({
            code: 'nested_context',
            message: 'Nodes inside @graph must not include @context',
            path: `$.@graph[${i}].@context`,
          });
        }
        walk(node, `$.@graph[${i}]`, issues, o, '$');
      }
      return issues;
    }
  }

  walk(value, '$', issues, o, '$');
  return issues;
}

export function assertJsonLd(value: unknown, opts?: ValidateJsonLdOptions): void {
  const issues = validateJsonLd(value, opts);
  if (issues.length === 0) return;
  throw new JsonLdValidationError(issues);
}

export function prepareJsonLd<T>(value: T, opts?: PrepareJsonLdOptions): T {
  const o = prepareDefaults(opts);
  const cleaned = cleanJsonLd(value, o.clean);
  const issues = validateJsonLd(cleaned, o.validate);

  if (issues.length === 0) return cleaned;

  if (o.mode === 'throw') {
    throw new JsonLdValidationError(issues);
  }

  if (o.mode === 'warn' && !isProductionEnv()) {
    console.warn(`[ranklabs-schema] Invalid JSON-LD:\n${formatValidationIssues(issues)}`);
  }

  return cleaned;
}