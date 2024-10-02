import React from 'react';
import { render } from 'react-dom';
import regeneratorRuntime from 'regenerator-runtime';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import App from './App';
import './index.css';

window.regeneratorRuntime = regeneratorRuntime;

const root = document.getElementById('root');

render(
  <SDKProvider>
    <GlobalStyles />
    <App />
  </SDKProvider>,
  root
);
