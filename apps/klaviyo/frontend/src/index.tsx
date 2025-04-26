import { createRoot } from 'react-dom/client';
import App from './App';
import { SDKProvider } from '@contentful/react-apps-toolkit';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container);

const Root = () => {
  return (
    <SDKProvider>
      <App />
    </SDKProvider>
  );
};

root.render(<Root />);
