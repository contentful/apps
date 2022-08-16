import React from 'react';
import { render } from 'react-dom';
import Field from './components/Field';
import Config from './components/ConfigScreen';
import {
  AppExtensionSDK,
  FieldExtensionSDK,
  init,
  locations,
} from '@contentful/app-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import '@contentful/forma-36-tokens/dist/css/index.css';
import './index.css';


import LocalhostWarning from './components/LocalhostWarning';

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  // You can remove this if block before deploying your app
  const root = document.getElementById('root');
  render(<LocalhostWarning />, root);
} else {
  init(async (sdk) => {
    const root = document.getElementById('root');
    
    if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
      render(<Field sdk={sdk as FieldExtensionSDK} />, root);
    } else if(sdk.location.is(locations.LOCATION_APP_CONFIG)) {
      render(<Config sdk={sdk as AppExtensionSDK} />, root)
    }

  });
}
