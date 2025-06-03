import { EntryProps } from 'contentful-management';

export const mockEntries: Record<string, EntryProps[]> = {
  condoA: [
    {
      sys: {
        id: '1',
        type: 'Entry',
        contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'condoA' } },
        version: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
        automationTags: [],
      },
      fields: { displayName: { 'en-US': 'Building one' } },
    },
    {
      sys: {
        id: '2',
        type: 'Entry',
        contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'condoA' } },
        version: 2,
        publishedVersion: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
        automationTags: [],
      },
      fields: { displayName: { 'en-US': 'Building two' } },
    },
  ],
  condoB: [
    {
      sys: {
        id: '4',
        type: 'Entry',
        contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'condoB' } },
        version: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
        automationTags: [],
      },
      fields: { displayName: { 'en-US': 'B1' } },
    },
    {
      sys: {
        id: '5',
        type: 'Entry',
        contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'condoB' } },
        version: 2,
        publishedVersion: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
        automationTags: [],
      },
      fields: { displayName: { 'en-US': 'B2' } },
    },
  ],
  condoC: [
    {
      sys: {
        id: '7',
        type: 'Entry',
        contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'condoC' } },
        version: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
        automationTags: [],
      },
      fields: { displayName: { 'en-US': 'C1' } },
    },
    {
      sys: {
        id: '8',
        type: 'Entry',
        contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'condoC' } },
        version: 2,
        publishedVersion: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
        automationTags: [],
      },
      fields: { displayName: { 'en-US': 'C2' } },
    },
  ],
  buildingWithLocation: [
    {
      sys: {
        id: '100',
        type: 'Entry',
        contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'buildingWithLocation' } },
        version: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
        automationTags: [],
      },
      fields: {
        displayName: { 'en-US': 'Building with Location' },
        location: { 'en-US': { lat: 39.73923, lon: -104.99025 } },
      },
    },
  ],
  buildingWithBoolean: [
    {
      sys: {
        id: '200',
        type: 'Entry',
        contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'buildingWithBoolean' } },
        version: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
        automationTags: [],
      },
      fields: {
        displayName: { 'en-US': 'Building with Boolean' },
        isActive: { 'en-US': true },
      },
    },
  ],
  buildingWithJson: [
    {
      sys: {
        id: '300',
        type: 'Entry',
        contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'buildingWithJson' } },
        version: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
        automationTags: [],
      },
      fields: {
        displayName: { 'en-US': 'Building with JSON' },
        metadata: {
          'en-US': {
            foo: 'bar',
            long: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            nested: { a: 1, b: 2 },
          },
        },
      },
    },
  ],
};

export const mockEntry = mockEntries.condoA[0];
