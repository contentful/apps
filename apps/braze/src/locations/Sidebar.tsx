import { BaseAppSDK, IdsAPI, SharedEditorSDK, SidebarAppSDK, WindowAPI } from '@contentful/app-sdk';
import { Box, Button, Subheading } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { EntryInfo } from './Dialog';
import {
  BRAZE_CONTENT_BLOCK_DOCUMENTATION,
  CONNECTED_CONTENT_DOCUMENTATION,
  DIALOG_TITLE,
  SIDEBAR_CREATE_BUTTON_TEXT,
  SIDEBAR_GENERATE_BUTTON_TEXT,
} from '../utils';
import { styles } from './Sidebar.styles';
import { KeyValueMap } from 'contentful-management';
import InformationWithLink from '../components/InformationWithLink';

function openDialog(
  sdk: Omit<BaseAppSDK<KeyValueMap, KeyValueMap, never>, 'ids'> &
    SharedEditorSDK & {
      ids: Omit<IdsAPI, 'field'>;
      window: WindowAPI;
    },
  invocationParams: EntryInfo
) {
  sdk.dialogs.openCurrentApp({
    title: DIALOG_TITLE,
    parameters: invocationParams,
    width: 'fullWidth',
  });
}

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();

  const invocationParams: EntryInfo = {
    id: sdk.ids.entry,
    contentTypeId: sdk.ids.contentType,
    title: sdk.entry.fields[sdk.contentType.displayField].getValue(),
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
          onClick={() => {
            openDialog(sdk, invocationParams);
          }}>
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
          onClick={() => {
            openDialog(sdk, invocationParams);
          }}>
          {SIDEBAR_CREATE_BUTTON_TEXT}
        </Button>
      </Box>
    </>
  );
};

export default Sidebar;
