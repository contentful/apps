import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import ConfigScreen from '../../src/locations/ConfigScreen';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  it('should display the welcome message', async () => {
    const { getByText } = render(<ConfigScreen />);

    // simulate the user clicking the install button
    await act(async () => {
      await mockSdk.app.onConfigure.mock.calls[0][0]({}, {});
    });

    expect(
      getByText('Welcome to your contentful app. This is your config page.')
    ).toBeInTheDocument();
  });
});
