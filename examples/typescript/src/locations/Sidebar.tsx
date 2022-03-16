import React from 'react';
import { PlainClientAPI } from 'contentful-management';
import { Paragraph } from '@contentful/f36-components';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from "@contentful/react-apps-toolkit";

interface SidebarProps {
  cma: PlainClientAPI;
}

const Sidebar = (props: SidebarProps) => {
  const sdk = useSDK<SidebarExtensionSDK>()

  return <Paragraph>Hello Sidebar Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Sidebar;
