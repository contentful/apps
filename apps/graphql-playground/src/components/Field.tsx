import React from 'react';
import { FieldExtensionSDK } from 'contentful-ui-extensions-sdk';

import { Note } from '@contentful/f36-components';

interface FieldProps {
  sdk: FieldExtensionSDK;
}

const Field = (prop: FieldProps) => {
  return (
    <Note variant="warning" style={{ margin: '1em' }}>
      GraphQL playground is not supported in the Entry field location.
    </Note>
  );
};

export default Field;
