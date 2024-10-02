import React from 'react';
import { Note } from '@contentful/f36-components';
import { FieldAppSDK } from '@contentful/app-sdk';

interface FieldProps {
  sdk: FieldAppSDK;
}

const Field = (prop: FieldProps) => {
  return (
    <Note variant="warning" style={{ margin: '1em' }}>
      GraphQL playground is not supported in the Entry field location.
    </Note>
  );
};

export default Field;
