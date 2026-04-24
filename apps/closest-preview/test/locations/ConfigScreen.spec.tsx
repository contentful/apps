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

vi.mock('../../src/components/ContentTypeMultiSelect', () => ({
  default: ({ selectedContentTypes, setSelectedContentTypes }: any) => (
    <div>
      <button
        type="button"
        onClick={() =>
          setSelectedContentTypes([...selectedContentTypes, { id: 'blogPost', name: 'Blog Post' }])
        }>
        Add Blog Post
      </button>
      <button
        type="button"
        onClick={() =>
          setSelectedContentTypes([...selectedContentTypes, { id: 'article', name: 'Article' }])
        }>
        Add Article
      </button>
      <div data-test-id="selected-content-types">
        {selectedContentTypes.map((contentType: any) => contentType.name).join(', ')}
      </div>
    </div>
  ),
}));

vi.mock('../../src/components/PreviewFieldMultiSelect', () => ({
  default: ({ selectedPreviewFieldIds, setSelectedPreviewFieldIds }: any) => (
    <div>
      <button
        type="button"
        onClick={() => setSelectedPreviewFieldIds([...selectedPreviewFieldIds, 'slug'])}>
        Add slug
      </button>
      <button
        type="button"
        onClick={() => setSelectedPreviewFieldIds([...selectedPreviewFieldIds, 'url'])}>
        Add url
      </button>
      <div data-test-id="selected-preview-field-ids">{selectedPreviewFieldIds.join(', ')}</div>
    </div>
  ),
}));

async function saveAppInstallation() {
  return await mockSdk.app.onConfigure.mock.calls.at(-1)[0]();
}

describe('ConfigScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.app.getCurrentState.mockResolvedValue({});
    mockSdk.app.getParameters.mockResolvedValue({});
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
      expect(screen.getByText('Preview field IDs')).toBeInTheDocument();
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
    render(<ConfigScreen />);
    await userEvent.click(await screen.findByRole('button', { name: 'Add Blog Post' }));
    expect(await screen.findByTestId('selected-content-types')).toHaveTextContent('Blog Post');
  });

  it('renders the content type selector area', async () => {
    render(<ConfigScreen />);
    expect(await screen.findByRole('button', { name: 'Add Blog Post' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Add Article' })).toBeInTheDocument();
  });

  it('successfully configures app with selected content types', async () => {
    mockCma.contentType.getMany.mockResolvedValue({
      items: [
        {
          sys: { id: 'pageType' },
          name: 'Page Type',
          fields: [{ id: 'slug', type: 'Symbol' }],
        },
        {
          sys: { id: 'blogPost' },
          name: 'Blog Post',
          fields: [{ id: 'title', type: 'Symbol' }],
        },
        {
          sys: { id: 'article' },
          name: 'Article',
          fields: [{ id: 'title', type: 'Symbol' }],
        },
      ],
    });

    render(<ConfigScreen />);
    await userEvent.click(await screen.findByRole('button', { name: 'Add Blog Post' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Add Article' }));

    const result = await act(async () => {
      return await saveAppInstallation();
    });

    expect(result).toEqual({
      parameters: {
        previewFieldIds: ['slug'],
      },
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

  it('does not save page-level content types in the sidebar assignment state', async () => {
    mockCma.contentType.getMany.mockResolvedValue({
      items: [
        {
          sys: { id: 'blogPost' },
          name: 'Blog Post',
          fields: [{ id: 'slug', type: 'Symbol' }],
        },
        {
          sys: { id: 'article' },
          name: 'Article',
          fields: [{ id: 'title', type: 'Symbol' }],
        },
      ],
    });

    render(<ConfigScreen />);
    await waitFor(() => {
      expect(mockCma.contentType.getMany).toHaveBeenCalled();
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Add Blog Post' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Add Article' }));

    const result = await act(async () => {
      return await saveAppInstallation();
    });

    expect(result).toEqual({
      parameters: {
        previewFieldIds: ['slug'],
      },
      targetState: {
        EditorInterface: {
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
      parameters: {
        previewFieldIds: ['slug'],
      },
      targetState: {
        EditorInterface: {},
      },
    });
  });

  it('loads and saves custom preview field ids', async () => {
    mockSdk.app.getParameters.mockResolvedValue({ previewFieldIds: ['slug', 'url'] });

    render(<ConfigScreen />);

    expect(await screen.findByTestId('selected-preview-field-ids')).toHaveTextContent('slug, url');

    const result = await act(async () => {
      return await saveAppInstallation();
    });

    expect(result).toEqual({
      parameters: {
        previewFieldIds: ['slug', 'url'],
      },
      targetState: {
        EditorInterface: {},
      },
    });
  });

  it('saves preview field ids selected from the picker', async () => {
    mockSdk.app.getParameters.mockResolvedValue({ previewFieldIds: [] });

    render(<ConfigScreen />);
    await userEvent.click(await screen.findByRole('button', { name: 'Add url' }));

    const result = await act(async () => {
      return await saveAppInstallation();
    });

    expect(result).toEqual({
      parameters: {
        previewFieldIds: ['slug', 'url'],
      },
      targetState: {
        EditorInterface: {},
      },
    });
  });

  it('registers onConfigure callback on mount', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.onConfigure).toHaveBeenCalled();
    });
  });

  it('allows removing selected content types', async () => {
    render(<ConfigScreen />);
    await userEvent.click(await screen.findByRole('button', { name: 'Add Blog Post' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Add Article' }));

    expect(await screen.findByTestId('selected-content-types')).toHaveTextContent(
      'Blog Post, Article'
    );
  });
});
