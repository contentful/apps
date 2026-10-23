// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { coveredDateFromKey } from '../lib/filenames';

describe('coveredDateFromKey', () => {
  it('returns the day before the filename datetime (docs example)', () => {
    expect(
      coveredDateFromKey('contentful-audit-7BLDDu2FYCNoN4QIWys1BR-20251009T040839978Z.json'),
    ).toBe('2025-10-08');
  });

  it('handles keys under a prefix', () => {
    expect(coveredDateFromKey('audit/contentful-audit-org1-20260101T050000000Z.json')).toBe(
      '2025-12-31',
    );
  });

  it('accepts .json.gz too', () => {
    expect(coveredDateFromKey('contentful-audit-org1-20260302T041000123Z.json.gz')).toBe(
      '2026-03-01',
    );
  });

  it('rejects non-matching keys', () => {
    expect(coveredDateFromKey('somethingelse.json')).toBeNull();
    expect(coveredDateFromKey('contentful-audit-org1-notadate.json')).toBeNull();
  });
});
