import LocalHostWarning from '@components/common/LocalHostWarning';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import { createRoot } from 'react-dom/client';
import App from './App';

(async () => {
  const container = document.getElementById('root')!;
  const root = createRoot(container);

  if (import.meta.env.DEV && window.self === window.top) {
    // You can remove this if block before deploying your app
    root.render(<LocalHostWarning />);
  } else {
    root.render(
      <SDKProvider>
        <GlobalStyles />
        <App />
      </SDKProvider>
    );
  }
})();
