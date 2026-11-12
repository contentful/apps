import React from 'react';
import { render, cleanup, waitFor, fireEvent } from '@testing-library/react';

import { AppExtensionSDK } from '@contentful/app-sdk';

import AppConfig from './AppConfig';
import { definitions } from './parameters.spec';

const contentTypes = [
  {
    sys: { id: 'ct1' },
    name: 'CT no 1',
    fields: [{ id: 'obj', name: 'Some object', type: 'Object' }],
  },
  {
    sys: { id: 'ct2' },
    name: 'CT no 2',
    fields: [{ id: 'txt', name: 'Some text', type: 'Text' }],
  },
  {
    sys: { id: 'ct3' },
    name: 'CT no 3',
    fields: [
      { id: 'txt', name: 'Some other text', type: 'Text' },
      { id: 'obj', name: 'Some other object', type: 'Object' },
    ],
  },
];

const makeSdkMock = () => ({
  cma: {
    contentType: {
      getMany: jest.fn().mockResolvedValue({ items: contentTypes }),
    },
    editorInterface: {
      getMany: jest.fn().mockResolvedValue({ items: [] }),
    },
  },
  app: {
    setReady: jest.fn(),
    getParameters: jest.fn().mockResolvedValue(null),
    onConfigure: jest.fn().mockReturnValue(undefined),
  },
  hostnames: {
    webapp: 'app.contentful.com',
  },
  ids: {
    app: 'some-app',
  },
});

const validate = () => null; // Means no error

const renderComponent = (sdk: unknown) => {
  return render(
    <AppConfig
      name="Some app"
      sdk={sdk as AppExtensionSDK}
      parameterDefinitions={definitions}
      validateParameters={validate}
      logo="some-logo.svg"
      color="red"
      description="App description"
    />
  );
};

