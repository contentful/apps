import React from 'react';
import { Paragraph } from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { Button } from '@aws-amplify/ui-react';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const buildAmplifyApp = () => {
    console.log('built');
  };

  return (
    <Paragraph>
      <Button variation="primary" loadingText="" onClick={buildAmplifyApp} ariaLabel="">
        Build
      </Button>
    </Paragraph>
  );
};

export default Sidebar;
