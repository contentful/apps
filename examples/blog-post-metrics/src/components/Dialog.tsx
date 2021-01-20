import React from 'react';
import { Paragraph } from '@contentful/forma-36-react-components';
import { DialogExtensionSDK } from 'contentful-ui-extensions-sdk';

interface DialogProps {
  sdk: DialogExtensionSDK;
}

const Dialog = (props: DialogProps) => {
  return <Paragraph>Hello Dialog Component</Paragraph>;
};

export default Dialog;
