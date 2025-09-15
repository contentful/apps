import { render } from 'react-dom';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import { LocalHostWarning } from '@contentful/integration-component-library';
import App from './App';

console.log('🌟 Amplitude App: Starting application bootstrap process');

const root = document.getElementById('root');

if (!root) {
  console.error('❌ Amplitude App: Failed to find root element in DOM');
  throw new Error('Root element not found');
}

console.log('✅ Amplitude App: Root element found, checking environment...');
console.log('🔍 Amplitude App: Environment check - NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 Amplitude App: Environment check - Self === Top:', window.self === window.top);

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  console.log('🚧 Amplitude App: Development mode detected - showing localhost warning');
  // You can remove this if block before deploying your app
  render(<LocalHostWarning />, root);
} else {
  console.log('🚀 Amplitude App: Production mode or iframe detected - rendering main app');
  console.log('🎯 Amplitude App: Initializing SDK Provider and Global Styles');
  
  render(
    <SDKProvider>
      <GlobalStyles />
      <App />
    </SDKProvider>,
    root
  );
  
  console.log('✨ Amplitude App: Application successfully rendered to DOM');
}
