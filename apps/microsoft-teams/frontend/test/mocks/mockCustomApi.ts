import { CustomApi } from '@context/SdkWithCustomApiProvider';
import { vi } from 'vitest';

const mockCustomApi: Partial<CustomApi> = {
  quickSaveConfiguration: vi.fn(),
  saveConfiguration: vi.fn(),
};

export { mockCustomApi };
