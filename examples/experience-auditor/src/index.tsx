import React from 'react';
import { createRoot } from 'react-dom/client';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import LocalhostWarning from './components/LocalhostWarning';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container!);

const params = new URLSearchParams(window.location.search);
const demoMode = process.env.NODE_ENV === 'development' && params.has('demo');

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
