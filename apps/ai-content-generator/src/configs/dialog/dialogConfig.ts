import { DialogInvocationParameters } from '@locations/Dialog';
import { OpenCustomWidgetOptions } from '@contentful/app-sdk';

const DIALOG_MIN_HEIGHT = 880;
const DIALOG_WIDTH = 820;

type openDialogOptions = OpenCustomWidgetOptions & { parameters: DialogInvocationParameters };

export const makeDialogConfig = (parameters: DialogInvocationParameters): openDialogOptions => {
  return {
    position: 'center',
    width: DIALOG_WIDTH,
    minHeight: DIALOG_MIN_HEIGHT,
    allowHeightOverflow: true,
    parameters,
  };
};
