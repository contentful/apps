import { mockCma } from './mockCma';

const mockSdk: any = {
  cma: mockCma,
  ids: {
    app: 'test-app',
    space: 'test-space',
    organization: 'test-organization',
    environment: 'test-environment',
  },
  parameters: {
    installation: {
      testParameter: 'test-parameter',
    },
  },
};

export { mockSdk };
