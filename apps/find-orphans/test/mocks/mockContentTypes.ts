import { ContentTypeProps } from 'contentful-management';

const baseSys = (id: string) =>
  ({
    id,
    type: 'ContentType',
    version: 1,
    space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
    environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  } as ContentTypeProps['sys']);

export const mockArticleContentType: ContentTypeProps = {
  sys: baseSys('article'),
  name: 'Article',
  description: '',
  displayField: 'title',
  fields: [
    {
      id: 'title',
      name: 'Title',
      type: 'Symbol',
      localized: false,
      required: false,
      disabled: false,
      omitted: false,
      validations: [],
    },
    {
      id: 'body',
      name: 'Body',
      type: 'Text',
      localized: false,
      required: false,
      disabled: false,
      omitted: false,
      validations: [],
    },
  ],
};

/**
 * Content type with no display field configured at all — common for
 * component types (banners, teasers) where nobody marks an entry title.
 * Every entry of such a type renders as "Untitled" in Contentful.
 */
export const mockNoDisplayFieldContentType: ContentTypeProps = {
  sys: baseSys('banner'),
  name: 'Basic Promotional Banner',
  description: '',
  displayField: null as unknown as string,
  fields: [
    {
      id: 'cta',
      name: 'Call to action',
      type: 'Symbol',
      localized: false,
      required: false,
      disabled: false,
      omitted: false,
      validations: [],
    },
  ],
};

/** Content type whose display field is not a text field (edge case: no scannable title). */
export const mockNumericDisplayContentType: ContentTypeProps = {
  sys: baseSys('counter'),
  name: 'Counter',
  description: '',
  displayField: 'count',
  fields: [
    {
      id: 'count',
      name: 'Count',
      type: 'Integer',
      localized: false,
      required: false,
      disabled: false,
      omitted: false,
      validations: [],
    },
  ],
};
