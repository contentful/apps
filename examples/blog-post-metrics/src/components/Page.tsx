import React from 'react';
import { Paragraph } from '@contentful/forma-36-react-components';
import { PageExtensionSDK } from 'contentful-ui-extensions-sdk';

interface PageProps {
  sdk: PageExtensionSDK;
}

const Page = (props: PageProps) => {
  return <Paragraph>Hello Page Component</Paragraph>;
};

export default Page;
