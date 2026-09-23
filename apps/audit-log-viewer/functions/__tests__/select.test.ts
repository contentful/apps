// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { MAX_FILES, selectLogFiles } from '../lib/storage/select';

const key = (yyyymmdd: string) => `contentful-audit-org1-${yyyymmdd}T040000000Z.json`;

describe('selectLogFiles', () => {
  it('keeps only files whose covered date is inside the range', () => {
    const { selected, truncated } = selectLogFiles(
      [
        { key: key('20260601'), size: 10 }, // covers 2026-05-31 → out
        { key: key('20260603'), size: 20 }, // covers 2026-06-02 → in
        { key: 'unrelated.txt', size: 1 },
      ],
      '2026-06-01',
      '2026-06-10'
    );
    expect(selected).toEqual([{ key: key('20260603'), size: 20, coveredDate: '2026-06-02' }]);
    expect(truncated).toBe(false);
  });

  it('sorts newest first, caps at MAX_FILES and sets truncated', () => {
    const objects = Array.from({ length: MAX_FILES + 5 }, (_, i) => ({
      key: key(`202601${String((i % 28) + 1).padStart(2, '0')}`),
      size: 1,
    }));
    const { selected, truncated } = selectLogFiles(objects, '2025-12-01', '2026-02-28');
    expect(selected).toHaveLength(MAX_FILES);
    expect(truncated).toBe(true);
    expect(selected[0].coveredDate >= selected[1].coveredDate).toBe(true);
  });
});
