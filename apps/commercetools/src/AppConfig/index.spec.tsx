import React from 'react';
import { render, cleanup, wait, fireEvent } from '@testing-library/react';

import { AppExtensionSDK } from '@contentful/app-sdk';

import AppConfig from '.';

const contentTypes = [
  {
    sys: { id: 'ct1' },
    name: 'CT1',
    fields: [
      { id: 'product_x', name: 'Product X', type: 'Symbol' },
      { id: 'y', name: 'Y', type: 'Object' }
    ]
  },
  {
    sys: { id: 'ct2' },
    name: 'CT2',
    fields: [{ id: 'foo', name: 'FOO', type: 'Text' }]
  },
  {
    sys: { id: 'ct3' },
    name: 'CT3',
    fields: [
      { id: 'bar', name: 'BAR', type: 'Object' },
      { id: 'baz', name: 'BAZ', type: 'Object' },
      { id: 'product_a', name: 'Product A', type: 'Symbol' }
    ]
  }
];

const makeSdkMock = () => ({
  ids: {
    app: 'some-app'
  },
  space: {
    getContentTypes: jest.fn().mockResolvedValue({ items: contentTypes }),
    getEditorInterfaces: jest.fn().mockResolvedValue({ items: [] })
  },
  app: {
    setReady: jest.fn(),
    getParameters: jest.fn().mockResolvedValue(null),
    onConfigure: jest.fn().mockReturnValue(undefined)
  }
});

const renderComponent = (sdk: unknown) => {
  return render(<AppConfig sdk={sdk as AppExtensionSDK} />);
};

describe('AppConfig', () => {
  afterEach(cleanup);

  it('renders app before installation', async () => {
    const sdk = makeSdkMock();
    const { getByLabelText } = renderComponent(sdk);
    await wait(() => getByLabelText(/commercetools Project Key/));

    [
      [/commercetools Project Key/, ''],
      [/Client ID/, ''],
      [/Client Secret/, ''],
      [/^API URL/, ''],
      [/Auth URL/, ''],
      [/commercetools data locale/, '']
    ].forEach(([labelRe, expected]) => {
      const configInput = getByLabelText(labelRe) as HTMLInputElement;
      expect(configInput.value).toEqual(expected);
    });

    [/Product X$/].forEach(labelRe => {
      const fieldCheckbox = getByLabelText(labelRe) as HTMLInputElement;
      expect(fieldCheckbox.checked).toBe(false);
    });
  });

  it('renders app after installation', async () => {
    const sdk = makeSdkMock();
    sdk.app.getParameters.mockResolvedValueOnce({
      projectKey: 'some-key',
      clientId: '12345',
      clientSecret: 'some-secret',
      apiEndpoint: 'some-endpoint',
      authApiEndpoint: 'some-auth-endpoint',
      locale: 'en'
    });
    sdk.space.getEditorInterfaces.mockResolvedValueOnce({
      items: [
        {
          sys: { contentType: { sys: { id: 'ct3' } } },
          controls: [
            {
              fieldId: 'product_a',
              widgetNamespace: 'app',
              widgetId: 'some-app'
            },
            {
              fieldId: 'bar',
              widgetNamespace: 'app',
              widgetId: 'some-diff-app'
            },
            {
              fieldId: 'product_d',
              widgetNamespace: 'app',
              widgetId: 'some-app'
            }
          ]
        }
      ]
    });

    const { getByLabelText } = renderComponent(sdk);
    await wait(() => getByLabelText(/commercetools Project Key/));

    [
      [/commercetools Project Key/, 'some-key'],
      [/Client ID/, '12345'],
      [/Client Secret/, 'some-secret'],
      [/^API URL/, 'some-endpoint'],
      [/Auth URL/, 'some-auth-endpoint'],
      [/commercetools data locale/, 'en']
    ].forEach(([labelRe, expected]) => {
      const configInput = getByLabelText(labelRe as RegExp) as HTMLInputElement;
      expect(configInput.value).toEqual(expected);
    });

    [[/Product X$/, false]].forEach(([labelRe, expected]) => {
      const fieldCheckbox = getByLabelText(labelRe as RegExp) as HTMLInputElement;
      expect(fieldCheckbox.checked).toBe(expected);
    });
  });

  it('updates configuration', async () => {
    const sdk = makeSdkMock();
    const { getByLabelText } = renderComponent(sdk);
    await wait(() => getByLabelText(/commercetools Project Key/));
    [
      [/commercetools Project Key/, 'some-key'],
      [/Client ID/, '12345'],
      [/Client Secret/, 'some-secret'],
      [/^API URL/, 'some-endpoint'],
      [/Auth URL/, 'some-auth-endpoint'],
      [/commercetools data locale/, 'en']
    ].forEach(([labelRe, value]) => {
      const configInput = getByLabelText(labelRe as RegExp) as HTMLInputElement;
      fireEvent.change(configInput, { target: { value } });
    });

    const onConfigure = sdk.app.onConfigure.mock.calls[0][0];
    const configurationResult = onConfigure();

    expect(configurationResult).toEqual({
      parameters: {
        projectKey: 'some-key',
        clientId: '12345',
        clientSecret: 'some-secret',
        apiEndpoint: 'some-endpoint',
        authApiEndpoint: 'some-auth-endpoint',
        locale: 'en',
        fieldsConfig: {}
      },
      targetState: {
        EditorInterface: {
          ct1: {},
          ct3: {}
        }
      }
    });
  });
});
