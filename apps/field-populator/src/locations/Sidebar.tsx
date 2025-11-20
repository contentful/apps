import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button, Flex, Text } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

const APP_NAME = 'Field Populator';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();

  const openDialog = async () => {
    return sdk.dialogs.openCurrentApp({
      title: APP_NAME,
    });
  };

  return (
    <Flex flexDirection="column" gap="spacingM">
      <Text fontColor="gray500">Populate content across similar locales</Text>
      <Button isFullWidth onClick={() => openDialog()}>
        {APP_NAME}
      </Button>
    </Flex>
  );
};

export default Sidebar;
