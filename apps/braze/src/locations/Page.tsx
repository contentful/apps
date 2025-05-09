import React from 'react';
import { Paragraph, Box } from '@contentful/f36-components';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();

  return (
    <Box marginTop="spacingM">
      <Paragraph>Hello Page Component (AppId: {sdk.ids.app})</Paragraph>
    </Box>
  );
};

export default Page;
