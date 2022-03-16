import React from 'react';
import { PlainClientAPI } from 'contentful-management';
import { Paragraph } from '@contentful/f36-components';
import {DialogExtensionSDK, PageExtensionSDK} from '@contentful/app-sdk';
import {useSDK} from "@contentful/react-apps-toolkit";

interface DialogProps {
  cma: PlainClientAPI;
}

const Dialog = (props: DialogProps) => {
  const sdk = useSDK<DialogExtensionSDK>()
  return <Paragraph>Hello Dialog Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Dialog;
