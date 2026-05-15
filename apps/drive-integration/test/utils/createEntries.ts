import { describe, it, expect } from 'vitest';
import { orderEntriesByCreationOrder } from '../../src/utils/createEntries';
import type { EntryToCreate } from '@types';

describe('orderEntriesByCreationOrder', () => {
  it('does not duplicate entries when creationOrder repeats the same tempId', () => {
    const a: EntryToCreate = {
      tempId: 'a',
      contentTypeId: 't',
      fields: { title: { 'en-US': 'A' } },
    };
    const b: EntryToCreate = {
      tempId: 'b',
      contentTypeId: 't',
      fields: { title: { 'en-US': 'B' } },
    };

    const ordered = orderEntriesByCreationOrder([a, b], ['a', 'a', 'b', 'b']);

    expect(ordered).toEqual([a, b]);
  });
});
