import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import type { AppProps } from 'next/app';

function App({ Component, pageProps }: AppProps) {
  return (
    <SDKProvider>
      <GlobalStyles />
      <Component {...pageProps} />
    </SDKProvider>
  );
}

export default App;
