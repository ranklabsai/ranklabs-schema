import { describe, expect, it } from 'vitest';

import {
  assertJsonLd,
  cleanJsonLd,
  prepareJsonLd,
  validateJsonLd,
  withContext,
  createGraph,
  JsonLdValidationError,
} from '@ranklabs/schema';

describe('runtime utils', () => {
  it('cleanJsonLd strips undefined deeply by default', () => {
    const input = {
      a: 1,
      b: undefined,
      c: [1, undefined, 2],
      d: { x: undefined, y: 'ok' },
    };

    const out = cleanJsonLd(input);
    expect(out).toEqual({ a: 1, c: [1, 2], d: { y: 'ok' } });
  });

  it('cleanJsonLd optionally strips null and empty containers', () => {
    const input = {
      a: null,
      b: '',
      c: [],
      d: {},
      e: { nested: {} },
    };

    const out = cleanJsonLd(input, {
      removeNull: true,
      removeEmptyStrings: true,
      removeEmptyArrays: true,
      removeEmptyObjects: true,
    });

    expect(out).toEqual({});
  });

  it('validateJsonLd catches nested @context', () => {
    const graph = {
      '@context': 'https://schema.org',
      '@graph': [withContext({ '@type': 'Thing', name: 'X' }) as any],
    };
    const issues = validateJsonLd(graph);
    expect(issues.some((i: { code: string }) => i.code === 'nested_context')).toBe(true);
  });

  it('validateJsonLd catches invalid @id', () => {
    const issues = validateJsonLd({ '@context': 'https://schema.org', '@type': 'Thing', '@id': 'not-a-url' });
    expect(issues.some((i: { code: string }) => i.code === 'invalid_id')).toBe(true);
  });

  it('assertJsonLd throws JsonLdValidationError', () => {
    expect(() => assertJsonLd({ '@context': 'https://schema.org', '@id': 'nope', '@type': 'Thing' })).toThrow(
      JsonLdValidationError,
    );
  });

  it('prepareJsonLd throw mode throws; warn/silent returns cleaned value', () => {
    expect(() => prepareJsonLd({ '@context': 'https://schema.org', '@id': 'nope', '@type': 'Thing' }, { mode: 'throw' })).toThrow(
      JsonLdValidationError,
    );

    const out = prepareJsonLd(
      { '@context': 'https://schema.org', '@type': 'Thing', foo: undefined },
      { mode: 'silent' },
    );
    expect(out).toEqual({ '@context': 'https://schema.org', '@type': 'Thing' });
  });
});
