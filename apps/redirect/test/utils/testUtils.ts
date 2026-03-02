import { EntryProps } from 'contentful-management';
import { REDIRECT_CONTENT_TYPE_ID } from '../../src/utils/consts';

export function createMockEntry(id: string): EntryProps {
  return {
    sys: {
      id,
      type: 'Entry',
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: REDIRECT_CONTENT_TYPE_ID },
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      version: 1,
      space: { sys: { type: 'Link', linkType: 'Space', id: 'space-1' } },
      environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
      automationTags: [],
    },
    fields: {
      title: { 'en-US': 'Redirect 1' },
      redirectFromContentTypes: {
        'en-US': [{ sys: { type: 'Link', linkType: 'Entry', id: 'from-1' } }],
      },
      redirectToContentTypes: {
        'en-US': [{ sys: { type: 'Link', linkType: 'Entry', id: 'to-1' } }],
      },
      redirectType: { 'en-US': 'Permanent (301)' },
      active: { 'en-US': true },
      reason: { 'en-US': 'Test' },
    },
  } as unknown as EntryProps;
}

export function createMockRedirectForPage(count: number): EntryProps {
  const id = `test-id-${count}`;
  const base = createMockEntry(id);

  return {
    ...base,
    sys: {
      ...base.sys,
      id,
      // keep other sys properties from base
    },
    fields: {
      ...base.fields,
      title: { 'en-US': `Redirect title ${count}` },
      redirectFromContentTypes: {
        'en-US': { sys: { id, title: `Field from title ${count}` } },
      },
      redirectToContentTypes: {
        'en-US': { sys: { id, title: `Field to title ${count}` } },
      },
      reason: { 'en-US': `Redirect reason ${count}` },
      redirectType: { 'en-US': `Redirect type ${count}` },
      active: { 'en-US': false },
    },
  } as EntryProps;
}
