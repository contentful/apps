import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button, Flex, Text } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { APP_NAME } from '../utils/consts';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();

  useAutoResizer();

  const openDialog = async () => {
    const result = await sdk.dialogs.openCurrentApp({
      title: APP_NAME,
      width: 'large',
      minHeight: '340px',
    });
    if (!result) {
      return;
    }
    const { sourceLocale, targetLocales } = result as {
      sourceLocale: string;
      targetLocales: string[];
    };
    updateFields(sourceLocale, targetLocales);
  };

  const updateFields = (sourceLocale: string, targetLocales: string[]) => {
    for (const fieldId of Object.keys(sdk.entry.fields)) {
      const newValue = sdk.entry.fields[fieldId].getValue(sourceLocale);
      for (const targetLocale of targetLocales) {
        sdk.entry.fields[fieldId].setValue(newValue, targetLocale);
      }
    }
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
