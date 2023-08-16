import { useCallback, useContext, useEffect } from 'react';
import { ConnectedWorkspace, useWorkspaceStore, WorkspaceState } from './workspace.store';
import { apiClient, slackClient } from './requests';
import { openPopup } from './helpers';
import { makeOAuthURL } from './constants';
import { getEnvironmentName } from './utils';
import { SDKContext, useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from './auth.store';

export const useConnect = () => {
  const sdk = useSDK<AppExtensionSDK>();
  const cma = useCMA();
  const { temporaryRefreshToken } = useAuthStore((state) => ({
    temporaryRefreshToken: state.temporaryRefreshToken,
  }));

  // @ts-expect-error private api not typed
  const { api } = useContext(SDKContext);

  const [setInstallationUuid] = useAuthStore((state) => [state.setInstallationUuid]);

  const saveWorkspace = useCallback(
    async (workspace, token) => {
      const genericErrorMessage =
        'Unable to store configuration. Please try connecting Slack again.';

      if (token) {
        try {
          await api.install({ workspaces: [workspace.id] });
          const installationUuid = uuidv4();
          setInstallationUuid(installationUuid);

          await apiClient.createAuthToken(sdk, cma, token, installationUuid);
        } catch (e) {
          const error = e as Error;

          // this 'AppInstallation does not exist error' is a race condition that occurs when instantiating the eventsService within the lambda.
          // it is not a valid error to show to the user.
          const errorMessage = JSON.parse(error.message);
          if (errorMessage && errorMessage.details !== 'AppInstallation does not exist.') {
            console.error(e);
            sdk.notifier.error(genericErrorMessage);
          }
        }
      }
    },
    // added during migration to new linting rules, ideally we can remove it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cma, sdk, temporaryRefreshToken],
  );

  const { addConnectedWorkspace, setWorkspaceState, setNotificationsLoading, setChannels } =
    useWorkspaceStore((state) => ({
      addConnectedWorkspace: state.addConnectedWorkspace,
      setWorkspaceState: state.setWorkspaceState,
      notificationsLoading: state.notificationsLoading,
      setNotificationsLoading: state.setNotificationsLoading,
      setChannels: state.setChannels,
    }));

  const [setTemporaryRefreshToken] = useAuthStore((state) => [state.setTemporaryRefreshToken]);

  const onMessage = async (message: MessageEvent) => {
    if (message.data.result === 'error') {
      sdk.notifier.error('Something went wrong while authenticating with Slack. Please try again.');
    }
    if (message.data.errorMessage) {
      console.error(message.data.errorMessage);
    }
    if (message.data.state && message.data.accessToken) {
      setWorkspaceState(WorkspaceState.LOADING);
      setNotificationsLoading(true);
      try {
        const token = message.data.accessToken;
        setTemporaryRefreshToken(message.data.refreshToken);
        const workspace = await slackClient.getWorkspace(token);
        const channels = await slackClient.getChannels(token, workspace.id);
        setChannels(channels);
        await saveWorkspace(workspace, message.data.refreshToken);
        addConnectedWorkspace({ ...(workspace as ConnectedWorkspace) });
        sdk.notifier.success('Connected to the Slack workspace successfully.');
      } catch (e) {
        sdk.notifier.error(
          'Something went wrong while authenticating with Slack. Please try again.',
        );
      } finally {
        setNotificationsLoading(false);
      }
      if (message.data) {
        window.removeEventListener('message', onMessage);
      }

      setWorkspaceState(WorkspaceState.SUCCESS);
    }
  };

  useEffect(() => {
    return () => window.removeEventListener('message', onMessage);
    // added during migration to new linting rules, ideally we can remove it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startOAuth = () => {
    window.addEventListener('message', onMessage);
    openPopup(makeOAuthURL(sdk.ids.space, getEnvironmentName(sdk.ids)), 700, 900);
  };

  return { startOAuth };
};
