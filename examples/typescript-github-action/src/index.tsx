import React from 'react';
import ReactDom from 'react-dom';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import LocalhostWarning from './components/LocalhostWarning';
import App from './App';

const container = document.getElementById('root')!;

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  // You can remove this if block before deploying your app
  ReactDom.render(<LocalhostWarning />, container);
} else {
  ReactDom.render(
    <SDKProvider>
      <GlobalStyles />
      <App />
    </SDKProvider>,
    container
  );
}
