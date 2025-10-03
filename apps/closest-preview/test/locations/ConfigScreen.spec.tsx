import React from 'react';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
import ConfigScreen from '../../src/locations/ConfigScreen';
import { mockSdk, mockCma } from '../mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

async function saveAppInstallation() {
  return await mockSdk.app.onConfigure.mock.calls.at(-1)[0]();
}

describe('ConfigScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.app.getParameters.mockResolvedValue({});
    mockSdk.app.getCurrentState.mockResolvedValue({});
    mockSdk.app.setReady.mockResolvedValue();
    mockSdk.app.onConfigure.mockImplementation((cb: () => Promise<any>) => {
      // Simulate Contentful's onConfigure callback registration
      mockSdk._onConfigure = cb;
    });
    mockSdk.ids.space = 'test-space';
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
      expect(screen.getByText('Set up Closest Preview')).toBeInTheDocument();
      expect(screen.getByText('Assign content types')).toBeInTheDocument();
      expect(screen.getByText('Content types')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Closest Preview allows users to quickly navigate to the closest page level element for a given entry in order to preview the item.'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Select the content type(s) you want to use with Closest Preview. You can change this anytime by navigating to the 'Sidebar' tab in your content model."
        )
      ).toBeInTheDocument();
    });
  });

  it('renders content type multi-select and allows selection', async () => {
    mockCma.contentType.getMany.mockResolvedValue({
      items: [
        { sys: { id: 'blogPost' }, name: 'Blog Post' },
        { sys: { id: 'article' }, name: 'Article' },
      ],
    });
    render(<ConfigScreen />);
    const autocomplete = await screen.findByPlaceholderText('Search content types');
    await userEvent.click(autocomplete);
    await userEvent.type(autocomplete, 'Blog');

    const option = await screen.findByText('Blog Post');
    await userEvent.click(option);

    expect(await screen.findByTestId('pill-Blog Post')).toBeInTheDocument();
  });

  it('handles empty state for content types', async () => {
    mockCma.contentType.getMany.mockResolvedValue({ items: [] });
    render(<ConfigScreen />);
    const autocomplete = await screen.findByPlaceholderText('Search content types');
    await userEvent.click(autocomplete);
    expect(screen.queryByText('No matches found')).toBeInTheDocument();
  });

  it('successfully configures app with selected content types', async () => {
    mockCma.contentType.getMany.mockResolvedValue({
      items: [
        { sys: { id: 'blogPost' }, name: 'Blog Post' },
        { sys: { id: 'article' }, name: 'Article' },
      ],
    });

    render(<ConfigScreen />);

    const autocomplete = await screen.findByPlaceholderText('Search content types');
    await userEvent.click(autocomplete);

    const blogPostOption = await screen.findByText('Blog Post');
    await userEvent.click(blogPostOption);

    const articleOption = await screen.findByText('Article');
    await userEvent.click(articleOption);

    expect(await screen.findByTestId('pill-Blog Post')).toBeInTheDocument();
    expect(await screen.findByTestId('pill-Article')).toBeInTheDocument();

    const result = await act(async () => {
      return await saveAppInstallation();
    });

    expect(result).toEqual({
      parameters: {},
      targetState: {
        EditorInterface: {
          blogPost: {
            sidebar: { position: 0 },
          },
          article: {
            sidebar: { position: 0 },
          },
        },
      },
    });
  });

  it('handles configuration with no content types selected', async () => {
    render(<ConfigScreen />);

    const result = await act(async () => {
      return await saveAppInstallation();
    });

    expect(result).toEqual({
      parameters: {},
      targetState: {
        EditorInterface: {},
      },
    });
  });

  it('loads existing parameters on mount', async () => {
    const existingParameters = { someParam: 'value' };
    mockSdk.app.getParameters.mockResolvedValue(existingParameters);

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.getParameters).toHaveBeenCalled();
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });
  });

  it('registers onConfigure callback on mount', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.onConfigure).toHaveBeenCalled();
    });
  });

  it('allows removing selected content types', async () => {
    mockCma.contentType.getMany.mockResolvedValue({
      items: [
        { sys: { id: 'blogPost' }, name: 'Blog Post' },
        { sys: { id: 'article' }, name: 'Article' },
      ],
    });

    render(<ConfigScreen />);

    const autocomplete = await screen.findByPlaceholderText('Search content types');
    await userEvent.click(autocomplete);

    const blogPostOption = await screen.findByText('Blog Post');
    await userEvent.click(blogPostOption);

    const articleOption = await screen.findByText('Article');
    await userEvent.click(articleOption);

    expect(await screen.findByTestId('pill-Blog Post')).toBeInTheDocument();
    expect(await screen.findByTestId('pill-Article')).toBeInTheDocument();

    const closeButtons = await screen.findAllByLabelText('Close');
    const blogPostCloseButton = closeButtons.find((button) =>
      button.closest('[data-test-id="pill-Blog Post"]')
    );
    await userEvent.click(blogPostCloseButton!);

    expect(screen.queryByTestId('pill-Blog Post')).not.toBeInTheDocument();
    expect(screen.getByTestId('pill-Article')).toBeInTheDocument();
  });

  it('filters content types based on search input', async () => {
    mockCma.contentType.getMany.mockResolvedValue({
      items: [
        { sys: { id: 'blogPost' }, name: 'Blog Post' },
        { sys: { id: 'article' }, name: 'Article' },
        { sys: { id: 'newsItem' }, name: 'News Item' },
      ],
    });

    render(<ConfigScreen />);

    const autocomplete = await screen.findByPlaceholderText('Search content types');
    await userEvent.click(autocomplete);

    await userEvent.type(autocomplete, 'Blog');

    expect(await screen.findByText('Blog Post')).toBeInTheDocument();
    expect(screen.queryByText('Article')).not.toBeInTheDocument();
    expect(screen.queryByText('News Item')).not.toBeInTheDocument();
  });
});
