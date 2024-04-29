import React from 'react';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import LocalhostWarning from './components/LocalhostWarning';
import App from './App';

const container = document.getElementById('root')!;
const root = createRoot(container);
const queryClient = new QueryClient();

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  // You can remove this if block before deploying your app
  root.render(<LocalhostWarning />);
} else {
  root.render(
    <SDKProvider>
      <GlobalStyles />
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </SDKProvider>
  );
}
