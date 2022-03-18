import React from 'react';
import { Paragraph } from '@contentful/f36-components';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from "@contentful/react-apps-toolkit";

const Dialog = () => {
  const sdk = useSDK<DialogExtensionSDK>()
  /* You can remove the next line as soon as you use the CMA, or, if not needed, simply remove the hook. */
  /*  eslint-disable @typescript-eslint/no-unused-vars */
  const cma = useCMA();

  return <Paragraph>Hello Dialog Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Dialog;
