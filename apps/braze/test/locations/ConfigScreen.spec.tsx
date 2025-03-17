import { fireEvent, screen, render, cleanup, RenderResult } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import ConfigScreen, { BRAZE_DOCUMENTATION } from '../../src/locations/ConfigScreen';
import userEvent from '@testing-library/user-event';
import { queries } from '@testing-library/dom';
import React from 'react';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

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
      expect(brazeLink.closest('a')?.getAttribute('href')).toBe(BRAZE_DOCUMENTATION);
    });

    it('renders the link to manage api keys', () => {
      const brazeLink = configScreen.getByText('Manage API');

      expect(brazeLink).toBeTruthy();
      expect(brazeLink.closest('a')?.getAttribute('href')).toBe(
        `https://app.contentful.com/spaces/${mockSdk.spaceId}/api/keys`
      );
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

  describe('installation', () => {
    it('when installed the api key is set correctly', async () => {
      const user = userEvent.setup();

      const apiKeyInput = screen.getAllByTestId('apiKey')[0];
      await user.type(apiKeyInput, 'valid-api-key-123');
      const result = await saveAppInstallation();

      expect(result).toEqual({
        parameters: { apiKey: 'valid-api-key-123' },
      });
    });
  });
});
