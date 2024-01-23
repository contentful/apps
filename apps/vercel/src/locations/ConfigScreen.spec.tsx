import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
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

  beforeEach(() => {
    render(<ConfigScreen />);
  });

  it('renders setup view', async () => {
    // simulate the user clicking the install button
    await mockSdk.app.onConfigure.mock.calls[0][0]();

    expect(screen.getByText('Set Up Vercel')).toBeTruthy();
    expect(screen.getByText('Vercel Access Token')).toBeTruthy();
  });

  describe('uninstalled', () => {
    it('allows the app to be installed with an access token', async () => {
      const user = userEvent.setup();
      const accessTokenInput = screen.getByLabelText('accessToken');

      await user.click(accessTokenInput);
      await user.type(accessTokenInput, testToken);

      await act(async () => {
        const res = await saveAppInstallation();

        expect(res).toEqual({
          parameters: {
            accessToken: testToken,
          },
          targetState: undefined,
        });
      });
    });
  });
});
