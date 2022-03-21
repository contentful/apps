import React from 'react';
import { PlainClientAPI } from 'contentful-management';
import { Paragraph } from '@contentful/f36-components';
import { PageExtensionSDK } from '@contentful/app-sdk';

interface PageProps {
  sdk: PageExtensionSDK;
  cma: PlainClientAPI;
}

const Page = (props: PageProps) => {
  return <Paragraph>Hello Page Component</Paragraph>;
};

export default Page;
