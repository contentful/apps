import { ContentTypeProps } from 'contentful-management';

const createSysProps = (id: string) => ({
  id,
  type: 'ContentType',
  version: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
  environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
});

export const mockContentTypes: ContentTypeProps[] = [
  {
    sys: createSysProps('condoC'),
    name: 'Condo C',
    description: 'Condo C content type',
    displayField: 'displayName',
    fields: [
      {
        id: 'displayName',
        name: 'Display Name',
        required: false,
        localized: false,
        type: 'Symbol',
      },
      {
        id: 'description',
        name: 'Description',
        required: false,
        localized: false,
        type: 'Text',
      },
    ],
  },
  {
    sys: createSysProps('condoA'),
    name: 'Condo A',
    description: 'Condo A content type',
    displayField: 'displayName',
    fields: [
      {
        id: 'displayName',
        name: 'Display Name',
        required: false,
        localized: false,
        type: 'Symbol',
      },
      {
        id: 'description',
        name: 'Description',
        required: false,
        localized: false,
        type: 'Text',
      },
    ],
  },
  {
    sys: createSysProps('condoB'),
    name: 'Condo B',
    description: 'Condo B content type',
    displayField: 'displayName',
    fields: [
      {
        id: 'displayName',
        name: 'Display Name',
        required: false,
        localized: false,
        type: 'Symbol',
      },
      {
        id: 'description',
        name: 'Description',
        required: false,
        localized: false,
        type: 'Text',
      },
    ],
  },
  {
    sys: createSysProps('buildingWithLocation'),
    name: 'Building With Location',
    description: 'Building with a location field',
    displayField: 'displayName',
    fields: [
      {
        id: 'displayName',
        name: 'Display Name',
        required: false,
        localized: false,
        type: 'Symbol',
      },
      {
        id: 'location',
        name: 'Location',
        required: false,
        localized: false,
        type: 'Location',
      },
    ],
  },
  {
    sys: createSysProps('buildingWithBoolean'),
    name: 'Building With Boolean',
    description: 'Building with a boolean field',
    displayField: 'displayName',
    fields: [
      {
        id: 'displayName',
        name: 'Display Name',
        required: false,
        localized: false,
        type: 'Symbol',
      },
      {
        id: 'isActive',
        name: 'Is Active',
        required: false,
        localized: false,
        type: 'Boolean',
      },
    ],
  },
  {
    sys: createSysProps('buildingWithJson'),
    name: 'Building With JSON',
    description: 'Building with a JSON field',
    displayField: 'displayName',
    fields: [
      {
        id: 'displayName',
        name: 'Display Name',
        required: false,
        localized: false,
        type: 'Symbol',
      },
      {
        id: 'metadata',
        name: 'Metadata',
        required: false,
        localized: false,
        type: 'Object',
      },
    ],
  },
];

export const mockContentType = mockContentTypes[1]; // Condo A
