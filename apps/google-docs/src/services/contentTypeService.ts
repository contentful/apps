import { PageAppSDK } from '@contentful/app-sdk';

export interface ContentTypeDisplayInfo {
  name: string;
  displayField?: string;
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
