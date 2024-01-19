import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
  <SDKProvider>
    <GlobalStyles />
    <App />
  </SDKProvider>
);
