import React from 'react';
import { render } from 'react-dom';
import { init, locations, ConfigAppSDK, FieldAppSDK, DialogAppSDK } from '@contentful/app-sdk';
import { GlobalStyles } from '@contentful/f36-components';
import '@contentful/forma-36-fcss/dist/styles.css';
import Authentication from './Auth';
import { TypeFormField } from './Field/TypeFormField';
import { TypeformPreviewWidget } from './TypeFormWidget';
import './index.scss';
import processTokenCallback from './processTokenCallback';

if (window.location.search.includes('token')) {
  processTokenCallback(window);
} else {
  init((sdk) => {
    if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
      render(
        <>
          <GlobalStyles />
          <Authentication sdk={sdk as ConfigAppSDK} />
        </>,
        document.getElementById('root')
      );
    } else if (sdk.location.is(locations.LOCATION_DIALOG)) {
      render(
        <>
          <GlobalStyles />
          <TypeformPreviewWidget sdk={sdk as DialogAppSDK} />
        </>,
        document.getElementById('root')
      );
    } else if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
      render(
        <>
          <GlobalStyles />
          <TypeFormField sdk={sdk as ConfigAppSDK & FieldAppSDK} />
        </>,
        document.getElementById('root')
      );
    }
  });
}
