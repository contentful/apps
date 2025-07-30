import { Button, Flex, Text, RelativeDateTime, Note, TextLink } from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { processFields } from '../utils/fieldsProcessing';
import { useEffect, useState } from 'react';
import ConfigEntryService from '../utils/ConfigEntryService';
import { EntryConnectedFields } from '../utils/utils';
import { ErrorCircleOutlineIcon } from '@contentful/f36-icons';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();

  const [connectedFields, setConnectedFields] = useState<EntryConnectedFields | undefined>(
    undefined
  );
  const [showTokenError, setShowTokenError] = useState(false);

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
        entryId: sdk.ids.entry,
        fields: JSON.parse(
          JSON.stringify(
            await processFields(Object.values(sdk.entry.fields), sdk.cma, sdk.locales.default)
          )
        ),
      },
    };
  };

  const openDialog = async () => {
    const params = await dialogParams();
    const showError = await sdk.dialogs.openCurrentApp(params);
    setShowTokenError(showError);
  };

  useEffect(() => {
    const getConfig = async () => {
      try {
        const entryConnectedFields = await new ConfigEntryService(
          sdk.cma,
          sdk.locales.default
        ).getEntryConnectedFields(sdk.ids.entry);
        setConnectedFields(entryConnectedFields);
      } catch (error) {}
    };
    getConfig();
  }, []);

  return (
    <Flex gap="spacingM" flexDirection="column">
      {connectedFields?.some((field) => field.error) && (
        <Note variant="negative" icon={<ErrorCircleOutlineIcon />}>
          <Text lineHeight="lineHeightCondensed" fontColor="gray800">
            Unable to sync content. Review your connected fields or{' '}
            <TextLink onClick={() => sdk.navigator.openAppConfig()}>app configuration</TextLink>.
          </Text>
        </Note>
      )}
      {showTokenError && (
        <Note variant="negative" icon={<ErrorCircleOutlineIcon />}>
          <Text lineHeight="lineHeightCondensed" fontColor="gray800">
            There is an error with your Hubspot private app access token, and entry fields did not
            sync. View instructions on the{' '}
            <TextLink onClick={() => sdk.navigator.openAppConfig()}>app configuration</TextLink>.
          </Text>
        </Note>
      )}

      <Flex gap="spacingXs" flexDirection="column">
        <Button variant="secondary" isFullWidth={true} onClick={openDialog}>
          Sync entry fields to Hubspot
        </Button>

        {connectedFields && connectedFields.length > 0 && (
          <Text lineHeight="lineHeightCondensed" fontColor="gray500">
            {`${connectedFields.length} field${connectedFields.length === 1 ? '' : 's'} synced `}
            <RelativeDateTime date={connectedFields[0].updatedAt} />
          </Text>
        )}
      </Flex>

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
