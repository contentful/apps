import React from 'react';

import { Note, TextLink } from '@contentful/f36-components';
import { IssuesResponse } from '../../interfaces';

interface Props {
  errorType: IssuesResponse['error'];
  signOut: () => void;
}

export default function ErrorMessage({ errorType, signOut }: Props) {
  if (errorType === 'unauthorized_error') {
    return (
      <Note variant="negative" title="Unauthorized">
        Your Jira account does not have permission to view the issues in this project.{' '}
        <TextLink onClick={signOut}>Sign out</TextLink>
      </Note>
    );
  }

  if (errorType === 'general_error') {
    return (
      <Note variant="warning" title="Error">
        An error occured while communicating with Jira. Please reload the page.
      </Note>
    );
  }

  return null;
}
