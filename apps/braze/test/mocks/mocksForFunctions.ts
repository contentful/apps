import type { EntryProps, ContentTypeProps, PlainClientAPI } from 'contentful-management';
import type { FunctionEventContext } from '@contentful/node-apps-toolkit';
import { vi } from 'vitest';

export const mockCma = {
  entry: { get: vi.fn() },
  contentType: { get: vi.fn() },
} as unknown as PlainClientAPI;

export const mockContext: FunctionEventContext = {
  spaceId: 'space-id',
  environmentId: 'environment-id',
  appInstallationParameters: {
    brazeApiKey: 'test-api-key',
    brazeEndpoint: 'https://test.braze.com',
  },
  cmaClientOptions: {
    accessToken: 'test-token',
  },
};

export function createEntry(fields: Record<string, any>): EntryProps {
  return {
    sys: {
      id: 'entry-id',
      type: 'Entry',
      space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
      environment: { sys: { type: 'Link', linkType: 'Environment', id: 'environment-id' } },
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'content-type-id' },
      },
      locale: 'en-US',
      version: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      automationTags: [],
    },
    fields: Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, { 'en-US': value }])
    ),
  } as EntryProps;
}

export function createContentType(
  fieldIds: string[],
  type: 'Text' | 'RichText' = 'Text'
): ContentTypeProps {
  return {
    sys: {
      type: 'ContentType',
      id: 'content-type-id',
      version: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
      environment: { sys: { type: 'Link', linkType: 'Environment', id: 'environment-id' } },
    },
    name: 'Test Content Type',
    description: 'Test Description',
    displayField: 'title',
    fields: fieldIds.map((id) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      type,
      localized: true,
      required: true,
      validations: [],
      disabled: false,
      omitted: false,
    })),
  };
}

export function mockFetchSuccess(responseData: object) {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(responseData),
  } as Response);
}
