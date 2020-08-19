import React from 'react';
import { render } from 'react-dom';

import { init, locations, PageExtensionSDK, AppExtensionSDK } from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';

import Config from './views/Config';
import Page from './views/Page';
import './index.css';

init((sdk) => {
  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    render(<Config sdk={sdk as AppExtensionSDK} />, document.getElementById('root'));
  }
  if (sdk.location.is(locations.LOCATION_PAGE)) {
    render(<Page sdk={sdk as PageExtensionSDK} />, document.getElementById('root'));
  } else {
    return null;
  }
});
