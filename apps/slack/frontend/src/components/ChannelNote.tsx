import React from 'react';
import { styles } from './WorkspacePanel/styles';
import { Note, TextLink } from '@contentful/f36-components';

export const ChannelNote = () => {
  const [noteClosed, setNoteClosed] = React.useState(
    window.localStorage.getItem('channelsNote') === 'seen'
  );

  const onNoteClose = () => {
    window.localStorage.setItem('channelsNote', 'seen');
    setNoteClosed(true);
  };

  if (noteClosed) {
    return null;
  }

  return (
    <Note className={styles.note}>
      Make sure to invite the{' '}
      <TextLink
        target="_blank"
        rel="noopener noreferrer"
        href="https://slack.com/oauth/v2/authorize?client_id=2307263142.2755108964338&scope=channels:read,chat:write,team:read&user_scope=https://slack.com/oauth/v2/authorize?client_id=2307263142.2755108964338&scope=channels:read,chat:write,team:read&user_scope=">
        @Contentful
      </TextLink>{' '}
      app to the Slack channels that you would like to configure notifications for. <TextLink onClick={onNoteClose}>Got it!</TextLink>
    </Note>
  );
};
