import React from 'react';
import { render } from '@testing-library/react';
import { ParameterDefinition } from '../interfaces';
import AppConfig from './AppConfig';
import { vi } from 'vitest';

describe('Config Screen component', () => {
  it('Component text exists', async () => {
    // eslint-disable-next-line
    const mockSdk: any = {
      app: {
        onConfigure: vi.fn(),
        getParameters: vi.fn().mockReturnValueOnce({}),
        setReady: vi.fn(),
        getCurrentState: vi.fn(),
      },
      hostnames: {
        webapp: 'app.contentful.com',
      },
      ids: {
        space: '123214',
        environment: 'master',
      },
      space: {
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
    };
    const { getByText } = render(
      <AppConfig
        sdk={mockSdk}
        parameterDefinitions={
          [
            {
              id: 'apiEndpoint',
              name: 'API Endpoint',
              description: 'The API URL',
              type: 'Symbol',
              required: true,
            },
          ] as ParameterDefinition[]
        }
        validateParameters={() => {
          return '';
        }}
        logo=""
        color=""
        name="SAP Commerce Cloud App"
        description={`
            The SAP Commerce Cloud app allows content creators to select products from their
            SAP Commerce Cloud instance and reference them inside of Contentful entries.`}
      />,
    );

    // simulate the user clicking the install button
    await mockSdk.app.onConfigure.mock.calls[0][0]();

    expect(
      getByText(
        'The SAP Commerce Cloud app allows content creators to select products from their SAP Commerce Cloud instance and reference them inside of Contentful entries.',
      ),
    ).toBeInTheDocument();
  });
});
