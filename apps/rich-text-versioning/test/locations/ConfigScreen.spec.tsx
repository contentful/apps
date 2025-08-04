import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import ConfigScreen from '../../src/locations/ConfigScreen';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

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

    const tokenInput = screen.getByLabelText(/Contentful Delivery API - access token/i);
    expect(tokenInput).toBeInTheDocument();
    expect(tokenInput).toHaveAttribute('type', 'password');
    expect(tokenInput).toBeRequired();
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

  it('should show loading state for content types initially', async () => {
    // Mock a delayed response to simulate loading
    mockCma.contentType.getMany.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                items: [],
                total: 0,
              }),
            100
          )
        )
    );

    await act(async () => {
      render(<ConfigScreen />);
    });

    expect(screen.getByText('Loading content types...')).toBeInTheDocument();
  });

  it('should load and display content types when CMA is available', async () => {
    const mockContentTypes = [
      { sys: { id: 'blogPost' }, name: 'Blog Post' },
      { sys: { id: 'article' }, name: 'Article' },
    ];

    mockCma.contentType.getMany.mockResolvedValue({
      items: mockContentTypes,
      total: 2,
    });

    await act(async () => {
      render(<ConfigScreen />);
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          '2 content type(s) loaded successfully. Selection functionality will be implemented next.'
        )
      ).toBeInTheDocument();
    });
  });

  it('should handle API token input changes', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<ConfigScreen />);
    });

    const tokenInput = screen.getByLabelText(/Contentful Delivery API - access token/i);
    await user.type(tokenInput, 'test-token-123');

    expect(tokenInput).toHaveValue('test-token-123');
  });

  it('should validate required API token on configuration', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<ConfigScreen />);
    });

    // Simulate configuration attempt without token
    await act(async () => {
      await mockSdk.app.onConfigureCallback();
    });

    // Should show validation error
    expect(screen.getByText(/API token is required/i)).toBeInTheDocument();
  });

  it('should save configuration with valid parameters', async () => {
    const user = userEvent.setup();
    const mockContentTypes = [{ sys: { id: 'blogPost' }, name: 'Blog Post' }];

    mockCma.contentType.getMany.mockResolvedValue({
      items: mockContentTypes,
      total: 1,
    });

    await act(async () => {
      render(<ConfigScreen />);
    });

    // Enter API token
    const tokenInput = screen.getByLabelText(/Contentful Delivery API - access token/i);
    await user.type(tokenInput, 'valid-token-123');

    // Simulate configuration
    await act(async () => {
      await mockSdk.app.onConfigureCallback();
    });

    // Verify parameters were saved
    expect(mockSdk.app.getCurrentState).toHaveBeenCalled();
  });

  it('should load existing parameters on mount', async () => {
    const existingParams = {
      apiToken: 'existing-token',
      selectedContentTypes: ['blogPost'],
    };

    mockSdk.app.getParameters.mockResolvedValue(existingParams);

    await act(async () => {
      render(<ConfigScreen />);
    });

    await waitFor(() => {
      const tokenInput = screen.getByLabelText(/Contentful Delivery API - access token/i);
      expect(tokenInput).toHaveValue('existing-token');
    });
  });

  it('should handle content types loading error gracefully', async () => {
    mockCma.contentType.getMany.mockRejectedValue(new Error('Failed to load content types'));

    await act(async () => {
      render(<ConfigScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Error loading content types/i)).toBeInTheDocument();
    });
  });

  it('should show progress indicator during content types loading', async () => {
    // Mock a slow response to test progress
    mockCma.contentType.getMany.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                items: [],
                total: 0,
              }),
            100
          )
        )
    );

    await act(async () => {
      render(<ConfigScreen />);
    });

    expect(screen.getByText('Loading content types...')).toBeInTheDocument();
  });
});
