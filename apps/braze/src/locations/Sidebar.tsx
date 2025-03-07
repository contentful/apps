import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useFields } from '../sidebaraux';
import { InvocationParams } from './Dialog';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();
  const entryFields = useFields(sdk);

  const invocationParams: InvocationParams = {
    entryId: sdk.ids.entry,
    entryFields: entryFields,
    contentTypeId: sdk.ids.contentType,
  };

  return (
    <Button
      isDisabled={entryFields.length === 0} // TODO: isLoading doesn't seem to disable the button
      variant="primary"
      isFullWidth={true}
      onClick={async () => {
        sdk.dialogs.openCurrentApp({
          title: 'Generate Braze Connected Content Call',
          parameters: invocationParams,
        });
      }}>
      Generate Braze Connected Content
    </Button>
  );
};

export default Sidebar;
