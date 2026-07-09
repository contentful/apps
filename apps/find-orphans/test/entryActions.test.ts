import { describe, expect, it, vi } from 'vitest';
import { archiveEntries } from '../src/locations/Page/utils/entryActions';
import { createMockCma } from './mocks';

describe('archiveEntries', () => {
  it('archives every entry and reports progress in batches', async () => {
    const { cma, entryArchive } = createMockCma();
    const onProgress = vi.fn();

    const outcome = await archiveEntries(cma, ['a', 'b', 'c'], 2, onProgress);

    expect(outcome.archivedIds).toEqual(expect.arrayContaining(['a', 'b', 'c']));
    expect(outcome.failedIds).toEqual([]);
    expect(entryArchive).toHaveBeenCalledTimes(3);
    // Two batches for three entries with a batch size of two.
    expect(onProgress).toHaveBeenNthCalledWith(1, { current: 2, total: 3 });
    expect(onProgress).toHaveBeenNthCalledWith(2, { current: 3, total: 3 });
  });

  it('collects failures without aborting the rest of the batch', async () => {
    const { cma } = createMockCma({ failArchiveIds: ['b'] });

    const outcome = await archiveEntries(cma, ['a', 'b', 'c'], 5, vi.fn());

    expect(outcome.archivedIds).toEqual(expect.arrayContaining(['a', 'c']));
    expect(outcome.failedIds).toEqual(['b']);
  });

  it('handles an empty selection without any API calls', async () => {
    const { cma, entryArchive } = createMockCma();

    const outcome = await archiveEntries(cma, [], 5, vi.fn());

    expect(outcome).toEqual({ archivedIds: [], failedIds: [] });
    expect(entryArchive).not.toHaveBeenCalled();
  });
});
