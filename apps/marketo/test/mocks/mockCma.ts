import { vi } from 'vitest';
import { VALID_CREDENTIALS_RESPONSE } from '../../src/const';

const mockCma: any = {
  contentType: {
    getMany: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
  appActionCall: {
    createWithResponse: vi.fn().mockResolvedValue({
      response: { body: JSON.stringify({ valid: true, message: VALID_CREDENTIALS_RESPONSE }) },
    }),
  },
};

export { mockCma };
