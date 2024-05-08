import { AppInstallationParameters } from '@customTypes/configPage';
import { vi } from 'vitest';

const SPACE_ID = '1234';

export const mockParameters: AppInstallationParameters = {
  vercelAccessToken: 'abc-123',
  selectedProject: 'test-project-id',
  selectedApiPath: 'test-api-path',
  contentTypePreviewPathSelections: [
    { contentType: 'test-content-type', previewPath: 'test-preview-path' },
  ],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
    onConfigurationCompleted: vi.fn(),
    isInstalled: vi.fn().mockReturnValue(true),
  },
  parameters: {
    instance: [],
    installation: {
      vercelAccessToken: mockParameters.vercelAccessToken,
      selectedProject: mockParameters.selectedProject,
    },
  },
  ids: {
    app: 'test-app',
    space: SPACE_ID,
  },
  cma: {
    contentType: {
      getMany: vi.fn().mockReturnValueOnce({}),
    },
    appActionCall: {
      createWithResponse: vi.fn(),
    },
  },
  notifier: {
    error: vi.fn(),
  },
};

export { mockSdk };
