import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button, Flex, Text } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { APP_NAME } from '../utils/consts';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();

  useAutoResizer();

  const openDialog = () => {
    sdk.dialogs.openCurrentApp({
      title: APP_NAME,
      width: 'fullWidth',
      minHeight: '340px',
      parameters: {
        entryId: sdk.entry.getSys().id,
        contentTypeId: sdk.contentType.sys.id,
      },
    });
  };

  return (
    <Flex flexDirection="column" gap="spacingM">
      <Text fontColor="gray500">Populate content across similar locales</Text>
      <Button isFullWidth onClick={openDialog}>
        {APP_NAME}
      </Button>
    </Flex>
  );
};

export default Sidebar;
