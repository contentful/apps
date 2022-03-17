import React from 'react';
import { Paragraph } from '@contentful/f36-components';
import { PageExtensionSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from "@contentful/react-apps-toolkit";

const Page = () => {
  const sdk = useSDK<PageExtensionSDK>()
  /* eslint-disable @typescript-eslint/no-unused-vars  */
  const cma = useCMA();

  return <Paragraph>Hello Page Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Page;
