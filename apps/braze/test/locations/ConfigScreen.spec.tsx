import { cleanup, fireEvent, render, RenderResult, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import ConfigScreen from '../../src/locations/ConfigScreen';
import userEvent from '@testing-library/user-event';
import { queries } from '@testing-library/dom';
import React from 'react';
import {
  BRAZE_API_KEY_DOCUMENTATION,
  BRAZE_APP_DOCUMENTATION,
  BRAZE_CONTENT_BLOCK_DOCUMENTATION,
  BRAZE_ENDPOINTS_LIST,
  CONTENT_TYPE_DOCUMENTATION,
} from '../../src/utils';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
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

describe('Config Screen component', () => {
  let configScreen: RenderResult<typeof queries, HTMLElement, HTMLElement>;
  beforeEach(() => {
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

    it('renders the braze api key link correctly', () => {
      const brazeLink = configScreen.getByText('Braze REST API Keys page');

      expect(brazeLink).toBeTruthy();
      expect(brazeLink.closest('a')?.getAttribute('href')).toBe(BRAZE_API_KEY_DOCUMENTATION);
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
      expect(brazeLink.closest('a')?.getAttribute('href')).toBe(BRAZE_ENDPOINTS_LIST);
    });

    it('has an input that sets contentful api key correctly', () => {
      const input = screen.getAllByTestId('contentfulApiKey')[0];
      fireEvent.change(input, {
        target: { value: `A test value for input` },
      });

      const inputExpected = screen.getAllByTestId('contentfulApiKey')[0] as HTMLInputElement;
      expect(inputExpected.value).toEqual(`A test value for input`);
    });

    it('has an input that sets braze api key correctly', () => {
      const input = screen.getAllByTestId('brazeApiKey')[0];
      fireEvent.change(input, {
        target: { value: `A test value for input` },
      });

      const inputExpected = screen.getAllByTestId('brazeApiKey')[0] as HTMLInputElement;
      expect(inputExpected.value).toEqual(`A test value for input`);
    });

    it('has an input that sets braze rest endpoint key correctly', () => {
      const input = screen.getAllByTestId('brazeEndpoint')[0];
      fireEvent.change(input, {
        target: { value: `A test value for input` },
      });

      const inputExpected = screen.getAllByTestId('brazeEndpoint')[0] as HTMLInputElement;
      expect(inputExpected.value).toEqual(`A test value for input`);
    });
  });

  describe('installation ', () => {
    it('sets the parameters correctly if the three inputs are set correctly', async () => {
      const user = userEvent.setup();
      const contentfulApiKeyInput = screen.getAllByTestId('contentfulApiKey')[0];
      const brazeApiKeyInput = screen.getAllByTestId('brazeApiKey')[0];
      const brazeEndpointInput = screen.getAllByTestId('brazeEndpoint')[0];
      await user.type(contentfulApiKeyInput, 'valid-api-key-123');
      await user.type(brazeApiKeyInput, 'valid-api-key-321');
      await user.type(brazeEndpointInput, 'valid-rest-endpoint-132');
      vi.spyOn(window, 'fetch').mockImplementationOnce((): any => {
        return { ok: true, status: 200 };
      });

      const result = await saveAppInstallation();

      expect(result).toEqual({
        parameters: {
          contentfulApiKey: 'valid-api-key-123',
          brazeApiKey: 'valid-api-key-321',
          brazeEndpoint: 'valid-rest-endpoint-132',
        },
      });
    });

    it('shows a toast error if the contentful api key is not set or invalid', async () => {
      const user = userEvent.setup();
      const contentfulApiKeyInput = screen.getAllByTestId('contentfulApiKey')[0];
      const brazeEndpointInput = screen.getAllByTestId('brazeEndpoint')[0];
      const brazeApiKeyInput = screen.getAllByTestId('brazeApiKey')[0];
      await user.type(brazeEndpointInput, 'valid-rest-endpoint-123');
      await user.type(brazeApiKeyInput, 'valid-api-key-123');
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
      const brazeEndpointInput = screen.getAllByTestId('brazeEndpoint')[0];
      await user.type(contentfulApiKeyInput, 'valid-api-key-123');
      await user.type(brazeEndpointInput, 'valid-rest-endpoint-123');
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
});
