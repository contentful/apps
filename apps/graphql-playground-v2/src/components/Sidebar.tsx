import React from 'react';
import { Paragraph, Button, Note } from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';

interface SidebarProps {
  sdk: SidebarAppSDK;
}

const Sidebar = (props: SidebarProps) => {
  const { sdk } = props;
  // @ts-ignore
  const cpaToken = sdk?.parameters?.installation?.cpaToken;

  sdk.window.startAutoResizer();
  const openGQLPlayground = () => {
    console.log('hello?');
    console.log(sdk.entry.getSys());
    sdk.dialogs.openCurrentApp({
      width: 'fullWidth',
      minHeight: '800px',
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      parameters: {
        entry: JSON.stringify(sdk.entry.getSys()),
      },
    });
  };

  return cpaToken ? (
    <Paragraph>
      <Button onClick={openGQLPlayground} style={{ width: '100%' }}>
        Open GQL Playground
      </Button>
    </Paragraph>
  ) : (
    <Note variant="warning">
      To use GraphQL playground. Please define the CPA installation parameter in your app
      configuration.
    </Note>
  );
};

export default Sidebar;
