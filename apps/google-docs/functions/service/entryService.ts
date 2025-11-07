import { EntryProps, ContentTypeProps } from 'contentful-management';

/**
 * INTEG-3264: Implement this file to create entries in Contentful using the Contentful Management API
 */
interface EntryServiceParams {
  spaceId: string;
  environmentId: string;
  accessToken: string;
}

export async function createEntry(aiDocumentResponse: any): Promise<EntryProps> {
  throw new Error('Not implemented');
}

export async function createEntries(
  entries: Array<{ contentTypeId: string; fields: Record<string, any> }>,
  config: EntryServiceParams
): Promise<EntryProps[]> {
  throw new Error('Not implemented');
}
