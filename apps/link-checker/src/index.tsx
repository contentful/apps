import { createRoot } from 'react-dom/client';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing root element');
}

createRoot(rootElement).render(
  <SDKProvider>
    <GlobalStyles />
    <App />
  </SDKProvider>
);
