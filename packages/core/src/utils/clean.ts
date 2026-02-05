export type CleanJsonLdOptions = {
  removeNull?: boolean;
  removeEmptyStrings?: boolean;
  removeEmptyArrays?: boolean;
  removeEmptyObjects?: boolean;
};

function defaults(opts?: CleanJsonLdOptions): Required<CleanJsonLdOptions> {
  return {
    removeNull: opts?.removeNull ?? false,
    removeEmptyStrings: opts?.removeEmptyStrings ?? false,
    removeEmptyArrays: opts?.removeEmptyArrays ?? false,
    removeEmptyObjects: opts?.removeEmptyObjects ?? false,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function cleanInternal(value: unknown, opts: Required<CleanJsonLdOptions>): unknown {
  if (value === undefined) return undefined;
  if (value === null) return opts.removeNull ? undefined : null;

  if (typeof value === 'string') {
    if (opts.removeEmptyStrings && value.length === 0) return undefined;
    return value;
  }

  if (Array.isArray(value)) {
    const next = value
      .map((v) => cleanInternal(v, opts))
      .filter((v) => v !== undefined);

    if (opts.removeEmptyArrays && next.length === 0) return undefined;
    return next;
  }

  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const cleaned = cleanInternal(v, opts);
      if (cleaned === undefined) continue;
      out[k] = cleaned;
    }
    if (opts.removeEmptyObjects && Object.keys(out).length === 0) return undefined;
    return out;
  }

  return value;
}

export function cleanJsonLd<T>(value: T, opts?: CleanJsonLdOptions): T {
  const cleaned = cleanInternal(value, defaults(opts));
  if (cleaned !== undefined) return cleaned as T;

  if (Array.isArray(value)) return [] as T;
  if (isPlainObject(value)) return {} as T;
  return cleaned as T;
}