import { render, screen } from '@testing-library/react';
import ConfigBody from './ConfigBody/ConfigBody';

const mockProviderConfig = {
  name: 'Ecom Provider',
  description: 'An app for ecom',
  parameterDefinitions: [
    {
      id: 'accessToken',
      name: 'Access Token',
      description: 'Your access token',
      type: 'Symbol',
      required: true,
    },
  ],
  primaryColor: '#212F3F',
  logoUrl: '',
};

describe('Config Body component', () => {
  it('mounts', () => {
    render(
      <ConfigBody
        baseUrl={''}
        error={undefined}
        isLoading={false}
        onCredentialCheck={jest.fn()}
        onParameterChange={jest.fn()}
        parameters={{}}
        providerConfig={mockProviderConfig}
      />
    );

    expect(screen.getByText(/Configuration/)).toBeInTheDocument();
  });
});

describe('Config Body component loading state', () => {
  it('mounts', () => {
    render(
      <ConfigBody
        baseUrl={''}
        error={undefined}
        isLoading={true}
        onCredentialCheck={jest.fn()}
        onParameterChange={jest.fn()}
        parameters={{}}
        providerConfig={mockProviderConfig}
      />
    );

    expect(screen.getByTestId('cf-ui-skeleton-form')).toBeInTheDocument();
  });
});

describe('Config Body component error state', () => {
  it('mounts', () => {
    render(
      <ConfigBody
        baseUrl={''}
        error={new Error()}
        isLoading={false}
        onCredentialCheck={jest.fn()}
        onParameterChange={jest.fn()}
        parameters={{}}
        providerConfig={mockProviderConfig}
      />
    );

    expect(screen.getByTestId('cf-ui-note')).toBeInTheDocument();
  });
});
