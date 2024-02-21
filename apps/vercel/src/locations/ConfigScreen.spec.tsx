import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import ConfigScreen from './ConfigScreen';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const saveAppInstallation = () => {
  // We manually call the LAST onConfigure() callback (this is important, as earlier calls have stale data)
  return mockSdk.app.onConfigure.mock.calls.at(-1)[0]();
};

describe('ConfigScreen', () => {
  const testToken = 'abc1234';

  it('renders setup view', async () => {
    const { unmount } = render(<ConfigScreen />);
    // simulate the user clicking the install button
    await mockSdk.app.onConfigure.mock.calls[0][0]();

    expect(screen.getByText('Connect Vercel')).toBeTruthy();
    expect(screen.getByText('Vercel Access Token')).toBeTruthy();
    unmount();
  });
});
