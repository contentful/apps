import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
import ConfigScreen from '../../src/locations/ConfigScreen';
import { mockSdk, mockCma } from '../mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

vi.mock('../../src/utils/createContentType', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/utils/createContentType')>();
  return {
    ...original,
    createContentTypes: vi.fn().mockResolvedValue(undefined),
  };
});

import { createContentTypes } from '../../src/utils/createContentType';

const mockContentTypes = [
  { sys: { id: 'blogPost' }, name: 'Blog Post' },
  { sys: { id: 'article' }, name: 'Article' },
  { sys: { id: 'landingPage' }, name: 'Landing Page' },
];

async function saveAppInstallation() {
  return await mockSdk.app.onConfigure.mock.calls.at(-1)[0]();
}

async function openMultiselect(index: number) {
  const toggleButtons = screen.getAllByLabelText('Toggle Multiselect');
  await userEvent.click(toggleButtons[index]);
}

async function selectContentType(name: string, multiselectIndex: number) {
  await openMultiselect(multiselectIndex);
  const checkbox = await screen.findByRole('checkbox', { name });
  await userEvent.click(checkbox);
}

describe('ConfigScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.app.getParameters.mockResolvedValue(null);
    mockSdk.app.getCurrentState.mockResolvedValue({});
    mockSdk.app.setReady.mockResolvedValue(undefined);
    mockCma.contentType.getMany.mockResolvedValue({ items: [] });
    mockCma.contentType.get.mockRejectedValue(new Error('Not found'));
    (createContentTypes as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all main sections and UI elements', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByText('Set up Redirects')).toBeInTheDocument();
      expect(screen.getByText('Configure')).toBeInTheDocument();
      expect(screen.getByText('Redirect FROM')).toBeInTheDocument();
      expect(screen.getByText('Redirect TO')).toBeInTheDocument();
      expect(screen.getByText('Vanity URL')).toBeInTheDocument();
      expect(screen.getByText('Disclaimer')).toBeInTheDocument();
    });
  });

  it('allows selecting content types for both FROM and TO', async () => {
    mockCma.contentType.getMany.mockResolvedValue({ items: mockContentTypes });

    render(<ConfigScreen />);

    await selectContentType('Blog Post', 0);
    await selectContentType('Article', 1);

    expect(await screen.findByTestId('pill-Blog Post')).toBeInTheDocument();
    expect(await screen.findByTestId('pill-Article')).toBeInTheDocument();
  });

  it('shows validation error only for FROM when TO is selected', async () => {
    mockCma.contentType.getMany.mockResolvedValue({ items: mockContentTypes });

    render(<ConfigScreen />);

    await selectContentType('Blog Post', 1);

    const result = await act(async () => {
      return await saveAppInstallation();
    });

    expect(result).toBe(false);

    await waitFor(() => {
      const validationMessages = screen.getAllByText('Select at least one content type');
      expect(validationMessages).toHaveLength(1);
    });
  });

  it('shows validation error only for TO when FROM is selected', async () => {
    mockCma.contentType.getMany.mockResolvedValue({ items: mockContentTypes });

    render(<ConfigScreen />);

    await selectContentType('Blog Post', 0);

    const result = await act(async () => {
      return await saveAppInstallation();
    });

    expect(result).toBe(false);

    await waitFor(() => {
      const validationMessages = screen.getAllByText('Select at least one content type');
      expect(validationMessages).toHaveLength(1);
    });
  });

  it('successfully configures app with selected content types', async () => {
    mockCma.contentType.getMany.mockResolvedValue({ items: mockContentTypes });

    render(<ConfigScreen />);

    await selectContentType('Blog Post', 0);
    await selectContentType('Article', 1);

    const result = await act(async () => {
      return await saveAppInstallation();
    });

    expect(createContentTypes).toHaveBeenCalledWith(mockSdk, false);
    expect(result).toEqual({
      parameters: {
        enableVanityUrl: false,
        redirectFromContentTypes: [{ id: 'blogPost', name: 'Blog Post' }],
        redirectToContentTypes: [{ id: 'article', name: 'Article' }],
      },
      targetState: {
        EditorInterface: {
          blogPost: { sidebar: { position: 0 } },
          article: { sidebar: { position: 0 } },
        },
      },
    });
  });

  it('deduplicates content type IDs in EditorInterface when same type selected for FROM and TO', async () => {
    mockCma.contentType.getMany.mockResolvedValue({ items: mockContentTypes });

    render(<ConfigScreen />);

    await selectContentType('Blog Post', 0);
    await selectContentType('Blog Post', 1);

    const result = await act(async () => {
      return await saveAppInstallation();
    });

    expect(result).toEqual({
      parameters: {
        enableVanityUrl: false,
        redirectFromContentTypes: [{ id: 'blogPost', name: 'Blog Post' }],
        redirectToContentTypes: [{ id: 'blogPost', name: 'Blog Post' }],
      },
      targetState: {
        EditorInterface: {
          blogPost: { sidebar: { position: 0 } },
        },
      },
    });
  });

  it('returns false and shows error notification when content type creation fails', async () => {
    mockCma.contentType.getMany.mockResolvedValue({ items: mockContentTypes });
    (createContentTypes as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Creation failed')
    );

    render(<ConfigScreen />);

    await selectContentType('Blog Post', 0);
    await selectContentType('Article', 1);

    const result = await act(async () => {
      return await saveAppInstallation();
    });

    expect(result).toBe(false);
    expect(mockSdk.notifier.error).toHaveBeenCalledWith(
      'Failed to create required content types. Please try again.'
    );
  });

  it('saves enableVanityUrl and passes it to createContentTypes when enabled', async () => {
    mockCma.contentType.getMany.mockResolvedValue({ items: mockContentTypes });

    render(<ConfigScreen />);

    const vanitySwitch = screen.getByRole('switch', {
      name: 'Enable Vanity URL content type',
    });
    await userEvent.click(vanitySwitch);

    await selectContentType('Blog Post', 0);
    await selectContentType('Article', 1);

    const result = await act(async () => {
      return await saveAppInstallation();
    });

    expect(createContentTypes).toHaveBeenCalledWith(mockSdk, true);
    expect(result).toMatchObject({
      parameters: {
        enableVanityUrl: true,
      },
    });
  });

  it('restores previously saved parameters on mount', async () => {
    mockSdk.app.getParameters.mockResolvedValue({
      enableVanityUrl: true,
      redirectFromContentTypes: [{ id: 'blogPost', name: 'Blog Post' }],
      redirectToContentTypes: [{ id: 'article', name: 'Article' }],
    });
    mockCma.contentType.getMany.mockResolvedValue({ items: mockContentTypes });

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('pill-Blog Post')).toBeInTheDocument();
      expect(screen.getByTestId('pill-Article')).toBeInTheDocument();
    });

    const vanitySwitch = screen.getByRole('switch', {
      name: 'Enable Vanity URL content type',
    });
    expect(vanitySwitch).toBeChecked();
  });

  it('excludes redirect-managed content types from selection lists', async () => {
    mockCma.contentType.getMany.mockResolvedValue({
      items: [
        ...mockContentTypes,
        { sys: { id: 'redirectAppRedirect' }, name: 'Redirect' },
        { sys: { id: 'redirectAppVanityUrl' }, name: 'Vanity URL Managed' },
      ],
    });

    render(<ConfigScreen />);

    await openMultiselect(0);

    expect(await screen.findByRole('checkbox', { name: 'Blog Post' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Redirect' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Vanity URL Managed' })).not.toBeInTheDocument();
  });
});
