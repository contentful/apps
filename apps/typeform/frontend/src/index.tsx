import React from 'react';
import { render } from 'react-dom';
import {
  init,
  locations,
  AppExtensionSDK,
  FieldExtensionSDK,
  DialogExtensionSDK,
} from '@contentful/app-sdk';
import Authentication from './Auth';
import { TypeFormField } from './Field/TypeFormField';
import { TypeformPreviewWidget } from './TypeFormWidget';
import './index.scss';
import processTokenCallback from './processTokenCallback';

if (window.location.search.includes('token')) {
  console.log('window.location.search', window.location.search);
  processTokenCallback(window);
} else {
  init((sdk) => {
    if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
      render(<Authentication sdk={sdk as AppExtensionSDK} />, document.getElementById('root'));
    } else if (sdk.location.is(locations.LOCATION_DIALOG)) {
      render(
        <TypeformPreviewWidget sdk={sdk as DialogExtensionSDK} />,
        document.getElementById('root')
      );
    } else if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
      render(
        <TypeFormField sdk={sdk as AppExtensionSDK & FieldExtensionSDK} />,
        document.getElementById('root')
      );
    }
  });
}
