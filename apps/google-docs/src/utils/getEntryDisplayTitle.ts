import type { EntryProps } from 'contentful-management';
import type { EntryToCreate } from '@types';
import type { ContentTypeDisplayInfo } from '../services/contentTypeService';

const UNTITLED_ENTRY_LABEL = 'Untitled';

export function getEntryDisplayTitle(
  entry: EntryToCreate | EntryProps,
  defaultLocale: string,
  contentTypeInfo?: ContentTypeDisplayInfo
): string {
  if (!contentTypeInfo) {
    return UNTITLED_ENTRY_LABEL;
  }
  if (!contentTypeInfo.displayField) {
    return '';
  }
  const raw = entry.fields[contentTypeInfo.displayField]?.[defaultLocale];
  if (raw != null && String(raw).trim().length > 0) {
    return String(raw).trim();
  }
  return UNTITLED_ENTRY_LABEL;
}
