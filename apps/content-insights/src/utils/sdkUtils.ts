import { BaseAppSDK } from '@contentful/app-sdk';

// We want to support environment aliases
export function getEnvironmentId(sdk: BaseAppSDK): string {
  return sdk.ids.environmentAlias ?? sdk.ids.environment;
}
