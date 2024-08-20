import React from 'react';
import { render } from '@testing-library/react';
import { ParameterDefinition } from '../interfaces';
import AppConfig from './AppConfig';
import { makeSdkMock } from '../__mocks__';

const description =
  'The SAP Commerce Cloud app allows content creators to select products from their SAP Commerce Cloud instance and reference them inside of Contentful entries.';

describe('Config Screen component', () => {
  it('Component text exists', async () => {
    const mockSdk: any = makeSdkMock();
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
        validateParameters={(parameters: Record<string, string>) => {
          return '';
        }}
        logo=""
        color=""
        name="SAP Commerce Cloud App"
        description={`${description}`}
      />
    );

    // simulate the user clicking the install button
    await mockSdk.app.onConfigure.mock.calls[0][0]();

    expect(getByText(description)).toBeInTheDocument();
  });
});
