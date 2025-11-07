import { EntryProps, ContentTypeProps } from 'contentful-management';

/**
 * INTEG-3265: Implement this file to create assets in Contentful using the Contentful Management API
 */
interface AssetServiceParams {
  spaceId: string;
  environmentId: string;
  accessToken: string;
}

export async function createAsset(aiDocumentResponse: any): Promise<EntryProps> {
  throw new Error('Not implemented');
}

export async function createAssets(
  entries: Array<{ contentTypeId: string; fields: Record<string, any> }>,
  config: AssetServiceParams
): Promise<EntryProps[]> {
  throw new Error('Not implemented');
}
