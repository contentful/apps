import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

export const useNotifier = () => {
  const sdk = useSDK<ConfigAppSDK>();

  return {
    success: (message: string) => sdk.notifier.success(message),
    error: (message: string) => sdk.notifier.error(message),
    copySuccess: (message: string) => sdk.notifier.success(`${message} copied to clipboard`),
  };
};
