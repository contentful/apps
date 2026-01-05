import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import { createRoot } from 'react-dom/client';
import App from './App';
import LocalhostWarning from './locations/LocalhostWarning';

const container = document.getElementById('root')!;
const root = createRoot(container);

const handleOAuthCallback = () => {
  const params = new URLSearchParams(window.location.search);
  console.log('OAuth callback params:', params);
  if (params.has('code') && params.has('state') && window.opener) {
    console.log('Sending OAuth completion message to parent window');
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
      <App />
    </SDKProvider>
  );
}
