import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConfigScreen from '../src/locations/ConfigScreen';
import { VALIDATION_MESSAGES } from '../src/const';
import { mockCma, mockSdk } from './mocks/mockSdk';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => ({ ...mockSdk, cma: mockCma }),
}));

vi.mock('../src/components/ContentTypeMultiSelect', () => ({
  default: ({
    availableContentTypes,
    isDisabled,
  }: {
    availableContentTypes: Array<{ id: string; name: string }>;
    isDisabled?: boolean;
  }) => {
    return (
      <div>
        <button type="button" disabled={isDisabled}>
          Select content type
        </button>
        <div data-test-id="available-content-types">
          {availableContentTypes.map((contentType) => contentType.name).join(', ')}
        </div>
      </div>
    );
  },
}));

async function renderAndWaitReady() {
  render(<ConfigScreen />);
  await waitFor(() => {
    expect(mockSdk.app.setReady).toHaveBeenCalled();
  });
}

describe('Asana ConfigScreen', () => {
  let isConnected = false;

  beforeEach(() => {
    vi.clearAllMocks();
    isConnected = false;
    mockSdk.app.getParameters.mockResolvedValue(null);
    mockSdk.app.isInstalled.mockResolvedValue(true);
    mockSdk.app.getCurrentState.mockResolvedValue({ EditorInterface: {} });
    mockCma.contentType.getMany.mockResolvedValue({
      items: [
        {
          sys: { id: 'blogPost' },
          name: 'Blog Post',
        },
      ],
    });
    mockCma.contentType.get.mockRejectedValue(new Error('not found'));
    mockCma.appActionCall.createWithResponse.mockImplementation(({ appActionId }) => {
      if (appActionId === 'checkStatusAction') {
        return Promise.resolve({
          response: { body: JSON.stringify({ connected: isConnected }) },
        });
      }

      if (appActionId === 'initiateOauthAction') {
        return Promise.resolve({
          response: {
            body: JSON.stringify({ authorizationUrl: 'https://app.asana.com/-/oauth_authorize' }),
          },
        });
      }

      if (appActionId === 'disconnectAction') {
        isConnected = false;
        return Promise.resolve({
          response: {
            body: JSON.stringify({ success: true, message: VALIDATION_MESSAGES.oauthDisconnected }),
          },
        });
      }

      if (appActionId === 'getAsanaWorkspacesAction') {
        return Promise.resolve({
          response: {
            body: JSON.stringify({
              workspaces: [{ gid: 'workspace-1', name: 'Marketing workspace' }],
            }),
          },
        });
      }

      if (appActionId === 'getAsanaProjectsAction') {
        return Promise.resolve({
          response: {
            body: JSON.stringify({
              projects: [{ gid: 'project-1', name: 'Launch project' }],
            }),
          },
        });
      }

      return Promise.reject(new Error(`Unhandled app action ${appActionId}`));
    });
  });

  it('shows a Connect to Asana button and a Not connected badge when not connected', async () => {
    await renderAndWaitReady();

    expect(screen.getByText('Set up the Asana app')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect to Asana' })).toBeInTheDocument();
    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });

  it('requires a connection before configuring', async () => {
    await renderAndWaitReady();

    const callback = mockSdk.app.onConfigure.mock.calls.at(-1)?.[0];
    const result = callback ? await callback() : undefined;

    expect(result).toBe(false);
    expect(mockSdk.notifier.error).toHaveBeenCalledWith(VALIDATION_MESSAGES.connectionRequired);
  });

  it('shows a Connected badge and hydrates workspaces when already connected', async () => {
    isConnected = true;
    mockSdk.app.getParameters.mockResolvedValue({
      defaultWorkspaceGid: '',
      defaultWorkspaceName: '',
      defaultProjectGid: '',
      defaultProjectName: '',
    });

    await renderAndWaitReady();

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Marketing workspace' })).toBeInTheDocument();
    });
  });

  it('loads available content types into the selector', async () => {
    await renderAndWaitReady();

    await waitFor(() => {
      expect(screen.getByTestId('available-content-types')).toHaveTextContent('Blog Post');
    });
  });

  it('persists enabled content type ids and creates the task link content type on configure when connected', async () => {
    isConnected = true;
    mockSdk.app.getParameters.mockResolvedValue({
      defaultWorkspaceGid: '',
      defaultWorkspaceName: '',
      defaultProjectGid: '',
      defaultProjectName: '',
      enabledContentTypeIds: ['blogPost'],
    });

    await renderAndWaitReady();

    const callback = mockSdk.app.onConfigure.mock.calls.at(-1)?.[0];
    const result = callback ? await callback() : undefined;

    expect(mockCma.contentType.createWithId).toHaveBeenCalledWith(
      expect.objectContaining({ contentTypeId: 'asanaTaskLink' }),
      expect.objectContaining({ name: 'Asana Integration (do not delete)' })
    );
    expect(result).toMatchObject({
      parameters: {
        enabledContentTypeIds: JSON.stringify(['blogPost']),
      },
    });
  });

  it('shows a note explaining the app will create the Asana Integration content type', async () => {
    await renderAndWaitReady();

    expect(screen.getByText(/Asana Integration \(do not delete\)/)).toBeInTheDocument();
  });

  it('opens an OAuth popup when Connect to Asana is clicked', async () => {
    const popup = { closed: false, close: vi.fn(), location: { href: '' } };
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);

    await renderAndWaitReady();

    fireEvent.click(screen.getByRole('button', { name: 'Connect to Asana' }));

    // The popup is opened synchronously (blank) in direct response to the click, since some
    // browsers only allow window.open() to navigate when called from a user gesture. The real
    // authorization URL is set on popup.location.href once the initiateOauthAction resolves.
    expect(openSpy).toHaveBeenCalledWith('', 'asana-oauth', 'width=600,height=700');

    await waitFor(() => {
      expect(mockCma.appActionCall.createWithResponse).toHaveBeenCalledWith(
        expect.objectContaining({ appActionId: 'initiateOauthAction' }),
        expect.anything()
      );
    });
    await waitFor(() => {
      expect(popup.location.href).toBe('https://app.asana.com/-/oauth_authorize');
    });

    openSpy.mockRestore();
  });

  it('disconnects from Asana when Disconnect is clicked', async () => {
    isConnected = true;
    mockSdk.app.getParameters.mockResolvedValue({
      defaultWorkspaceGid: 'workspace-1',
      defaultWorkspaceName: 'Marketing workspace',
      defaultProjectGid: 'project-1',
      defaultProjectName: 'Launch project',
    });

    await renderAndWaitReady();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => {
      expect(mockSdk.notifier.success).toHaveBeenCalledWith(VALIDATION_MESSAGES.oauthDisconnected);
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Connect to Asana' })).toBeInTheDocument();
    });
  });
});
