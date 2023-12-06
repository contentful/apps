import { render } from 'react-dom';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import App from './App';
import { init } from '@contentful/app-sdk';
import { createCustomAPI } from './analytics/createCustomAPI';
import type { KnownSDK } from '@contentful/app-sdk';
import type { CustomAPI } from './types';
import { createAnalyticsClient } from './analytics/createAnalyticsClient';
import { setState as setAnalyticsState } from './stores/analytics.store';
import { setState as setInternalSdkState } from './stores/internalsdk.store';
import { setState as setSdkState } from './stores/sdk.store';

type CompleteInit = <
  T extends KnownSDK = KnownSDK,
  C extends ((channel: any, params: any) => any) | undefined = undefined
>(
  initCallback: C extends Function ? (sdk: T, customSdk: ReturnType<C>) => any : (sdk: T) => any,
  options?: { makeCustomApi: C; supressIframeWarning?: boolean }
) => void;
const typedInit = init as CompleteInit;

typedInit(
  (sdk: KnownSDK, internalSdk: CustomAPI) => {
    setSdkState({ sdk });
    setInternalSdkState({ internalSdk });

    const analyticsClient = createAnalyticsClient(internalSdk.analytics);
    setAnalyticsState({ analyticsClient });
  },
  // The custom API client allows us to customize the internal experience-sdk
  // which gives us access to methods that might not still be publicly supported
  // by the APP SDK
  { makeCustomApi: createCustomAPI }
);

const root = document.getElementById('root');

render(
  <SDKProvider>
    <GlobalStyles />
    <App />
  </SDKProvider>,
  root
);
