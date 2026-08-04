import { describe, expect, it } from 'vitest';
import { EntryProps } from 'contentful-management';
import { isArchivedEntry } from '../../src/utils/EntryUtils';
import { createMockEntry } from './testHelpers';

describe('isArchivedEntry', () => {
  it('returns true when sys.archivedVersion is present', () => {
    expect(isArchivedEntry(createMockEntry({ archived: true }))).toBe(true);
  });

  it('returns false for a non-archived entry', () => {
    expect(isArchivedEntry(createMockEntry())).toBe(false);
  });

  it('returns false when sys has no archived fields at all', () => {
    expect(isArchivedEntry({ sys: {} } as EntryProps)).toBe(false);
  });
});
