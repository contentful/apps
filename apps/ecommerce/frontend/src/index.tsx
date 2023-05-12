import * as Sentry from '@sentry/react';
import React from 'react';
import { render } from 'react-dom';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import { LocalHostWarning } from '@contentful/integration-component-library';
import App from './App';
import { config } from './config';

Sentry.init({
  dsn: config.sentryDSN,
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  environment: config.environment,
  // TODO: setup Sentry as part of release pipeline (see: https://docs.sentry.io/platforms/javascript/sourcemaps/?_ga=2.56533545.342806665.1676988870-873194326.1675171780#uploading-source-maps-to-sentry)
  release: config.release,
});

const root = document.getElementById('root');

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  // You can remove this if block before deploying your app
  render(<LocalHostWarning />, root);
} else {
  render(
    <Sentry.ErrorBoundary>
      <SDKProvider>
        <GlobalStyles />
        <App />
      </SDKProvider>
    </Sentry.ErrorBoundary>,
    root
  );
}
