import productPreviews from '../productPreviews';

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
};
