import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  notifier: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
  ids: {
    app: 'test-app',
    space: 'test-space',
    environment: 'test-environment',
    environmentAlias: 'test-environment-alias',
  },
  cmaAdapter: {
    // Mock CMA adapter for testing
  },
  dialogs: {
    openCurrentApp: vi.fn(),
  },
  navigator: {
    openCurrentAppPage: vi.fn(),
  },
  contentType: {
    displayField: 'title',
  },
  locales: {
    default: 'en-US',
  },
  close: vi.fn(),
  entry: {
    fields: {
      title: {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
        locales: ['en-US'],
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
        linkType: undefined,
        items: undefined,
        getValue: () => 'title value',
      },
      description: {
        id: 'description',
        name: 'Description',
        type: 'Text',
        locales: ['en-US', 'es-AR'],
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
        linkType: undefined,
        items: undefined,
        getValue: (locale: string) => (locale == 'en-US' ? 'description value' : 'descripcion'),
      },
      iamge: {
        id: 'image',
        name: 'Image',
        type: 'Link',
        locales: ['en-US'],
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
        linkType: 'Asset',
        items: undefined,
        getValue: () => {
          return {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: 'asset-id',
            },
          };
        },
      },
      tags: {
        id: 'tags',
        name: 'Tags',
        type: 'Array',
        locales: ['en-US'],
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
        linkType: undefined,
        items: {
          type: 'Symbol',
          linkType: undefined,
        },
        getValue: () => ['tag1', 'tag2'],
      },
      boolean: {
        id: 'boolean',
        name: 'Boolean',
        type: 'Boolean',
        locales: ['en-US'],
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
        linkType: undefined,
        items: undefined,
        getValue: () => true,
      },
      author: {
        id: 'author',
        name: 'Author',
        type: 'Link',
        locales: ['en-US'],
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
        linkType: 'Entry',
        items: undefined,
        getValue: () => {
          return {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: 'entry-id',
            },
          };
        },
      },
    },
  },
};

export const expectedFields = [
  {
    type: 'Symbol',
    id: 'title',
    uniqueId: 'title',
    name: 'Title',
    supported: true,
    value: 'title value',
  },
  {
    type: 'Text',
    id: 'description',
    uniqueId: 'description-en-US',
    name: 'Description',
    locale: 'en-US',
    supported: true,
    value: 'description value',
  },
  {
    type: 'Text',
    id: 'description',
    uniqueId: 'description-es-AR',
    name: 'Description',
    locale: 'es-AR',
    supported: true,
    value: 'descripcion',
  },
  {
    type: 'Link',
    id: 'image',
    uniqueId: 'image',
    name: 'Image',
    linkType: 'Asset',
    supported: true,
    value: {
      url: 'https://example.com/image.jpg',
      contentType: 'image/jpeg',
      width: 100,
      height: 100,
    },
  },
  {
    type: 'Array',
    id: 'tags',
    uniqueId: 'tags',
    name: 'Tags',
    items: { type: 'Symbol', linkType: undefined },
    supported: true,
    value: ['tag1', 'tag2'],
  },
  {
    type: 'Boolean',
    id: 'boolean',
    uniqueId: 'boolean',
    name: 'Boolean',
    supported: false,
    value: true,
  },
  {
    type: 'Link',
    id: 'author',
    uniqueId: 'author',
    name: 'Author',
    linkType: 'Entry',
    supported: false,
    value: {
      sys: {
        type: 'Link',
        linkType: 'Entry',
        id: 'entry-id',
      },
    },
  },
];

export { mockSdk };
