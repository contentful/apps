import React from 'react';
import { Button, Card, Flex, Text } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

import { styles } from './styles';
import { ConnectedWorkspace, useWorkspaceStore } from '../../workspace.store';
import { TestConnection } from './TestConnection';

interface Props {
  workspace: ConnectedWorkspace;
}

export const ConnectedWorkspacePanel = ({ workspace }: Props) => {
  const removeConnectedWorkspace = useWorkspaceStore((state) => state.removeConnectedWorkspace);

  // Check if we're in development environment
  const isDevelopment = process.env.NODE_ENV === 'development';

  const disconnectWorkspace = () => {
    // todo remove workspace from database
    removeConnectedWorkspace(workspace.id);
  };

  return (
    <Card className={styles.workspacePanel} padding="large">
      <Flex alignItems="center">
        <Flex flex={1} alignItems="center">
          <img
            className={styles.workspaceLogo}
            src={workspace.icon.image_68}
            alt="Slack workspace logo"
          />
          <Text fontColor="gray900" fontWeight="fontWeightMedium">
            {workspace.name}
          </Text>
        </Flex>
        <Button onClick={disconnectWorkspace} variant="secondary" size="small">
          Disconnect
        </Button>
      </Flex>
      {isDevelopment && <TestConnection workspaceId={workspace.id} />}
    </Card>
  );
};
