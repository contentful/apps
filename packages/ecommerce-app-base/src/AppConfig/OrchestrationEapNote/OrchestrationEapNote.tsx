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
  hideOrchestrationEapNote: boolean;
}

export const OrchestrationEapNote = ({ hideOrchestrationEapNote, name }: Props) => {
  const [, setHideOrchestrationEapNote] = useState(false);

  return (
    <Note
      style={{ display: hideOrchestrationEapNote ? 'none' : 'grid' }}
      className={styles.eapNote}
      withCloseButton={true}
      onClose={() => setHideOrchestrationEapNote(true)}
      title="Resolve content with Third party orchestration">
      Deliver {name} content effortlessly within Contentful using our Third party orchestration
      feature. Resolve content referenced from {name} using the Contentful GraphQL API.
      <br />
      <br />
      Learn more and get started today with our{' '}
      <TextLink
        variant="primary"
        target="_blank"
        icon={<ExternalLinkIcon />}
        alignIcon="end"
        rel="noopener noreferrer"
        href={`https://www.contentful.com/help/third-party-orchestration/`}>
        Introduction to Third party orchestration
      </TextLink>
    </Note>
  );
};
