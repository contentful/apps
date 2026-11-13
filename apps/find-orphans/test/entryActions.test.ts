import { describe, expect, it, vi } from 'vitest';
import { archiveOrphans, ArchiveTarget } from '../src/locations/Page/utils/entryActions';
import { createMockCma } from './mocks';

const entry = (id: string): ArchiveTarget => ({ id, kind: 'entry' });
const asset = (id: string): ArchiveTarget => ({ id, kind: 'asset' });

describe('archiveOrphans', () => {
  it('archives every target and reports progress in batches', async () => {
    const { cma, entryArchive } = createMockCma();
    const onProgress = vi.fn();

    const outcome = await archiveOrphans(cma, [entry('a'), entry('b'), entry('c')], 2, onProgress);

    expect(outcome.archivedIds).toEqual(expect.arrayContaining(['a', 'b', 'c']));
    expect(outcome.failedIds).toEqual([]);
    expect(entryArchive).toHaveBeenCalledTimes(3);
    // Two batches for three targets with a batch size of two.
    expect(onProgress).toHaveBeenNthCalledWith(1, { current: 2, total: 3 });
    expect(onProgress).toHaveBeenNthCalledWith(2, { current: 3, total: 3 });
  });

  it('routes each target to the endpoint matching its kind', async () => {
    const { cma, entryArchive, assetArchive } = createMockCma();

    const outcome = await archiveOrphans(cma, [entry('e1'), asset('a1')], 5, vi.fn());

    expect(outcome.archivedIds).toEqual(expect.arrayContaining(['e1', 'a1']));
    expect(entryArchive).toHaveBeenCalledWith({ entryId: 'e1' });
    expect(assetArchive).toHaveBeenCalledWith({ assetId: 'a1' });
  });

  it('collects failures without aborting the rest of the batch', async () => {
    const { cma } = createMockCma({ failArchiveIds: ['b'] });

    const outcome = await archiveOrphans(cma, [entry('a'), entry('b'), asset('c')], 5, vi.fn());

    expect(outcome.archivedIds).toEqual(expect.arrayContaining(['a', 'c']));
    expect(outcome.failedIds).toEqual(['b']);
  });

  it('handles an empty selection without any API calls', async () => {
    const { cma, entryArchive, assetArchive } = createMockCma();

    const outcome = await archiveOrphans(cma, [], 5, vi.fn());

    expect(outcome).toEqual({ archivedIds: [], failedIds: [] });
    expect(entryArchive).not.toHaveBeenCalled();
    expect(assetArchive).not.toHaveBeenCalled();
  });
});
