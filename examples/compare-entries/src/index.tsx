import ReactDOM from 'react-dom';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import App from './App';

const container = document.getElementById('root')!;

ReactDOM.render(
  <SDKProvider>
    <GlobalStyles />
    <App />
  </SDKProvider>,
  container
);
