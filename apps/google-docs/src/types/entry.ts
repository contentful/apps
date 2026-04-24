export interface Reference {
  __ref: string;
}

export type LocalizedField = Record<string, unknown>;

export interface EntryToCreate {
  tempId?: string;
  contentTypeId: string;
  fields: Record<string, LocalizedField>;
}

export interface AssetToCreate {
  url: string;
  placeholderId?: string;
  title?: string;
  altText?: string;
  fileName?: string;
  contentType?: string;
}

export interface FinalEntriesResult {
  entries: EntryToCreate[];
  assets: AssetToCreate[];
  summary: string;
  totalEntries: number;
}

export function isReference(value: unknown): value is Reference {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__ref' in value &&
    typeof (value as Reference).__ref === 'string'
  );
}

export function isReferenceArray(value: unknown): value is Reference[] {
  return Array.isArray(value) && value.length > 0 && value.every(isReference);
}
