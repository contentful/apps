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
