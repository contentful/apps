import * as React from 'react';
import { render } from 'react-dom';
import { init, locations, AppExtensionSDK, SidebarExtensionSDK } from '@contentful/app-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.scss';
import App from './App';

import standalone from './standalone';

/*
  If we are running this code in standalone mode, it just means we have been redirected
  with an access or refresh_token
*/
if (window.location.search.includes('access_token') || window.location.search.includes('refresh_token')) {
  standalone(window);
} else {
  init(sdk => {
    if (sdk.location.is(locations.LOCATION_APP_CONFIG) || sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
      render(
        <App sdk={sdk as AppExtensionSDK | SidebarExtensionSDK} />,
        document.getElementById('root')
      );
    }
  });
}
