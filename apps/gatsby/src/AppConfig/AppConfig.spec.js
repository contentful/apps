import React from 'react';
import { render } from '@testing-library/react';
import { enabledContentTypesToTargetState, AppConfig } from './AppConfig';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeMockSdk({
  onConfigure = () => {},
  getParameters = () => {},
  previewUrl = 'https://preview.de',
  webhookUrl = 'https://webhook.de',
  previewWebhookUrl = 'https://preview-webhook.de',
  contentSyncUrl = 'https://content-sync-url.de',
}) {
  return {
    space: {
      getEditorInterfaces: () => ({
        items: [],
      }),
      getContentTypes: () => ({
        items: [],
      }),
    },
    app: {
      onConfigure,
      getParameters: () => ({
        previewUrl,
        webhookUrl,
        previewWebhookUrl,
        contentSyncUrl,
      }),
      getCurrentState: () => ({ EditorInterface: {} }),
      setReady: () => {},
    },
    ids: {
      app: '1234',
      space: '1234',
      environment: '1234',
    },
    notifier: {
      error: () => {},
    },
  }
}

function makeContentTypes() {
  return [
    {
      sys: {
        id: 'page',
      },
    },
    {
      sys: {
        id: 'seo',
      },
    },
  ];
}

describe('<AppConfig />', () => {
  /** 
   * Because the Contentful SDK takes care of calling configure, we need to follow an atypical
   * pattern for the following tests. This includes adding a delay to ensure that the component is fully
   * mounted before manually calling the configure method and then asserting that its return value
   * is correct
   */ 
  describe('configure callback validation', () => {
    it('validates url fields and returns correct values if valid', async () => {
      let configure;
      const mockSdk = makeMockSdk({
        onConfigure: jest.fn((cb) => {
          configure = cb;
        }),
      });

      render(<AppConfig sdk={mockSdk} />);

      await delay(500);
      const configureResult = await configure();
      const { parameters } = configureResult;

      expect(configureResult).toBeTruthy();
      expect(parameters.previewUrl).toEqual('https://preview.de');
      expect(parameters.webhookUrl).toEqual('https://webhook.de');
      expect(parameters.previewWebhookUrl).toEqual('https://preview-webhook.de');
      expect(parameters.contentSyncUrl).toEqual('https://content-sync-url.de');
    });

    it('returns false if previewUrl is invalid', async () => {
      let configure;
      const mockSdk = makeMockSdk({
        onConfigure: jest.fn((cb) => {
          configure = cb;
        }),
        previewUrl: 'not-a-real-url',
      });

      render(<AppConfig sdk={mockSdk} />);

      await delay(500);
      const configureResult = await configure();

      expect(configureResult).toEqual(false);
    });

    it('returns false if webhookUrl is invalid', async () => {
      let configure;
      const mockSdk = makeMockSdk({
        onConfigure: jest.fn((cb) => {
          configure = cb;
        }),
        webhookUrl: 'not-a-real-url',
      });

      render(<AppConfig sdk={mockSdk} />);

      await delay(500);
      const configureResult = await configure();

      expect(configureResult).toEqual(false);
    });

    it('returns false if previewWebhookUrl is invalid', async () => {
      let configure;
      const mockSdk = makeMockSdk({
        onConfigure: jest.fn((cb) => {
          configure = cb;
        }),
        previewWebhookUrl: 'not-a-real-url',
      });

      render(<AppConfig sdk={mockSdk} />);

      await delay(500);
      const configureResult = await configure();

      expect(configureResult).toEqual(false);
    });

    it('returns false if contentSyncUrl is invalid', async () => {
      let configure;
      const mockSdk = makeMockSdk({
        onConfigure: jest.fn((cb) => {
          configure = cb;
        }),
        contentSyncUrl: 'not-a-real-url',
      });

      render(<AppConfig sdk={mockSdk} />);

      await delay(500);
      const configureResult = await configure();

      expect(configureResult).toEqual(false);
    });
  })
});

describe('enabledContentTypesToTargetState', () => {
  const contentTypes = makeContentTypes();
  const enabledContentTypes = ['page'];
  describe('when the content type already has the app assigned', () => {
    it('does not overwrite the existing position', () => {
      const currentState = {
        EditorInterface: {
          page: {
            sidebar: {
              position: 6,
            },
          },
        },
      };
      const result = enabledContentTypesToTargetState(
        currentState,
        contentTypes,
        enabledContentTypes
      );
      expect(result.EditorInterface.page.sidebar.position).toEqual(6);
    });
  });
  describe('when the content type does not already have the app assigned', () => {
    it('sets Gatsby to position 3', () => {
      const currentState = { EditorInterface: {} };
      const result = enabledContentTypesToTargetState(
        currentState,
        contentTypes,
        enabledContentTypes
      );
      expect(result.EditorInterface.page.sidebar.position).toEqual(3);
    });
  });
});
