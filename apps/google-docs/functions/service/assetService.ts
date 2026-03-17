import { EntryProps } from 'contentful-management';

/**
 * INTEG-3265: Implement this file to create assets in Contentful using the Contentful Management API
 */
interface AssetServiceParams {
  spaceId: string;
  environmentId: string;
  accessToken: string;
}

export async function createAsset(): Promise<EntryProps> {
  throw new Error('Not implemented');
}

export async function createAssets(
  _entries: Array<{ contentTypeId: string; fields: Record<string, any> }>,
  _config: AssetServiceParams
): Promise<EntryProps[]> {
  // Temporary placeholder until functions folder is removed.
  void _entries;
  void _config;
  throw new Error('Not implemented');
}
