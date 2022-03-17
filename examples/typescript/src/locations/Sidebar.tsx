import React from 'react';
import { Paragraph } from '@contentful/f36-components';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from "@contentful/react-apps-toolkit";

const Sidebar = () => {
  const sdk = useSDK<SidebarExtensionSDK>()
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const cma = useCMA();

  return <Paragraph>Hello Sidebar Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Sidebar;
