import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import { sentryMarketplaceAppsSDK } from '@contentful/integration-frontend-toolkit/sdks';

import { createRoot } from 'react-dom/client';
import App from './App';

const { client: SentryClient, init: SentryInit } = sentryMarketplaceAppsSDK

SentryInit();

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
  <SentryClient.ErrorBoundary>
    <SDKProvider>
      <GlobalStyles />
      <App />
    </SDKProvider>
  </SentryClient.ErrorBoundary>
);
