import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigScreen from './ConfigScreen';
import { mockSdk } from '../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

// Helper to mock users clicking "save" -- return result of the callback passed to onConfigure()
const saveAppInstallation = () => {
  // We manually call the LAST onConfigure() callback (this is important, as earlier calls have stale data)
  return mockSdk.app.onConfigure.mock.calls.at(-1)[0]();
};

describe('ConfigScreen', () => {
  beforeEach(() => {
    render(<ConfigScreen />);
  });

  describe('setup', () => {
    it('renders setup view', async () => {
      // simulate the user clicking the install button
      await mockSdk.app.onConfigure.mock.calls[0][0]();

      expect(screen.getByText('Set Up AWS Amplify')).toBeInTheDocument();
      expect(screen.getByText('AWS Amplify Webhook URL')).toBeInTheDocument();
    });
  });

  describe('uninstalled', () => {
    it('does not allow the app to be installed without a valid webhook url', async () => {
      const user = userEvent.setup();
      const webhookUrlInput = screen.getByLabelText('webhookUrl');

      await user.click(webhookUrlInput);
      await user.type(webhookUrlInput, 'http//www.cool.com');

      await act(async () => {
        const res = await saveAppInstallation();

        expect(res).toEqual(false);
      });
    });

    it('allows the app to be installed with a valid webhook url', async () => {
      const user = userEvent.setup();
      const webhookUrlInput = screen.getByLabelText('webhookUrl');
      const testUrl = 'https://www.cool.com';

      await user.click(webhookUrlInput);
      await user.type(webhookUrlInput, testUrl);

      await act(async () => {
        const res = await saveAppInstallation();

        expect(res).toEqual({
          parameters: {
            amplifyWebhookUrl: testUrl,
          },
          targetState: undefined,
        });
      });
    });
  });

  describe('installed', () => {
    const testUrl = 'https://www.cool.com';

    beforeEach(async () => {
      mockSdk.app.getParameters.mockReturnValue({
        amplifyWebhookUrl: testUrl,
      });

      fireEvent.change(screen.getByTestId('webhookUrl'), {
        target: {
          value: testUrl,
        },
      });
    });

    it('overrides the previously saved parameters', async () => {
      const newUrl = 'https://www.newurl.com/';
      const webhookUrlInput = screen.getByTestId('webhookUrl') as HTMLInputElement;

      expect(webhookUrlInput.value).toBe(testUrl);

      await userEvent.click(webhookUrlInput);
      fireEvent.change(screen.getByTestId('webhookUrl'), {
        target: {
          value: '',
        },
      });
      await userEvent.type(webhookUrlInput, newUrl);
      await act(async () => {
        const res = await saveAppInstallation();

        expect(res).toEqual({
          parameters: {
            amplifyWebhookUrl: newUrl,
          },
          targetState: undefined,
        });
      });
    });
  });
});
