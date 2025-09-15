import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

type CopyFn = (text: string, description?: string) => void;

export const useClipboard = (): { copy: CopyFn } => {
  const sdk = useSDK<PageAppSDK>();

  const copy: CopyFn = (text, description = 'item') => {
    navigator.clipboard.writeText(text).then(
      () => sdk.notifier.success(`Copied ${description} to clipboard.`),
      () => sdk.notifier.error(`Failed to copy ${description} to clipboard.`)
    );
  };

  return { copy };
};

export default useClipboard;
