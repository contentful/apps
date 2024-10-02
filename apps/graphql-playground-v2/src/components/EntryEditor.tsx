import React from 'react';
import { Note } from '@contentful/f36-components';
import { EditorAppSDK } from '@contentful/app-sdk';

interface EditorProps {
  sdk: EditorAppSDK;
}

const Entry = (props: EditorProps) => {
  return (
    <Note variant="warning" style={{ margin: '1em' }}>
      GraphQL playground is not supported in the Entry editor location.
    </Note>
  );
};

export default Entry;
