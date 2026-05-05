import { createRoot } from 'react-dom/client';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import LocalHostWarning from '@components/common/LocalHostWarning';
import App from './App';

const container = document.getElementById('root')!;
const root = createRoot(container);

if (import.meta.env.DEV && window.self === window.top) {
  root.render(<LocalHostWarning />);
} else {
  root.render(
    <SDKProvider>
      <GlobalStyles />
      <App />
    </SDKProvider>
  );
}
