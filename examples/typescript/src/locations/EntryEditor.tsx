import React from 'react';
import { Paragraph } from '@contentful/f36-components';
import { EditorExtensionSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';

const Entry = () => {
  const sdk = useSDK<EditorExtensionSDK>();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  return <Paragraph>Hello Entry Editor Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Entry;
