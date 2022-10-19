import React from 'react';
import { EditorExtensionSDK } from 'contentful-ui-extensions-sdk';

import { Note } from '@contentful/f36-components';

interface EditorProps {
  sdk: EditorExtensionSDK;
}

const Entry = (props: EditorProps) => {
  return (
    <Note variant="warning" style={{ margin: '1em' }}>
      GraphQL playground is not supported in the Entry editor location.
    </Note>
  );
};

export default Entry;
