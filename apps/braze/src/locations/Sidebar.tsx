import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { EntryInfo } from './Dialog';
import { DIALOG_TITLE, SIDEBAR_BUTTON_TEXT } from '../helpers/utils';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();

  const invocationParams: EntryInfo = {
    id: sdk.ids.entry,
    contentTypeId: sdk.ids.contentType,
  };

  return (
    <Button
      variant="primary"
      isFullWidth={true}
      onClick={() => {
        sdk.dialogs.openCurrentApp({
          title: DIALOG_TITLE,
          parameters: invocationParams,
          width: 'fullWidth',
        });
      }}>
      {SIDEBAR_BUTTON_TEXT}
    </Button>
  );
};

export default Sidebar;
