import { Button, Flex } from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();

  return (
    <Flex gap="spacingM" flexDirection="column">
      <Button
        variant="secondary"
        isFullWidth={true}
        onClick={() => sdk.dialogs.openCurrentApp({ title: 'Sync entry fields to Hubspot' })}>
        Sync entry fields to Hubspot
      </Button>

      <Button
        variant="secondary"
        isFullWidth={true}
        onClick={() => sdk.navigator.openCurrentAppPage()}>
        View all connected entries
      </Button>
    </Flex>
  );
};

export default Sidebar;
