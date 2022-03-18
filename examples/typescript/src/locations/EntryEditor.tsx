import React from 'react';
import { Paragraph } from '@contentful/f36-components';
import { EditorExtensionSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from "@contentful/react-apps-toolkit";

const Entry = () => {
  const sdk = useSDK<EditorExtensionSDK>()
  /* You can remove the next line as soon as you use the CMA, or, if not needed, simply remove the hook. */
  /*  eslint-disable @typescript-eslint/no-unused-vars */
  const cma = useCMA();

  return <Paragraph>Hello Entry Editor Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Entry;
