import { SidebarAppSDK } from '@contentful/app-sdk';
import { Box, Button, Subheading } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import {
  BRAZE_CONTENT_BLOCK_DOCUMENTATION,
  CONNECTED_CONTENT_DOCUMENTATION,
  CREATE_DIALOG_MODE,
  CREATE_DIALOG_TITLE,
  GENERATE_DIALOG_MODE,
  GENERATE_DIALOG_TITLE,
  SIDEBAR_CREATE_BUTTON_TEXT,
  SIDEBAR_GENERATE_BUTTON_TEXT,
} from '../utils';
import { InvocationParams } from './Dialog';
import { styles } from './Sidebar.styles';
import InformationWithLink from '../components/InformationWithLink';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();

  const initialInvocationParams: InvocationParams = {
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

  return (
    <>
      <Box>
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
          onClick={() => openDialogLogic('fields', undefined, GENERATE_DIALOG_MODE)}>
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
          onClick={() => openDialogLogic('fields', undefined, CREATE_DIALOG_MODE)}>
          {SIDEBAR_CREATE_BUTTON_TEXT}
        </Button>
      </Box>
    </>
  );
};

export default Sidebar;
