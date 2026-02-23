import { vi } from 'vitest';

const mockEntry = {
  sys: {
    id: 'test-entry',
    type: 'Entry',
    contentType: {
      sys: { id: 'test-content-type' },
    },
  },
  fields: {
    title: {
      'en-US': 'Test Title',
    },
    description: {
      'en-US': 'Test Description',
    },
  },
};

const mockContentType = {
  sys: {
    id: 'test-content-type',
    type: 'ContentType',
  },
  name: 'Test Content Type',
  fields: [
    {
      id: 'title',
      name: 'Title',
      type: 'Symbol',
      localized: true,
    },
    {
      id: 'description',
      name: 'Description',
      type: 'Text',
      localized: true,
    },
  ],
};

const mockCma: any = {
  contentType: {
    getMany: vi.fn(),
    get: vi.fn().mockResolvedValue(mockContentType),
  },
  entry: {
    getMany: vi.fn(),
    get: vi.fn().mockResolvedValue(mockEntry),
    update: vi.fn().mockResolvedValue(mockEntry),
  },
  asset: {
    getMany: vi.fn(),
  },
};

export { mockCma, mockEntry, mockContentType };
