import React from 'react';
import { Paragraph, Box } from '@contentful/f36-components';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  return (
    <Box marginTop="spacingM">
      <Paragraph>Hello Page Component (AppId: {sdk.ids.app})</Paragraph>
    </Box>
  );
};

export default Page;
