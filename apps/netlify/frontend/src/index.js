import 'whatwg-fetch';

import React from 'react';
import ReactDOM from 'react-dom';

import { init, locations } from '@contentful/app-sdk';
import { SDKProvider } from '@contentful/app-sdk';

import '@contentful/forma-36-fcss/dist/styles.css';

import NeflifySidebar from './sidebar';
import NetlifyAppConfig from './app';

init((sdk) => {
  const root = document.getElementById('root');

  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    ReactDOM.render(
      <SDKProvider>
        <NetlifyAppConfig sdk={sdk} />
      </SDKProvider>,
      root
    );
  } else if (sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
    ReactDOM.render(
      <SDKProvider>
        <NeflifySidebar sdk={sdk} />
      </SDKProvider>,
      root
    );
  }
});
