import { createRoot } from 'react-dom/client';

import { GlobalStyles } from '@contentful/f36-components';

import App from './App';
import LocalhostWarning from '@components/LocalhostWarning';
import { SdkWithCustomApiProvider } from '@context/SdkWithCustomApiProvider';

const container = document.getElementById('root')!;
const root = createRoot(container);

if (import.meta.env.DEV && window.self === window.top) {
  // You can remove this if block before deploying your app
  root.render(<LocalhostWarning />);
} else {
  root.render(
    <SdkWithCustomApiProvider>
      <GlobalStyles />
      <App />
    </SdkWithCustomApiProvider>
  );
}
