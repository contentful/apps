import { createRoot } from 'react-dom/client';

import { GlobalStyles } from '@contentful/f36-components';

import App from './App';
import LocalhostWarning from '@components/LocalhostWarning';
import { SdkWithCustomApiProvider } from '@context/SdkWithCustomApiProvider';
import {
  SegmentAnalyticsProvider,
  sentryMarketplaceAppsSDK,
} from '@contentful/integration-frontend-toolkit/sdks';
import AuthProvider from '@context/AuthProvider';

const { client: SentryClient, init: SentryInit } = sentryMarketplaceAppsSDK;
const environment = import.meta.env.PROD ? 'production' : 'development';

SentryInit({
  environment,
  ignoreErrors: [
    // Ignore 429 rate limit errors
    '429',
    'Too Many Requests',
    'RateLimitExceeded',
    'exceeded the rate limit',
  ],
});

const container = document.getElementById('root')!;
const root = createRoot(container);

if (import.meta.env.DEV && window.self === window.top) {
  // You can remove this if block before deploying your app
  root.render(<LocalhostWarning />);
} else {
  root.render(
    <SentryClient.ErrorBoundary>
      <SdkWithCustomApiProvider>
        <SegmentAnalyticsProvider writeKey={import.meta.env.VITE_APP_SEGMENT_WRITE_KEY}>
          <AuthProvider>
            <GlobalStyles />
            <App />
          </AuthProvider>
        </SegmentAnalyticsProvider>
      </SdkWithCustomApiProvider>
    </SentryClient.ErrorBoundary>
  );
}
