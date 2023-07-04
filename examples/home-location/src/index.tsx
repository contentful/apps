import { init, KnownAppSDK } from '@contentful/app-sdk';
import { GlobalStyles } from '@contentful/f36-components';
import { createRoot } from 'react-dom/client';

import App from './App';
import LocalhostWarning from './components/LocalhostWarning';
import { SDKProvider } from './SDKProvider';

const container = document.getElementById('root')!;
const root = createRoot(container);

init((sdk: KnownAppSDK) => {
  if (process.env.NODE_ENV === 'development' && window.self === window.top) {
    // You can remove this if block before deploying your app
    root.render(<LocalhostWarning />);
  } else {
    root.render(
      <SDKProvider>
        <GlobalStyles />
        <App />
      </SDKProvider>
    );
  }
});
