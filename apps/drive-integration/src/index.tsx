import { GlobalStyles } from '@contentful/f36-components';
import { SegmentAnalyticsProvider } from '@contentful/integration-frontend-toolkit/sdks';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import { withLDProvider } from 'launchdarkly-react-client-sdk';
import { createRoot } from 'react-dom/client';
import App from './App';
import LocalhostWarning from './locations/LocalhostWarning';
const AppWithLD = withLDProvider({
  clientSideID: import.meta.env.VITE_LD_CLIENT_ID ?? '',
  options: { bootstrap: 'localStorage' },
})(App);

// Fullstory only captures a cross-origin iframe when this is set before its snippet loads.
window._fs_run_in_iframe = true;

const container = document.getElementById('root')!;
const root = createRoot(container);

const handleOAuthCallback = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has('code') && params.has('state') && window.opener) {
    window.opener.postMessage(
      {
        type: 'oauth:complete',
        code: params.get('code'),
        state: params.get('state'),
      },
      '*'
    );
    // Close the popup window
    window.close();
  }
};

// Check if this is an OAuth callback page
if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
  handleOAuthCallback();
}

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  // You can remove this if block before deploying your app
  root.render(<LocalhostWarning />);
} else {
  root.render(
    <SDKProvider>
      <GlobalStyles />
      <SegmentAnalyticsProvider writeKey={import.meta.env.VITE_SEGMENT_WRITE_KEY ?? ''}>
        <AppWithLD />
      </SegmentAnalyticsProvider>
    </SDKProvider>
  );
}
