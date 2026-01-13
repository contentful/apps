import ConfigScreen from './ConfigScreen';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockSdk, mockCma } from '../../test/mocks';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
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

    it('should show error when Project ID is missing on save', async () => {
      mockSdk.app.getParameters.mockResolvedValue({
        personalApiKey: 'phx_test_key',
        projectId: '',
        posthogHost: 'https://us.posthog.com',
        urlMappings: [],
      });

      render(<ConfigScreen />);

      // Wait for parameters to be loaded (indicated by setReady being called)
      await waitFor(() => {
        expect(mockSdk.app.setReady).toHaveBeenCalled();
      });

      // Get the latest onConfigure callback (may be registered multiple times due to useEffect)
      const calls = mockSdk.app.onConfigure.mock.calls;
      const onConfigureCallback = calls[calls.length - 1][0];
      const result = await onConfigureCallback();

      expect(result).toBe(false);
      expect(mockSdk.notifier.error).toHaveBeenCalledWith('Project ID is required');
    });

    it('should show error when PostHog Host is missing on save', async () => {
      mockSdk.app.getParameters.mockResolvedValue({
        personalApiKey: 'phx_test_key',
        projectId: '12345',
        posthogHost: '',
        urlMappings: [],
      });

      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.app.setReady).toHaveBeenCalled();
      });

      const calls = mockSdk.app.onConfigure.mock.calls;
      const onConfigureCallback = calls[calls.length - 1][0];
      const result = await onConfigureCallback();

      expect(result).toBe(false);
      expect(mockSdk.notifier.error).toHaveBeenCalledWith('PostHog Host is required');
    });

    it('should show error when URL pattern is missing {slug} placeholder', async () => {
      mockSdk.app.getParameters.mockResolvedValue({
        personalApiKey: 'phx_test_key',
        projectId: '12345',
        posthogHost: 'https://us.posthog.com',
        urlMappings: [{ contentTypeId: 'blogPost', urlPattern: 'https://example.com/blog/' }],
      });

      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.app.setReady).toHaveBeenCalled();
      });

      const calls = mockSdk.app.onConfigure.mock.calls;
      const onConfigureCallback = calls[calls.length - 1][0];
      const result = await onConfigureCallback();

      expect(result).toBe(false);
      expect(mockSdk.notifier.error).toHaveBeenCalledWith(
        'URL patterns must include {slug} placeholder'
      );
    });

    it('should return configuration when all fields are valid', async () => {
      mockSdk.app.getParameters.mockResolvedValue({
        personalApiKey: 'phx_test_key',
        projectId: '12345',
        posthogHost: 'https://us.posthog.com',
        urlMappings: [{ contentTypeId: 'blogPost', urlPattern: 'https://example.com/blog/{slug}' }],
      });
      mockSdk.app.getCurrentState.mockResolvedValue({ EditorInterface: {} });

      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.app.setReady).toHaveBeenCalled();
      });

      const calls = mockSdk.app.onConfigure.mock.calls;
      const onConfigureCallback = calls[calls.length - 1][0];
      const result = await onConfigureCallback();

      expect(result).toEqual({
        parameters: {
          personalApiKey: 'phx_test_key',
          projectId: '12345',
          posthogHost: 'https://us.posthog.com',
          urlMappings: [
            { contentTypeId: 'blogPost', urlPattern: 'https://example.com/blog/{slug}' },
          ],
        },
        targetState: { EditorInterface: {} },
      });
    });

    it('should filter out empty URL mappings on save', async () => {
      mockSdk.app.getParameters.mockResolvedValue({
        personalApiKey: 'phx_test_key',
        projectId: '12345',
        posthogHost: 'https://us.posthog.com',
        urlMappings: [
          { contentTypeId: 'blogPost', urlPattern: 'https://example.com/blog/{slug}' },
          { contentTypeId: '', urlPattern: '' },
          { contentTypeId: 'page', urlPattern: 'https://example.com/{slug}' },
        ],
      });
      mockSdk.app.getCurrentState.mockResolvedValue({ EditorInterface: {} });

      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.app.setReady).toHaveBeenCalled();
      });

      const calls = mockSdk.app.onConfigure.mock.calls;
      const onConfigureCallback = calls[calls.length - 1][0];
      const result = await onConfigureCallback();

      expect(result.parameters.urlMappings).toHaveLength(2);
      expect(result.parameters.urlMappings).toEqual([
        { contentTypeId: 'blogPost', urlPattern: 'https://example.com/blog/{slug}' },
        { contentTypeId: 'page', urlPattern: 'https://example.com/{slug}' },
      ]);
    });
  });

  describe('URL Mapping Management', () => {
    it('should remove URL mapping when delete button is clicked', async () => {
      mockSdk.app.getParameters.mockResolvedValue({
        personalApiKey: 'phx_test_key',
        projectId: '12345',
        posthogHost: 'https://us.posthog.com',
        urlMappings: [{ contentTypeId: 'blogPost', urlPattern: 'https://example.com/blog/{slug}' }],
      });

      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('blogPost')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /remove mapping/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('blogPost')).not.toBeInTheDocument();
      });
    });

    it('should handle multiple URL mappings', async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByText('Add URL Mapping')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add URL Mapping');

      // Add first mapping
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getAllByPlaceholderText('blogPost')).toHaveLength(1);
      });

      // Add second mapping
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getAllByPlaceholderText('blogPost')).toHaveLength(2);
      });
    });
  });

  describe('Test Connection Button', () => {
    it('should render Test Connection button', async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument();
      });
    });

    it('should show error when testing without Personal API Key', async () => {
      mockSdk.app.getParameters.mockResolvedValue({
        personalApiKey: '',
        projectId: '12345',
        posthogHost: 'https://us.posthog.com',
        urlMappings: [],
      });

      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument();
      });

      const testButton = screen.getByRole('button', { name: /test connection/i });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(mockSdk.notifier.error).toHaveBeenCalledWith(
          'Please enter a Personal API Key first'
        );
      });
    });

    it('should show error when testing without Project ID', async () => {
      mockSdk.app.getParameters.mockResolvedValue({
        personalApiKey: 'phx_test_key',
        projectId: '',
        posthogHost: 'https://us.posthog.com',
        urlMappings: [],
      });

      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument();
      });

      const testButton = screen.getByRole('button', { name: /test connection/i });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(mockSdk.notifier.error).toHaveBeenCalledWith('Please enter a Project ID first');
      });
    });

    it('should show error when testing without PostHog Host', async () => {
      mockSdk.app.getParameters.mockResolvedValue({
        personalApiKey: 'phx_test_key',
        projectId: '12345',
        posthogHost: '',
        urlMappings: [],
      });

      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument();
      });

      const testButton = screen.getByRole('button', { name: /test connection/i });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(mockSdk.notifier.error).toHaveBeenCalledWith('Please select a PostHog Host first');
      });
    });

    it('should call appActionCall with correct parameters when testing connection', async () => {
      mockSdk.app.getParameters.mockResolvedValue({
        personalApiKey: 'phx_test_key',
        projectId: '12345',
        posthogHost: 'https://us.posthog.com',
        urlMappings: [],
      });

      mockCma.appActionCall.createWithResponse.mockResolvedValue({
        response: {
          body: JSON.stringify({
            success: true,
            data: { projectName: 'My Project', organizationName: 'My Org' },
          }),
        },
      });

      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument();
      });

      const testButton = screen.getByRole('button', { name: /test connection/i });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(mockCma.appActionCall.createWithResponse).toHaveBeenCalledWith(
          {
            spaceId: mockSdk.ids.space,
            environmentId: mockSdk.ids.environment,
            appDefinitionId: mockSdk.ids.app,
            appActionId: 'validateConnection',
          },
          {
            parameters: {
              apiKey: 'phx_test_key',
              projectId: '12345',
              host: 'https://us.posthog.com',
            },
          }
        );
      });
    });

    it('should show success message when connection is valid', async () => {
      mockSdk.app.getParameters.mockResolvedValue({
        personalApiKey: 'phx_test_key',
        projectId: '12345',
        posthogHost: 'https://us.posthog.com',
        urlMappings: [],
      });

      mockCma.appActionCall.createWithResponse.mockResolvedValue({
        response: {
          body: JSON.stringify({
            success: true,
            data: { projectName: 'My Project', organizationName: 'My Org' },
          }),
        },
      });

      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument();
      });

      const testButton = screen.getByRole('button', { name: /test connection/i });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(mockSdk.notifier.success).toHaveBeenCalledWith('Connected to project: My Project');
      });

      // Should show success status in UI
      await waitFor(() => {
        expect(screen.getByText(/connected to/i)).toBeInTheDocument();
        expect(screen.getByText('My Project')).toBeInTheDocument();
      });
    });

    it('should show error message when connection fails', async () => {
      mockSdk.app.getParameters.mockResolvedValue({
        personalApiKey: 'phx_invalid_key',
        projectId: '12345',
        posthogHost: 'https://us.posthog.com',
        urlMappings: [],
      });

      mockCma.appActionCall.createWithResponse.mockResolvedValue({
        response: {
          body: JSON.stringify({
            success: false,
            error: { code: 'INVALID_API_KEY', message: 'Invalid API key' },
          }),
        },
      });

      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument();
      });

      const testButton = screen.getByRole('button', { name: /test connection/i });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(mockSdk.notifier.error).toHaveBeenCalledWith('Invalid API key');
      });

      // Should show error status in UI
      await waitFor(() => {
        expect(screen.getByText('Invalid API key')).toBeInTheDocument();
      });
    });
  });

  describe('Credential Input Behavior', () => {
    it('should display censored API key when value exists', async () => {
      mockSdk.app.getParameters.mockResolvedValue({
        personalApiKey: 'phx_1234567890abcdef',
        projectId: '12345',
        posthogHost: 'https://us.posthog.com',
        urlMappings: [],
      });

      render(<ConfigScreen />);

      await waitFor(() => {
        // The key should be censored (showing first 4 and last 4 chars)
        const inputs = screen.getAllByRole('textbox');
        const personalKeyInput = inputs.find(
          (input) => (input as HTMLInputElement).name === 'personalApiKey'
        );
        expect(personalKeyInput).toHaveValue('phx_••••••••••••cdef');
      });
    });

    it('should allow editing Personal API Key on click', async () => {
      mockSdk.app.getParameters.mockResolvedValue({
        personalApiKey: 'phx_existing_key',
        projectId: '12345',
        posthogHost: 'https://us.posthog.com',
        urlMappings: [],
      });

      render(<ConfigScreen />);

      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        const personalKeyInput = inputs.find(
          (input) => (input as HTMLInputElement).name === 'personalApiKey'
        );
        expect(personalKeyInput).toBeInTheDocument();
      });

      // Find and click on the Personal API Key input
      const inputs = screen.getAllByRole('textbox');
      const personalKeyInput = inputs.find(
        (input) => (input as HTMLInputElement).name === 'personalApiKey'
      );
      fireEvent.click(personalKeyInput!);

      await waitFor(() => {
        // After clicking, should show the actual value for editing
        const passwordInput = screen.getByDisplayValue('phx_existing_key');
        expect(passwordInput).toBeInTheDocument();
      });
    });

    it('should update Project ID when typing', async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        const projectIdInput = screen.getByPlaceholderText('12345');
        expect(projectIdInput).toBeInTheDocument();
      });

      const projectIdInput = screen.getByPlaceholderText('12345');
      fireEvent.change(projectIdInput, { target: { value: '67890' } });

      expect(projectIdInput).toHaveValue('67890');
    });

    it('should handle host selection for US Cloud', async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'https://us.posthog.com' } });

      expect(select).toHaveValue('https://us.posthog.com');
    });

    it('should handle host selection for EU Cloud', async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'https://eu.posthog.com' } });

      expect(select).toHaveValue('https://eu.posthog.com');
    });

    it('should update custom host value when typing', async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'custom' } });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('https://posthog.yourcompany.com')).toBeInTheDocument();
      });

      const customInput = screen.getByPlaceholderText('https://posthog.yourcompany.com');
      fireEvent.change(customInput, { target: { value: 'https://my-posthog.example.com' } });

      expect(customInput).toHaveValue('https://my-posthog.example.com');
    });
  });
});
