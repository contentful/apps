import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest';
import { mockSdk } from './mocks';
import ConfigScreen from '../src/locations/ConfigScreen';
import { OnConfigureHandlerReturn } from '@contentful/app-sdk';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

async function saveAppInstallation() {
  return await mockSdk.app.onConfigure.mock.calls.at(-1)?.[0]();
}

describe('Config Screen component', () => {
  beforeAll(() => {
    mockSdk.cma.contentType.getMany.mockResolvedValue({
      items: [
        {
          sys: { id: 'blog-post' },
          name: 'Blog Post',
          fields: [
            { id: 'title', name: 'Title', type: 'Text' },
            { id: 'content', name: 'Content', type: 'Text' },
          ],
        },
        {
          sys: { id: 'article' },
          name: 'Article',
          fields: [
            { id: 'title', name: 'Title', type: 'Text' },
            { id: 'body', name: 'Body', type: 'Text' },
          ],
        },
        {
          sys: { id: 'page' },
          name: 'Page',
          fields: [
            { id: 'title', name: 'Title', type: 'Text' },
            { id: 'description', name: 'Description', type: 'Text' },
          ],
        },
      ],
      total: 3,
    });

    mockSdk.notifier = {
      error: vi.fn(),
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.app.getParameters.mockResolvedValue({});
    mockSdk.app.getCurrentState.mockResolvedValue({});
    mockSdk.app.onConfigure.mockImplementation(
      (callback: () => Promise<OnConfigureHandlerReturn>) => {
        mockSdk.app.onConfigureCallback = callback;
      }
    );
  });

  it('should display the main heading and description', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText('Set up Locale Field Populator')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        /Save time localizing content by instantly copying field values across locales with the Locale Field Populator app/
      )
    ).toBeInTheDocument();
  });

  it('should display the content types multiselect', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    expect(screen.getByText('Content types')).toBeInTheDocument();
    expect(screen.getByText('Select one or more')).toBeInTheDocument();
  });

  it('should display the assign content types section', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    expect(
      screen.getByText(
        "Select the content type(s) you want to use with Locale Field Populator. You can change this anytime by navigating to the 'Sidebar' tab in your content model."
      )
    ).toBeInTheDocument();
  });

  it('should restore selected content types from saved state', async () => {
    mockSdk.app.getCurrentState.mockResolvedValue({
      EditorInterface: {
        'blog-post': {
          sidebar: { position: 1 },
        },
        article: {
          sidebar: { position: 1 },
        },
      },
    });

    await act(async () => {
      render(<ConfigScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText('Content types')).toBeInTheDocument();
    });

    expect(screen.getByTestId('pill-Blog-Post')).toBeInTheDocument();
    expect(screen.getByTestId('pill-Article')).toBeInTheDocument();
  });

  it('should reset content types when none are selected', async () => {
    mockSdk.app.getCurrentState.mockResolvedValue({
      EditorInterface: {
        'existing-content-type': {
          sidebar: { position: 1 },
        },
      },
    });

    await act(async () => {
      render(<ConfigScreen />);
    });

    await waitFor(() => {
      expect(screen.getByText('Content types')).toBeInTheDocument();
    });

    await act(async () => {
      const result = await saveAppInstallation();

      expect(result?.targetState.EditorInterface).toEqual({});
    });
  });
});
