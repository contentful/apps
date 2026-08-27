import { render, screen, waitFor } from '@testing-library/react';
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
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.app.getParameters.mockResolvedValue(null);
    mockSdk.app.isInstalled.mockResolvedValue(true);
    mockSdk.app.getCurrentState.mockResolvedValue({ EditorInterface: {} });
    mockCma.contentType.getMany.mockResolvedValue({
      items: [
        {
          sys: { id: 'blogPost' },
          name: 'Blog Post',
          fields: [
            { id: 'asanaTaskGid', name: 'Asana Task GID', type: 'Symbol' },
            { id: 'asanaTaskUrl', name: 'Asana Task URL', type: 'Symbol' },
            { id: 'asanaTaskName', name: 'Asana Task Name', type: 'Symbol' },
          ],
        },
      ],
    });
    mockCma.appActionCall.createWithResponse.mockImplementation(({ appActionId }) => {
      if (appActionId === 'validateAsanaCredentialsAction') {
        return Promise.resolve({
          response: {
            body: JSON.stringify({ valid: true, message: VALIDATION_MESSAGES.validCredentials }),
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

  it('renders OAuth credential fields, connect button, and test connection button', async () => {
    await renderAndWaitReady();

    expect(screen.getByText('Set up the Asana app')).toBeInTheDocument();
    expect(screen.getAllByTestId('cf-ui-text-input')).toHaveLength(2);
    expect(document.getElementById('oauthClientId')).toBeInTheDocument();
    expect(document.getElementById('oauthClientSecret')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect to Asana' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Test connection' })).toBeInTheDocument();
  });

  it('requires a token on configure', async () => {
    await renderAndWaitReady();

    const callback = mockSdk.app.onConfigure.mock.calls.at(-1)?.[0];
    const result = callback ? await callback() : undefined;

    expect(result).toBe(false);
    await waitFor(() => {
      expect(mockSdk.notifier.error).toHaveBeenCalledWith(VALIDATION_MESSAGES.saveRequired);
    });
    expect(await screen.findByText(VALIDATION_MESSAGES.tokenRequired)).toBeInTheDocument();
  });

  it('hydrates saved workspaces for a configured token', async () => {
    mockSdk.app.getParameters.mockResolvedValue({
      oauthClientId: 'client-1',
      oauthClientSecret: 'secret-1',
      oauthRefreshToken: 'refresh-123',
      oauthRedirectUri: 'https://example.com/?oauthCallback=1',
      defaultWorkspaceGid: '',
      defaultWorkspaceName: '',
      defaultProjectGid: '',
      defaultProjectName: '',
    });
    await renderAndWaitReady();

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

  it('persists auto-detected primary task link mappings on configure', async () => {
    mockSdk.app.getParameters.mockResolvedValue({
      oauthClientId: 'client-1',
      oauthClientSecret: 'secret-1',
      oauthRefreshToken: 'refresh-123',
      oauthRedirectUri: 'https://example.com/?oauthCallback=1',
      defaultWorkspaceGid: '',
      defaultWorkspaceName: '',
      defaultProjectGid: '',
      defaultProjectName: '',
      enabledContentTypeIds: ['blogPost'],
    });

    await renderAndWaitReady();

    const callback = mockSdk.app.onConfigure.mock.calls.at(-1)?.[0];
    const result = callback ? await callback() : undefined;

    expect(result).toMatchObject({
      parameters: {
        enabledContentTypeIds: ['blogPost'],
        primaryTaskLinkMappings: {
          blogPost: {
            taskGidFieldId: 'asanaTaskGid',
            taskUrlFieldId: 'asanaTaskUrl',
            taskNameFieldId: 'asanaTaskName',
          },
        },
      },
    });
  });
});
