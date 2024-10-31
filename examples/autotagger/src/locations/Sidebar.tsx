import React from 'react';
import { TagsIcon } from '@contentful/f36-icons';
import { Button } from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';

const appActionId = 'YtIfXugb4P1w6Dqf4E8oq';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();

  const [isLoading, setIsLoading] = React.useState(false);

  useAutoResizer();

  async function callAppAction() {
    setIsLoading(true);
    await sdk.cma.appActionCall.createWithResponse(
      {
        appDefinitionId: sdk.ids.app,
        appActionId,
      },
      {
        parameters: {
          entryId: sdk.ids.entry,
        },
      }
    );
    setIsLoading(false);
  }

  return (
    <Button isLoading={isLoading} startIcon={<TagsIcon />} isFullWidth onClick={callAppAction}>
      Autotag
    </Button>
  );
};

export default Sidebar;