describe('AppConfig', () => {
  afterEach(cleanup);

  it('renders app before installation', async () => {
    const sdk = makeSdkMock();
    const { getByLabelText } = renderComponent(sdk);
    await waitFor(() => getByLabelText(/Cloud name/));

    [
      [/Cloud name/, ''],
      [/API key/, ''],
      [/Max number of files/, '10'],
    ].forEach(([labelRe, expected]) => {
      const configInput = getByLabelText(labelRe) as HTMLInputElement;
      expect(configInput.value).toEqual(expected);
    });

    [/Some object/, /Some other object/].forEach(async (labelRe) => {
      await waitFor(() => {
        const fieldCheckbox = getByLabelText(labelRe) as HTMLInputElement;
        expect(fieldCheckbox.checked).toBe(false);
      });
    });
  });

  it('renders app after installation', async () => {
    const sdk = makeSdkMock();
    sdk.app.getParameters.mockResolvedValueOnce({
      cloudName: 'test-cloud',
      apiKey: 'test-api-key',
      maxFiles: 12,
    });
    sdk.cma.editorInterface.getMany.mockResolvedValueOnce({
      items: [
        {
          sys: { contentType: { sys: { id: 'ct3' } } },
          controls: [
            {
              fieldId: 'obj',
              widgetNamespace: 'app',
              widgetId: 'some-app',
            },
          ],
        },
      ],
    });

    const { getByLabelText } = renderComponent(sdk);
    await waitFor(() => getByLabelText(/Cloud name/));

    [
      [/Cloud name/, 'test-cloud'],
      [/API key/, 'test-api-key'],
      [/Max number of files/, '12'],
    ].forEach(([labelRe, expected]) => {
      const configInput = getByLabelText(labelRe as RegExp) as HTMLInputElement;
      expect(configInput.value).toEqual(expected);
    });

    [
      [/Some object/, false],
      [/Some other object/, true],
    ].forEach(([labelRe, expected]) => {
      const fieldCheckbox = getByLabelText(labelRe as RegExp) as HTMLInputElement;
      expect(fieldCheckbox.checked).toBe(expected);
    });
  });

  describe('with more content types than a single CMA page', () => {
    // PAGE_SIZE is 1000, so the first page must be full for a second request to happen.
    const PAGE_SIZE = 1000;
    const plainContentTypes = Array.from({ length: PAGE_SIZE }, (_, i) => ({
      sys: { id: `plain-${i}` },
      name: `Plain ${i}`,
      fields: [{ id: 'txt', name: 'Text', type: 'Text' }],
    }));
    const lateJsonContentType = {
      sys: { id: 'late-json' },
      name: 'Late JSON',
      fields: [{ id: 'payload', name: 'Late payload', type: 'Object' }],
    };
    const total = PAGE_SIZE + 1;

    it('lists JSON fields from content types beyond the first page (ES-917)', async () => {
      const sdk = makeSdkMock();
      sdk.cma.contentType.getMany
        .mockResolvedValueOnce({ items: plainContentTypes, total })
        .mockResolvedValueOnce({ items: [lateJsonContentType], total });

      const { getByLabelText } = renderComponent(sdk);

      await waitFor(() => getByLabelText(/Late payload/));
      expect(sdk.cma.contentType.getMany).toHaveBeenCalledTimes(2);
      expect(sdk.cma.contentType.getMany).toHaveBeenNthCalledWith(1, {
        query: { limit: PAGE_SIZE, skip: 0 },
      });
      expect(sdk.cma.contentType.getMany).toHaveBeenNthCalledWith(2, {
        query: { limit: PAGE_SIZE, skip: PAGE_SIZE },
      });
    });

    it('restores selected fields from editor interfaces beyond the first page', async () => {
      const sdk = makeSdkMock();
      sdk.cma.contentType.getMany.mockResolvedValueOnce({ items: [lateJsonContentType] });

      const fillerEditorInterfaces = Array.from({ length: PAGE_SIZE }, (_, i) => ({
        sys: { contentType: { sys: { id: `plain-${i}` } } },
        controls: [],
      }));
      sdk.cma.editorInterface.getMany
        .mockResolvedValueOnce({ items: fillerEditorInterfaces, total })
        .mockResolvedValueOnce({
          items: [
            {
              sys: { contentType: { sys: { id: 'late-json' } } },
              controls: [{ fieldId: 'payload', widgetNamespace: 'app', widgetId: 'some-app' }],
            },
          ],
          total,
        });

      const { getByLabelText } = renderComponent(sdk);

      await waitFor(() => {
        expect((getByLabelText(/Late payload/) as HTMLInputElement).checked).toBe(true);
      });
      expect(sdk.cma.editorInterface.getMany).toHaveBeenNthCalledWith(2, {
        query: { limit: PAGE_SIZE, skip: PAGE_SIZE },
      });
    });
  });

  it('updates configuration', async () => {
    const sdk = makeSdkMock();
    const { getByLabelText } = renderComponent(sdk);
    await waitFor(() => getByLabelText(/Cloud name/));
    [
      [/Cloud name/, 'test-cloud'],
      [/API key/, 'test-api-key'],
      [/Max number of files/, '12'],
    ].forEach(([labelRe, value]) => {
      const configInput = getByLabelText(labelRe as RegExp) as HTMLInputElement;
      fireEvent.change(configInput, { target: { value } });
    });

    const fieldCheckbox = getByLabelText(/Some other object/) as HTMLInputElement;
    fireEvent.click(fieldCheckbox);

    const onConfigure = sdk.app.onConfigure.mock.calls[0][0];
    const configurationResult = onConfigure();

    expect(configurationResult).toEqual({
      parameters: {
        cloudName: 'test-cloud',
        apiKey: 'test-api-key',
        maxFiles: 12,
      },
      targetState: {
        EditorInterface: {
          ct1: {},
          ct3: { controls: [{ fieldId: 'obj' }] },
        },
      },
    });
  });
});
