import { createRoot } from 'react-dom/client';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import App from './App';
import LocalhostWarning from './components/LocalhostWarning';
import OAuthCallback from './oauth/OAuthCallback';

const container = document.getElementById('root')!;
const root = createRoot(container);

if (new URLSearchParams(window.location.search).has('oauthCallback')) {
  // Asana's OAuth redirect lands here in a bare popup, outside Contentful's
  // iframe — render the SDK-free callback handoff instead of the real app.
  root.render(<OAuthCallback />);
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
