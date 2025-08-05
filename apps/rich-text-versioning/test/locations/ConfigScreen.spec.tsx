import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import ConfigScreen from '../../src/locations/ConfigScreen';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

async function saveAppInstallation() {
  return await mockSdk.app.onConfigure.mock.calls.at(-1)[0]();
}

describe('Config Screen component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockSdk.app.getParameters.mockResolvedValue({});
    mockSdk.app.getCurrentState.mockResolvedValue({});
    mockSdk.app.onConfigure.mockImplementation((callback: () => Promise<any>) => {
      mockSdk.app.onConfigureCallback = callback;
    });
    // Mock space and environment IDs
    mockSdk.ids.space = 'test-space';
    mockSdk.ids.environment = 'test-environment';
    mockSdk.hostnames = { delivery: 'cdn.contentful.com' };
    mockSdk.notifier = {
      error: vi.fn(),
    };
  });

  it('should display the main heading and description', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    expect(screen.getByText('Set up Rich Text Versioning')).toBeInTheDocument();
    expect(
      screen.getByText(
        /This app allows content creators to visually compare changes in a rich text field against the last published version/
      )
    ).toBeInTheDocument();
  });

  it('should display the configure access section', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    expect(screen.getByText('Configure access')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Input the Contentful Delivery API - access token that will be used to request your content via API at send time/
      )
    ).toBeInTheDocument();
  });

  it('should display the API token input field', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    const tokenInput = screen.getByTestId('contentfulApiKey');

    expect(tokenInput).toBeInTheDocument();
    expect(screen.getByLabelText(/Contentful Delivery API - access token/)).toBeInTheDocument();
  });

  it('should display the manage API keys link', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    const link = screen.getByRole('link', { name: 'Manage API keys' });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://app.contentful.com/spaces/test-space/api/keys');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should display the assign content types section', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    expect(screen.getByText('Assign content types')).toBeInTheDocument();
    expect(
      screen.getByText(/Select the content type\(s\) you want to use with Rich Text Versioning/)
    ).toBeInTheDocument();
  });

  it('should display the content type implementation note', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    expect(
      screen.getByText('Implement content type selection checkboxes in the next step')
    ).toBeInTheDocument();
  });

  it('should allow entering and updating the Contentful API key', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<ConfigScreen />);
    });

    const tokenInput = screen.getByTestId('contentfulApiKey');
    await user.type(tokenInput, 'my-api-key');
    expect(tokenInput).toHaveValue('my-api-key');
  });

  it('should save configuration with valid parameters', async () => {
    const user = userEvent.setup();

    // Mock successful fetch response
    vi.spyOn(window, 'fetch').mockImplementationOnce((): any => {
      return { ok: true, status: 200 };
    });

    await act(async () => {
      render(<ConfigScreen />);
    });

    // Enter API token
    const tokenInput = screen.getByTestId('contentfulApiKey');
    await user.type(tokenInput, 'valid-token-123');

    // Simulate configuration
    await act(async () => {
      await saveAppInstallation();
    });

    // Verify parameters were saved
    expect(mockSdk.app.getCurrentState).toHaveBeenCalled();
  });

  it('should load existing parameters on mount', async () => {
    const existingParams = {
      contentfulApiKey: 'existing-token',
    };

    mockSdk.app.getParameters.mockResolvedValue(existingParams);

    await act(async () => {
      render(<ConfigScreen />);
    });

    await waitFor(() => {
      const tokenInput = screen.getByTestId('contentfulApiKey');
      expect(tokenInput).toHaveValue('existing-token');
    });
  });

  it('should show error notification when validation fails', async () => {
    const user = userEvent.setup();

    // Mock failed fetch response
    vi.spyOn(window, 'fetch').mockImplementationOnce((): any => {
      return { ok: false, status: 401 };
    });

    await act(async () => {
      render(<ConfigScreen />);
    });

    const contentfulApiKeyInput = screen.getByTestId('contentfulApiKey');
    await user.type(contentfulApiKeyInput, 'invalid-api-key-123');

    // Simulate configuration attempt
    await act(async () => {
      await saveAppInstallation();
    });

    // Verify error notification was shown
    expect(mockSdk.notifier.error).toHaveBeenCalledWith(
      'The app configuration was not saved. Please try again.'
    );
  });

  it('should handle empty API key validation', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    await act(async () => {
      await saveAppInstallation();
    });

    expect(mockSdk.notifier.error).toHaveBeenCalledWith(
      'The app configuration was not saved. Please try again.'
    );
  });
});
