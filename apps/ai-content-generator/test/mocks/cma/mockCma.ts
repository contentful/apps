import { vi } from 'vitest';
import { createCma } from './utils/createCma';
// import { entry } from './utils/createEntry';
import { generateRandomContentType } from './utils/generateRandomContentType';

interface MockCma {
  cma: ReturnType<typeof createCma>;
}

class MockCma {
  constructor() {
    this.cma = createCma();
  }

  reset() {
    this.cma.entry.get = vi.fn((payload: { entryId: string }) => Promise.resolve({} /* entry*/));
    this.cma.entry.update = vi.fn((payload: { entryId: string }, entry: any) =>
      Promise.resolve('success')
    );
    this.cma.contentType.get = vi.fn((payload: { contentTypeId: string }) =>
      Promise.resolve(generateRandomContentType())
    );
  }
}

export { MockCma };
