import React from 'react';
import { Paragraph } from '@contentful/f36-components';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import LineChart from 'components/LineChart';

const Sidebar = () => {
  const sdk = useSDK<SidebarExtensionSDK>();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const mockData = [1000, -500, 500, 230];
  const mockLabels = ['January', 'February', 'March', 'April'];

  return (
    <>
      <Paragraph>Hello Sidebar Component (AppId: {sdk.ids.app})</Paragraph>
      <LineChart dataValues={mockData} xAxesLabels={mockLabels} />
    </>
  );
};

export default Sidebar;
