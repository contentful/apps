import React from 'react';
import { Paragraph } from '@contentful/f36-components';
import { EditorExtensionSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from "@contentful/react-apps-toolkit";

const Entry = () => {
  const sdk = useSDK<EditorExtensionSDK>()
  /* eslint-disable @typescript-eslint/no-unused-vars  */
  const cma = useCMA();

  return <Paragraph>Hello Entry Editor Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Entry;
