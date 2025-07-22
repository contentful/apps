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

// Condo A entries
export const condoAEntry1: EntryProps = createMockEntry(
  { displayName: { 'en-US': 'Building one' } },
  { id: '1', contentType: { sys: { id: 'condoA' } }, version: 1 }
);

export const condoAEntry2: EntryProps = createMockEntry(
  { displayName: { 'en-US': 'Building two' } },
  { id: '2', contentType: { sys: { id: 'condoA' } }, version: 2, publishedVersion: 1 }
);

export const condoAEntries: EntryProps[] = [condoAEntry1, condoAEntry2];

// Condo B entries
export const condoBEntry1: EntryProps = createMockEntry(
  { displayName: { 'en-US': 'B1' } },
  { id: '4', contentType: { sys: { id: 'condoB' } }, version: 1 }
);

export const condoBEntry2: EntryProps = createMockEntry(
  { displayName: { 'en-US': 'B2' } },
  { id: '5', contentType: { sys: { id: 'condoB' } }, version: 2, publishedVersion: 1 }
);

export const condoBEntries: EntryProps[] = [condoBEntry1, condoBEntry2];

// Condo C entries
export const condoCEntry1: EntryProps = createMockEntry(
  { displayName: { 'en-US': undefined } },
  { id: '7', contentType: { sys: { id: 'condoC' } }, version: 1 }
);

export const condoCEntry2: EntryProps = createMockEntry(
  { displayName: { 'en-US': 'C2' } },
  { id: '8', contentType: { sys: { id: 'condoC' } }, version: 2, publishedVersion: 1 }
);

export const condoCEntries: EntryProps[] = [condoCEntry1, condoCEntry2];

// Building with Location entry
export const buildingWithLocationEntry: EntryProps = createMockEntry(
  {
    displayName: { 'en-US': 'Building with Location' },
    location: { 'en-US': { lat: 39.73923, lon: -104.99025 } },
  },
  { id: '100', contentType: { sys: { id: 'buildingWithLocation' } } }
);

// Building with Boolean entry
export const buildingWithBooleanEntry: EntryProps = createMockEntry(
  {
    displayName: { 'en-US': 'Building with Boolean' },
    isActive: { 'en-US': true },
  },
  { id: '200', contentType: { sys: { id: 'buildingWithBoolean' } } }
);

export const buildingWithBooleanEntries: EntryProps[] = [buildingWithBooleanEntry];

// Building with JSON entry
export const buildingWithJsonEntry: EntryProps = createMockEntry(
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
);

export const buildingWithJsonEntries: EntryProps[] = [buildingWithJsonEntry];
