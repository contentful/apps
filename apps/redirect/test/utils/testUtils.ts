import { ContentTypeProps, EditorInterfaceProps, EntryProps } from 'contentful-management';
import { REDIRECT_CONTENT_TYPE_ID } from '../../src/utils/consts';

export function createMockReferencedEntry(
  id: string,
  contentTypeId: string,
  fields: Record<string, Record<string, unknown>>
): EntryProps {
  return {
    sys: {
      id,
      type: 'Entry',
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: contentTypeId },
      },
    },
    fields,
  } as unknown as EntryProps;
}

export function createMockContentType(id: string, displayField: string): ContentTypeProps {
  return {
    sys: { id, type: 'ContentType', version: 1 },
    name: id,
    displayField,
    fields: [],
  } as unknown as ContentTypeProps;
}

export function createMockEditorInterface(
  contentTypeId: string,
  slugFieldId: string
): EditorInterfaceProps {
  return {
    sys: {
      id: `${contentTypeId}Interface`,
      type: 'EditorInterface',
      contentType: {
        sys: { id: contentTypeId, type: 'Link', linkType: 'ContentType' },
      },
      version: 1,
    },
    controls: [{ fieldId: slugFieldId, widgetId: 'slugEditor' }],
  } as unknown as EditorInterfaceProps;
}

function buildRedirectSys(id: string) {
  return {
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
  };
}

interface MockRedirectFields {
  fromTitle?: string;
  toTitle?: string;
  reason?: string;
  type?: string;
  active?: boolean;
}

export function createMockRedirect(id: string, fields: MockRedirectFields = {}): EntryProps {
  const {
    fromTitle = 'Source',
    toTitle = 'Destination',
    reason = 'Some reason',
    type = 'Permanent (301)',
    active = true,
  } = fields;

  return {
    sys: buildRedirectSys(id),
    fields: {
      redirectFromContentTypes: { sys: { id: `from-${id}` }, title: fromTitle },
      redirectToContentTypes: { sys: { id: `to-${id}` }, title: toTitle },
      reason: { 'en-US': reason },
      redirectType: { 'en-US': type },
      active: { 'en-US': active },
    },
  } as EntryProps;
}

export function createMockRedirectForPage(count: number): EntryProps {
  const id = `test-id-${count}`;

  return {
    sys: buildRedirectSys(id),
    fields: {
      title: { 'en-US': `Redirect title ${count}` },
      redirectFromContentTypes: {
        sys: { id: `from-${id}` },
        title: `Field from title ${count}`,
      },
      redirectToContentTypes: {
        sys: { id: `to-${id}` },
        title: `Field to title ${count}`,
      },
      redirectType: { 'en-US': `Redirect type ${count}` },
      active: { 'en-US': false },
      reason: { 'en-US': `Redirect reason ${count}` },
    },
  } as EntryProps;
}
