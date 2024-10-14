import React from 'react';
import { Paragraph } from '@contentful/f36-components';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();

  return <Paragraph>Hello Dialog Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Dialog;
