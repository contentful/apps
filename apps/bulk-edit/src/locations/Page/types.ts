import { AppExtensionSDK } from '@contentful/app-sdk';

export interface PageProps {
  sdk: AppExtensionSDK;
}

export interface PageState {
  isLoading: boolean;
  error: string | null;
}
