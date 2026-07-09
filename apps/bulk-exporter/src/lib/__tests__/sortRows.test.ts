import { describe, it, expect } from 'vitest';

// Re-implement the comparator inline so we can test it without invoking the
// full Exporter (which needs a CMA client). The shape mirrors the function
// used in src/lib/exporter.ts -> sortRowsByColumn.
function sortRowsByColumn<T extends Record<string, string | number | boolean | null>>(
  rows: T[],
  column: string,
  direction: 'asc' | 'desc'
): T[] {
  const factor = direction === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = a[column];
    const bv = b[column];

    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * factor;
    }

    return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' }) * factor;
  });
}

describe('sortRowsByColumn (mirror of exporter helper)', () => {
  const rows = [
    { Name: 'Charlie', Updated: '2026-01-03' },
    { Name: 'alice', Updated: '2026-01-01' },
    { Name: 'Bob', Updated: '2026-01-02' },
  ];

  it('sorts strings ascending case-insensitively', () => {
    const result = sortRowsByColumn(rows, 'Name', 'asc');
    expect(result.map(r => r.Name)).toEqual(['alice', 'Bob', 'Charlie']);
  });

  it('sorts strings descending', () => {
    const result = sortRowsByColumn(rows, 'Name', 'desc');
    expect(result.map(r => r.Name)).toEqual(['Charlie', 'Bob', 'alice']);
  });

  it('sorts dates ascending by string comparison (ISO format)', () => {
    const result = sortRowsByColumn(rows, 'Updated', 'asc');
    expect(result.map(r => r.Updated)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03']);
  });

  it('puts null/undefined values at the end regardless of direction', () => {
    const withNulls = [
      { Name: 'Beta', value: 5 },
      { Name: 'Alpha', value: null },
      { Name: 'Gamma', value: 1 },
    ];

    const asc = sortRowsByColumn(withNulls, 'value', 'asc');
    expect(asc.map(r => r.Name)).toEqual(['Gamma', 'Beta', 'Alpha']);

    const desc = sortRowsByColumn(withNulls, 'value', 'desc');
    expect(desc.map(r => r.Name)).toEqual(['Beta', 'Gamma', 'Alpha']);
  });

  it('does not mutate the input array', () => {
    const before = rows.map(r => r.Name);
    sortRowsByColumn(rows, 'Name', 'asc');
    expect(rows.map(r => r.Name)).toEqual(before);
  });

  it('sorts numbers numerically (not lexically)', () => {
    const numbers = [
      { Name: 'a', count: 2 },
      { Name: 'b', count: 10 },
      { Name: 'c', count: 1 },
    ];
    const result = sortRowsByColumn(numbers, 'count', 'asc');
    expect(result.map(r => r.count)).toEqual([1, 2, 10]);
  });
});
