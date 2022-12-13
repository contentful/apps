import React from 'react';
import ConfigScreen from './ConfigScreen';
import { render, RenderResult } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  let renderedComponent: RenderResult;

  beforeEach(() => {
    renderedComponent = render(<ConfigScreen />);
  });

  it('shows config screen', async () => {
    const { getByText } = renderedComponent;

    // install the app
    await mockSdk.app.onConfigure.mock.calls[0][0]();

    expect(getByText('About Google Analytics for Contentful')).toBeInTheDocument();
  });

  it('can be installed', async () => {
    const { getByText } = renderedComponent;

    // install the app
    await mockSdk.app.onConfigure.mock.calls[0][0]();

    expect(getByText('About Google Analytics for Contentful')).toBeInTheDocument();
  });
});
