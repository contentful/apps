import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMETERS, resolveParameters } from '../src/parameters';

describe('resolveParameters', () => {
  it('returns defaults for missing or empty parameters', () => {
    expect(resolveParameters(undefined)).toEqual(DEFAULT_PARAMETERS);
    expect(resolveParameters(null)).toEqual(DEFAULT_PARAMETERS);
    expect(resolveParameters({})).toEqual(DEFAULT_PARAMETERS);
  });

  it('keeps valid values and coerces numeric strings', () => {
    const resolved = resolveParameters({ maxCandidates: 1000, batchSize: '3' });
    expect(resolved).toEqual({ maxCandidates: 1000, batchSize: 3, untouchedOnly: true });
  });

  it('falls back to defaults for invalid values', () => {
    const resolved = resolveParameters({ maxCandidates: -5, batchSize: 'many', untouchedOnly: 1 });
    expect(resolved).toEqual(DEFAULT_PARAMETERS);
  });

  it('caps batchSize at the CMA rate limit of 7', () => {
    expect(resolveParameters({ batchSize: 50 }).batchSize).toBe(7);
  });

  it('accepts booleans and boolean strings for untouchedOnly', () => {
    expect(resolveParameters({ untouchedOnly: false }).untouchedOnly).toBe(false);
    // Hand-edited parameters may store booleans as strings.
    expect(resolveParameters({ untouchedOnly: 'false' }).untouchedOnly).toBe(false);
    expect(resolveParameters({ untouchedOnly: 'true' }).untouchedOnly).toBe(true);
  });
});
