import React from 'react';
import { PlainClientAPI } from 'contentful-management';
import { Paragraph } from '@contentful/f36-components';
import { DialogExtensionSDK } from '@contentful/app-sdk';

interface DialogProps {
  sdk: DialogExtensionSDK;
  cma: PlainClientAPI;
}

const Dialog = (props: DialogProps) => {
  return <Paragraph>Hello Dialog Component</Paragraph>;
};

export default Dialog;
