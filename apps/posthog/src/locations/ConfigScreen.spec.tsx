import ConfigScreen from './ConfigScreen';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockSdk } from '../../test/mocks';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('ConfigScreen component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.app.getParameters.mockResolvedValue({
      personalApiKey: '',
      projectId: '',
      posthogHost: '',
      urlMappings: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the PostHog Analytics heading', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('PostHog Analytics')).toBeInTheDocument();
    });
  });

  it('should render API Configuration section', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('API Configuration')).toBeInTheDocument();
    });
  });

  it('should render all required form fields', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('Project API Key (Public)')).toBeInTheDocument();
      expect(screen.getByText('Personal API Key')).toBeInTheDocument();
      expect(screen.getByText('Project ID')).toBeInTheDocument();
      expect(screen.getByText('PostHog Host')).toBeInTheDocument();
    });
  });

  it('should render security warning note', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Security: Use Minimal Permissions/i)).toBeInTheDocument();
      expect(screen.getByText(/Do not use a key with Write permissions/i)).toBeInTheDocument();
    });
  });

  it('should render URL Mapping section', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('URL Mapping')).toBeInTheDocument();
      expect(screen.getByText('Add URL Mapping')).toBeInTheDocument();
    });
  });

  it('should render Help section with documentation links', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('Need Help?')).toBeInTheDocument();
      expect(screen.getByText('PostHog API Documentation')).toBeInTheDocument();
      expect(screen.getByText('HogQL Query Language')).toBeInTheDocument();
    });
  });

  it('should add URL mapping when button is clicked', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('Add URL Mapping')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add URL Mapping');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('blogPost')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://example.com/blog/{slug}')).toBeInTheDocument();
    });
  });

  it('should show custom host input when Custom is selected', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('https://posthog.yourcompany.com')).toBeInTheDocument();
    });
  });

  it('should call setReady on mount', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });
  });

  it('should register onConfigure callback', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.onConfigure).toHaveBeenCalled();
    });
  });

  it('should load existing parameters on mount', async () => {
    mockSdk.app.getParameters.mockResolvedValue({
      personalApiKey: 'phx_existing_key',
      projectId: '12345',
      posthogHost: 'https://eu.posthog.com',
      urlMappings: [{ contentTypeId: 'blogPost', urlPattern: 'https://example.com/blog/{slug}' }],
    });

    render(<ConfigScreen />);

    await waitFor(() => {
      // The host dropdown should show EU Cloud
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('https://eu.posthog.com');
    });
  });

  describe('Validation', () => {
    it('should show error when Personal API Key is missing on save', async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.app.onConfigure).toHaveBeenCalled();
      });

      // Get the onConfigure callback and call it
      const onConfigureCallback = mockSdk.app.onConfigure.mock.calls[0][0];
      const result = await onConfigureCallback();

      expect(result).toBe(false);
      expect(mockSdk.notifier.error).toHaveBeenCalledWith('Personal API Key is required');
    });
  });
});
