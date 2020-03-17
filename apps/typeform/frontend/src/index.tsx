import React from 'react';
import { render } from 'react-dom';
import {
  init,
  locations,
  AppExtensionSDK,
  FieldExtensionSDK,
  DialogExtensionSDK
} from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import { AppConfig } from './AppConfig';
import { AppAuthConfig } from './AppConfig/AppAuthConfig';
import { TypeFormField } from './FIeld/TypeFormField';
import { TypeformPreviewWidget } from './TypeFormWidget';
import './index.scss';
import processTokenCallback from './processTokenCallback';

if (window.location.search.includes('token')) {
  processTokenCallback(window);
} else {
  init(sdk => {
    if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
      render(<AppAuthConfig sdk={sdk as AppExtensionSDK} />, document.getElementById('root'));
    } else if (sdk.location.is(locations.LOCATION_DIALOG)) {
      render(
        <TypeformPreviewWidget sdk={sdk as DialogExtensionSDK} />,
        document.getElementById('root')
      );
    } else {
      render(<TypeFormField sdk={sdk as FieldExtensionSDK} />, document.getElementById('root'));
    }
  });
}
/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
