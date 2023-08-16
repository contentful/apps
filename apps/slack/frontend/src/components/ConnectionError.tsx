import React from 'react';
import { Note, TextLink } from '@contentful/f36-components';
import { useConnect } from '../useConnect';

const ConnectionError = () => {
  const { startOAuth } = useConnect();

  const reconnect = () => {
    startOAuth();
  };

  return (
    <Note title="Failed to fetch workspace" variant="warning">
      <div>{"Couldn't connect to Slack. Reconnect to configure notifications"}</div>
      <TextLink onClick={reconnect}>Reconnect to Slack</TextLink>
    </Note>
  );
};

export default ConnectionError;
