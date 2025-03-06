import 'regenerator-runtime/runtime';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import App from './index';

const container = document.getElementById('root') || document.createElement('div');
const root = createRoot(container);

root.render(
  <SDKProvider>
    <GlobalStyles />
    <App />
  </SDKProvider>
);
