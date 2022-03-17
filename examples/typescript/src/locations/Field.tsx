import React from 'react';
import { Paragraph } from '@contentful/f36-components';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from "@contentful/react-apps-toolkit";

const Field = () => {
  const sdk = useSDK<FieldExtensionSDK>()
  /* eslint-disable @typescript-eslint/no-unused-vars  */
  const cma = useCMA();
  // If you only want to extend Contentful's default editing experience
  // reuse Contentful's editor components
  // -> https://www.contentful.com/developers/docs/extensibility/field-editors/
  return <Paragraph>Hello Entry Field Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Field;
