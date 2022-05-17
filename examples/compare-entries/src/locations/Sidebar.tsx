import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import React, { useEffect } from 'react';

const Sidebar = () => {
  const sdk = useSDK<SidebarExtensionSDK>();

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk.window]);

  // TODO: add dropdown with list of space environments where the app is installed

  return (
    <Button
      onClick={() =>
        sdk.dialogs.openCurrentApp({
          title: 'Compare Entry',
          allowHeightOverflow: true,
          shouldCloseOnOverlayClick: true,
          shouldCloseOnEscapePress: true,
          minHeight: 400,
          width: 'fullWidth',
          parameters: {
            leftEntry: {
              spaceId: sdk.ids.space,
              environmentId: sdk.ids.environment,
              entryId: sdk.ids.entry,
            },
            rightEntry: {
              entryId: sdk.ids.entry,
            },
          },
        })
      }
    >
      Open Dialog
    </Button>
  );
};

export default Sidebar;
