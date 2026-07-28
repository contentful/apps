import { describe, it, expect } from 'vitest';
import { truncateForXlsx, XLSX_CELL_CHARACTER_LIMIT } from '../exportFormats';

describe('truncateForXlsx', () => {
  it('returns short strings unchanged', () => {
    expect(truncateForXlsx('hello')).toBe('hello');
  });

  it('returns numbers unchanged', () => {
    expect(truncateForXlsx(123)).toBe(123);
  });

  it('returns booleans unchanged', () => {
    expect(truncateForXlsx(true)).toBe(true);
    expect(truncateForXlsx(false)).toBe(false);
  });

  it('returns null unchanged', () => {
    expect(truncateForXlsx(null)).toBeNull();
  });

  it('returns string at exactly the limit unchanged', () => {
    const value = 'a'.repeat(XLSX_CELL_CHARACTER_LIMIT);
    expect(truncateForXlsx(value)).toBe(value);
  });

  it('truncates strings longer than the limit and appends marker', () => {
    const value = 'a'.repeat(XLSX_CELL_CHARACTER_LIMIT + 100);
    const result = truncateForXlsx(value);
    expect(result.length).toBeLessThanOrEqual(XLSX_CELL_CHARACTER_LIMIT);
    expect(result.endsWith('[truncated]')).toBe(true);
  });

  it('truncates very large JSON-stringified blobs without throwing', () => {
    const huge = JSON.stringify({ content: 'x'.repeat(100_000) });
    const result = truncateForXlsx(huge);
    expect(result.length).toBeLessThanOrEqual(XLSX_CELL_CHARACTER_LIMIT);
  });
});
