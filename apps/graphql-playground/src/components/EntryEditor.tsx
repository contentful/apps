import React from 'react';
import { Note } from '@contentful/forma-36-react-components';
import { EditorAppSDK } from '@contentful/app-sdk';

interface EditorProps {
  sdk: EditorAppSDK;
}

const Entry = (props: EditorProps) => {
  return (
    <Note noteType="warning" style={{ margin: '1em' }}>
      GraphQL playground is not supported in the Entry editor location.
    </Note>
  );
};

export default Entry;
