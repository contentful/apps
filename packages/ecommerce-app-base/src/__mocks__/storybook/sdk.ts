import productPreviews from '../productPreviews';
import { FieldAppSDK } from '@contentful/app-sdk';

// @ts-ignore
export const sdk = {
  close: (...args) => alert(args),
  field: {
    onValueChanged: () => {},
    getValue: () => productPreviews,
    onIsDisabledChanged: () => {},
  },
  parameters: {
    installation: {},
    invocation: {},
  },
  window: {
    startAutoResizer: () => {},
  },
  notifier: {
    error: (message: string) => alert(message),
  },
} as FieldAppSDK;
