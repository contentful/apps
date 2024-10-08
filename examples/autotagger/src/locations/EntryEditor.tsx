import React from 'react';
import { Paragraph } from '@contentful/f36-components';
import { EditorAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

const Entry = () => {
  const sdk = useSDK<EditorAppSDK>();

  return <Paragraph>Hello Entry Editor Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Entry;
