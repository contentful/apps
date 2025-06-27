import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import ConfigScreen from '../../src/locations/ConfigScreen';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

async function saveAppInstallation() {
  return await mockSdk.app.onConfigure.mock.calls.at(-1)[0]();
}

describe('Hubspot Config Screen ', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCma.contentType.getMany.mockResolvedValue({
      items: [
        { sys: { id: 'blogPost' }, name: 'Blog Post' },
        { sys: { id: 'article' }, name: 'Article' },
        { sys: { id: 'news' }, name: 'News' },
      ],
      total: 3,
      skip: 0,
      limit: 100,
      sys: { type: 'Array' },
    });
    mockSdk.app.getCurrentState.mockResolvedValue({
      EditorInterface: {},
    });
    render(<ConfigScreen />);
  });

  afterEach(() => {
    cleanup();
  });

  describe('components', () => {
    it('renders the main heading and description', () => {
      expect(screen.getByRole('heading', { name: /Set up Hubspot/i })).toBeTruthy();
      expect(
        screen.getByText(/Seamlessly sync Contentful entry content to email campaigns in Hubspot/i)
      ).toBeTruthy();
    });

    it('renders the Configure access section and input', () => {
      expect(screen.getByText(/Configure access/i)).toBeTruthy();
      expect(
        screen.getByText(
          /To connect your organization's Hubspot account, enter the private app access token/i
        )
      ).toBeTruthy();
      expect(screen.getByLabelText(/Private app access token/i)).toBeTruthy();
      expect(screen.getByPlaceholderText(/Enter your access token/i)).toBeTruthy();
    });

    it('shows a toast error if the hubspot api key is not set', async () => {
      const input = screen.getByPlaceholderText(/Enter your access token/i);
      expect(input).toHaveValue('');

      await saveAppInstallation();

      expect(mockSdk.notifier.error).toHaveBeenCalledWith('Some fields are missing or invalid');
    });

    it('renders the external link with icon', async () => {
      const user = userEvent.setup();
      const expandButton = screen.getByLabelText('Expand instructions');
      await user.click(expandButton);

      const link = await screen.findByRole('link', {
        name: /Read about creating private apps in Hubspot/i,
      });

      expect(link).toBeTruthy();
      expect(link).toHaveAttribute('href');
      expect(link.querySelector('svg')).toBeTruthy();
    });

    it('renders the content type multi-select', async () => {
      expect(await screen.findByText('Select one or more')).toBeTruthy();
    });
  });

  describe('Content type installation', () => {
    const selectContentTypes = async (user: UserEvent, contentTypeName: string | RegExp) => {
      const autocomplete = await screen.findByText('Select one or more');
      await user.click(autocomplete);
      const checkbox = await screen.findByRole('checkbox', { name: contentTypeName });
      await user.click(checkbox);
    };

    const fillInHubspotAccessToken = async (user: UserEvent) => {
      const hubspotAccessTokenInput = await screen.findByPlaceholderText('Enter your access token');
      await user.type(hubspotAccessTokenInput, 'valid-api-key-123');
    };

    it('adds and removes app from sidebar for each content type', async () => {
      const user = userEvent.setup();
      // Always mock the token validation as valid for this test
      mockCma.appActionCall.createWithResponse.mockResolvedValue({
        response: { body: JSON.stringify({ valid: true, hasContentScope: true }) },
      });
      await fillInHubspotAccessToken(user);

      // adding the app for the content type
      await selectContentTypes(user, 'Blog Post');
      const closeButton = await screen.findByLabelText('Close');
      const pill = closeButton.parentElement;
      expect(pill).toHaveTextContent('Blog Post');

      const saveAddingContentType = await saveAppInstallation();
      expect(saveAddingContentType.targetState.EditorInterface).toEqual({
        blogPost: {
          sidebar: { position: 0 },
        },
      });

      // removing the app from the content type
      await user.click(closeButton);

      const saveRemovingContentType = await saveAppInstallation();
      expect(saveRemovingContentType.targetState.EditorInterface).toEqual({});
    });
  });

  describe('HubSpot access token validation', () => {
    const fillInHubspotAccessToken = async (user: UserEvent, value: string) => {
      const hubspotAccessTokenInput = await screen.findByPlaceholderText('Enter your access token');
      await user.clear(hubspotAccessTokenInput);
      await user.type(hubspotAccessTokenInput, value);
    };

    it('shows the input as required', () => {
      const input = screen.getByPlaceholderText(/Enter your access token/i);
      expect(input).toBeRequired();
    });

    it('blocks saving and shows error if the access token is invalid', async () => {
      const user = userEvent.setup();
      mockCma.appActionCall.createWithResponse.mockResolvedValueOnce({
        response: { body: JSON.stringify({ valid: false, hasContentScope: false }) },
      });

      await fillInHubspotAccessToken(user, 'invalid-token');
      const result = await saveAppInstallation();

      expect(result).toBe(false);
      expect(mockSdk.notifier.error).toHaveBeenCalledWith('Invalid HubSpot access token');
    });

    it('blocks saving and shows error if the access token is missing the content scope', async () => {
      const user = userEvent.setup();
      mockCma.appActionCall.createWithResponse.mockResolvedValueOnce({
        response: { body: JSON.stringify({ valid: true, hasContentScope: false }) },
      });

      await fillInHubspotAccessToken(user, 'token-without-content-scope');
      const result = await saveAppInstallation();

      expect(result).toBe(false);
      expect(mockSdk.notifier.error).toHaveBeenCalledWith(
        'The HubSpot token is missing the required "content" scope.'
      );
    });

    it('allows saving if the access token is valid and has content scope', async () => {
      const user = userEvent.setup();
      mockCma.appActionCall.createWithResponse.mockResolvedValueOnce({
        response: { body: JSON.stringify({ valid: true, hasContentScope: true }) },
      });

      await fillInHubspotAccessToken(user, 'valid-token');
      const result = await saveAppInstallation();

      expect(result).not.toBe(false);
      // Should not show error
      expect(mockSdk.notifier.error).not.toHaveBeenCalledWith('Invalid HubSpot access token');
      expect(mockSdk.notifier.error).not.toHaveBeenCalledWith(
        'The HubSpot token is missing the required "content" scope.'
      );
    });
  });
});
