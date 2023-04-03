import React, { StrictMode } from 'react';
import { render } from 'react-dom';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import LocalhostWarning from './components/LocalhostWarning';
import App from './App';

const root = document.getElementById('root');

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  render(<LocalhostWarning />, root);
} else {
  render(
    <StrictMode>
      <SDKProvider>
        <GlobalStyles />
        <App />
      </SDKProvider>
    </StrictMode>,
    root
  );
}
