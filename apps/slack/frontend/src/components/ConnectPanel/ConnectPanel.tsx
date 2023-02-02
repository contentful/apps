import React from 'react';
import { Button, Card, HelpText, Paragraph, Subheading } from '@contentful/f36-components';
import { SlackLogo } from '../SlackLogo';
import { styles } from './styles';
import { useConnect } from '../../useConnect';

export const ConnectPanel = () => {
  const { startOAuth } = useConnect();

  return (
    <div className={styles.connectWrapper}>
      <Subheading className={styles.heading}>Connect to Slack</Subheading>
      <Card padding="large">
        <Paragraph>
          To add Contentful functionality in your Slack workspace, first sign into Slack to install
          the Contentful app.
        </Paragraph>
        <Button
          className={styles.addButtonWrapper}
          onClick={startOAuth}
          variant="secondary"
          isFullWidth>
          <div className={styles.addButton}>
            <SlackLogo className={styles.logo} />
            Add to Slack
          </div>
        </Button>
        <HelpText>Hint: You’ll need permissions to install apps in your Slack workspace.</HelpText>
      </Card>
    </div>
  );
};
