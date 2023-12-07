import { render } from 'react-dom';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import App from './App';
import { init } from '@contentful/app-sdk';
import type { KnownSDK } from '@contentful/app-sdk';
import { setState as setSdkState } from './stores/sdk.store';

type CompleteInit = <
  T extends KnownSDK = KnownSDK,
  C extends ((channel: any, params: any) => any) | undefined = undefined
>(
  initCallback: C extends Function ? (sdk: T, customSdk: ReturnType<C>) => any : (sdk: T) => any,
  options?: { makeCustomApi: C; supressIframeWarning?: boolean }
) => void;
const typedInit = init as CompleteInit;

typedInit((sdk: KnownSDK) => {
  setSdkState({ sdk });
});

const root = document.getElementById('root');

render(
  <SDKProvider>
    <GlobalStyles />
    <App />
  </SDKProvider>,
  root
);
