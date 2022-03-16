import React from 'react';
import { PlainClientAPI } from 'contentful-management';
import { Paragraph } from '@contentful/f36-components';
import { PageExtensionSDK } from '@contentful/app-sdk';
import {useSDK} from "@contentful/react-apps-toolkit";

interface PageProps {
  cma: PlainClientAPI;
}

const Page = (props: PageProps) => {
  const sdk = useSDK<PageExtensionSDK>()

  return <Paragraph>Hello Page Component</Paragraph>;
};

export default Page;
