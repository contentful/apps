import React from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { DEFAULT_ERR_MSG } from 'components/main-app/constants/noteMessages';
import HyperLink from 'components/common/HyperLink/HyperLink';

interface AppConfigPageHyperLinkProps {
  bodyMsg: string;
}

export const AppConfigPageHyperLink = (props: AppConfigPageHyperLinkProps) => {
  const { bodyMsg } = props;
  const sdk = useSDK<SidebarExtensionSDK>();
  const openConfigPage = () => sdk.navigator.openAppConfig();
  return <HyperLink body={bodyMsg} substring="app configuration page." onClick={openConfigPage} />;
};

export const SupportHyperLink = () => (
  <HyperLink
    body={DEFAULT_ERR_MSG}
    substring="contact support."
    hyperLinkHref="https://www.contentful.com/support/?utm_source=webapp&utm_medium=help-menu&utm_campaign=in-app-help"
  />
);
