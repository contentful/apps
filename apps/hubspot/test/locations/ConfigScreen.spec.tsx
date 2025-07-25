import { cleanup, render, screen, act } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { mockCma, mockSdk } from '../mocks';
import ConfigScreen, { EMPTY_MESSAGE } from '../../src/locations/ConfigScreen';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

async function saveAppInstallation() {
  return await mockSdk.app.onConfigure.mock.calls.at(-1)[0]();
}

const selectContentTypes = async (user: UserEvent, contentTypeName: string | RegExp) => {
  const autocomplete = await screen.findByText('Select one or more');
  await user.click(autocomplete);
  const checkbox = await screen.findByRole('checkbox', { name: contentTypeName });
  await user.click(checkbox);
};

const fillInHubspotAccessToken = async (user: UserEvent, value: string) => {
  const hubspotAccessTokenInput = await screen.findByPlaceholderText('Enter your access token');
  await user.clear(hubspotAccessTokenInput);
  await user.type(hubspotAccessTokenInput, value);
};

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
  });

  afterEach(() => {
    cleanup();
  });

  describe('components', () => {
    it('renders the main heading and description', async () => {
      render(<ConfigScreen />);

      expect(await screen.findByRole('heading', { name: /Set up Hubspot/i })).toBeTruthy();
      expect(
        screen.getByText(/Seamlessly sync Contentful entry content to email campaigns in Hubspot/i)
      ).toBeTruthy();
    });

    it('renders the Configure access section and input', async () => {
      render(<ConfigScreen />);

      expect(await screen.findByText(/Configure access/i)).toBeTruthy();
      expect(
        screen.getByText(
          /To connect your organization's Hubspot account, enter the private app access token/i
        )
      ).toBeTruthy();
      expect(screen.getByLabelText(/Private app access token/i)).toBeTruthy();
      expect(screen.getByPlaceholderText(/Enter your access token/i)).toBeTruthy();
    });

    it('shows a toast error if the hubspot api key is not set', async () => {
      render(<ConfigScreen />);
      expect(await screen.findByPlaceholderText(/Enter your access token/i)).toBeTruthy();

      const input = screen.getByPlaceholderText(/Enter your access token/i);
      expect(input).toHaveValue('');
      await act(async () => {
        await saveAppInstallation();
      });

      expect(mockSdk.notifier.error).toHaveBeenCalledWith(EMPTY_MESSAGE);
    });

    it('renders the external link with icon', async () => {
      render(<ConfigScreen />);
      expect(await screen.findByLabelText('Expand instructions')).toBeTruthy();
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
      render(<ConfigScreen />);

      expect(await screen.findByText('Select one or more')).toBeTruthy();
    });

    it('renders the Getting started section with all steps and images', async () => {
      render(<ConfigScreen />);

      expect(await screen.findByText('Getting started')).toBeTruthy();
      expect(
        screen.getByText(
          '1. After you install the app, you can sync content from the entry editor sidebar.'
        )
      ).toBeTruthy();
      expect(
        screen.getByText('2. You can manage all synced content from the app’s full page location.')
      ).toBeTruthy();
      expect(
        screen.getByText(
          '3. In Hubspot, synced content will appear as modules within the Design manager, and within the Email editor.'
        )
      ).toBeTruthy();

      // Check for all three images by alt text
      expect(screen.getByAltText('Contentful Sidebar with sync button')).toBeTruthy();
      expect(screen.getByAltText('Contentful Page view with table of synced content')).toBeTruthy();
      expect(screen.getByAltText('Hubspot Design manager with synced modules')).toBeTruthy();
    });
  });

  describe('Content type installation', () => {
    it('adds and removes app from sidebar for each content type', async () => {
      render(<ConfigScreen />);
      expect(await screen.findByText('Select one or more')).toBeTruthy();
      const user = userEvent.setup();
      await fillInHubspotAccessToken(user, 'valid-token');

      // adding the app for the content type
      await selectContentTypes(user, 'Blog Post');
      const closeButton = await screen.findByLabelText('Close');
      const pill = closeButton.parentElement;
      expect(pill).toHaveTextContent('Blog Post');

      const saveAddingContentType = await act(async () => {
        return await saveAppInstallation();
      });
      expect(saveAddingContentType.targetState.EditorInterface).toEqual({
        blogPost: {
          sidebar: { position: 0 },
        },
      });

      // removing the app from the content type
      await user.click(closeButton);

      const saveRemovingContentType = await act(async () => {
        return await saveAppInstallation();
      });
      expect(saveRemovingContentType.targetState.EditorInterface).toEqual({});
    });
  });

  describe('HubSpot access token validation', () => {
    it('shows the input as required', async () => {
      render(<ConfigScreen />);
      expect(await screen.findByPlaceholderText(/Enter your access token/i)).toBeTruthy();

      const input = screen.getByPlaceholderText(/Enter your access token/i);
      expect(input).toBeRequired();
    });

    it('blocks saving and shows error if the access token is empty', async () => {
      render(<ConfigScreen />);
      expect(await screen.findByPlaceholderText(/Enter your access token/i)).toBeTruthy();
      const user = userEvent.setup();

      const result = await act(async () => {
        return await saveAppInstallation();
      });

      expect(result).toBe(false);
      expect(mockSdk.notifier.error).toHaveBeenCalledWith('Some fields are missing');
    });

    it('allows saving if the access token is valid', async () => {
      render(<ConfigScreen />);
      expect(await screen.findByPlaceholderText(/Enter your access token/i)).toBeTruthy();
      const user = userEvent.setup();

      await fillInHubspotAccessToken(user, 'valid-token');
      const result = await act(async () => {
        return await saveAppInstallation();
      });

      expect(result).not.toBe(false);
      expect(mockSdk.notifier.error).not.toHaveBeenCalled();
    });
  });

  describe('createContentType', () => {
    it('creates content type and entry if they do not exist', async () => {
      render(<ConfigScreen />);
      expect(await screen.findByPlaceholderText(/Enter your access token/i)).toBeTruthy();
      const user = userEvent.setup();
      await fillInHubspotAccessToken(user, 'valid-token');

      await saveAppInstallation();

      expect(mockCma.contentType.createWithId).toHaveBeenCalled();
      expect(mockCma.contentType.publish).toHaveBeenCalled();
      expect(mockCma.entry.createWithId).toHaveBeenCalled();
    });

    it('does not create content type if it already exists', async () => {
      render(<ConfigScreen />);
      expect(await screen.findByPlaceholderText(/Enter your access token/i)).toBeTruthy();
      // Mock content type and entry creation to throw VersionMismatch error
      const versionMismatchError = { code: 'VersionMismatch' };
      mockCma.contentType.createWithId.mockResolvedValue(versionMismatchError);
      mockCma.contentType.publish.mockResolvedValue(versionMismatchError);
      mockCma.entry.createWithId.mockResolvedValue(versionMismatchError);
      const user = userEvent.setup();
      await fillInHubspotAccessToken(user, 'valid-token');

      await saveAppInstallation();

      expect(mockCma.contentType.createWithId).toHaveBeenCalled();
      expect(mockCma.contentType.publish).toHaveBeenCalled();
      expect(mockCma.entry.createWithId).toHaveBeenCalled();
      expect(mockSdk.notifier.error).not.toHaveBeenCalled();
    });
  });
});
