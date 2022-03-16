import React from 'react';
import { PlainClientAPI } from 'contentful-management';
import { Paragraph } from '@contentful/f36-components';
import {EditorExtensionSDK} from '@contentful/app-sdk';
import {useSDK} from "@contentful/react-apps-toolkit";

interface EditorProps {
  cma: PlainClientAPI;
}

const Entry = (props: EditorProps) => {
  const sdk = useSDK<EditorExtensionSDK>()
  return <Paragraph>Hello Entry Editor Component</Paragraph>;
};

export default Entry;
