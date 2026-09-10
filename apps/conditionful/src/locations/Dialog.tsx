import { Paragraph } from '@contentful/f36-components';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import EntrySelectionDialog from './EntrySelectionDialog';

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();

  // Check if this is an entry selection dialog
  const params = sdk.parameters.invocation as any;
  if (params && params.allowedEntryIds) {
    return <EntrySelectionDialog />;
  }

  // Default dialog content
  return <Paragraph>Hello Dialog Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Dialog;
