import { createRoot } from 'react-dom/client';

import { GlobalStyles } from '@contentful/f36-components';

import App from './App';
import LocalhostWarning from '@components/LocalhostWarning';
import { SdkWithCustomApiProvider } from '@context/SdkWithCustomApiProvider';
import { sentryMarketplaceAppsSDK } from '@contentful/integration-frontend-toolkit/sdks';

const { client: SentryClient, init: SentryInit } = sentryMarketplaceAppsSDK

SentryInit();

const container = document.getElementById('root')!;
const root = createRoot(container);

if (import.meta.env.DEV && window.self === window.top) {
  // You can remove this if block before deploying your app
  root.render(<LocalhostWarning />);
} else {
  root.render(
    <SentryClient.ErrorBoundary>
      <SdkWithCustomApiProvider>
        <GlobalStyles />
        <App />
      </SdkWithCustomApiProvider>
    </SentryClient.ErrorBoundary>
  );
}
