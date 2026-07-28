import { createRoot } from 'react-dom/client';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import App from './App';
import LocalhostWarning from './components/LocalhostWarning';

const container = document.getElementById('root')!;
const root = createRoot(container);

if (import.meta.env.DEV && window.self === window.top) {
  root.render(<LocalhostWarning />);
} else {
  root.render(
    <SDKProvider>
      <GlobalStyles />
      <App />
    </SDKProvider>
  );
}
