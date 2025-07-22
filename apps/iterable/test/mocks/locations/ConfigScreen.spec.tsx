import React from 'react';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
import ConfigScreen from '../../../src/locations/ConfigScreen';
import { mockSdk, mockCma } from '..';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

async function saveAppInstallation() {
  return await mockSdk.app.onConfigure.mock.calls.at(-1)[0]();
}

describe('ConfigScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.app.getParameters.mockResolvedValue({ accessToken: '' });
    mockSdk.app.getCurrentState.mockResolvedValue({});
    mockSdk.app.setReady.mockResolvedValue();
    mockSdk.app.onConfigure.mockImplementation((cb: () => Promise<any>) => {
      // Simulate Contentful's onConfigure callback registration
      mockSdk._onConfigure = cb;
    });
    mockSdk.ids.space = 'test-space';
    mockSdk.notifier = { error: vi.fn(), success: vi.fn() };
    mockSdk.cma = mockCma;
    mockCma.contentType = {
      getMany: vi.fn().mockResolvedValue({ items: [] }),
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all main sections and UI elements', async () => {
    render(<ConfigScreen />);
    await waitFor(() => {
      expect(screen.getByText('Set up Iterable')).toBeInTheDocument();
      expect(screen.getByText('Configure access')).toBeInTheDocument();
      expect(screen.getByText('Assign content types')).toBeInTheDocument();
      expect(screen.getByText('Getting started')).toBeInTheDocument();
      expect(screen.getByText('Manage API keys')).toBeInTheDocument();
      expect(screen.getByText('Contentful Delivery API - access token')).toBeInTheDocument();
      expect(
        screen.getByText(
          'The Iterable integration will only be enabled for the content types you assign. The sidebar widget will be displayed on these entry pages.'
        )
      ).toBeInTheDocument();
    });
  });

  it('allows entering and updating the Contentful API key', async () => {
    render(<ConfigScreen />);
    const input = screen.getByTestId('contentfulApiKey');
    await userEvent.type(input, 'my-api-key');
    expect(input).toHaveValue('my-api-key');
  });

  it('renders content type multi-select and allows selection', async () => {
    mockCma.contentType.getMany.mockResolvedValue({
      items: [
        { sys: { id: 'blogPost' }, name: 'Blog Post' },
        { sys: { id: 'article' }, name: 'Article' },
      ],
    });
    render(<ConfigScreen />);
    // Open the autocomplete
    const autocomplete = await screen.findByPlaceholderText('Search content types');
    await userEvent.click(autocomplete);
    // Type to filter
    await userEvent.type(autocomplete, 'Blog');
    // Select the option
    const option = await screen.findByText('Blog Post');
    await userEvent.click(option);
    // Pill should appear
    expect(await screen.findByTestId('pill-Blog Post')).toBeInTheDocument();
  });

  it('handles empty state for content types', async () => {
    mockCma.contentType.getMany.mockResolvedValue({ items: [] });
    render(<ConfigScreen />);
    const autocomplete = await screen.findByPlaceholderText('Search content types');
    await userEvent.click(autocomplete);
    expect(screen.queryByText('No matches found')).toBeInTheDocument();
  });

  it('shows a toast error if the contentful api key is not set or invalid', async () => {
    const user = userEvent.setup();
    render(<ConfigScreen />);
    const contentfulApiKeyInput = await screen.findByTestId('contentfulApiKey');
    await user.type(contentfulApiKeyInput, 'invalid-api-key-123');
    vi.spyOn(window, 'fetch').mockImplementationOnce((): any => {
      return { ok: false, status: 401 };
    });

    await act(async () => {
      await saveAppInstallation();
    });

    expect(mockSdk.notifier.error).toHaveBeenCalledWith(
      'The app configuration was not saved. Please try again.'
    );
  });

  it("renders the 'here' link with the correct href in the Getting started section", async () => {
    render(<ConfigScreen />);
    const link = await screen.findByRole('link', { name: /^here$/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://www.contentful.com/help/apps/iterable/');
  });
});
