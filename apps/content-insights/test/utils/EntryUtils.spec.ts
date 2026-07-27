import { describe, expect, it } from 'vitest';
import { EntryProps } from 'contentful-management';
import { getEntryStatus, isArchivedEntry } from '../../src/utils/EntryUtils';
import { EntryStatus } from '../../src/utils/types';
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

describe('getEntryStatus', () => {
  it('reports Archived for an archived entry even when it was previously published', () => {
    // An archived entry retains the publishedVersion it had when archived,
    // so the archived check has to win over the published check.
    const entry = createMockEntry({
      archived: true,
      publishedVersion: 1,
      version: 2,
    });

    expect(getEntryStatus(entry)).toBe(EntryStatus.Archived);
  });

  it('reports Draft for an entry that was never published', () => {
    expect(getEntryStatus(createMockEntry())).toBe(EntryStatus.Draft);
  });

  it('reports Published when version is exactly one ahead of publishedVersion', () => {
    const entry = createMockEntry({ publishedVersion: 1, version: 2 });

    expect(getEntryStatus(entry)).toBe(EntryStatus.Published);
  });

  it('reports Changed when there are unpublished changes', () => {
    const entry = createMockEntry({ publishedVersion: 1, version: 5 });

    expect(getEntryStatus(entry)).toBe(EntryStatus.Changed);
  });
});
