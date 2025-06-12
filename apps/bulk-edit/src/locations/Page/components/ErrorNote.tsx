import React from 'react';
import { Note } from '@contentful/f36-components';
import { WarningOctagonIcon } from '@phosphor-icons/react';
import tokens from '@contentful/f36-tokens';
import { Entry, ContentTypeField } from '../types';
import { getEntryFieldValue } from '../utils/entryUtils';
import { styles } from '../styles';

interface ErrorNoteProps {
  failedUpdates: Entry[];
  selectedField: ContentTypeField | null;
  defaultLocale: string;
  onClose: () => void;
}

export const ErrorNote: React.FC<ErrorNoteProps> = ({
  failedUpdates,
  selectedField,
  defaultLocale,
  onClose,
}) => {
  if (failedUpdates.length === 0) return null;

  const firstFailedValue = getEntryFieldValue(failedUpdates[0], selectedField, defaultLocale);

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
      {firstFailedValue}
      {failedUpdates.length > 1 &&
        ` and ${failedUpdates.length - 1} more entry field${failedUpdates.length > 2 ? 's' : ''}`}
    </Note>
  );
};
