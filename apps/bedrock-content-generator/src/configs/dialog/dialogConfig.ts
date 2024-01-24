import { DialogInvocationParameters } from '@locations/Dialog';
import { OpenCustomWidgetOptions } from '@contentful/app-sdk';

const DIALOG_WIDTH = 820;

type openDialogOptions = OpenCustomWidgetOptions & { parameters: DialogInvocationParameters };

export const makeDialogConfig = (parameters: DialogInvocationParameters): openDialogOptions => {
  return {
    position: 'center',
    width: DIALOG_WIDTH,
    allowHeightOverflow: true,
    parameters,
  };
};
