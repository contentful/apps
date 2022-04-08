import React from 'react';
import { Paragraph } from '@contentful/f36-components';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';

const Sidebar = () => {
  const sdk = useSDK();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  return <Paragraph>Hello Sidebar Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Sidebar;
