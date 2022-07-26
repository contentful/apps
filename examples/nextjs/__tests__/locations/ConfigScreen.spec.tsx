import React from 'react';
import { act, render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../__tests__/mocks';
import ConfigScreen from '@/components/locations/ConfigScreen';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  it('Component text exists', async () => {
    const { getByText } = render(<ConfigScreen />);

    // simulate the user clicking the install button
    await act(async () => {
      await mockSdk.app.onConfigure.mock.calls[0][0]();
    });

    expect(
      getByText('Welcome to your contentful app. This is your config page.')
    ).toBeInTheDocument();
  });
});
