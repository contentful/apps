import 'whatwg-fetch';

import React from 'react';
import ReactDOM from 'react-dom';

import { init, locations } from '@contentful/app-sdk';

import NeflifySidebar from './sidebar';
import NetlifyAppConfig from './app';

init((sdk) => {
  const root = document.getElementById('root');

  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    ReactDOM.render(<NetlifyAppConfig sdk={sdk} />, root);
  } else if (sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
    ReactDOM.render(<NeflifySidebar sdk={sdk} />, root);
  }
});
