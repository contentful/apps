import productPreviews from '../productPreviews';
import { FieldAppSDK } from '@contentful/app-sdk';
import { DeepPartial } from '../DeepPartial';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const sdk: DeepPartial<FieldAppSDK> = {
  close: (...args) => alert(args),
  field: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    onValueChanged: () => {},
    getValue: () => productPreviews,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    onIsDisabledChanged: () => {},
  },
  parameters: {
    installation: {},
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    invocation: {},
  },
  window: {
    startAutoResizer: () => {},
  },
  notifier: {
    error: (message: string) => alert(message),
  },
};
