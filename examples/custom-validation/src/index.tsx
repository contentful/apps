import 'regenerator-runtime/runtime';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import React from 'react';
import { render } from 'react-dom';
import App from './App';
import { LocalhostWarning } from './components/LocalhostWarning';

const root = document.getElementById('root');

if (import.meta.env.DEV && window.self === window.top) {
  render(<LocalhostWarning />, root);
} else {
  render(
    <SDKProvider>
      <GlobalStyles />
      <App />
    </SDKProvider>,
    root
  );
}
