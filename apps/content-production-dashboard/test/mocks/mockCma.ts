import { vi } from 'vitest';
import { EntryProps } from 'contentful-management';

const mockCma: any = {
  entry: {
    getMany: vi.fn(),
  },
};

export const getManyEntries = (entries: EntryProps[], total?: number) => {
  return {
    items: entries,
    total: total ?? entries.length,
    skip: 0,
    limit: 1000,
    sys: { type: 'Array' },
  };
};

export { mockCma };
