import React from 'react';
import { Note } from '@contentful/f36-components';
import { WarningOctagonIcon } from '@phosphor-icons/react';
import tokens from '@contentful/f36-tokens';
import { Entry } from '../types';
import { getEntryTitle } from '../utils/entryUtils';
import { styles } from '../styles';
import { ContentTypeProps } from 'contentful-management';

interface ErrorNoteProps {
  failedUpdates: Entry[];
  selectedContentType: ContentTypeProps;
  defaultLocale: string;
  onClose: () => void;
}

export const ErrorNote: React.FC<ErrorNoteProps> = ({
  failedUpdates,
  selectedContentType,
  defaultLocale,
  onClose,
}) => {
  if (failedUpdates.length === 0) return null;

  const firstFailedTitle = getEntryTitle(failedUpdates[0], selectedContentType, defaultLocale);

  return (
    <Note
      variant="negative"
      icon={
        <WarningOctagonIcon fill={tokens.red600} height={tokens.spacingM} width={tokens.spacingM} />
      }
      style={styles.errorNote}
      onClose={onClose}
      withCloseButton>
      {`${failedUpdates.length} field${failedUpdates.length > 1 ? 's' : ''} did not update: `}
      {firstFailedTitle}
      {failedUpdates.length > 1 &&
        ` and ${failedUpdates.length - 1} more entry field${failedUpdates.length > 2 ? 's' : ''}`}
    </Note>
  );
};
