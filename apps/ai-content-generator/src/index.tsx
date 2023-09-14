import { createRoot } from 'react-dom/client';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';
import LocalHostWarning from '@components/common/LocalHostWarning';
import ldConfig from '@configs/launch-darkly/ldConfig';
import App from './App';
import { SegmentAnalyticsProvider } from '@providers/segmentAnalyticsProvider';

(async () => {
  const LDProvider = await asyncWithLDProvider(ldConfig);

  const container = document.getElementById('root')!;
  const root = createRoot(container);

  if (import.meta.env.DEV && window.self === window.top) {
    // You can remove this if block before deploying your app
    root.render(<LocalHostWarning />);
  } else {
    root.render(
      <SDKProvider>
        <SegmentAnalyticsProvider>
          <LDProvider>
            <GlobalStyles />
            <App />
          </LDProvider>
        </SegmentAnalyticsProvider>
      </SDKProvider>
    );
  }
})();
