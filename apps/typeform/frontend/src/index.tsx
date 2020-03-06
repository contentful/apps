import React from 'react';
import { render } from 'react-dom';
import { init, locations, AppExtensionSDK } from 'contentful-ui-extensions-sdk';
import { Heading, Note, Form, SelectField, Option } from '@contentful/forma-36-react-components';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import { AppConfig } from './AppConfig';
import './index.scss';

init(sdk => {
  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    render(<AppConfig sdk={sdk as AppExtensionSDK} />, document.getElementById('root'));
  } else {
    render(<div>I should be the App</div>, document.getElementById('root'));
  }
});

/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
