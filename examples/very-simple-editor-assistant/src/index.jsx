import React from 'react';
import { createRoot } from 'react-dom/client';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import LocalhostWarning from './components/LocalhostWarning';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
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
