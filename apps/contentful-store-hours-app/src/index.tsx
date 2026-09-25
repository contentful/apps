import { createRoot } from 'react-dom/client';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import App from './App';

const root = createRoot(document.getElementById('root')!);

root.render(
  <SDKProvider>
    <GlobalStyles />
    <App />
  </SDKProvider>
);
