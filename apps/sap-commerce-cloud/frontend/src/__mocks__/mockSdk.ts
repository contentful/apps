import { vi } from 'vitest';

export const makeSdkMock = () => ({
  ids: {
    app: 'some-app',
    space: '123214',
    environment: 'master',
  },
  hostnames: {
    webapp: 'app.contentful.com',
  },
  window: {
    startAutoResizer: vi.fn(),
  },
  field: {
    type: 'Array',
    removeValue: vi.fn(),
    onValueChanged: vi.fn((value) => value),
    onIsDisabledChanged: vi.fn((value) => value),
    getValue: vi.fn(),
    id: 'fieldId',
    setValue: vi.fn((value) => {
      return value;
    }),
  },
  space: {
    sys: {
      id: 'spaceId',
    },
    getContentTypes: vi.fn().mockReturnValue({
      items: [
        {
          sys: { id: 'some-id' },
          name: 'some-name',
          fields: [
            {
              id: 'some-id',
              name: 'some-name',
              type: 'some-type',
            },
          ],
        },
      ],
    }),
    getEditorInterfaces: vi.fn().mockReturnValue({
      items: [
        {
          sys: { contentType: { sys: { id: 'some-id' } } },
        },
      ],
    }),
  },
  dialogs: {
    openCurrentApp: vi.fn(() => {
      return ['sku1', 'sku2'];
    }),
  },
  parameters: {
    installation: {},
    invocation: {
      apiEndpoint: 'https://api.example.com',
      baseSites: 'site1,site2',
      fieldValue: [],
    },
  },
  cma: {},
  cmaAdapter: {},
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
});
