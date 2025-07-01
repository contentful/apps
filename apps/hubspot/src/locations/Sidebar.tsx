import { Button, Flex } from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { processFields } from '../utils/fieldsProcessing';
import { createClient } from 'contentful-management';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  );
  useAutoResizer();

  const getEntryTitle = (): string => {
    let displayFieldId = sdk.contentType.displayField;
    if (!displayFieldId) return 'Untitled';

    const value = sdk.entry.fields[displayFieldId].getValue();
    if (value === undefined || value === null || value === '') {
      return 'Untitled';
    }
    return String(value);
  };

  const dialogParams = async () => {
    return {
      title: 'Sync entry fields to Hubspot',
      parameters: {
        entryTitle: getEntryTitle(),
        fields: await processFields(Object.values(sdk.entry.fields), cma, sdk.locales.default),
      },
    };
  };

  return (
    <Flex gap="spacingM" flexDirection="column">
      <Button
        variant="secondary"
        isFullWidth={true}
        onClick={async () => sdk.dialogs.openCurrentApp(await dialogParams())}>
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
