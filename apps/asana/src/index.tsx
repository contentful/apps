import { createRoot } from 'react-dom/client';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import App from './App';
import LocalhostWarning from './components/LocalhostWarning';

const container = document.getElementById('root')!;
const root = createRoot(container);

// The Asana OAuth redirect lands on this app's own root
// (e.g. http://localhost:3001/?code=...&state=...) inside the popup window
// opened from ConfigScreen. If that's what's happening, forward the code/state
// to the opener (the Contentful app iframe) and close the popup instead of
// trying to render the app itself.
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const state = params.get('state');
const error = params.get('error');

if ((code || error) && window.opener) {
  window.opener.postMessage({ type: 'oauth:complete', code, state, error }, window.location.origin);
  window.close();
} else if (import.meta.env.DEV && window.self === window.top) {
  root.render(<LocalhostWarning />);
} else {
  root.render(
    <SDKProvider>
      <GlobalStyles />
      <App />
    </SDKProvider>
  );
}
