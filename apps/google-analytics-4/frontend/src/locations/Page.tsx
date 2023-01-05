import React from 'react';
import { Paragraph } from '@contentful/f36-components';
import { PageExtensionSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';

const Page = () => {
  const sdk = useSDK<PageExtensionSDK>();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  return <Paragraph>Hello Page Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Page;
