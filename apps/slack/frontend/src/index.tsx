import React from 'react';
import { render } from 'react-dom';
import { GlobalStyles } from '@contentful/f36-components';
import './index.css';

import Config from './components/ConfigScreen';
import { CustomSDKProvider } from './CustomSDKProvider';

const params = new URLSearchParams(window.location.search);

if (params.has('result')) {
  window.opener.postMessage({
    result: params.get('result'),
    state: params.get('state'),
    accessToken: params.get('accessToken'),
    refreshToken: params.get('refreshToken'),
    errorMessage: params.get('errorMessage'),
  });
  window.close();
} else {
  const root = document.getElementById('root');

  render(
    <CustomSDKProvider>
      <GlobalStyles />
      <Config />
    </CustomSDKProvider>,
    root,
  );
}
