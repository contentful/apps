import React, { useCallback, useEffect, useState } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { Subheading } from '@contentful/f36-components';
import { styles } from './WorkspacePanel/styles';
import { ConnectPanel } from './ConnectPanel/ConnectPanel';
import { ConnectedWorkspacePanel } from './WorkspacePanel/ConnectedWorkspacePanel';
import { useWorkspaceStore, WorkspaceState } from '../workspace.store';
import { apiClient } from '../requests';
import LoadingPanel from './WorkspacePanel/LoadingPanel';
import { NotificationsPanel } from './NotificationsPanel';
import { Workbench } from '@contentful/f36-workbench';
import { SlackNotification, useNotificationStore } from '../notification.store';
import { useAuthStore } from '../auth.store';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import ConnectionError from './ConnectionError';

export interface AppInstallationParameters {
  active?: boolean;
  workspaces?: string[];
  notifications?: SlackNotification[];
}

const Config = () => {
  const sdk = useSDK<AppExtensionSDK>();
  const cma = useCMA();
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const { connectedWorkspaces, addConnectedWorkspace, workspaceState, setWorkspaceState } =
    useWorkspaceStore((state) => ({
      connectedWorkspaces: state.connectedWorkspaces,
      addConnectedWorkspace: state.addConnectedWorkspace,
      workspaceState: state.workspaceState,
      setWorkspaceState: state.setWorkspaceState,
    }));
  const [isFirstInstallation, setIsFirstInstallation] = useState<boolean | undefined>();

  const { active, notifications, setNotifications, setActive } = useNotificationStore((state) => ({
    active: state.active,
    notifications: state.notifications,
    setNotifications: state.setNotifications,
    setActive: state.setActive,
  }));

  const { temporaryRefreshToken, installationUuid } = useAuthStore((state) => ({
    temporaryRefreshToken: state.temporaryRefreshToken,
    installationUuid: state.installationUuid,
  }));

  useEffect(() => {
    if (typeof isFirstInstallation === 'undefined') {
      sdk.app.isInstalled().then((isInstalled) => {
        setIsFirstInstallation(!isInstalled);
      });
    }
  }, [isFirstInstallation, sdk.app]);

  useEffect(() => {
    setParameters((prevParameters) => ({ ...prevParameters, notifications }));
  }, [notifications]);

  useEffect(() => {
    setParameters((prevParameters) => ({ ...prevParameters, active }));
  }, [active]);

  useEffect(() => {
    (async () => {
      setWorkspaceState(WorkspaceState.LOADING);
      try {
        const currentParameters = await sdk.app.getParameters();
        if (currentParameters?.workspaces) {
          await Promise.all(
            currentParameters.workspaces.map(async (workspaceId: string) => {
              const workspace = await apiClient.getWorkspace(sdk, workspaceId, cma);
              addConnectedWorkspace({ ...workspace });
            })
          );
        }
        setWorkspaceState(WorkspaceState.SUCCESS);
      } catch (e) {
        setWorkspaceState(WorkspaceState.ERROR);
        sdk.notifier.error(
          'Something went wrong fetching the connected workspace. Please try again.'
        );
      }
    })();
  }, [addConnectedWorkspace, cma, sdk, setWorkspaceState]);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters: { ...parameters, installationUuid },
      targetState: currentState,
    };
  }, [parameters, sdk, installationUuid]);

  console.log('PARAMATERS>>>', parameters);

  const onConfigurationCompleted = useCallback(
    async (error) => {
      const isInErrorState = error || (isFirstInstallation && !temporaryRefreshToken);
      const genericErrorMessage =
        'Unable to store configuration. Please try connecting Slack again.';

      if (isInErrorState) {
        sdk.notifier.error(genericErrorMessage);
        console.error(error ?? 'Missing temporary refresh token');
        return;
      }

      if (isFirstInstallation && temporaryRefreshToken && installationUuid) {
        try {
          await apiClient.createAuthToken(sdk, cma, temporaryRefreshToken, installationUuid);
          setIsFirstInstallation(false);
        } catch (e) {
          console.error(e);
          sdk.notifier.error(genericErrorMessage);
        }
      }
    },
    [isFirstInstallation, cma, sdk, temporaryRefreshToken, installationUuid]
  );

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
    sdk.app.onConfigurationCompleted((error) => onConfigurationCompleted(error));
  }, [sdk, onConfigure, onConfigurationCompleted]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      setParameters({
        ...currentParameters,
        workspaces: Object.values(connectedWorkspaces).map((workspace) => workspace.id),
      });

      if (currentParameters?.notifications) {
        setNotifications(currentParameters.notifications);
      }

      const activeFlag = currentParameters?.active;

      setActive(typeof activeFlag === 'boolean' ? activeFlag : true);

      await sdk.app.setReady();
    })();
  }, [sdk, connectedWorkspaces, setNotifications, setActive]);

  return (
    <Workbench className={styles.workbench}>
      <Workbench.Content type="text">
        {(Object.values(connectedWorkspaces).length > 0 ||
          workspaceState === WorkspaceState.LOADING ||
          workspaceState === WorkspaceState.ERROR) && (
          <Subheading marginBottom="spacingS">Slack workspace</Subheading>
        )}
        {workspaceState === WorkspaceState.LOADING ? (
          <LoadingPanel />
        ) : workspaceState === WorkspaceState.ERROR ? (
          <ConnectionError />
        ) : Object.values(connectedWorkspaces).length > 0 ? (
          <>
            {Object.values(connectedWorkspaces).map((workspace) => (
              <React.Fragment key={workspace.id}>
                <ConnectedWorkspacePanel workspace={workspace} />
                <NotificationsPanel workspace={workspace} />
              </React.Fragment>
            ))}
          </>
        ) : (
          <ConnectPanel />
        )}
      </Workbench.Content>
    </Workbench>
  );
};

export default Config;
