import { fireEvent, screen, render, cleanup, RenderResult } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import ConfigScreen, {
  BRAZE_APP_DOCUMENTATION,
  BRAZE_CONNECTED_CONTENT_DOCUMENTATION,
  CONTENT_TYPE_DOCUMENTATION,
} from '../../src/locations/ConfigScreen';
import userEvent from '@testing-library/user-event';
import { queries } from '@testing-library/dom';
import React from 'react';

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
    it('renders the braze link correctly', () => {
      const brazeLink = configScreen.getByText("Braze's Connected Content feature");

      expect(brazeLink).toBeTruthy();
      expect(brazeLink.closest('a')?.getAttribute('href')).toBe(
        BRAZE_CONNECTED_CONTENT_DOCUMENTATION
      );
    });

    it('renders the link to manage api keys', () => {
      const brazeLink = configScreen.getByText('Manage API Keys');

      expect(brazeLink).toBeTruthy();
      expect(brazeLink.closest('a')?.getAttribute('href')).toBe(
        `https://app.contentful.com/spaces/${mockSdk.spaceId}/api/keys`
      );
    });

    it('renders the braze app link correctly', () => {
      const brazeLink = configScreen.getByTestId(BRAZE_APP_DOCUMENTATION);

      expect(brazeLink).toBeTruthy();
      expect(brazeLink.closest('a')?.getAttribute('href')).toBe(BRAZE_APP_DOCUMENTATION);
    });

    it('renders the braze app link correctly', () => {
      const brazeLink = configScreen.getByTestId(CONTENT_TYPE_DOCUMENTATION);

      expect(brazeLink).toBeTruthy();
      expect(brazeLink.closest('a')?.getAttribute('href')).toBe(CONTENT_TYPE_DOCUMENTATION);
    });

    it('has an input that sets api key correctly', () => {
      const input = screen.getAllByTestId('apiKey')[0];
      fireEvent.change(input, {
        target: { value: `A test value for input` },
      });

      const inputExpected = screen.getAllByTestId('apiKey')[0] as HTMLInputElement;
      expect(inputExpected.value).toEqual(`A test value for input`);
    });
  });

  describe('installation ', () => {
    it('sets the parameters correctly if the api key is valid', async () => {
      const user = userEvent.setup();
      const apiKeyInput = screen.getAllByTestId('apiKey')[0];
      await user.type(apiKeyInput, 'valid-api-key-123');
      vi.spyOn(window, 'fetch').mockImplementationOnce((): any => {
        return { ok: true, status: 200 };
      });

      const result = await saveAppInstallation();

      expect(result).toEqual({
        parameters: { apiKey: 'valid-api-key-123' },
      });
    });

    it('shows a toast error if the api key is invalid', async () => {
      const user = userEvent.setup();
      const apiKeyInput = screen.getAllByTestId('apiKey')[0];
      await user.type(apiKeyInput, 'invalid-api-key-123');
      vi.spyOn(window, 'fetch').mockImplementationOnce((): any => {
        return { ok: false, status: 401 };
      });

      await saveAppInstallation();

      expect(mockSdk.notifier.error).toHaveBeenCalledWith('A valid Contentful API key is required');
    });
  });
});
