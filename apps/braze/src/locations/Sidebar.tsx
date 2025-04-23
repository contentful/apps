import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { DIALOG_TITLE, SIDEBAR_BUTTON_TEXT } from '../utils';
import { InvocationParams } from './Dialog';

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
    parameters: InvocationParams = initialInvocationParams
  ) => {
    const width = step === 'codeBlocks' ? 'fullWidth' : 'large';
    const result = await openDialog(parameters, width);
    const nextStep = result['step'];
    if (nextStep !== 'close') {
      await openDialogLogic(nextStep, result);
    }
  };

  const openDialog = async (parameters: InvocationParams, width: 'fullWidth' | 'large') => {
    return sdk.dialogs.openCurrentApp({
      title: DIALOG_TITLE,
      parameters: parameters,
      width: width,
    });
  };

  return (
    <Button variant="primary" isFullWidth={true} onClick={() => openDialogLogic('fields')}>
      {SIDEBAR_BUTTON_TEXT}
    </Button>
  );
};

export default Sidebar;
