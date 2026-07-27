import { ContentTypeProps, EntryProps } from 'contentful-management';
import { EntryStatus } from '../utils/types';

// Archived entries are excluded from "needs update" reporting: they are
// deliberately stale, so their old `updatedAt` is expected rather than
// actionable. Mirrors `isArchived` in contentful-management.
export function isArchivedEntry(entry: EntryProps): boolean {
  return !!entry?.sys?.archivedVersion;
}

export function getEntryStatus(entry: EntryProps): EntryStatus {
  const { sys } = entry;

  // Checked before publishedVersion: an archived entry keeps the
  // publishedVersion it had when archived and would otherwise report
  // as Published.
  if (isArchivedEntry(entry)) {
    return EntryStatus.Archived;
  }

  if (!sys.publishedVersion) {
    return EntryStatus.Draft;
  }

  if (sys.version === sys.publishedVersion + 1) {
    return EntryStatus.Published;
  }

  if (sys.version >= sys.publishedVersion + 2) {
    return EntryStatus.Changed;
  }

  return EntryStatus.Draft;
}

export function getEntryTitle(
  entry: EntryProps,
  contentType: ContentTypeProps | undefined,
  defaultLocale: string
): string {
  if (!entry.fields || !contentType?.displayField) {
    return 'Untitled';
  }

  const fieldValue = entry.fields[contentType.displayField];
  if (typeof fieldValue === 'object' && fieldValue !== null) {
    return String(fieldValue[defaultLocale] ?? '');
  }

  return 'Untitled';
}

export function getUniqueIdsFromEntries<T>(
  entries: T[],
  selector: (entry: T) => string | undefined | null
): string[] {
  const ids = entries.map(selector).filter(Boolean) as string[];
  return [...new Set(ids)];
}

export function getUniqueUserIdsFromEntries(entries: EntryProps[]): string[] {
  return getUniqueIdsFromEntries(entries, (entry) => entry.sys.createdBy?.sys?.id);
}

export function getUniqueContentTypeIdsFromEntries(entries: EntryProps[]): string[] {
  return getUniqueIdsFromEntries(entries, (entry) => entry.sys.contentType?.sys?.id);
}
