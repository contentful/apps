import React, { useState } from 'react';
import { Note, TextLink } from '@contentful/f36-components';

import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { ExternalLinkIcon } from '@contentful/f36-icons';

const styles = {
  eapNote: css({
    marginBottom: tokens.spacingL,
  }),
};

interface Props {
  name: string;
  setHideOrchestrationEapNote: (hideOrchestrationEapNote: boolean) => void;
}

export const OrchestrationEapNote = ({ setHideOrchestrationEapNote, name }: Props) => {
  const title = `The ${name} app supports External references`;

  const handleClose = () => {
    setHideOrchestrationEapNote(true);
  };

  return (
    <Note className={styles.eapNote} withCloseButton={true} onClose={handleClose} title={title}>
      Contentful now supports unified delivery of content from both Contentful and {name} available
      on our GraphQL API.
      <br />
      <br />
      Learn more and get started today with our introduction to{' '}
      <TextLink
        variant="primary"
        target="_blank"
        icon={<ExternalLinkIcon />}
        alignIcon="end"
        rel="noopener noreferrer"
        href={`https://www.contentful.com/help/external-references/`}>
        External references
      </TextLink>
    </Note>
  );
};
