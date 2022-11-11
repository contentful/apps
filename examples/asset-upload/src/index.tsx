import { render } from 'react-dom';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import LocalhostWarning from './components/LocalhostWarning';
import Field from './locations/Field';

const root = document.getElementById('root');

if (import.meta.env.DEV && window.self === window.top) {
  // You can remove this if block before deploying your app
  render(<LocalhostWarning />, root);
} else {
  render(
    <SDKProvider>
      <GlobalStyles />
      <Field />
    </SDKProvider>,
    root
  );
}
