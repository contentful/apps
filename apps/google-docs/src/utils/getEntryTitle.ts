import { PageAppSDK } from '@contentful/app-sdk';
import type { EntryProps } from 'contentful-management';
import type { EntryToCreate } from '@types';

export interface ContentTypeDisplayInfo {
  name: string;
  displayField?: string;
}

const UNTITLED_ENTRY_LABEL = 'Untitled';

export function getEntryDisplayTitle(
  entry: EntryToCreate | EntryProps,
  defaultLocale: string,
  contentTypeInfo?: ContentTypeDisplayInfo
): string {
  const fields = entry.fields as Record<string, Record<string, unknown>>;
  if (!contentTypeInfo?.displayField) {
    return UNTITLED_ENTRY_LABEL;
  }

  const raw = fields[contentTypeInfo.displayField]?.[defaultLocale];
  if (raw != null && String(raw).trim().length > 0) {
    return String(raw).trim();
  }

  return UNTITLED_ENTRY_LABEL;
}

export async function fetchContentTypesInfoByIds(
  sdk: PageAppSDK,
  contentTypeIds: string[]
): Promise<Map<string, ContentTypeDisplayInfo>> {
  const unique = [...new Set(contentTypeIds)].filter(Boolean);
  if (unique.length === 0) {
    return new Map();
  }

  const spaceId = sdk.ids.space;
  const environmentId = sdk.ids.environment;
  const response = await sdk.cma.contentType.getMany({
    spaceId,
    environmentId,
    query: { 'sys.id[in]': unique.join(',') },
  });

  const displayInfoMap = new Map<string, ContentTypeDisplayInfo>();
  for (const ct of response.items) {
    displayInfoMap.set(ct.sys.id, {
      name: ct.name,
      displayField: ct.displayField,
    });
  }
  return displayInfoMap;
}
