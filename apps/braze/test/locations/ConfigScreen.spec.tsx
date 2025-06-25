import React from 'react';
import { cleanup, fireEvent, render, RenderResult, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockSdk } from '../mocks';
import ConfigScreen from '../../src/locations/ConfigScreen';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { queries, waitFor } from '@testing-library/dom';
import {
  BRAZE_API_KEY_DOCUMENTATION,
  BRAZE_APP_DOCUMENTATION,
  BRAZE_CONTENT_BLOCK_DOCUMENTATION,
  BRAZE_ENDPOINTS_DOCUMENTATION,
  BRAZE_ENDPOINTS,
  CONTENT_TYPE_DOCUMENTATION,
} from '../../src/utils';
import { createContentTypeResponse } from '../mocks/contentTypeResponse';

const mockCma = {
  contentType: {
    get: vi.fn(),
    createWithId: vi.fn(),
    publish: vi.fn(),
    getMany: vi.fn(),
  },
  entry: {
    createWithId: vi.fn(),
  },
  editorInterface: {
    get: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

vi.mock('./ConfigScreen', async () => {
  const actual: any = await vi.importActual('./ConfigScreen');

  return {
    ...actual,
    callContentful: vi.fn().mockResolvedValue({ ok: true, error: null }),
  };
});

async function saveAppInstallation() {
  return await mockSdk.app.onConfigure.mock.calls.at(-1)[0]();
}

const fillScreen = async (user?: UserEvent) => {
  user = user || userEvent.setup();
  const contentfulApiKeyInput = screen.getAllByTestId('contentfulApiKey')[0];
  const brazeApiKeyInput = screen.getAllByTestId('brazeApiKey')[0];
  const brazeEndpointSelect = screen.getByTestId('brazeEndpoint');

  await user.type(contentfulApiKeyInput, 'valid-api-key-123');
  await user.type(brazeApiKeyInput, 'valid-api-key-321');
  fireEvent.change(brazeEndpointSelect, { target: { value: BRAZE_ENDPOINTS[0].url } });

  vi.spyOn(window, 'fetch').mockImplementationOnce((): any => {
    return { ok: true, status: 200 };
  });
};

describe('Config Screen component', () => {
  let configScreen: RenderResult<typeof queries, HTMLElement, HTMLElement>;
  beforeEach(() => {
    vi.clearAllMocks();
    mockCma.contentType.getMany.mockResolvedValue({
      items: [
        { sys: { id: 'blogPost' }, name: 'Blog Post' },
        { sys: { id: 'article' }, name: 'Article' },
        { sys: { id: 'news' }, name: 'News' },
      ],
    });
    configScreen = render(<ConfigScreen />);
  });

  afterEach(() => {
    cleanup();
  });

  describe('components', () => {
    it('renders the braze app link correctly', () => {
      const brazeLink = configScreen.getByTestId('link-braze-app-docs-here');

      expect(brazeLink).toBeTruthy();
      expect(brazeLink.closest('a')?.getAttribute('href')).toBe(BRAZE_APP_DOCUMENTATION);
    });

    it('renders the link to contentful manage api keys', () => {
      const brazeLink = configScreen.getByText('Manage API Keys');

      expect(brazeLink).toBeTruthy();
      expect(brazeLink.closest('a')?.getAttribute('href')).toBe(
        `https://app.contentful.com/spaces/${mockSdk.spaceId}/api/keys`
      );
    });

    it('renders the braze content block link correctly', () => {
      const brazeLink = configScreen.getByText("Braze's Content Block feature");

      expect(brazeLink).toBeTruthy();
      expect(brazeLink.closest('a')?.getAttribute('href')).toBe(BRAZE_CONTENT_BLOCK_DOCUMENTATION);
    });

    it('renders the content type link correctly', () => {
      const brazeLink = configScreen.getByTestId('link-content-type-docs-here');

      expect(brazeLink).toBeTruthy();
      expect(brazeLink.closest('a')?.getAttribute('href')).toBe(CONTENT_TYPE_DOCUMENTATION);
    });

    it('renders the rest endpoint link correctly', () => {
      const brazeLink = configScreen.getByTestId('link-rest-endpoints-here');

      expect(brazeLink).toBeTruthy();
      expect(brazeLink.closest('a')?.getAttribute('href')).toBe(BRAZE_ENDPOINTS_DOCUMENTATION);
    });

    it('has an input that sets contentful api key correctly', () => {
      const input = screen.getAllByTestId('contentfulApiKey')[0];
      fireEvent.change(input, {
        target: { value: `A test value for input` },
      });

      const inputExpected = screen.getAllByTestId('contentfulApiKey')[0] as HTMLInputElement;
      expect(inputExpected.value).toEqual(`A test value for input`);
    });

    it('has an input that sets braze rest endpoint key correctly', async () => {
      const select = screen.getByTestId('brazeEndpoint');
      fireEvent.change(select, {
        target: { value: BRAZE_ENDPOINTS[0].url },
      });

      const selectExpected = screen.getByTestId('brazeEndpoint') as HTMLSelectElement;
      expect(selectExpected.value).toEqual(BRAZE_ENDPOINTS[0].url);
    });
  });

  describe('installation ', () => {
    it('sets the parameters correctly if the three inputs are set correctly', async () => {
      await fillScreen();

      const result = await saveAppInstallation();

      expect(result).toEqual({
        parameters: {
          contentfulApiKey: 'valid-api-key-123',
          brazeApiKey: 'valid-api-key-321',
          brazeEndpoint: BRAZE_ENDPOINTS[0].url,
        },
        targetState: {
          EditorInterface: {},
        },
      });
    });

    it('shows a toast error if the contentful api key is not set or invalid', async () => {
      const user = userEvent.setup();
      const contentfulApiKeyInput = screen.getAllByTestId('contentfulApiKey')[0];
      const brazeEndpointSelect = screen.getByTestId('brazeEndpoint');
      const brazeApiKeyInput = screen.getAllByTestId('brazeApiKey')[0];

      await user.type(brazeApiKeyInput, 'valid-api-key-123');
      fireEvent.change(brazeEndpointSelect, { target: { value: BRAZE_ENDPOINTS[0].url } });
      await user.type(contentfulApiKeyInput, 'invalid-api-key-123');

      vi.spyOn(window, 'fetch').mockImplementationOnce((): any => {
        return { ok: false, status: 401 };
      });

      await saveAppInstallation();

      expect(mockSdk.notifier.error).toHaveBeenCalledWith('Some fields are missing or invalid');
    });

    it('shows a toast error if the braze api key is not set', async () => {
      const user = userEvent.setup();
      const contentfulApiKeyInput = screen.getAllByTestId('contentfulApiKey')[0];
      const brazeEndpointSelect = screen.getByTestId('brazeEndpoint');

      await user.type(contentfulApiKeyInput, 'valid-api-key-123');
      fireEvent.change(brazeEndpointSelect, { target: { value: BRAZE_ENDPOINTS[0].url } });

      vi.spyOn(window, 'fetch').mockImplementationOnce((): any => {
        return { ok: true, status: 200 };
      });

      await saveAppInstallation();

      expect(mockSdk.notifier.error).toHaveBeenCalledWith('Some fields are missing or invalid');
    });

    it('shows a toast error if the braze rest endpoint is not set', async () => {
      const user = userEvent.setup();
      const contentfulApiKeyInput = screen.getAllByTestId('contentfulApiKey')[0];
      const brazeApiKeyInput = screen.getAllByTestId('brazeApiKey')[0];

      await user.type(contentfulApiKeyInput, 'valid-api-key-123');
      await user.type(brazeApiKeyInput, 'valid-api-key-123');

      vi.spyOn(window, 'fetch').mockImplementationOnce((): any => {
        return { ok: true, status: 200 };
      });

      await saveAppInstallation();

      expect(mockSdk.notifier.error).toHaveBeenCalledWith('Some fields are missing or invalid');
    });
  });

  describe('createContentType', () => {
    it('creates content type and entry if they do not exist', async () => {
      await fillScreen();
      mockCma.contentType.get.mockRejectedValueOnce(new Error('Content type not found'));

      await saveAppInstallation();

      expect(mockCma.contentType.createWithId).toHaveBeenCalled();
      expect(mockCma.contentType.publish).toHaveBeenCalled();
      expect(mockCma.entry.createWithId).toHaveBeenCalled();
    });

    it('does not create content type if it already exists', async () => {
      await fillScreen();
      mockCma.contentType.get.mockResolvedValueOnce({});

      await saveAppInstallation();

      expect(mockCma.contentType.createWithId).not.toHaveBeenCalled();
      expect(mockCma.contentType.publish).not.toHaveBeenCalled();
      expect(mockCma.entry.createWithId).not.toHaveBeenCalled();
    });
  });

  describe('Content type installation', () => {
    const selectContentTypes = async (user: UserEvent) => {
      const autocomplete = screen.getByPlaceholderText('Search');
      await user.click(autocomplete);
      await user.type(autocomplete, 'Blog');
      const option = await screen.findByText('Blog Post');
      await user.click(option);
    };

    it('loads and displays available content types', async () => {
      await fillScreen();
      const user = userEvent.setup();

      const autocomplete = screen.getByPlaceholderText('Search');
      await user.click(autocomplete);

      const blogPost = await screen.findByText('Blog Post');
      const article = await screen.findByText('Article');
      const news = await screen.findByText('News');

      expect(mockCma.contentType.getMany).toHaveBeenCalled();
      expect(blogPost).toBeTruthy();
      expect(article).toBeTruthy();
      expect(news).toBeTruthy();
    });

    it('adds app to sidebar for each content type', async () => {
      mockCma.editorInterface.get.mockResolvedValueOnce({
        sidebar: [],
        sys: { contentType: { sys: { id: 'blogPost' } } },
      });
      mockCma.editorInterface.update.mockResolvedValueOnce({});

      await fillScreen();
      const user = userEvent.setup();
      await fillScreen(user);
      await selectContentTypes(user);
      await waitFor(() => expect(screen.getByTestId('pill-blogPost')).toBeTruthy());

      const result = await saveAppInstallation();

      expect(mockCma.editorInterface.get).toHaveBeenCalledWith({ contentTypeId: 'blogPost' });
      expect(mockCma.editorInterface.update).toHaveBeenCalledWith(
        { contentTypeId: 'blogPost' },
        expect.objectContaining({
          sidebar: expect.arrayContaining([
            expect.objectContaining({
              widgetId: mockSdk.ids.app,
              widgetNamespace: 'app',
              settings: { position: 0 },
            }),
          ]),
        })
      );

      expect(result.targetState.EditorInterface).toEqual({
        blogPost: {
          sidebar: { position: 0 },
        },
      });
    });

    it('handles errors when adding app to sidebar', async () => {
      const user = userEvent.setup();
      await fillScreen(user);
      await selectContentTypes(user);
      await waitFor(() => expect(screen.getByTestId('pill-blogPost')).toBeTruthy());

      mockCma.editorInterface.get.mockRejectedValueOnce(
        new Error('Failed to get editor interface')
      );

      await saveAppInstallation();

      expect(mockSdk.notifier.error).toHaveBeenCalledWith(
        'Failed to add app to sidebar for content type blogPost'
      );
    });
  });
});
