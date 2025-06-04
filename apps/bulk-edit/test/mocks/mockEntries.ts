import { EntryProps } from 'contentful-management';

// Helper to create entry props for DRY
export const createMockEntry = (fields: Record<string, any>, sysOverrides: Partial<any> = {}) => ({
  sys: {
    id: 'test-id',
    type: 'Entry',
    contentType: { sys: { type: 'Link', linkType: 'ContentType', id: 'test-content-type' } },
    version: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
    environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
    automationTags: [],
    ...sysOverrides,
  },
  fields,
});

export const mockEntries: Record<string, EntryProps[]> = {
  condoA: [
    createMockEntry(
      { displayName: { 'en-US': 'Building one' } },
      { id: '1', contentType: { sys: { id: 'condoA' } }, version: 1 }
    ),
    createMockEntry(
      { displayName: { 'en-US': 'Building two' } },
      { id: '2', contentType: { sys: { id: 'condoA' } }, version: 2, publishedVersion: 1 }
    ),
  ],
  condoB: [
    createMockEntry(
      { displayName: { 'en-US': 'B1' } },
      { id: '4', contentType: { sys: { id: 'condoB' } }, version: 1 }
    ),
    createMockEntry(
      { displayName: { 'en-US': 'B2' } },
      { id: '5', contentType: { sys: { id: 'condoB' } }, version: 2, publishedVersion: 1 }
    ),
  ],
  condoC: [
    createMockEntry(
      { displayName: { 'en-US': 'C1' } },
      { id: '7', contentType: { sys: { id: 'condoC' } }, version: 1 }
    ),
    createMockEntry(
      { displayName: { 'en-US': 'C2' } },
      { id: '8', contentType: { sys: { id: 'condoC' } }, version: 2, publishedVersion: 1 }
    ),
  ],
  buildingWithLocation: [
    createMockEntry(
      {
        displayName: { 'en-US': 'Building with Location' },
        location: { 'en-US': { lat: 39.73923, lon: -104.99025 } },
      },
      { id: '100', contentType: { sys: { id: 'buildingWithLocation' } } }
    ),
  ],
  buildingWithBoolean: [
    createMockEntry(
      {
        displayName: { 'en-US': 'Building with Boolean' },
        isActive: { 'en-US': true },
      },
      { id: '200', contentType: { sys: { id: 'buildingWithBoolean' } } }
    ),
  ],
  buildingWithJson: [
    createMockEntry(
      {
        displayName: { 'en-US': 'Building with JSON' },
        json: {
          'en-US': {
            foo: 'bar',
            long: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            nested: { a: 1, b: 2 },
          },
        },
      },
      { id: '300', contentType: { sys: { id: 'buildingWithJson' } } }
    ),
  ],
};

export const mockEntry = mockEntries.condoA[0];
