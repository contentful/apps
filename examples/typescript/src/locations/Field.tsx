import React from 'react';
import { PlainClientAPI } from 'contentful-management';
import { Paragraph } from '@contentful/f36-components';
import {FieldExtensionSDK} from '@contentful/app-sdk';
import {useSDK} from "@contentful/react-apps-toolkit";

interface FieldProps {
  cma: PlainClientAPI;
}

const Field = (props: FieldProps) => {
  const sdk = useSDK<FieldExtensionSDK>()
  // If you only want to extend Contentful's default editing experience
  // reuse Contentful's editor components
  // -> https://www.contentful.com/developers/docs/extensibility/field-editors/
  return <Paragraph>Hello Entry Field Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Field;
