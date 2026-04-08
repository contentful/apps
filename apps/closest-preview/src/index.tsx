import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import { createRoot } from 'react-dom/client';
import App from './App';
import LocalhostWarning from './components/LocalhostWarning';
import PreviewPage from './components/PreviewPage';

const container = document.getElementById('root')!;
const root = createRoot(container);

const isPreviewPage = window.location.pathname === '/preview';

if (isPreviewPage) {
  root.render(
    <>
      <GlobalStyles />
      <PreviewPage />
    </>
  );
} else if (process.env.NODE_ENV === 'development' && window.self === window.top) {
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
