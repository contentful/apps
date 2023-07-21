import { vi } from 'vitest';
import { generateRandomContentType } from './generateRandomContentType';
// import { entry } from './createEntry';

const createCma = () => {
  return {
    entry: {
      get: vi.fn((payload: { entryId: string }) => Promise.resolve({} /* entry*/)),
      update: vi.fn((payload: { entryId: string }, entry: any) => Promise.resolve('success')),
    },
    contentType: {
      get: vi.fn((payload: { contentTypeId: string }) =>
        Promise.resolve(generateRandomContentType())
      ),
    },
  };
};

export { createCma };
