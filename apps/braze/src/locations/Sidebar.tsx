import { SidebarAppSDK } from '@contentful/app-sdk';
import { Box, Button, Subheading, Card, Text, Note, TextLink } from '@contentful/f36-components';
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
  SidebarContentBlockInfo,
} from '../utils';
import { InvocationParams } from './Dialog';
import { styles } from './Sidebar.styles';
import InformationWithLink from '../components/InformationWithLink';
import Splitter from '../components/Splitter';
import { useEffect, useState } from 'react';
import React from 'react';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();
  const [entryConnectedFields, setEntryConnectedFields] = useState<SidebarContentBlockInfo[]>([]);

  useEffect(() => {
    const getContentBlocksData = async () => {
      const response = await sdk.cma.appActionCall.createWithResponse(
        {
          appDefinitionId: sdk.ids.app!,
          appActionId: 'getContentBlocksAction',
        },
        {
          parameters: {
            entryId: sdk.ids.entry,
          },
        }
      );
      const responseData: { contentBlocks: SidebarContentBlockInfo[] } = JSON.parse(
        response.response.body
      );

      setEntryConnectedFields(responseData.contentBlocks);
    };
    getContentBlocksData();
  }, []);

  const initialInvocationParams = (): InvocationParams => {
    return {
      mode: GENERATE_DIALOG_MODE,
      entryId: sdk.ids.entry,
      contentTypeId: sdk.ids.contentType,
      title: sdk.entry.fields[sdk.contentType.displayField].getValue(),
    };
  };

  const openDialogLogic = async (
    step: string,
    parameters: InvocationParams = initialInvocationParams(),
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
      {entryConnectedFields.length > 0 && (
        <>
          <Box marginTop="spacingM">
            <Card className={styles.card}>
              <Subheading className={styles.subheadingCard}>
                Connected Content Block entries
              </Subheading>
              <Splitter />
              <div className={styles.stack}>
                {entryConnectedFields.map((fieldMapping, index) => (
                  <React.Fragment key={`${fieldMapping.fieldId}-${index}`}>
                    <Text as="div" fontSize="fontSizeS" className={styles.listItem}>
                      Field name
                    </Text>
                    <Text as="div" fontWeight="fontWeightMedium">
                      {`${sdk.entry.fields[fieldMapping.fieldId].name}${
                        fieldMapping.locale ? ` (${fieldMapping.locale})` : ''
                      }`}
                    </Text>
                    <Text as="div" fontSize="fontSizeS" className={styles.listItem}>
                      Content block name
                    </Text>
                    <Text as="div" fontWeight="fontWeightMedium">
                      {fieldMapping.contentBlockName}
                    </Text>
                    <Splitter />
                  </React.Fragment>
                ))}
              </div>
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
