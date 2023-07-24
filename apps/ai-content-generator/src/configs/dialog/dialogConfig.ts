import { DialogInvocationParameters } from '@locations/Dialog';
import { OpenCustomWidgetOptions } from '@contentful/app-sdk';

export const DIALOG_MIN_HEIGHT = '468px';

type openDialogOptions = OpenCustomWidgetOptions & { parameters: DialogInvocationParameters };

export const makeDialogConfig = (
  parameters: DialogInvocationParameters,
  title: string,
): openDialogOptions => {
  return {
    position: 'center',
    width: 'fullWidth',
    minHeight: DIALOG_MIN_HEIGHT,
    title,
    parameters,
  };
};
