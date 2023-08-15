import { createRoot } from 'react-dom/client';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';

import App from './App';
import LocalhostWarning from './components/common/LocalhostWarning';
import launchDarklyConfig from './configs/launch-darkly/launchDarklyConfig';

(async () => {
  const LDProvider = await asyncWithLDProvider(launchDarklyConfig);

  const container = document.getElementById('root')!;
  const root = createRoot(container);

  if (process.env.NODE_ENV === 'development' && window.self === window.top) {
    // You can remove this if block before deploying your app
    root.render(<LocalhostWarning />);
  } else {
    root.render(
      <SDKProvider>
        <LDProvider>
          <GlobalStyles />
          <App />
        </LDProvider>
      </SDKProvider>
    );
  }
})();
