import { SidebarAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Subheading,
  Card,
  Text,
  Stack,
  Note,
  TextLink,
} from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import {
  BRAZE_CONTENT_BLOCK_DOCUMENTATION,
  CONNECTED_CONTENT_DOCUMENTATION,
  CREATE_DIALOG_MODE,
  CREATE_DIALOG_TITLE,
  FIELDS_STEP,
  GENERATE_DIALOG_MODE,
  GENERATE_DIALOG_TITLE,
  SIDEBAR_CONNECTED_ENTRIES_BUTTON_TEXT,
  SIDEBAR_CREATE_BUTTON_TEXT,
  SIDEBAR_GENERATE_BUTTON_TEXT,
} from '../utils';
import { InvocationParams } from './Dialog';
import { styles } from './Sidebar.styles';
import InformationWithLink from '../components/InformationWithLink';
import Splitter from '../components/Splitter';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const connectedFields = JSON.parse(sdk.parameters.installation.brazeConnectedFields || '{}');
  const currentEntryId = sdk.ids.entry;
  const connectedFieldsForCurrentEntry: [string, string][] = connectedFields[currentEntryId] || [];

  useAutoResizer();

  const initialInvocationParams: InvocationParams = {
    mode: GENERATE_DIALOG_MODE,
    entryId: sdk.ids.entry,
    contentTypeId: sdk.ids.contentType,
    title: sdk.entry.fields[sdk.contentType.displayField].getValue(),
  };

  const openDialogLogic = async (
    step: string,
    parameters: InvocationParams = initialInvocationParams,
    mode: string
  ) => {
    const width = step === 'codeBlocks' ? 'fullWidth' : 'large';
    const result = await openDialog({ ...parameters, mode }, width);
    if (!result || result['step'] === 'close') {
      return;
    }
    await openDialogLogic(result['step'], result, mode);
  };

  const openDialog = async (parameters: InvocationParams, width: 'fullWidth' | 'large') => {
    return sdk.dialogs.openCurrentApp({
      title: parameters.mode === CREATE_DIALOG_MODE ? CREATE_DIALOG_TITLE : GENERATE_DIALOG_TITLE,
      parameters: parameters,
      width: width,
    });
  };

  const handleOpenAppConfig = async (e: React.MouseEvent) => {
    e.preventDefault();
    await sdk.navigator.openAppConfig();
  };

  const hasUpdatedConfig =
    sdk.parameters.installation.contentfulApiKey &&
    sdk.parameters.installation.brazeApiKey &&
    sdk.parameters.installation.brazeEndpoint;

  return (
    <>
      <Box>
        {!hasUpdatedConfig && (
          <Note variant="warning">
            <Text>Update your app configuration </Text>
            <TextLink
              alignIcon="end"
              href="#"
              onClick={handleOpenAppConfig}
              target="_blank"
              rel="noopener noreferrer">
              here
            </TextLink>
          </Note>
        )}
        <Subheading className={styles.subheading}>Connected Content</Subheading>
        <InformationWithLink
          url={CONNECTED_CONTENT_DOCUMENTATION}
          linkText={'Learn more'}
          fontColor="gray500"
          marginTop="spacing2Xs"
          marginBottom="spacingS">
          Generate a Connected Content call to copy and paste into Braze.
        </InformationWithLink>
        <Button
          variant="secondary"
          isFullWidth={true}
          onClick={() => openDialogLogic(FIELDS_STEP, undefined, GENERATE_DIALOG_MODE)}
          isDisabled={!hasUpdatedConfig}>
          {SIDEBAR_GENERATE_BUTTON_TEXT}
        </Button>
      </Box>
      <Box marginTop="spacingS">
        <Subheading className={styles.subheading}>Content Blocks</Subheading>
        <InformationWithLink
          url={BRAZE_CONTENT_BLOCK_DOCUMENTATION}
          linkText={'Learn more'}
          fontColor="gray500"
          marginTop="spacing2Xs"
          marginBottom="spacingS">
          Send individual entry fields to Braze to create Content Blocks.
        </InformationWithLink>
        <Button
          variant="secondary"
          isFullWidth={true}
          onClick={() => openDialogLogic(FIELDS_STEP, undefined, CREATE_DIALOG_MODE)}
          isDisabled={!hasUpdatedConfig}>
          {SIDEBAR_CREATE_BUTTON_TEXT}
        </Button>
      </Box>
      {Object.keys(connectedFieldsForCurrentEntry).length > 0 && (
        <>
          <Box marginTop="spacingM">
            <Card className={styles.card}>
              <Subheading className={styles.subheadingCard}>
                Connected Content Block entries
              </Subheading>
              <Splitter />
              <Stack
                flexDirection="column"
                spacing="spacingXs"
                alignItems="initial"
                className={styles.stack}>
                {connectedFieldsForCurrentEntry.map(([contentfulFieldId], index) => (
                  <Text key={`${currentEntryId}-${index}`} className={styles.listItem}>
                    {contentfulFieldId}
                  </Text>
                ))}
              </Stack>
            </Card>
            <Button
              variant="secondary"
              isFullWidth={true}
              onClick={() => sdk.navigator.openCurrentAppPage()}>
              {SIDEBAR_CONNECTED_ENTRIES_BUTTON_TEXT}
            </Button>
          </Box>
        </>
      )}
    </>
  );
};

export default Sidebar;
