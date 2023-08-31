import React from 'react';
import { render } from 'react-dom';

import { init, locations } from '@contentful/app-sdk';
import { SDKProvider } from '@contentful/app-sdk';

import Sidebar from './Sidebar';
import { AppConfig } from './AppConfig';

import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import './index.css';

init((sdk) => {
  const root = document.getElementById('root');

  if (sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
    render(
      <SDKProvider>
        <Sidebar sdk={sdk} />
      </SDKProvider>,
      root
    );
  } else if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    render(
      <SDKProvider>
        <AppConfig sdk={sdk} />{' '}
      </SDKProvider>,
      root
    );
  }
});
