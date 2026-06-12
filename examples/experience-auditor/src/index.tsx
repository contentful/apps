import React from 'react';
import { createRoot } from 'react-dom/client';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import LocalhostWarning from './components/LocalhostWarning';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container!);

// `process.env.NODE_ENV` is evaluated first so the URL parse is fully
// eliminated from production builds (the whole `&&` folds away).
const demoMode =
  process.env.NODE_ENV === 'development' && new URLSearchParams(window.location.search).has('demo');

if (demoMode) {
  // Standalone demo: `npm start` + `?demo` renders the toolbar against a seeded
  // in-memory sdk.exo. Dynamically imported so the demo scaffolding stays out of
  // the production bundle.
  void import('./demo/DemoProvider').then(({ default: DemoProvider }) => {
    root.render(<DemoProvider />);
  });
} else if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  // You can remove this if block before deploying your app
  root.render(<LocalhostWarning />);
} else {
  root.render(
    <SDKProvider>
      <GlobalStyles />
      <App />
    </SDKProvider>
  );
}
