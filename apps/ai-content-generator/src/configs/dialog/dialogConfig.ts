import { DialogInvocationParameters } from '@locations/Dialog';
import { OpenCustomWidgetOptions } from '@contentful/app-sdk';
import featureConfig from '@configs/features/featureConfig';

export const DIALOG_MIN_HEIGHT = '468px';

type openDialogOptions = OpenCustomWidgetOptions & { parameters: DialogInvocationParameters };

export const makeDialogConfig = (parameters: DialogInvocationParameters): openDialogOptions => {
  const dialogTitle = featureConfig[parameters.feature].dialogTitle;

  return {
    position: 'center',
    width: 'fullWidth',
    minHeight: DIALOG_MIN_HEIGHT,
    title: dialogTitle,
    parameters,
  };
};
