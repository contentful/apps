import React from 'react';
import ConfigScreen from './ConfigScreen';
import { act, render, RenderResult } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  it('can render the basic form', () => {
    const renderedComponent = render(<ConfigScreen />);
    const { getByText } = renderedComponent;

    expect(getByText('About Google Analytics for Contentful')).toBeInTheDocument();
  });

  it('allows the app to be installed with a valid service key file', async () => {
    const renderedComponent = render(<ConfigScreen />);
    const { getByText } = renderedComponent;

    await act(async () => {
      await mockSdk.app.onConfigure.mock.calls[0][0]();
    });

    expect(getByText('About Google Analytics for Contentful')).toBeInTheDocument();
  });
});
