import React from 'react';
import { Paragraph } from '@contentful/f36-components';
import { HomeAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

const Home = () => {
  const sdk = useSDK<HomeAppSDK>();

  return <Paragraph>Hello Home Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Home;
