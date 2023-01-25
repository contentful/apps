import React from 'react';
import {
  Button,
  Card,
  Flex,
  SkeletonBodyText,
  SkeletonContainer,
  SkeletonImage,
} from '@contentful/f36-components';
import { styles } from './styles';

const LoadingPanel = () => (
  <Card className={styles.workspacePanel} padding="large">
    <Flex alignItems="center">
      <Flex flex={1} alignItems="center">
        <SkeletonContainer className={styles.workspaceLogo}>
          <SkeletonImage />
        </SkeletonContainer>
        <SkeletonContainer className={styles.loadingText}>
          <SkeletonBodyText numberOfLines={1} />
        </SkeletonContainer>
      </Flex>
      <Button isDisabled={true} variant="secondary" size="small">
        Disconnect
      </Button>
    </Flex>
  </Card>
);

export default LoadingPanel;
